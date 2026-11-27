<template>
  <StudentDashboardLayout>
    <v-container class="py-6 px-4 px-md-8" style="max-width: 800px">
      <!-- Missing session state (e.g., direct URL or hard refresh without state) -->
      <v-card v-if="!session && !store.summary" rounded="xl" border elevation="0" class="pa-6 text-center">
        <v-icon size="48" color="warning" class="mb-3">mdi-alert-circle-outline</v-icon>
        <p class="text-body-1 mb-4">{{ t("practice.sessionNotFound") }}</p>
        <v-btn color="primary" rounded="lg" to="/student/practice">
          {{ t("practice.backToSelect") }}
        </v-btn>
      </v-card>

      <!-- Summary View -->
      <v-card v-else-if="store.summary" rounded="xl" border elevation="0" class="pa-6">
        <div class="text-center mb-5">
          <v-avatar color="amber-darken-1" size="64" class="mb-3">
            <v-icon color="white" size="36">mdi-trophy</v-icon>
          </v-avatar>
          <h1 class="text-h5 font-weight-bold mb-1">
            {{ t("practice.summaryTitle") }}
          </h1>
          <p class="text-h6 text-primary font-weight-bold">
            {{ t("practice.scoreLabel", { correct: store.summary.correctCount, total: store.summary.total }) }}
          </p>
          <v-chip
            v-if="store.summary.xpAwarded > 0"
            color="success"
            variant="flat"
            size="large"
            class="mt-2 font-weight-bold"
          >
            {{ t("practice.xpEarned", { xp: store.summary.xpAwarded }) }}
          </v-chip>
        </div>

        <!-- Wrong questions review -->
        <div v-if="wrongQuestions.length > 0" class="mb-5">
          <h2 class="text-subtitle-1 font-weight-bold mb-3">
            {{ t("practice.wrongQuestionsTitle") }}
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
              {{ store.answers[wq.id]?.explanation }}
            </div>
          </v-card>
        </div>

        <div class="d-flex justify-center ga-3 flex-wrap">
          <v-btn color="primary" rounded="lg" size="large" to="/student/practice">
            {{ t("practice.practiceAgain") }}
          </v-btn>
          <v-btn variant="outlined" rounded="lg" size="large" to="/student">
            {{ t("practice.backToSelect") }}
          </v-btn>
        </div>
      </v-card>

      <!-- Active Question View -->
      <template v-else-if="currentQuestion">
        <div class="d-flex align-center justify-space-between mb-3">
          <span class="text-subtitle-2 font-weight-bold">
            {{ t("practice.progressLabel", { current: currentIndex + 1, total: session.questions.length }) }}
          </span>
          <v-chip size="small" variant="tonal" color="info">
            {{ t("practice.aiDisclaimer") }}
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
              :disabled="Boolean(currentAnswer) || store.loading"
              @click="selectedOptionId = opt.id"
            >
              {{ opt.content }}
            </v-btn>
          </div>

          <!-- Feedback after answering -->
          <v-alert
            v-if="currentAnswer"
            :type="currentAnswer.isCorrect ? 'success' : 'error'"
            variant="tonal"
            class="mb-4"
          >
            <div class="font-weight-bold mb-1">
              {{ currentAnswer.isCorrect ? t("practice.correct") : t("practice.wrong") }}
            </div>
            <div class="text-body-2">{{ currentAnswer.explanation }}</div>
          </v-alert>

          <!-- Actions -->
          <div class="d-flex align-center justify-space-between flex-wrap ga-2">
            <v-btn
              v-if="currentAnswer && !currentAnswer.reported"
              variant="text"
              size="small"
              color="medium-emphasis"
              @click="store.reportQuestion(currentQuestion.id)"
            >
              <v-icon start size="16">mdi-flag-outline</v-icon>
              {{ t("practice.reportBtn") }}
            </v-btn>
            <span v-else-if="currentAnswer?.reported" class="text-caption text-success">
              {{ t("practice.reportedMsg") }}
            </span>
            <span v-else />

            <v-btn
              v-if="!currentAnswer"
              color="primary"
              size="large"
              rounded="lg"
              :disabled="!selectedOptionId"
              :loading="store.loading"
              @click="checkAnswer"
            >
              {{ t("practice.checkBtn") }}
            </v-btn>

            <v-btn
              v-else-if="currentIndex < session.questions.length - 1"
              color="primary"
              size="large"
              rounded="lg"
              @click="nextQuestion"
            >
              {{ t("practice.nextBtn") }}
              <v-icon end>mdi-arrow-right</v-icon>
            </v-btn>

            <v-btn
              v-else
              color="success"
              size="large"
              rounded="lg"
              :loading="store.loading"
              @click="finishSession"
            >
              {{ t("practice.finishBtn") }}
            </v-btn>
          </div>
        </v-card>
      </template>
    </v-container>
  </StudentDashboardLayout>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import StudentDashboardLayout from "../../layouts/StudentDashboardLayout.vue";
import { usePracticeStore } from "../../stores/practice";
import { useGamificationStore } from "../../stores/gamification";

const { t } = useI18n();
const route = useRoute();
const store = usePracticeStore();
const gamificationStore = useGamificationStore();

const sessionId = Number(route.params.id);
const currentIndex = ref(0);
const selectedOptionId = ref(null);

const session = computed(() =>
  store.currentSession?.sessionId === sessionId ? store.currentSession : null,
);

const currentQuestion = computed(
  () => session.value?.questions?.[currentIndex.value] ?? null,
);

const currentAnswer = computed(() =>
  currentQuestion.value ? store.answers[currentQuestion.value.id] ?? null : null,
);

const wrongQuestions = computed(() =>
  (session.value?.questions || []).filter(
    (q) => store.answers[q.id]?.isCorrect === false,
  ),
);

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
  await store.submitAnswer(sessionId, currentQuestion.value.id, selectedOptionId.value);
}

function nextQuestion() {
  selectedOptionId.value = null;
  currentIndex.value += 1;
}

async function finishSession() {
  const res = await store.finish(sessionId);
  if (res?.xpAwarded > 0) {
    gamificationStore.pushToast({ type: "xp", amount: res.xpAwarded });
    gamificationStore.loadMe();
  }
}
</script>
