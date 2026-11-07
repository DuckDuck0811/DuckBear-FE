<template>
  <v-card class="question-tree-card rounded-xl" variant="outlined">
    <v-card-title class="text-subtitle-1 font-weight-bold pb-2">{{ t('questionBank.curriculumTree') }}</v-card-title>
    <div class="question-tree-tools px-4 pb-3">
      <v-switch :model-value="myBooksOnly" :label="t('questionBank.myBooksOnly')" color="primary" hide-details density="compact" :aria-label="t('questionBank.myBooksOnly')" @update:model-value="emit('update:my-books-only', $event)" />
      <v-text-field :model-value="search" :label="t('questionBank.searchCurriculum')" :aria-label="t('questionBank.searchCurriculum')" prepend-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details clearable class="mt-2" @update:model-value="emit('update:search', $event || '')" />
    </div>
    <v-divider />
    <v-card-text class="question-tree-card-body pa-3">
      <div v-if="!shownBooks.length" class="pa-5 text-center text-body-2 text-medium-emphasis">{{ t('questionBank.noBooks') }}</div>
      <button
        v-for="book in shownBooks"
        :key="book.id"
        type="button"
        class="book-card"
        :class="{ 'book-card--selected': Number(selectedBookId) === Number(book.id) }"
        :style="{ '--book-cover': coverColor(book) }"
        :aria-current="Number(selectedBookId) === Number(book.id) ? 'true' : undefined"
        @click="emit('select-book', book)"
      >
        <span class="book-cover" aria-hidden="true">{{ coverLabel(book) }}</span>
        <span class="book-card-copy">
          <span class="book-card-title">{{ book.title }}</span>
          <span class="book-card-meta">
            <span>{{ book.subject }} · {{ t('questionBank.gradeLabel', { grade: book.gradeLevel }) }}</span>
            <span v-if="bookDetails[book.id]" class="book-progress-label">{{ t('questionBank.lessonsWithQuestions', bookSummary(bookDetails[book.id])) }}</span>
            <span v-else class="book-progress-label text-medium-emphasis">{{ t('questionBank.selectForProgress') }}</span>
          </span>
          <v-progress-linear v-if="bookDetails[book.id]" :model-value="bookSummary(bookDetails[book.id]).percent" height="4" color="primary" rounded class="book-progress" />
          <span v-if="!isOwnBook(book) && book.createdBy?.fullName" class="book-owner"><v-chip size="x-small" color="secondary" variant="tonal">{{ t('questionBank.readOnlyLabel') }}</v-chip><span>{{ t('questionBank.createdBy', { name: book.createdBy.fullName }) }}</span></span>
        </span>
        <v-progress-circular v-if="loadingBooks[book.id]" indeterminate size="20" width="2" color="primary" aria-hidden="true" />
      </button>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  books: { type: Array, default: () => [] },
  bookDetails: { type: Object, default: () => ({}) },
  loadingBooks: { type: Object, default: () => ({}) },
  myBooksOnly: { type: Boolean, default: false },
  search: { type: String, default: '' },
  userId: { type: [Number, String], default: null },
  selectedBookId: { type: [Number, String], default: null },
})
const emit = defineEmits(['select-book', 'update:my-books-only', 'update:search'])
const { t } = useI18n()
function normalize(value) { return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('vi') }
const normalizedSearch = computed(() => normalize(props.search.trim()))
const shownBooks = computed(() => props.books.filter((book) => !normalizedSearch.value || normalize(book.title).includes(normalizedSearch.value) || (props.bookDetails[book.id]?.chapters || []).some((chapter) => normalize(chapter.title).includes(normalizedSearch.value) || (chapter.lessons || []).some((lesson) => normalize(lesson.title).includes(normalizedSearch.value)))))
function questionCount(lesson) { return Number(lesson?._count?.questions) || 0 }
function bookSummary(book) {
  const lessons = (book.chapters || []).flatMap((chapter) => chapter.lessons || [])
  const count = lessons.filter((lesson) => questionCount(lesson) > 0).length
  return { count, total: lessons.length, percent: lessons.length ? count * 100 / lessons.length : 0 }
}
function isOwnBook(book) { return Number(book.createdById) === Number(props.userId) }
function coverLabel(book) {
  const subject = normalize(book.subject)
  const match = subject.match(/\d+/)
  const grade = match?.[0] || String(book.gradeLevel || '').replace(/\D/g, '')
  const code = subject.includes('anh') ? t('questionBank.coverPrefixes.english') : subject.includes('su') ? t('questionBank.coverPrefixes.history') : subject.includes('dia') ? t('questionBank.coverPrefixes.geography') : subject.includes('van') || subject.includes('ngu') ? t('questionBank.coverPrefixes.literature') : subject.includes('toan') ? t('questionBank.coverPrefixes.math') : subject.slice(0, 1).toLocaleUpperCase('vi')
  return `${code}${grade}`
}
function coverColor(book) {
  const subject = normalize(book.subject)
  if (subject.includes('anh')) return 'rgb(var(--v-theme-pink))'
  if (subject.includes('su')) return 'rgb(var(--v-theme-orange))'
  if (subject.includes('dia')) return 'rgb(var(--v-theme-green))'
  if (subject.includes('van') || subject.includes('ngu')) return 'rgb(var(--v-theme-purple))'
  if (subject.includes('toan')) return 'rgb(var(--v-theme-primary))'
  const palette = ['rgb(var(--v-theme-primary))', 'rgb(var(--v-theme-pink))', 'rgb(var(--v-theme-orange))', 'rgb(var(--v-theme-green))', 'rgb(var(--v-theme-purple))']
  return palette[Math.abs(Number(book.id) || 0) % palette.length]
}
</script>

<style scoped>
.question-tree-card { min-width: 0; border-color: rgba(var(--v-theme-primary), .18); background: rgb(var(--v-theme-surface)); }
.question-tree-card-body { display: grid; gap: 10px; min-width: 0; }
.question-tree-tools :deep(.v-label) { font-size: 13px; }
.book-card { display: flex; width: 100%; min-width: 0; align-items: center; gap: 12px; padding: 10px; border: 1px solid rgba(var(--v-theme-on-surface), .13); border-radius: 14px; background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface)); text-align: left; cursor: pointer; transition: background-color .16s ease, border-color .16s ease, box-shadow .16s ease; }
.book-cover { display: grid; width: 42px; height: 54px; flex: 0 0 42px; place-items: center; border-radius: 6px 10px 10px 6px; background: color-mix(in srgb, var(--book-cover) 55%, rgb(var(--v-theme-secondary))); box-shadow: inset 4px 0 rgba(var(--v-theme-on-surface), .14), 0 2px 5px rgba(var(--v-theme-on-surface), .14); color: rgb(var(--v-theme-on-secondary)); font-size: 13px; font-weight: 800; text-align: center; }
.book-card-copy { display: grid; min-width: 0; flex: 1; gap: 4px; }
.book-card-title { overflow: hidden; font-size: 14px; font-weight: 750; line-height: 1.3; text-overflow: ellipsis; }
.book-card-meta { display: flex; flex-wrap: wrap; gap: 2px 6px; color: rgba(var(--v-theme-on-surface), .75); font-size: 13px; line-height: 1.3; }
.book-progress-label { font-weight: 600; }
.book-progress { max-width: 240px; }
.book-owner { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; color: rgba(var(--v-theme-on-surface), .72); font-size: 13px; }
.book-card:hover { border-color: rgba(var(--v-theme-primary), .5); }
.book-card--selected { border-color: rgb(var(--v-theme-primary)); background: rgba(var(--v-theme-primary), .09); box-shadow: 0 0 0 1px rgba(var(--v-theme-primary), .2); }
.book-card:focus-visible { outline: 3px solid rgb(var(--v-theme-primary)); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .book-card { transition: none; } }
</style>
