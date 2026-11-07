<template>
  <v-card class="question-tree-card rounded-xl" variant="outlined">
    <v-card-title class="text-subtitle-1 font-weight-bold pb-2">{{ t('questionBank.curriculumTree') }}</v-card-title>
    <div class="question-tree-tools px-4 pb-3">
      <v-switch :model-value="myBooksOnly" :label="t('questionBank.myBooksOnly')" color="primary" hide-details density="compact" :aria-label="t('questionBank.myBooksOnly')" @update:model-value="emit('update:my-books-only', $event)" />
      <v-text-field :model-value="search" :label="t('questionBank.searchCurriculum')" :aria-label="t('questionBank.searchCurriculum')" prepend-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details clearable class="mt-2" @update:model-value="emit('update:search', $event || '')" />
    </div>
    <v-divider />
    <v-card-text class="question-tree-card-body pa-2">
      <div v-if="!shownBooks.length" class="pa-5 text-center text-body-2 text-medium-emphasis">
        {{ t('questionBank.noBooks') }}
      </div>
      <v-expansion-panels
        v-else
        v-model="expandedBooks"
        multiple
        variant="accordion"
        elevation="0"
        class="question-tree-books"
        @update:model-value="onExpandedBooks"
      >
        <v-expansion-panel v-for="book in shownBooks" :key="book.id" :value="book.id">
          <v-expansion-panel-title class="question-tree-book-title" @click="emit('expand-book', book.id)">
            <div class="min-width-0 pr-2">
              <div class="question-tree-book-name">{{ book.title }}</div>
              <div class="question-tree-book-meta">
                {{ book.subject }} · {{ t('questionBank.gradeLabel', { grade: book.gradeLevel }) }}<template v-if="bookDetails[book.id]"> · {{ t('questionBank.bookLessonCount', bookSummary(bookDetails[book.id])) }}</template><template v-else> · <span class="text-medium-emphasis">{{ t('questionBank.openBookToLoad') }}</span></template>
                <span v-if="Number(book.createdById) !== Number(userId) && book.createdBy?.fullName" class="question-tree-creator"> · {{ t('questionBank.createdBy', { name: book.createdBy.fullName }) }} · {{ t('questionBank.readOnlyLabel') }}</span>
              </div>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-progress-linear v-if="loadingBooks[book.id]" indeterminate color="primary" class="mb-3" />
            <div v-else-if="!bookDetails[book.id]" class="text-caption text-medium-emphasis py-2">
              {{ t('questionBank.openBookToLoad') }}
            </div>
            <div v-else-if="!bookDetails[book.id].chapters?.length" class="text-caption text-medium-emphasis py-2">
              {{ t('questionBank.noLessons') }}
            </div>
            <v-expansion-panels v-else v-model="expandedChapters[book.id]" multiple variant="accordion" elevation="0" class="question-tree-chapters">
              <v-expansion-panel v-for="chapter in bookDetails[book.id].chapters" :key="chapter.id" :value="chapter.id">
                <v-expansion-panel-title class="question-tree-chapter-title">
                  <span class="question-tree-chapter-name">{{ chapter.title }}</span>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <div v-if="!chapter.lessons?.length" class="text-caption text-medium-emphasis py-2">
                    {{ t('questionBank.noLessons') }}
                  </div>
                  <v-list v-else density="compact" class="pa-0">
                    <v-list-item
                      v-for="lesson in chapter.lessons"
                      :key="lesson.id"
                      :active="Number(selectedLessonId) === Number(lesson.id)"
                      :class="{ 'question-tree-lesson--selected': Number(selectedLessonId) === Number(lesson.id) }"
                      :aria-current="Number(selectedLessonId) === Number(lesson.id) ? 'page' : undefined"
                      rounded="lg"
                      class="question-tree-lesson px-2"
                      @click="emit('select-lesson', { book, chapter, lesson })"
                    >
                      <v-list-item-title class="question-tree-lesson-title">{{ lesson.title }}</v-list-item-title>
                      <template #append>
                        <div class="question-tree-lesson-count">
                          <v-tooltip
                            v-if="!questionCount(lesson)"
                            :text="t('questionBank.emptyLesson')"
                            location="top"
                          >
                            <template #activator="{ props: tooltipProps }">
                              <v-icon
                                v-bind="tooltipProps"
                                icon="mdi-alert-circle-outline"
                                color="warning"
                                size="18"
                                :aria-label="t('questionBank.emptyLesson')"
                                role="img"
                              />
                            </template>
                          </v-tooltip>
                          <span v-else class="question-count-badge" :aria-label="t('questionBank.savedCount')">
                            {{ questionCount(lesson) }}
                          </span>
                        </div>
                      </template>
                    </v-list-item>
                  </v-list>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  books: { type: Array, default: () => [] },
  bookDetails: { type: Object, default: () => ({}) },
  loadingBooks: { type: Object, default: () => ({}) },
  myBooksOnly: { type: Boolean, default: false },
  search: { type: String, default: '' },
  userId: { type: [Number, String], default: null },
  selectedBookId: { type: [Number, String], default: null },
  selectedLessonId: { type: [Number, String], default: null },
})
const emit = defineEmits(['expand-book', 'select-lesson', 'update:my-books-only', 'update:search'])
const { t } = useI18n()
const expandedBooks = ref([])
const expandedChapters = ref({})
function normalize(value) { return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('vi') }
const normalizedSearch = computed(() => normalize(props.search.trim()))
const shownBooks = computed(() => props.books.filter((book) => !normalizedSearch.value || normalize(book.title).includes(normalizedSearch.value) || (props.bookDetails[book.id]?.chapters || []).some((chapter) => normalize(chapter.title).includes(normalizedSearch.value) || (chapter.lessons || []).some((lesson) => normalize(lesson.title).includes(normalizedSearch.value)))))
watch([normalizedSearch, () => props.bookDetails], ([query]) => {
  if (!query) { expandedChapters.value = {}; return }
  const bookIds = []
  const chaptersToOpen = {}
  for (const book of shownBooks.value) {
    const chapters = props.bookDetails[book.id]?.chapters || []
    const matches = chapters.filter((chapter) => normalize(chapter.title).includes(query) || (chapter.lessons || []).some((lesson) => normalize(lesson.title).includes(query)))
    bookIds.push(Number(book.id))
    if (matches.length) chaptersToOpen[book.id] = matches.map((chapter) => Number(chapter.id))
  }
  expandedBooks.value = bookIds
  expandedChapters.value = chaptersToOpen
}, { deep: true })

function questionCount(lesson) {
  return Number(lesson?._count?.questions) || 0
}

function chapterSummary(chapter) {
  const lessons = chapter.lessons || []
  return { count: lessons.filter((lesson) => questionCount(lesson) > 0).length, total: lessons.length }
}

function bookSummary(book) {
  const lessons = (book.chapters || []).flatMap((chapter) => chapter.lessons || [])
  return { count: lessons.filter((lesson) => questionCount(lesson) > 0).length, total: lessons.length }
}

watch(() => props.selectedBookId, (bookId) => {
  if (bookId && !expandedBooks.value.some((id) => Number(id) === Number(bookId))) {
    expandedBooks.value = [...expandedBooks.value, Number(bookId)]
    emit('expand-book', Number(bookId))
  }
}, { immediate: true })

function onExpandedBooks(bookIds) {
  for (const bookId of bookIds || []) emit('expand-book', Number(bookId))
}
</script>

<style scoped>
.question-tree-card { min-width: 0; border-color: rgba(var(--v-theme-primary), .18); background: rgb(var(--v-theme-surface)); }
.question-tree-card-body { min-width: 0; }
.question-tree-tools :deep(.v-label) { font-size: 13px; }
.question-tree-books :deep(.v-expansion-panel-title) { min-height: 64px; }
.question-tree-book-title { align-items: flex-start; }
.question-tree-book-name { color: rgb(var(--v-theme-on-surface)); font-size: 15px; font-weight: 750; line-height: 1.35; overflow-wrap: anywhere; }
.question-tree-book-meta, .question-tree-creator { font-size: 13px; line-height: 1.45; }
.question-tree-book-meta { color: rgba(var(--v-theme-on-surface), .74); }
.question-tree-creator { color: rgba(var(--v-theme-on-surface), .72); }
.question-tree-summary { color: rgba(var(--v-theme-on-surface), .76); font-size: 13px; font-weight: 500; line-height: 1.4; white-space: nowrap; }
.question-tree-chapters :deep(.v-expansion-panel-title) { min-height: 46px; }
.question-tree-chapter-title { display: flex; flex-wrap: wrap; gap: 4px 8px; color: rgb(var(--v-theme-on-surface)); font-size: 14px; font-weight: 700; }
.question-tree-chapter-name { min-width: 0; overflow-wrap: anywhere; }
.question-tree-lesson { min-height: 44px; border-left: 3px solid transparent; border-radius: 8px !important; }
.question-tree-lesson :deep(.v-list-item__content) { align-self: center; }
.question-tree-lesson-title { color: rgb(var(--v-theme-on-surface)); font-size: 14px; line-height: 1.35; white-space: normal; }
.question-tree-lesson-count { display: flex; min-width: 30px; min-height: 28px; align-items: center; justify-content: center; margin-inline-start: 8px; }
.question-count-badge { display: inline-flex; min-width: 28px; min-height: 26px; align-items: center; justify-content: center; padding: 0 7px; border: 1px solid rgba(var(--v-theme-on-surface), .22); border-radius: 999px; color: rgb(var(--v-theme-on-surface)); font-size: 12px; font-weight: 700; line-height: 1; }
.question-tree-lesson--selected { border-left-color: rgb(var(--v-theme-primary)); background: rgba(var(--v-theme-primary), .12) !important; }
.question-tree-lesson--selected .question-tree-lesson-title { color: rgb(var(--v-theme-primary)); font-weight: 750; }
.question-tree-lesson:focus-visible { outline: 3px solid rgb(var(--v-theme-primary)); outline-offset: 2px; }
.question-tree-lesson--selected:focus-visible { outline-offset: 1px; }
.question-tree-card :deep(.v-expansion-panel-title:focus-visible) { outline: 3px solid rgb(var(--v-theme-primary)); outline-offset: -3px; z-index: 1; }
.min-width-0 { min-width: 0; }
</style>
