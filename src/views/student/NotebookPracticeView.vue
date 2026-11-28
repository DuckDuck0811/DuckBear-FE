<template>
  <StudentDashboardLayout>
    <v-container class="py-6 px-4 px-md-8" style="max-width: 800px">
      <v-skeleton-loader v-if="loadingSession" type="article" />

      <EmptyState
        v-else-if="loadError"
        icon="mdi-alert-circle-outline"
        :title="t('notebook.practice.notFound')"
        :description="loadError"
      >
        <template #action>
          <v-btn color="primary" rounded="lg" to="/student/notebook">
            {{ t("notebook.practice.backToNotebook") }}
          </v-btn>
        </template>
      </EmptyState>

      <!-- Summary -->
      <v-card v-else-if="summary" rounded="xl" border elevation="0" class="pa-6">
        <div class="text-center mb-5">
          <v-avatar color="amber-darken-1" size="64" class="mb-3">
            <v-icon color="white" size="36">mdi-trophy</v-icon>
          </v-avatar>
          <h1 class="text-h5 font-weight-bold mb-1">
            {{ t("notebook.practice.summaryTitle") }}
          </h1>
          <p class="text-h6 text-primary font-weight-bold">
            {{ t("notebook.practice.scoreLabel", { correct: summary.correctCount, total: summary.total }) }}
          </p>
          <v-chip
            v-if="summary.xpAwarded > 0"
            color="success"
            variant="flat"
            size="large"
            class="mt-2 font-weight-bold"
          >
            {{ t("notebook.practice.xpEarned", { xp: summary.xpAwarded }) }}
          </v-chip>
        </div>

        <v-alert
          v-if="summary.allCorrect && session?.sourceQuestionId"
          type="success"
          variant="tonal"
          class="mb-4"
        >
          <div class="d-flex align-center justify-space-between flex-wrap ga-2">
            <span>{{ t("notebook.practice.allCorrectHint") }}</span>
            <v-btn
              size="small"
              color="success"
              variant="flat"
              :to="`/student/notebook/review?questionId=${session.sourceQuestionId}`"
            >
              {{ t("notebook.practice.reviewOriginalBtn") }}
            </v-btn>
          </div>
        </v-alert>

        <div v-if="wrongQuestions.length > 0" class="mb-5">
          <h2 class="text-subtitle-1 font-weight-bold mb-3">
            {{ t("notebook.practice.wrongQuestionsTitle") }}
          </h2>
          <v-card
            v-for="wq in wrongQuestions"
            :key="wq.id"
            variant="tonal"
            color="error"
            rounded="lg"
            class="pa-3 mb-2"
          >
            <div class="font-weight-medium mb-1">{{ wq.content }}</div>
            <div class="text-body-2 text-medium-emphasis">
              {{ answers[wq.id]?.explanation }}
            </div>
          </v-card>
        </div>

        <div class="d-flex justify-center ga-3 flex-wrap">
          <v-btn color="primary" rounded="lg" size="large" to="/student/notebook">
            {{ t("notebook.practice.backToNotebook") }}
          </v-btn>
        </div>
      </v-card>

      <!-- Active Question -->
      <template v-else-if="currentQuestion">
        <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-3">
          <span class="text-subtitle-2 font-weight-bold">
            {{ t("notebook.practice.progressLabel", { current: currentIndex + 1, total: session.questions.length }) }}
          </span>
          <v-chip size="small" variant="tonal" color="info">
            {{ t("notebook.practice.aiDisclaimer") }}
          </v-chip>
        </div>

        <v-progress-linear
          :model-value="((currentIndex + 1) / session.questions.length) * 100"
          color="primary"
          height="8"
          rounded
          class="mb-5"
        />

        <v-card rounded="xl" border elevation="0" class="pa-5">
          <h2 class="text-h6 font-weight-bold mb-4">
            {{ currentQuestion.content }}
          </h2>

          <div class="d-flex flex-column ga-3 mb-5">
            <v-btn
              v-for="opt in currentQuestion.options"
              :key="opt.id"
              :color="optionColor(opt.id)"
              :variant="optionVariant(opt.id)"
              size="large"
              rounded="lg"
              class="justify-start text-none py-3 px-4"
              style="height: auto; white-space: normal; text-align: left"
              :disabled="Boolean(currentAnswer) || submitting"
              @click="selectedOptionId = opt.id"
            >
              {{ opt.content }}
            </v-btn>
          </div>

          <v-alert
            v-if="currentAnswer"
            :type="currentAnswer.isCorrect ? 'success' : 'error'"
            variant="tonal"
            class="mb-4"
          >
            <div class="font-weight-bold mb-1">
              {{ currentAnswer.isCorrect ? t("notebook.practice.correct") : t("notebook.practice.wrong") }}
            </div>
            <div class="text-body-2">{{ currentAnswer.explanation }}</div>
          </v-alert>

          <div class="d-flex align-center justify-space-between flex-wrap ga-2">
            <v-btn
              v-if="currentAnswer && !currentAnswer.reported"
              variant="text"
              size="small"
              color="medium-emphasis"
              @click="reportCurrent"
            >
              <v-icon start size="16">mdi-flag-outline</v-icon>
              {{ t("notebook.practice.reportBtn") }}
            </v-btn>
            <span v-else-if="currentAnswer?.reported" class="text-caption text-success">
              {{ t("notebook.practice.reportedMsg") }}
            </span>
            <span v-else />

            <v-btn
              v-if="!currentAnswer"
              color="primary"
              size="large"
              rounded="lg"
              :disabled="!selectedOptionId"
              :loading="submitting"
              @click="checkAnswer"
            >
              {{ t("notebook.practice.checkBtn") }}
            </v-btn>

            <v-btn
              v-else-if="currentIndex < session.questions.length - 1"
              color="primary"
              size="large"
              rounded="lg"
              @click="nextQuestion"
            >
              {{ t("notebook.practice.nextBtn") }}
              <v-icon end>mdi-arrow-right</v-icon>
            </v-btn>

            <v-btn
              v-else
              color="success"
              size="large"
              rounded="lg"
              :loading="submitting"
              @click="finish"
            >
              {{ t("notebook.practice.finishBtn") }}
            </v-btn>
          </div>
        </v-card>
      </template>
    </v-container>
  </StudentDashboardLayout>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import StudentDashboardLayout from "../../layouts/StudentDashboardLayout.vue";
import EmptyState from "../../components/shared/EmptyState.vue";
import {
  answerNotebookPractice,
  finishNotebookPractice,
  getNotebookPracticeDetail,
  reportNotebookPracticeQuestion,
} from "../../services/notebook";
import { useGamificationStore } from "../../stores/gamification";

const { t } = useI18n();
const route = useRoute();
const gamificationStore = useGamificationStore();

const sessionId = Number(route.params.sessionId);
const session = ref(null);
const answers = ref({});
const summary = ref(null);
const currentIndex = ref(0);
const selectedOptionId = ref(null);
const loadingSession = ref(true);
const loadError = ref("");
const submitting = ref(false);

const currentQuestion = computed(
  () => session.value?.questions?.[currentIndex.value] ?? null,
);

const currentAnswer = computed(() =>
  currentQuestion.value ? answers.value[currentQuestion.value.id] ?? null : null,
);

const wrongQuestions = computed(() =>
  (session.value?.questions || []).filter(
    (q) => answers.value[q.id]?.isCorrect === false,
  ),
);

async function loadSession() {
  loadingSession.value = true;
  loadError.value = "";
  try {
    const data = await getNotebookPracticeDetail(sessionId);
    session.value = data;
    const map = {};
    let firstUnanswered = 0;
    let foundUnanswered = false;
    (data.questions || []).forEach((q, idx) => {
      if (q.answeredAt) {
        map[q.id] = {
          selectedOptionId: q.selectedOptionId,
          isCorrect: q.isCorrect,
          correctOptionId: q.correctOptionId,
          explanation: q.explanation,
          reported: q.reported,
        };
      } else if (!foundUnanswered) {
        firstUnanswered = idx;
        foundUnanswered = true;
      }
    });
    answers.value = map;
    currentIndex.value = firstUnanswered;

    if (data.status === "DONE") {
      summary.value = await finishNotebookPractice(sessionId);
    }
  } catch (err) {
    loadError.value = err?.message || t("notebook.practice.notFound");
  } finally {
    loadingSession.value = false;
  }
}

function optionColor(optId) {
  const ans = currentAnswer.value;
  if (!ans) return selectedOptionId.value === optId ? "primary" : "default";
  if (optId === ans.correctOptionId) return "success";
  if (optId === ans.selectedOptionId && !ans.isCorrect) return "error";
  return "default";
}

function optionVariant(optId) {
  const ans = currentAnswer.value;
  if (!ans) return selectedOptionId.value === optId ? "tonal" : "outlined";
  if (optId === ans.correctOptionId || optId === ans.selectedOptionId) return "tonal";
  return "outlined";
}

async function checkAnswer() {
  if (!currentQuestion.value || !selectedOptionId.value) return;
  submitting.value = true;
  try {
    const res = await answerNotebookPractice(sessionId, {
      questionId: currentQuestion.value.id,
      selectedOptionId: selectedOptionId.value,
    });
    answers.value = {
      ...answers.value,
      [currentQuestion.value.id]: {
        selectedOptionId: selectedOptionId.value,
        isCorrect: res.isCorrect,
        correctOptionId: res.correctOptionId,
        explanation: res.explanation,
        reported: false,
      },
    };
  } finally {
    submitting.value = false;
  }
}

function nextQuestion() {
  selectedOptionId.value = null;
  currentIndex.value += 1;
}

async function finish() {
  submitting.value = true;
  try {
    const res = await finishNotebookPractice(sessionId);
    summary.value = res;
    if (res?.xpAwarded > 0) {
      gamificationStore.pushToast({ type: "xp", amount: res.xpAwarded });
      gamificationStore.loadMe();
    }
  } finally {
    submitting.value = false;
  }
}

async function reportCurrent() {
  if (!currentQuestion.value) return;
  await reportNotebookPracticeQuestion(currentQuestion.value.id);
  answers.value = {
    ...answers.value,
    [currentQuestion.value.id]: {
      ...answers.value[currentQuestion.value.id],
      reported: true,
    },
  };
}

onMounted(loadSession);
</script>
