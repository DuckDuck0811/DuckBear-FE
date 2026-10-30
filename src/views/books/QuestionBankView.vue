<template>
  <v-layout class="question-bank-page min-vh-100">
    <AppHeader />
    <TeacherSidebar />

    <v-main class="pb-16">
      <v-container class="py-7 px-4 px-md-8" style="max-width: 1180px">
        <v-card class="question-bank-hero pa-5 pa-md-7 mb-6" rounded="xl">
          <div class="d-flex align-center ga-4">
            <v-avatar color="primary" variant="tonal" rounded="xl" size="54">
              <v-icon icon="mdi-comment-question-outline" size="28" />
            </v-avatar>
            <div>
              <div class="text-overline text-primary font-weight-bold">
                {{ t('questionBank.eyebrow') }}
              </div>
              <h1 class="text-h4 font-weight-black">
                {{ t('questionBank.pageTitle') }}
              </h1>
              <p class="text-body-2 text-secondary mb-0">
                {{ t('questionBank.pageSubtitle') }}
              </p>
            </div>
          </div>
        </v-card>

        <v-card class="selector-card pa-4 pa-md-6" rounded="xl">
          <v-row>
            <v-col cols="12" md="6">
              <v-select
                v-model="selectedBookId"
                :items="books"
                item-title="title"
                item-value="id"
                :label="t('questionBank.selectBook')"
                :loading="isLoadingBooks"
                :disabled="isLoadingBooks || !books.length"
                variant="outlined"
                prepend-inner-icon="mdi-book-open-page-variant"
                hide-details="auto"
                @update:model-value="loadBookLessons"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="selectedLessonId"
                :items="lessons"
                item-title="displayTitle"
                item-value="id"
                :label="t('questionBank.selectLesson')"
                :loading="isLoadingBook"
                :disabled="isLoadingBook || !lessons.length"
                variant="outlined"
                prepend-inner-icon="mdi-book-open-variant"
                hide-details="auto"
              />
            </v-col>
          </v-row>

          <v-alert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            class="mt-4"
          >
            {{ errorMessage }}
            <template #append>
              <v-btn v-if="!books.length" variant="text" @click="loadBooks">
                {{ t('classSeatMap.retry') }}
              </v-btn>
            </template>
          </v-alert>

          <v-card
            v-else-if="!isLoadingBooks && !books.length"
            class="empty-selection pa-6 text-center mt-4"
            rounded="lg"
            variant="tonal"
          >
            <v-icon
              icon="mdi-book-alert-outline"
              size="38"
              color="primary"
              class="mb-2"
            />
            <p class="text-body-2 text-secondary mb-0">
              {{ t('questionBank.noBooks') }}
            </p>
          </v-card>

          <v-card
            v-else-if="selectedBookId && !isLoadingBook && !lessons.length"
            class="empty-selection pa-6 text-center mt-4"
            rounded="lg"
            variant="tonal"
          >
            <v-icon
              icon="mdi-book-open-page-variant-outline"
              size="38"
              color="primary"
              class="mb-2"
            />
            <p class="text-body-2 text-secondary mb-0">
              {{ t('questionBank.noLessons') }}
            </p>
          </v-card>

          <div v-if="selectedLesson" class="selected-lesson mt-5">
            <div>
              <div class="text-overline text-secondary">
                {{ t('questionBank.selectedLesson') }}
              </div>
              <h2 class="text-h6 font-weight-black">
                {{ selectedLesson.displayTitle }}
              </h2>
            </div>
            <QuestionBankSection
              :lesson-id="selectedLesson.id"
              :lesson-title="selectedLesson.displayTitle"
            />
          </div>
        </v-card>
      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/auth';
import AppHeader from '../../components/shared/AppHeader.vue';
import TeacherSidebar from '../../components/shared/TeacherSidebar.vue';
import QuestionBankSection from '../../components/QuestionBankSection.vue';

const { t } = useI18n();
const authStore = useAuthStore();
const books = ref([]);
const book = ref(null);
const selectedBookId = ref(null);
const selectedLessonId = ref(null);
const isLoadingBooks = ref(false);
const isLoadingBook = ref(false);
const errorMessage = ref('');

const lessons = computed(() =>
  (book.value?.chapters || []).flatMap((chapter) =>
    (chapter.lessons || []).map((lesson) => ({
      ...lesson,
      displayTitle: `${chapter.title} — ${lesson.title}`,
    })),
  ),
);

const selectedLesson = computed(
  () =>
    lessons.value.find((lesson) => lesson.id === selectedLessonId.value) ||
    null,
);

async function loadBooks() {
  isLoadingBooks.value = true;
  errorMessage.value = '';
  try {
    const result = await api('/books');
    books.value =
      authStore.user?.role === 'ADMIN'
        ? result
        : result.filter(
            (item) => String(item.createdById) === String(authStore.user?.id),
          );
  } catch (error) {
    errorMessage.value = error.message || t('questionBank.loadError');
  } finally {
    isLoadingBooks.value = false;
  }
}

async function loadBookLessons(bookId) {
  book.value = null;
  selectedLessonId.value = null;
  errorMessage.value = '';
  if (!bookId) return;

  isLoadingBook.value = true;
  try {
    book.value = await api(`/books/${bookId}`);
  } catch (error) {
    errorMessage.value = error.message || t('questionBank.loadError');
  } finally {
    isLoadingBook.value = false;
  }
}

onMounted(loadBooks);
</script>

<style scoped>
.question-bank-page {
  background: #f4f8ff;
}

.question-bank-hero,
.selector-card {
  border: 1px solid #e4ecf7;
  background: #fff;
  box-shadow: 0 8px 24px rgba(47, 124, 246, 0.06);
}

.question-bank-hero h1 {
  color: #172b4d;
}

.selected-lesson {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border: 1px solid #dce8f7;
  border-radius: 14px;
  background: #f8fbff;
}

.selected-lesson h2 {
  color: #172b4d;
}

.empty-selection {
  border: 1px dashed #c5d8ef;
  background: #f8fbff;
}

@media (max-width: 600px) {
  .question-bank-hero h1 {
    font-size: 1.45rem;
  }

  .selected-lesson {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
