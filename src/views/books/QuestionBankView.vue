<template>
  <v-layout class="question-bank-page min-vh-100">
    <AppHeader />
    <TeacherSidebar />

    <v-main class="pb-16">
      <v-container fluid class="question-bank-container py-6 px-4 px-md-6">
        <header class="page-heading mb-5">
          <div>
            <h1 class="text-h4 font-weight-black text-primary mb-1">{{ t('questionBank.pageTitle') }}</h1>
            <p class="text-body-1 text-medium-emphasis mb-0">{{ t('questionBank.pageSubtitle') }}</p>
          </div>
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
              :book-details="bookDetails"
              :loading-books="loadingBookIds"
              :user-id="authStore.user?.id"
              :my-books-only="myBooksOnly"
              :search="treeSearch"
              :selected-book-id="selectedBookId"
              :selected-lesson-id="selectedLessonId"
              @update:my-books-only="myBooksOnly = $event"
              @update:search="treeSearch = $event"
              @expand-book="openBook"
              @select-lesson="selectLesson"
            />
          </aside>

          <section class="question-bank-content" aria-live="polite">
            <div class="question-bank-sticky-bar">
              <div v-if="selectedLesson" class="min-width-0">
                <div class="breadcrumb-path text-body-2 font-weight-bold text-primary" :aria-label="t('questionBank.curriculumPath')">
                  <span>{{ selectedLesson.bookTitle }}</span>
                  <v-icon icon="mdi-chevron-right" size="16" aria-hidden="true" />
                  <span>{{ selectedLesson.chapterTitle }}</span>
                  <v-icon icon="mdi-chevron-right" size="16" aria-hidden="true" />
                  <span>{{ selectedLesson.title }}</span>
                </div>
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

            <QuestionBankSection
              v-if="selectedLesson"
              :key="selectedLesson.id"
              :lesson-id="selectedLesson.id"
              :lesson-title="selectedLesson.title"
              :can-manage="canManageSelectedBook"
              inline
            />
            <v-card v-else class="question-bank-placeholder pa-6 rounded-xl" variant="tonal">
              <div class="d-flex flex-column align-center text-center ga-2 mb-4">
                <v-icon icon="mdi-file-tree-outline" size="38" color="primary" />
                <p class="text-body-2 mb-0">{{ t('questionBank.selectLessonHint') }}</p>
                <v-btn v-if="recentLesson" color="primary" variant="flat" prepend-icon="mdi-history" @click="continueRecentLesson">{{ t('questionBank.continueLesson', { path: recentLesson.path }) }}</v-btn>
              </div>
              <div v-if="selectedBook && selectedBookSummary" class="book-overview text-center">
                <div class="text-subtitle-2 font-weight-bold mb-2">{{ selectedBook.title }}</div>
                <div class="text-body-2 text-primary font-weight-medium mb-3">{{ t('questionBank.lessonsWithQuestions', selectedBookSummary) }}</div>
                <div v-if="selectedBookSummary.emptyLessons.length" class="d-flex flex-wrap justify-center ga-2">
                  <v-btn v-for="item in selectedBookSummary.emptyLessons" :key="item.lesson.id" size="small" variant="outlined" color="primary" @click="selectLesson({ book: selectedBook, lesson: item.lesson })">{{ item.chapter.title }} › {{ item.lesson.title }}</v-btn>
                </div>
              </div>
              <div v-else-if="selectedBook" class="text-body-2 text-medium-emphasis text-center">{{ t('questionBank.openBookToLoad') }}</div>
            </v-card>
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
            :book-details="bookDetails"
            :loading-books="loadingBookIds"
            :user-id="authStore.user?.id"
            :my-books-only="myBooksOnly"
            :search="treeSearch"
            :selected-book-id="selectedBookId"
            :selected-lesson-id="selectedLessonId"
            @update:my-books-only="myBooksOnly = $event"
            @update:search="treeSearch = $event"
              @expand-book="openBook"
            @select-lesson="selectLesson"
          />
        </v-navigation-drawer>
      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import { useQuestionBankStore } from '../../stores/questionBank'
import AppHeader from '../../components/shared/AppHeader.vue'
import TeacherSidebar from '../../components/shared/TeacherSidebar.vue'
import QuestionBankSection from '../../components/QuestionBankSection.vue'
import QuestionBankTree from '../../components/question-bank/QuestionBankTree.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const questionBankStore = useQuestionBankStore()
const books = ref([])
const bookDetails = reactive({})
const loadingBookIds = reactive({})
const pendingBookLoads = new Map()
const isLoadingBooks = ref(false)
const hasLoadedBooks = ref(false)
const errorMessage = ref('')
const drawerOpen = ref(false)
const myBooksOnly = ref(false)
const treeSearch = ref('')
const recentLesson = ref(null)

const selectedBookId = computed(() => Number(route.query.bookId) || null)
const selectedLessonId = computed(() => Number(route.query.lessonId) || null)
const visibleBooks = computed(() => myBooksOnly.value
  ? books.value.filter((book) => Number(book.createdById) === Number(authStore.user?.id))
  : books.value)
const openedBookId = ref(null)
const selectedBook = computed(() => (selectedBookId.value ? bookDetails[selectedBookId.value] : bookDetails[openedBookId.value]) || null)
const selectedBookSummary = computed(() => {
  if (!selectedBook.value) return null
  const lessons = (selectedBook.value.chapters || []).flatMap((chapter) => (chapter.lessons || []).map((lesson) => ({ chapter, lesson })))
  return { count: lessons.filter(({ lesson }) => Number(lesson?._count?.questions) > 0).length, total: lessons.length, emptyLessons: lessons.filter(({ lesson }) => !(Number(lesson?._count?.questions) > 0)).slice(0, 5) }
})
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
    restoreRecentLesson()
    await restoreRouteSelection()
  } catch (error) {
    errorMessage.value = error.message || t('questionBank.loadError')
  } finally {
    isLoadingBooks.value = false
  }
}

async function loadBookDetails(bookId) {
  const id = Number(bookId)
  if (!id || bookDetails[id]) return bookDetails[id]
  if (pendingBookLoads.has(id)) return pendingBookLoads.get(id)

  loadingBookIds[id] = true
  const request = api(`/books/${id}`)
    .then((detail) => {
      bookDetails[id] = detail
      restoreRecentLesson()
      return detail
    })
    .catch((error) => {
      errorMessage.value = error.message || t('questionBank.loadError')
      return null
    })
    .finally(() => {
      loadingBookIds[id] = false
      pendingBookLoads.delete(id)
    })
  pendingBookLoads.set(id, request)
  return request
}

function openBook(bookId) {
  openedBookId.value = Number(bookId)
  void loadBookDetails(bookId)
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

async function restoreRecentLesson() {
  let saved
  try { saved = JSON.parse(localStorage.getItem('questionBank.lastSelection') || 'null') } catch { return }
  const bookId = Number(saved?.bookId)
  const lessonId = Number(saved?.lessonId)
  const book = books.value.find((item) => Number(item.id) === bookId)
  if (!book || !lessonId) return
  const detail = bookDetails[bookId]
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
  if (!questionBankStore.hasPendingDrafts) return true
  return window.confirm(t('questionBank.confirmLeaveWithDrafts'))
})

function warnBeforeUnload(event) {
  if (!questionBankStore.hasPendingDrafts) return
  event.preventDefault()
  event.returnValue = ''
}

onMounted(() => window.addEventListener('beforeunload', warnBeforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', warnBeforeUnload))

onMounted(loadBooks)
</script>

<style scoped>
.question-bank-page { background: rgb(var(--v-theme-background)); }
.question-bank-container { width: 100%; max-width: 1400px; margin-inline: 0 auto; box-sizing: border-box; }
.page-heading { display: flex; align-items: end; justify-content: space-between; gap: 20px; }
.question-bank-workspace { display: grid; grid-template-columns: minmax(280px, 340px) minmax(0, 1fr); align-items: start; gap: 20px; }
.question-bank-tree-column { position: sticky; top: 86px; min-width: 0; max-height: calc(100vh - 102px); max-height: calc(100dvh - 102px); overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; scrollbar-gutter: stable; }
.question-bank-content { min-width: 0; }
.question-bank-sticky-bar { position: sticky; top: 70px; z-index: 12; display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 70px; margin-bottom: 16px; padding: 12px 16px; border: 1px solid rgba(var(--v-theme-primary), .16); border-radius: 16px; background: rgb(var(--v-theme-surface)); box-shadow: 0 6px 18px rgba(35,72,132,.06); backdrop-filter: blur(8px); }
.breadcrumb-path { display: flex; flex-wrap: wrap; align-items: center; min-width: 0; gap: 3px; overflow-wrap: anywhere; }
.question-bank-placeholder { min-height: 220px; border: 1px dashed rgba(var(--v-theme-primary), .42); background: rgba(var(--v-theme-primary), .045); }
.question-bank-drawer { display: none; }
.min-width-0 { min-width: 0; }
@media (max-width: 1023.98px) {
  .question-bank-workspace { display: block; }
  .question-bank-tree-column { position: static; max-height: none; overflow: visible; }
  .question-bank-tree-column { display: none; }
  .question-bank-drawer { display: block; }
  .change-lesson-button { display: inline-flex; }
}
@media (prefers-reduced-motion: reduce) {
  .question-bank-page *, .question-bank-page *::before, .question-bank-page *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
}
@media (min-width: 1024px) {
  .question-bank-drawer { display: none !important; }
  .change-lesson-button { display: none; }
}
@media (max-width: 600px) {
  .page-heading { align-items: flex-start; flex-direction: column; gap: 8px; }
  .question-bank-sticky-bar { top: 64px; align-items: flex-start; flex-direction: column; }
  .change-lesson-button { align-self: stretch; }
}
</style>
