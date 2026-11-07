<template>
  <v-layout class="question-bank-page min-vh-100">
    <AppHeader />
    <TeacherSidebar />

    <v-main class="pb-16">
      <v-container fluid class="question-bank-container py-4 px-4 px-md-6">
        <header class="page-heading mb-3">
          <h1 class="text-h5 font-weight-black text-primary mb-0">{{ t('questionBank.pageTitle') }}</h1>
        </header>

        <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4" role="alert">
          <div class="d-flex flex-wrap align-center justify-space-between ga-3">
            <span>{{ errorMessage }}</span>
            <v-btn variant="text" @click="loadBooks">{{ t('classSeatMap.retry') }}</v-btn>
          </div>
        </v-alert>

        <div class="question-bank-workspace">
          <aside class="question-bank-tree-column" :aria-label="t('questionBank.curriculumNavigation')">
            <QuestionBankTree
              :books="visibleBooks"
              :all-books="books"
              :book-details="bookDetails"
              :loading-books="loadingBookIds"
              :user-id="authStore.user?.id"
              :my-books-only="myBooksOnly"
              :search="treeSearch"
              :selected-book-id="selectedBookId || openedBookId"
              @update:my-books-only="myBooksOnly = $event"
              @update:search="treeSearch = $event"
              @select-book="selectBook"
            />
          </aside>

          <section class="question-bank-content" aria-live="polite">
            <div class="question-bank-sticky-bar" :class="{ 'question-bank-sticky-bar--empty': !selectedLesson }">
              <div v-if="selectedLesson" class="breadcrumb-path text-body-2 font-weight-bold text-primary" :aria-label="t('questionBank.curriculumPath')">
                <v-btn class="back-to-map" variant="text" size="small" prepend-icon="mdi-arrow-left" @click="backToMap">{{ t('questionBank.backToMap') }}</v-btn>
                <span class="breadcrumb-separator" aria-hidden="true">|</span>
                <v-tooltip :text="`${selectedLesson.bookTitle} › ${selectedLesson.chapterTitle}`" location="bottom">
                  <template #activator="{ props: tooltipProps }">
                    <span v-bind="tooltipProps" class="breadcrumb-label">{{ selectedLesson.bookTitle }} › {{ selectedLesson.chapterTitle }}</span>
                  </template>
                </v-tooltip>
              </div>
              <v-btn
                class="change-lesson-button"
                color="primary"
                variant="tonal"
                prepend-icon="mdi-file-tree-outline"
                @click="drawerOpen = true"
              >
                {{ t('questionBank.changeLesson') }}
              </v-btn>
            </div>

            <template v-if="selectedLesson">
              <div class="lesson-switcher mb-4">
                <div v-if="selectedUnit" ref="siblingLessonsRef" class="sibling-lessons" :aria-label="t('questionBank.unitLessons', { unit: selectedUnit.title })" @keydown="handleSiblingKeydown">
                  <v-chip v-for="(lesson, index) in selectedUnit.lessons" :key="lesson.id" :ref="(element) => setSiblingChipRef(element, index)" :color="Number(lesson.id) === Number(selectedLesson.id) ? 'primary' : undefined" :variant="Number(lesson.id) === Number(selectedLesson.id) ? 'flat' : 'outlined'" :class="['sibling-chip', { 'sibling-chip--empty': !questionCount(lesson) }]" :title="lesson.title" :aria-label="t('questionBank.siblingLessonLabel', { title: lesson.title, count: questionCount(lesson) })" :tabindex="Number(lesson.id) === Number(selectedLesson.id) ? 0 : -1" @click="selectLesson({ book: selectedBook, lesson })">{{ t('questionBank.siblingLessonShort', { number: index + 1, count: questionCount(lesson) }) }}</v-chip>
                </div>
              </div>
              <QuestionBankSection :key="selectedLesson.id" :lesson-id="selectedLesson.id" :lesson-title="selectedLesson.title" :can-manage="canManageSelectedBook" inline />
            </template>
            <QuestionBankOverview v-else :book="selectedBook" :loading="Boolean(activeBookId && loadingBookIds[activeBookId] && !bookDetails[activeBookId])" :error="activeBookId ? bookErrors[activeBookId] : ''" :can-manage="canManageSelectedBook" :recent-lesson="recentLesson" @retry="retryBook" @continue="continueRecentLesson" @select-lesson="selectLesson" />
          </section>
        </div>

        <v-navigation-drawer
          v-model="drawerOpen"
          temporary
          width="360"
          class="question-bank-drawer"
          :aria-label="t('questionBank.curriculumNavigation')"
        >
          <QuestionBankTree
            :books="visibleBooks"
            :all-books="books"
            :book-details="bookDetails"
            :loading-books="loadingBookIds"
            :user-id="authStore.user?.id"
            :my-books-only="myBooksOnly"
            :search="treeSearch"
            :selected-book-id="selectedBookId || openedBookId"
            @update:my-books-only="myBooksOnly = $event"
            @update:search="treeSearch = $event"
            @select-book="selectBook"
          />
        </v-navigation-drawer>
      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup>
import { computed, nextTick, onMounted, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import { useQuestionBankStore } from '../../stores/questionBank'
import AppHeader from '../../components/shared/AppHeader.vue'
import TeacherSidebar from '../../components/shared/TeacherSidebar.vue'
import QuestionBankSection from '../../components/QuestionBankSection.vue'
import QuestionBankTree from '../../components/question-bank/QuestionBankTree.vue'
import QuestionBankOverview from '../../components/question-bank/QuestionBankOverview.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const questionBankStore = useQuestionBankStore()
const books = ref([])
const bookDetails = reactive({})
const loadingBookIds = reactive({})
const bookErrors = reactive({})
const pendingBookLoads = new Map()
let prefetchRunId = 0
const isLoadingBooks = ref(false)
const hasLoadedBooks = ref(false)
const errorMessage = ref('')
const drawerOpen = ref(false)
const myBooksOnly = ref(false)
const treeSearch = ref('')
const recentLesson = ref(null)
const siblingChipRefs = new Map()

const openedBookId = ref(null)
const selectedBookId = computed(() => Number(route.query.bookId) || null)
const selectedLessonId = computed(() => Number(route.query.lessonId) || null)
const activeBookId = computed(() => selectedBookId.value || openedBookId.value)
const visibleBooks = computed(() => myBooksOnly.value
  ? books.value.filter((book) => Number(book.createdById) === Number(authStore.user?.id))
  : books.value)
const selectedBook = computed(() => (selectedBookId.value ? bookDetails[selectedBookId.value] : bookDetails[openedBookId.value]) || null)
const selectedUnit = computed(() => selectedBook.value?.chapters?.find((chapter) => chapter.lessons?.some((lesson) => Number(lesson.id) === selectedLessonId.value)) || null)
const selectedLesson = computed(() => {
  if (!selectedBook.value || !selectedLessonId.value) return null
  for (const chapter of selectedBook.value.chapters || []) {
    const lesson = (chapter.lessons || []).find((item) => Number(item.id) === selectedLessonId.value)
    if (lesson) return {
      ...lesson,
      bookTitle: selectedBook.value.title,
      chapterTitle: chapter.title,
    }
  }
  return null
})
const canManageSelectedBook = computed(() =>
  authStore.user?.role === 'ADMIN' ||
  Number(selectedBook.value?.createdById) === Number(authStore.user?.id),
)

async function loadBooks() {
  isLoadingBooks.value = true
  errorMessage.value = ''
  try {
    books.value = await api('/books')
    hasLoadedBooks.value = true
    await restoreRecentLesson()
    await restoreRouteSelection()
    void prefetchBookDetails()
  } catch (error) {
    errorMessage.value = error.message || t('questionBank.loadError')
  } finally {
    isLoadingBooks.value = false
  }
}

async function loadBookDetails(bookId) {
  const id = Number(bookId)
  if (!id || bookDetails[id]) return bookDetails[id]
  if (pendingBookLoads.has(id)) return pendingBookLoads.get(id).promise

  loadingBookIds[id] = true
  bookErrors[id] = ''
  const controller = new AbortController()
  const request = api(`/books/${id}`, { signal: controller.signal })
    .then((detail) => {
      bookDetails[id] = detail
      void restoreRecentLesson()
      return detail
    })
    .catch((error) => {
      if (error?.name !== 'AbortError') bookErrors[id] = error.message || t('questionBank.loadError')
      return null
    })
    .finally(() => {
      loadingBookIds[id] = false
      pendingBookLoads.delete(id)
    })
  pendingBookLoads.set(id, { promise: request, controller })
  return request
}

async function prefetchBookDetails() {
  const runId = ++prefetchRunId
  const pendingIds = books.value.map((book) => Number(book.id)).filter((id) => id && !bookDetails[id] && !pendingBookLoads.has(id))
  let index = 0
  const workerCount = Math.min(2, pendingIds.length)
  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (runId === prefetchRunId && index < pendingIds.length) {
      const id = pendingIds[index++]
      await loadBookDetails(id)
    }
  }))
}

function cancelPendingBookLoads() {
  prefetchRunId += 1
  for (const { controller } of pendingBookLoads.values()) controller.abort()
}

async function selectBook(book) {
  drawerOpen.value = false
  openedBookId.value = Number(book.id)
  const { lessonId: _lessonId, ...query } = route.query
  await router.replace({ query: { ...query, bookId: String(book.id) } })
  await loadBookDetails(book.id)
}

function questionCount(lesson) { return Number(lesson?._count?.questions) || 0 }

async function backToMap() {
  await router.replace({ query: { ...route.query, lessonId: undefined } })
}

async function retryBook() {
  const id = activeBookId.value
  if (id) { delete bookDetails[id]; await loadBookDetails(id) }
}

async function restoreRouteSelection() {
  const bookId = selectedBookId.value
  if (!bookId) return
  if (hasLoadedBooks.value && !books.value.some((book) => Number(book.id) === bookId)) {
    const { bookId: _bookId, lessonId: _lessonId, ...query } = route.query
    await router.replace({ query })
    return
  }
  const detail = await loadBookDetails(bookId)
  const lessonId = selectedLessonId.value
  if (detail && lessonId && !detail.chapters?.some((chapter) => chapter.lessons?.some((lesson) => Number(lesson.id) === lessonId))) {
    await router.replace({ query: { ...route.query, lessonId: undefined } })
  }
}

async function selectLesson({ book, lesson }) {
  drawerOpen.value = false
  try { localStorage.setItem('questionBank.lastSelection', JSON.stringify({ bookId: Number(book.id), lessonId: Number(lesson.id) })) } catch {}
  await router.replace({
    query: {
      ...route.query,
      bookId: String(book.id),
      lessonId: String(lesson.id),
    },
  })
}

function setSiblingChipRef(element, index) {
  if (element) siblingChipRefs.set(index, element.$el || element)
  else siblingChipRefs.delete(index)
}

async function centerSelectedSibling() {
  await nextTick()
  const index = selectedUnit.value?.lessons?.findIndex((lesson) => Number(lesson.id) === selectedLessonId.value) ?? -1
  const chip = siblingChipRefs.get(index)
  if (index < 0 || !chip) return
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  chip.scrollIntoView?.({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest', inline: 'center' })
}

function handleSiblingKeydown(event) {
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return
  const lessons = selectedUnit.value?.lessons || []
  const current = lessons.findIndex((lesson) => Number(lesson.id) === selectedLessonId.value)
  const next = current + (event.key === 'ArrowRight' ? 1 : -1)
  if (next < 0 || next >= lessons.length) return
  event.preventDefault()
  const chip = siblingChipRefs.get(next)
  chip?.focus?.()
  const lesson = lessons[next]
  void selectLesson({ book: selectedBook.value, lesson })
}

watch([() => selectedLessonId.value, selectedUnit], centerSelectedSibling, { flush: 'post' })

async function restoreRecentLesson() {
  let saved
  try { saved = JSON.parse(localStorage.getItem('questionBank.lastSelection') || 'null') } catch { return }
  const bookId = Number(saved?.bookId)
  const lessonId = Number(saved?.lessonId)
  const book = books.value.find((item) => Number(item.id) === bookId)
  if (!book || !lessonId) return
  openedBookId.value = bookId
  const detail = bookDetails[bookId] || await loadBookDetails(bookId)
  if (!detail) return
  const chapter = detail?.chapters?.find((item) => item.lessons?.some((lesson) => Number(lesson.id) === lessonId))
  const lesson = chapter?.lessons?.find((item) => Number(item.id) === lessonId)
  if (lesson) recentLesson.value = { book, lesson, path: `${book.title} › ${chapter.title} › ${lesson.title}` }
}

async function continueRecentLesson() {
  if (recentLesson.value) await selectLesson(recentLesson.value)
}

watch(
  () => [route.query.bookId, route.query.lessonId],
  () => {
    if (hasLoadedBooks.value) void restoreRouteSelection()
  },
)

onBeforeRouteLeave(() => {
  if (questionBankStore.hasPendingDrafts && !window.confirm(t('questionBank.confirmLeaveWithDrafts'))) return false
  cancelPendingBookLoads()
  return true
})

function warnBeforeUnload(event) {
  if (!questionBankStore.hasPendingDrafts) return
  event.preventDefault()
  event.returnValue = ''
}

onMounted(() => window.addEventListener('beforeunload', warnBeforeUnload))
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', warnBeforeUnload)
  cancelPendingBookLoads()
})

onMounted(loadBooks)
</script>

<style scoped>
.question-bank-page { background: rgb(var(--v-theme-background)); }
.question-bank-container { width: 100%; max-width: 1400px; margin-inline: 0 auto; box-sizing: border-box; }
.page-heading { display: flex; align-items: end; justify-content: space-between; gap: 20px; }
.question-bank-workspace { display: grid; grid-template-columns: minmax(280px, 300px) minmax(0, 1fr); align-items: start; gap: 20px; }
.question-bank-tree-column { position: sticky; top: 86px; min-width: 0; max-height: calc(100vh - 102px); max-height: calc(100dvh - 102px); overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; scrollbar-gutter: stable; }
.question-bank-content { min-width: 0; }
.lesson-switcher { display: grid; gap: 10px; }
.sibling-lessons { display: flex; gap: 8px; overflow-x: auto; padding: 4px 2px 8px; scrollbar-width: thin; scrollbar-color: rgba(var(--v-theme-primary), .35) transparent; }
.sibling-chip { flex: 0 0 auto; min-height: 34px; font-size: 13px; }
.sibling-chip:focus-visible { outline: 3px solid rgb(var(--v-theme-primary)); outline-offset: 2px; }
.sibling-chip--empty { border-style: dashed !important; }
.question-bank-sticky-bar { position: sticky; top: 70px; z-index: 12; display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 70px; margin-bottom: 16px; padding: 12px 16px; border: 1px solid rgba(var(--v-theme-primary), .16); border-radius: 16px; background: rgb(var(--v-theme-surface)); box-shadow: 0 6px 18px rgba(var(--v-theme-primary), .06); backdrop-filter: blur(8px); }
.breadcrumb-path { display: flex; align-items: center; min-width: 0; gap: 8px; }
.back-to-map { flex: 0 0 auto; }
.breadcrumb-separator { color: rgba(var(--v-theme-on-surface), .45); font-weight: 400; }
.breadcrumb-label { display: block; max-width: min(70vw, 620px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.question-bank-placeholder { min-height: 220px; border: 1px dashed rgba(var(--v-theme-primary), .42); background: rgba(var(--v-theme-primary), .045); }
.question-bank-drawer { display: none; }
.min-width-0 { min-width: 0; }
@media (max-width: 1023.98px) {
  .question-bank-workspace { display: block; height: auto; }
  .question-bank-sticky-bar { position: static; }
  .question-bank-tree-column { display: none; }
  .question-bank-drawer { display: block; }
  .change-lesson-button { display: inline-flex; }
}
@media (prefers-reduced-motion: reduce) {
  .question-bank-page *, .question-bank-page *::before, .question-bank-page *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
}
@media (min-width: 1024px) {
  .question-bank-sticky-bar--empty { display: none; }
  .question-bank-drawer { display: none !important; }
  .change-lesson-button { display: none; }
}
@media (max-width: 600px) {
  .page-heading { align-items: flex-start; flex-direction: column; gap: 8px; }
  .question-bank-sticky-bar { align-items: flex-start; flex-direction: column; }
  .change-lesson-button { align-self: stretch; }
}
</style>
