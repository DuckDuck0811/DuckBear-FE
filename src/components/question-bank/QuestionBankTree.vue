<template>
  <v-card class="question-tree-card rounded-xl" variant="outlined">
    <v-card-title class="text-subtitle-1 font-weight-bold">
      {{ t('questionBank.curriculumTree') }}
    </v-card-title>
    <v-divider />
    <v-card-text class="pa-2">
      <div v-if="!books.length" class="pa-5 text-center text-body-2 text-medium-emphasis">
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
        <v-expansion-panel v-for="book in books" :key="book.id" :value="book.id">
          <v-expansion-panel-title @click="emit('expand-book', book.id)">
            <div class="min-width-0 pr-2">
              <div class="font-weight-bold text-body-2 text-wrap">{{ book.title }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ book.subject }} · {{ t('questionBank.gradeLabel', { grade: book.gradeLevel }) }}
              </div>
              <div v-if="book.createdBy?.fullName" class="text-caption text-medium-emphasis">
                {{ t('questionBank.createdBy', { name: book.createdBy.fullName }) }}
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
            <v-expansion-panels v-else multiple variant="accordion" elevation="0" class="question-tree-chapters">
              <v-expansion-panel v-for="chapter in bookDetails[book.id].chapters" :key="chapter.id" :value="chapter.id">
                <v-expansion-panel-title class="text-body-2 font-weight-medium">
                  {{ chapter.title }}
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
                      rounded="lg"
                      class="question-tree-lesson px-2"
                      @click="emit('select-lesson', { book, chapter, lesson })"
                    >
                      <v-list-item-title class="text-body-2 text-wrap">{{ lesson.title }}</v-list-item-title>
                      <template #append>
                        <v-chip
                          size="x-small"
                          :color="lesson._count?.questions ? 'primary' : 'warning'"
                          variant="tonal"
                          :aria-label="t(lesson._count?.questions ? 'questionBank.savedCount' : 'questionBank.emptyLesson')"
                        >
                          {{ lesson._count?.questions || 0 }}
                        </v-chip>
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
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  books: { type: Array, default: () => [] },
  bookDetails: { type: Object, default: () => ({}) },
  loadingBooks: { type: Object, default: () => ({}) },
  selectedBookId: { type: [Number, String], default: null },
  selectedLessonId: { type: [Number, String], default: null },
})
const emit = defineEmits(['expand-book', 'select-lesson'])
const { t } = useI18n()
const expandedBooks = ref([])

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
.question-tree-card { border-color: #e4ecf7; }
.question-tree-books :deep(.v-expansion-panel-title) { min-height: 64px; }
.question-tree-chapters :deep(.v-expansion-panel-title) { min-height: 42px; }
.question-tree-lesson { min-height: 42px; }
.min-width-0 { min-width: 0; }
</style>
