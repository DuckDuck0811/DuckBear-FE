<template>
  <v-layout class="question-bank-page min-vh-100">
    <AppHeader />
    <TeacherSidebar />

    <v-main class="pb-16">
      <v-container class="py-7 px-4 px-md-8" style="max-width: 1180px">
        <v-card class="question-bank-hero mb-6" rounded="xl" elevation="0">
          <div class="hero-copy">
            <v-chip class="hero-kicker mb-4" size="small" prepend-icon="mdi-sparkles" variant="flat">
              {{ t('questionBank.eyebrow') }}
            </v-chip>
            <h1>{{ t('questionBank.pageTitle') }}</h1>
            <p>{{ t('questionBank.pageSubtitle') }}</p>
            <div class="hero-points">
              <span><v-icon icon="mdi-book-check-outline" />{{ t('questionBank.heroPointOne') }}</span>
              <span><v-icon icon="mdi-lightning-bolt-outline" />{{ t('questionBank.heroPointTwo') }}</span>
            </div>
          </div>
          <div class="hero-art" aria-hidden="true">
            <div class="orbit orbit-one"></div><div class="orbit orbit-two"></div>
            <div class="art-card art-card-back"><v-icon icon="mdi-checkbox-marked-circle-outline" /></div>
            <div class="art-card art-card-front">
              <div class="art-card-top"><v-icon icon="mdi-comment-question" /><span></span></div>
              <div class="art-line long"></div><div class="art-line"></div>
              <div class="art-choice correct"><v-icon icon="mdi-check-circle" /><span></span></div>
              <div class="art-choice"><v-icon icon="mdi-circle-outline" /><span></span></div>
            </div>
            <div class="art-spark spark-one">✦</div><div class="art-spark spark-two">✦</div>
          </div>
        </v-card>

        <v-card class="selector-card pa-4 pa-md-6" rounded="xl">
          <div class="selector-heading mb-4">
            <div class="selector-icon"><v-icon icon="mdi-tune-variant" /></div>
            <div><div class="section-kicker">{{ t('questionBank.setupEyebrow') }}</div><h2>{{ t('questionBank.setupTitle') }}</h2></div>
          </div>
          <v-row>
            <v-col cols="12" md="6">
              <div class="select-step"><span>01</span>{{ t('questionBank.selectBook') }}</div>
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
              <div class="select-step"><span>02</span>{{ t('questionBank.selectLesson') }}</div>
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
            <div class="lesson-cover" aria-hidden="true">
              <div class="cover-sun"></div><v-icon icon="mdi-book-open-page-variant" size="48" /><span class="cover-star">✦</span>
            </div>
            <div class="lesson-info">
              <div class="d-flex flex-wrap align-center ga-2 mb-2">
                <v-chip size="x-small" color="primary" variant="tonal" prepend-icon="mdi-bookmark-outline">{{ selectedLesson.chapterTitle }}</v-chip>
                <span class="text-caption text-medium-emphasis">{{ t('questionBank.selectedLesson') }}</span>
              </div>
              <h2>{{ selectedLesson.title }}</h2>
              <p>{{ book?.title }}<span v-if="book?.subject"> · {{ book.subject }}</span><span v-if="book?.gradeLevel"> · {{ t('questionBank.gradeLabel', { grade: book.gradeLevel }) }}</span></p>
            </div>
            <div class="lesson-action">
              <div class="action-hint"><v-icon icon="mdi-arrow-down-left" size="16" />{{ t('questionBank.actionHint') }}</div>
            <QuestionBankSection
              :lesson-id="selectedLesson.id"
              :lesson-title="selectedLesson.displayTitle"
            />
            </div>
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
      chapterTitle: chapter.title,
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
  background: radial-gradient(ellipse at 8% 0%, rgba(208, 225, 255, .44), transparent 34%), #f4f7fd;
}

.selector-card {
  background: #fff;
  border: 1px solid #e6edf8;
  box-shadow: 0 12px 34px rgba(35, 72, 132, .055);
}

.question-bank-hero {
  position: relative;
  min-height: 254px;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 36px clamp(24px, 5vw, 64px);
  color: white;
  background: linear-gradient(112deg, #1749b8 0%, #2878f2 53%, #6aa6ff 100%);
  box-shadow: 0 18px 42px rgba(40, 104, 214, .2);
}
.question-bank-hero::before,.question-bank-hero::after { content: ''; position: absolute; border: 1px solid rgba(255,255,255,.16); border-radius: 50%; }
.question-bank-hero::before { width: 430px; height: 430px; right: 9%; top: -260px; }
.question-bank-hero::after { width: 330px; height: 330px; right: 13%; bottom: -255px; }
.hero-copy { position: relative; z-index: 2; max-width: 670px; }
.hero-kicker { color: #eaf2ff !important; background: rgba(255,255,255,.15) !important; letter-spacing: .08em; }
.hero-copy h1 { margin: 0; font-size: clamp(2rem, 4vw, 3rem); font-weight: 850; letter-spacing: -.035em; line-height: 1.1; }
.hero-copy > p { margin: 14px 0 0; color: rgba(255,255,255,.84); font-size: 1.05rem; }
.hero-points { display: flex; flex-wrap: wrap; gap: 18px; margin-top: 25px; }
.hero-points span { display: inline-flex; align-items: center; gap: 7px; font-size: .82rem; color: rgba(255,255,255,.92); }
.hero-points .v-icon { font-size: 18px; }
.hero-art { position: absolute; width: 310px; height: 240px; right: 6%; top: 8px; }
.orbit { position: absolute; border: 1px solid rgba(255,255,255,.2); border-radius: 50%; transform: rotate(-25deg); }
.orbit-one { width: 260px; height: 150px; left: 21px; top: 50px; }
.orbit-two { width: 300px; height: 190px; left: 1px; top: 31px; transform: rotate(32deg); }
.art-card { position: absolute; width: 148px; height: 178px; top: 33px; border: 1px solid rgba(255,255,255,.75); border-radius: 19px; background: rgba(255,255,255,.95); box-shadow: 0 20px 35px rgba(9,43,110,.18); }
.art-card-back { right: 29px; top: 48px; transform: rotate(11deg); display: grid; place-items: center; color: #f5a623; font-size: 48px; }
.art-card-front { right: 89px; padding: 17px 14px; transform: rotate(-7deg); }
.art-card-top { display: flex; align-items: center; gap: 8px; color: #347af0; font-size: 24px; }
.art-card-top span,.art-line,.art-choice span { display: block; border-radius: 9px; background: #e5edfa; height: 7px; flex: 1; }
.art-line { height: 6px; margin-top: 12px; width: 70%; }.art-line.long { width: 94%; margin-top: 14px; }
.art-choice { height: 24px; margin-top: 10px; border: 1px solid #e5eefa; border-radius: 8px; display: flex; align-items: center; gap: 6px; padding: 0 6px; color: #a9b6ca; font-size: 13px; }
.art-choice span { height: 5px; }.art-choice.correct { color: #20ae79; border-color: #bcebd9; background: #f1fcf7; }
.art-spark { position: absolute; color: #ffe18c; font-size: 25px; }.spark-one { top: 34px; left: 30px; }.spark-two { right: 27px; bottom: 21px; font-size: 16px; }
.selector-heading { display: flex; align-items: center; gap: 13px; padding: 2px 4px 4px; }
.selector-icon { display: grid; place-items: center; width: 43px; height: 43px; border-radius: 14px; color: #347af0; background: #edf4ff; font-size: 21px; }
.section-kicker { color: #6480a8; font-size: .66rem; font-weight: 800; letter-spacing: .11em; }
.selector-heading h2 { color: #172b4d; font-size: 1.16rem; font-weight: 800; margin: 1px 0 0; }
.select-step { display: flex; align-items: center; gap: 8px; color: #62748f; font-size: .77rem; font-weight: 700; margin: 0 0 7px 2px; }
.select-step span { display: inline-grid; place-items: center; width: 21px; height: 21px; border-radius: 7px; color: #347af0; background: #edf4ff; font-size: .66rem; }
.selector-card :deep(.v-field) { border-radius: 13px; }

.selected-lesson {
  position: relative; display: flex; align-items: center; gap: 22px; min-height: 148px; padding: 19px 22px; overflow: hidden;
  border: 1px solid #d9e7ff; border-radius: 20px; background: linear-gradient(105deg, #f4f8ff 0%, #f9fbff 58%, #edf4ff 100%);
}
.selected-lesson::after { content: ''; position: absolute; width: 160px; height: 160px; right: 25%; top: -120px; border-radius: 50%; background: rgba(71,133,238,.055); }
.lesson-cover { position: relative; flex: 0 0 94px; height: 104px; display: grid; place-items: center; overflow: hidden; border-radius: 15px; color: white; background: linear-gradient(145deg, #6aa4ff, #3475e9 65%, #2558bf); box-shadow: 0 9px 17px rgba(47,111,224,.2); }
.lesson-cover::after { content: ''; position: absolute; width: 120px; height: 120px; bottom: -76px; left: -32px; border: 1px solid rgba(255,255,255,.4); border-radius: 50%; }
.cover-sun { position: absolute; width: 35px; height: 35px; border-radius: 50%; right: 11px; top: 11px; background: rgba(255,218,125,.9); }
.lesson-cover .v-icon { position: relative; z-index: 1; filter: drop-shadow(0 4px 5px rgba(14,54,130,.2)); }
.cover-star { position: absolute; z-index: 1; right: 9px; bottom: 12px; color: #fff1b9; font-size: 17px; }
.lesson-info { position: relative; z-index: 1; flex: 1; min-width: 0; }
.lesson-info h2 { color: #193258; font-size: clamp(1.05rem, 2vw, 1.35rem); font-weight: 850; line-height: 1.35; margin: 0; }
.lesson-info p { color: #7688a3; font-size: .86rem; margin: 7px 0 0; }
.lesson-action { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
.action-hint { color: #7688a3; font-size: .72rem; display: flex; align-items: center; gap: 4px; }
.lesson-action :deep(.v-btn) { border-radius: 12px; font-weight: 750; }
.empty-selection { border: 1px dashed #c5d8ef; background: #f8fbff; }

@media (max-width: 760px) {
  .hero-art { right: -100px; opacity: .43; }
  .hero-copy { max-width: 100%; }
  .selected-lesson { align-items: flex-start; gap: 14px; flex-wrap: wrap; }
  .lesson-cover { flex-basis: 70px; height: 78px; }
  .lesson-cover .v-icon { font-size: 38px !important; }
  .lesson-info { min-width: calc(100% - 90px); }
  .lesson-action { width: 100%; flex-direction: row; justify-content: space-between; align-items: center; }
}
@media (max-width: 480px) {
  .hero-art { opacity: .25; right: -130px; }
  .hero-copy > p { max-width: 290px; }
  .hero-points { gap: 10px; flex-direction: column; }
  .question-bank-hero { min-height: 275px; }
}

</style>
