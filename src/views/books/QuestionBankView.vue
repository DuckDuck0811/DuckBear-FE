<template>
  <v-layout class="question-bank-page min-vh-100">
    <AppHeader />
    <TeacherSidebar />

    <v-main class="pb-16">
      <v-container class="question-bank-container py-6 px-4 px-md-8">
        <header class="page-heading mb-5">
          <div>
            <h1 class="text-h4 font-weight-black text-primary mb-1">{{ t('questionBank.pageTitle') }}</h1>
            <p class="text-body-1 text-medium-emphasis mb-0">{{ t('questionBank.pageSubtitle') }}</p>
          </div>
          <v-switch
            v-model="myBooksOnly"
            :label="t('questionBank.myBooksOnly')"
            color="primary"
            hide-details
            density="compact"
            class="my-books-filter"
          />
        </header>

        <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4" role="alert">
          <div class="d-flex flex-wrap align-center justify-space-between ga-3">
            <span>{{ errorMessage }}</span>
            <v-btn variant="text" @click="loadBooks">{{ t('classSeatMap.retry') }}</v-btn>
          </div>
        </v-alert>

        <div class="question-bank-workspace">
          <aside class="question-bank-tree-column" aria-label="Curriculum navigation">
            <QuestionBankTree
              :books="visibleBooks"
              :book-details="bookDetails"
              :loading-books="loadingBookIds"
              :selected-book-id="selectedBookId"
              :selected-lesson-id="selectedLessonId"
              @expand-book="loadBookDetails"
              @select-lesson="selectLesson"
            />
          </aside>

          <section class="question-bank-content" aria-live="polite">
            <div class="question-bank-sticky-bar">
              <div v-if="selectedLesson" class="min-width-0">
                <div class="text-caption text-medium-emphasis">{{ t('questionBank.selectedLesson') }}</div>
                <div class="breadcrumb-path text-body-2 font-weight-bold text-primary" aria-label="Selected book, chapter, and lesson">
                  <span>{{ selectedLesson.bookTitle }}</span>
                  <v-icon icon="mdi-chevron-right" size="16" aria-hidden="true" />
                  <span>{{ selectedLesson.chapterTitle }}</span>
                  <v-icon icon="mdi-chevron-right" size="16" aria-hidden="true" />
                  <span>{{ selectedLesson.title }}</span>
                </div>
              </div>
              <div v-else class="text-body-2 text-medium-emphasis">{{ t('questionBank.selectLessonHint') }}</div>
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
              :lesson-title="`${selectedLesson.chapterTitle} — ${selectedLesson.title}`"
              :can-manage="canManageSelectedBook"
              inline
            />
            <v-card v-else class="question-bank-placeholder pa-8 text-center rounded-xl" variant="tonal">
              <v-icon icon="mdi-file-tree-outline" size="42" color="primary" class="mb-2" />
              <p class="text-body-2 text-medium-emphasis mb-0">{{ t('questionBank.selectLessonHint') }}</p>
            </v-card>
          </section>
        </div>

        <v-navigation-drawer
          v-model="drawerOpen"
          temporary
          width="360"
          class="question-bank-drawer"
          aria-label="Curriculum navigation"
        >
          <QuestionBankTree
            :books="visibleBooks"
            :book-details="bookDetails"
            :loading-books="loadingBookIds"
            :selected-book-id="selectedBookId"
            :selected-lesson-id="selectedLessonId"
            @expand-book="loadBookDetails"
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

const selectedBookId = computed(() => Number(route.query.bookId) || null)
const selectedLessonId = computed(() => Number(route.query.lessonId) || null)
const visibleBooks = computed(() => myBooksOnly.value
  ? books.value.filter((book) => Number(book.createdById) === Number(authStore.user?.id))
  : books.value)
const selectedBook = computed(() => bookDetails[selectedBookId.value] || null)
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
  await router.replace({
    query: {
      ...route.query,
      bookId: String(book.id),
      lessonId: String(lesson.id),
    },
  })
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
.question-bank-page { background: #f4f7fd; }
.question-bank-container { max-width: 1440px; }
.page-heading { display: flex; align-items: end; justify-content: space-between; gap: 20px; }
.my-books-filter { flex: 0 0 auto; }
.question-bank-workspace { display: grid; grid-template-columns: minmax(280px, 340px) minmax(0, 1fr); align-items: start; gap: 20px; }
.question-bank-tree-column { min-width: 0; }
.question-bank-content { min-width: 0; }
.question-bank-sticky-bar { position: sticky; top: 70px; z-index: 12; display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 70px; margin-bottom: 16px; padding: 12px 16px; border: 1px solid #e4ecf7; border-radius: 16px; background: rgba(255,255,255,.97); box-shadow: 0 6px 18px rgba(35,72,132,.06); backdrop-filter: blur(8px); }
.breadcrumb-path { display: flex; flex-wrap: wrap; align-items: center; min-width: 0; gap: 3px; overflow-wrap: anywhere; }
.question-bank-placeholder { min-height: 220px; border: 1px dashed #c5d8ef; }
.question-bank-drawer { display: none; }
.min-width-0 { min-width: 0; }
@media (max-width: 1023.98px) {
  .question-bank-workspace { display: block; }
  .question-bank-tree-column { display: none; }
  .question-bank-drawer { display: block; }
  .change-lesson-button { display: inline-flex; }
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
