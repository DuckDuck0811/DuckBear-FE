<template>
  <StudentDashboardLayout>
    <v-container class="py-6 px-4 px-md-8" style="max-width: 820px">
      <div class="d-flex align-center justify-space-between mb-4">
        <v-btn
          variant="text"
          prepend-icon="mdi-arrow-left"
          :to="'/student/notebook'"
        >
          {{ t("notebook.review.backToNotebook") }}
        </v-btn>
        <div v-if="!finished && questions.length" class="text-body-2 font-weight-bold">
          {{ t("notebook.review.progress", { current: currentIndex + 1, total: questions.length }) }}
        </div>
      </div>

      <v-progress-linear
        v-if="!finished && questions.length"
        :model-value="((currentIndex + 1) / questions.length) * 100"
        color="primary"
        height="8"
        rounded
        class="mb-6"
      />

      <v-alert v-if="loadError" type="error" variant="tonal" class="mb-4">
        <div class="d-flex align-center justify-space-between flex-wrap ga-2">
          <span>{{ loadError }}</span>
          <v-btn size="small" variant="text" color="error" @click="loadDueQuestions">
            {{ t("notebook.retry") }}
          </v-btn>
        </div>
      </v-alert>

      <div v-if="loading" class="d-flex flex-column ga-3">
        <v-skeleton-loader type="article, actions" rounded="xl" />
      </div>

      <EmptyState
        v-else-if="!questions.length && !loadError"
        icon="mdi-check-decagram-outline"
        :title="t('notebook.empty.dueTitle')"
        :description="t('notebook.empty.dueDescription')"
      >
        <template #actions>
          <v-btn color="primary" rounded="lg" :to="'/student/notebook'">
            {{ t("notebook.review.backToNotebook") }}
          </v-btn>
        </template>
      </EmptyState>

      <!-- Summary Screen -->
      <v-card v-else-if="finished" rounded="xl" border elevation="0" class="pa-6 text-center">
        <v-icon icon="mdi-party-popper" size="48" color="primary" class="mb-3" />
        <h2 class="text-h5 font-weight-bold mb-2">
          {{ t("notebook.review.summaryTitle") }}
        </h2>
        <v-row class="my-4" justify="center">
          <v-col cols="6" sm="3">
            <div class="text-h5 font-weight-black text-success">{{ stats.correct }}</div>
            <div class="text-caption text-medium-emphasis">{{ t("notebook.review.correctCount") }}</div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="text-h5 font-weight-black text-error">{{ stats.wrong }}</div>
            <div class="text-caption text-medium-emphasis">{{ t("notebook.review.wrongCount") }}</div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="text-h5 font-weight-black text-primary">{{ stats.promoted }}</div>
            <div class="text-caption text-medium-emphasis">{{ t("notebook.review.promotedCount") }}</div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="text-h5 font-weight-black text-warning">{{ stats.mastered }}</div>
            <div class="text-caption text-medium-emphasis">{{ t("notebook.review.masteredCount") }}</div>
          </v-col>
        </v-row>
        <div class="d-flex justify-center flex-wrap ga-3 mt-4">
          <v-btn variant="tonal" rounded="lg" :to="'/student/notebook'">
            {{ t("notebook.review.backToNotebook") }}
          </v-btn>
          <v-btn
            v-if="notebookStore.summary.dueToday > 0"
            color="primary"
            rounded="lg"
            @click="loadDueQuestions"
          >
            {{ t("notebook.review.continueReview") }}
          </v-btn>
        </div>
      </v-card>

      <!-- Question Card -->
      <v-card v-else-if="currentItem" rounded="xl" border elevation="0" class="pa-5 pa-sm-6">
        <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-3">
          <v-chip size="small" color="primary" variant="tonal">
            {{ currentItem.question?.type }}
          </v-chip>
          <span class="text-caption text-medium-emphasis">
            {{ t("notebook.boxLabel", { box: currentItem.box }) }}
          </span>
        </div>

        <div class="text-h6 font-weight-bold mb-5" style="line-height: 1.5">
          {{ currentItem.question?.content }}
        </div>

        <div class="d-flex flex-column ga-3 mb-5">
          <v-btn
            v-for="option in currentItem.question?.options || []"
            :key="option.id"
            block
            size="large"
            rounded="lg"
            :variant="optionVariant(option.id)"
            :color="optionColor(option.id)"
            class="justify-start text-none py-3 px-4 option-btn"
            :disabled="Boolean(reviewResult) || submitting"
            @click="selectedOptionId = option.id"
          >
            <span class="text-wrap text-left">{{ option.content }}</span>
          </v-btn>
        </div>

        <v-alert v-if="submitError" type="error" variant="tonal" class="mb-4">
          <div class="d-flex align-center justify-space-between flex-wrap ga-2">
            <span>{{ submitError }}</span>
            <v-btn
              v-if="canRetrySubmit"
              size="small"
              variant="text"
              color="error"
              @click="handleCheck"
            >
              {{ t("notebook.retry") }}
            </v-btn>
          </div>
        </v-alert>

        <v-alert
          v-if="reviewResult"
          :type="reviewResult.isCorrect ? 'success' : 'error'"
          variant="tonal"
          class="mb-4"
        >
          <div class="font-weight-bold mb-1">{{ boxFeedbackMessage }}</div>
          <div v-if="reviewResult.explanation" class="text-body-2 mt-1">
            {{ reviewResult.explanation }}
          </div>
        </v-alert>

        <!-- Reserved slot for future AI explanation button -->
        <div class="d-flex align-center justify-end flex-wrap ga-3">
          <v-btn
            v-if="!reviewResult"
            color="primary"
            size="large"
            rounded="lg"
            :disabled="!selectedOptionId || submitting"
            :loading="submitting"
            @click="handleCheck"
          >
            {{ t("notebook.review.check") }}
          </v-btn>
          <v-btn
            v-else
            color="primary"
            size="large"
            rounded="lg"
            @click="nextQuestion"
          >
            {{
              currentIndex + 1 < questions.length
                ? t("notebook.review.next")
                : t("notebook.review.finish")
            }}
          </v-btn>
        </div>
      </v-card>
    </v-container>
  </StudentDashboardLayout>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import StudentDashboardLayout from "../../layouts/StudentDashboardLayout.vue";
import EmptyState from "../../components/shared/EmptyState.vue";
import { getNotebook, submitReview } from "../../services/notebook";
import { useNotebookStore } from "../../stores/notebook";

const { t } = useI18n();
const notebookStore = useNotebookStore();

const questions = ref([]);
const currentIndex = ref(0);
const selectedOptionId = ref(null);
const reviewResult = ref(null);
const loading = ref(false);
const submitting = ref(false);
const loadError = ref("");
const submitError = ref("");
const canRetrySubmit = ref(false);
const finished = ref(false);
const stats = ref({ correct: 0, wrong: 0, promoted: 0, mastered: 0 });

const currentItem = computed(() => questions.value[currentIndex.value] ?? null);

const boxFeedbackMessage = computed(() => {
  const res = reviewResult.value;
  if (!res) return "";
  if (res.status === "MASTERED") return t("notebook.review.masteredMsg");
  if (!res.isCorrect) return t("notebook.review.wrongResetMsg");
  if (res.boxAfter === res.boxBefore) return t("notebook.review.earlyReviewMsg");
  const days = Math.max(
    1,
    Math.ceil(
      (new Date(res.nextReviewAt).getTime() - Date.now()) /
        (24 * 60 * 60 * 1000),
    ),
  );
  return t("notebook.review.promotedMsg", { box: res.boxAfter, days });
});

function optionColor(optionId) {
  if (!reviewResult.value) {
    return selectedOptionId.value === optionId ? "primary" : "default";
  }
  if (optionId === reviewResult.value.correctOptionId) return "success";
  if (
    optionId === reviewResult.value.selectedOptionId &&
    !reviewResult.value.isCorrect
  ) {
    return "error";
  }
  return "default";
}

function optionVariant(optionId) {
  if (!reviewResult.value) {
    return selectedOptionId.value === optionId ? "tonal" : "outlined";
  }
  if (
    optionId === reviewResult.value.correctOptionId ||
    optionId === reviewResult.value.selectedOptionId
  ) {
    return "tonal";
  }
  return "outlined";
}

async function loadDueQuestions() {
  loading.value = true;
  loadError.value = "";
  finished.value = false;
  currentIndex.value = 0;
  selectedOptionId.value = null;
  reviewResult.value = null;
  submitError.value = "";
  stats.value = { correct: 0, wrong: 0, promoted: 0, mastered: 0 };

  try {
    const data = await getNotebook({ due: true, page: 1, limit: 50 });
    questions.value = (data.items || []).filter((item) =>
      ["MCQ", "TRUE_FALSE"].includes(item.question?.type),
    );
  } catch (err) {
    loadError.value = err?.message || t("notebook.loadError");
  } finally {
    loading.value = false;
  }
}

async function handleCheck() {
  if (!currentItem.value || !selectedOptionId.value || submitting.value) return;
  submitting.value = true;
  submitError.value = "";
  canRetrySubmit.value = false;

  try {
    const res = await submitReview({
      questionId: currentItem.value.questionId,
      selectedOptionId: selectedOptionId.value,
    });
    reviewResult.value = res;
    if (res.isCorrect) {
      stats.value.correct += 1;
      if (res.boxAfter > res.boxBefore) stats.value.promoted += 1;
      if (res.status === "MASTERED") stats.value.mastered += 1;
    } else {
      stats.value.wrong += 1;
    }
    notebookStore.loadSummary();
  } catch (err) {
    if (err?.status === 400 || err?.status === 404) {
      submitError.value = err.message || t("notebook.review.skipError");
      setTimeout(() => {
        nextQuestion();
      }, 1200);
    } else {
      submitError.value = err?.message || t("notebook.review.networkError");
      canRetrySubmit.value = true;
    }
  } finally {
    submitting.value = false;
  }
}

function nextQuestion() {
  selectedOptionId.value = null;
  reviewResult.value = null;
  submitError.value = "";
  canRetrySubmit.value = false;
  if (currentIndex.value + 1 < questions.value.length) {
    currentIndex.value += 1;
  } else {
    finished.value = true;
  }
}

onMounted(() => {
  notebookStore.loadSummary();
  loadDueQuestions();
});
</script>

<style scoped>
.option-btn {
  min-height: 52px;
  height: auto !important;
}
</style>
