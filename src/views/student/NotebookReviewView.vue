<template>
  <StudentDashboardLayout>
    <v-container class="py-4 px-3 px-md-6" style="max-width: 820px">

      <!-- ── Top navigation bar ── -->
      <div class="review-topbar d-flex align-center justify-space-between mb-3 px-1">
        <v-btn
          variant="text"
          size="small"
          prepend-icon="mdi-arrow-left"
          class="text-medium-emphasis"
          :to="'/student/notebook'"
        >
          {{ t("notebook.review.backToNotebook") }}
        </v-btn>
        <div v-if="!finished && questions.length" class="text-body-2 font-weight-bold text-medium-emphasis">
          {{ t("notebook.review.progress", { current: currentIndex + 1, total: questions.length }) }}
        </div>
      </div>

      <!-- ── Progress bar ── -->
      <div v-if="!finished && questions.length" class="mb-5">
        <v-progress-linear
          :model-value="((currentIndex + 1) / questions.length) * 100"
          color="primary"
          bg-color="primary-lighten-4"
          height="10"
          rounded
        />
      </div>

      <!-- ── Load error ── -->
      <v-alert v-if="loadError" type="error" variant="tonal" class="mb-4" rounded="lg">
        <div class="d-flex align-center justify-space-between flex-wrap ga-2">
          <span>{{ loadError }}</span>
          <v-btn size="small" variant="text" color="error" @click="loadSession">
            {{ t("notebook.retry") }}
          </v-btn>
        </div>
      </v-alert>

      <!-- ── Loading skeleton ── -->
      <div v-if="loading" class="d-flex flex-column ga-3">
        <v-skeleton-loader type="article, actions" rounded="xl" />
      </div>

      <!-- ── Empty state ── -->
      <EmptyState
        v-else-if="!questions.length && !loadError"
        icon="mdi-check-decagram-outline"
        :title="route.query.mode === 'frequent' ? t('notebook.empty.frequentTitle') : t('notebook.empty.dueTitle')"
        :description="route.query.mode === 'frequent' ? t('notebook.empty.frequentDescription') : t('notebook.empty.dueDescription')"
      >
        <template #actions>
          <v-btn color="primary" rounded="lg" :to="'/student/notebook'">
            {{ t("notebook.review.backToNotebook") }}
          </v-btn>
        </template>
      </EmptyState>

      <!-- ══════════════════════════════════════
           Summary Screen
      ══════════════════════════════════════ -->
      <v-card v-else-if="finished" rounded="xl" elevation="2" class="overflow-hidden">
        <!-- Header strip -->
        <div class="summary-header pa-6 text-center">
          <v-icon icon="mdi-party-popper" size="56" color="white" class="mb-2" />
          <h2 class="text-h5 font-weight-bold text-white">
            {{ t("notebook.review.summaryTitle") }}
          </h2>
        </div>

        <!-- Stat cards -->
        <div class="pa-5">
          <v-row dense class="mb-4">
            <v-col cols="6" sm="3">
              <div class="stat-card stat-success text-center rounded-xl pa-3">
                <div class="text-h4 font-weight-black">{{ stats.correct }}</div>
                <div class="text-caption font-weight-medium">{{ t("notebook.review.correctCount") }}</div>
              </div>
            </v-col>
            <v-col cols="6" sm="3">
              <div class="stat-card stat-error text-center rounded-xl pa-3">
                <div class="text-h4 font-weight-black">{{ stats.wrong }}</div>
                <div class="text-caption font-weight-medium">{{ t("notebook.review.wrongCount") }}</div>
              </div>
            </v-col>
            <v-col cols="6" sm="3">
              <div class="stat-card stat-primary text-center rounded-xl pa-3">
                <div class="text-h4 font-weight-black">{{ stats.promoted }}</div>
                <div class="text-caption font-weight-medium">{{ t("notebook.review.promotedCount") }}</div>
              </div>
            </v-col>
            <v-col cols="6" sm="3">
              <div class="stat-card stat-warning text-center rounded-xl pa-3">
                <div class="text-h4 font-weight-black">{{ stats.mastered }}</div>
                <div class="text-caption font-weight-medium">{{ t("notebook.review.masteredCount") }}</div>
              </div>
            </v-col>
          </v-row>

          <!-- Wrong items list -->
          <div v-if="wrongItemsInSession.length" class="mb-4">
            <div class="text-subtitle-2 font-weight-bold mb-2 text-medium-emphasis">
              {{ t("notebook.review.wrongInSessionTitle") }}
            </div>
            <v-list density="compact" rounded="lg" border>
              <v-list-item
                v-for="item in wrongItemsInSession"
                :key="item.questionId"
                :title="item.question?.content"
              >
                <template #append>
                  <v-btn
                    size="small"
                    variant="text"
                    color="primary"
                    @click="openDetail(item.questionId)"
                  >
                    {{ t("notebook.review.viewDetail") }}
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
          </div>

          <!-- Action buttons -->
          <div class="d-flex justify-center flex-wrap ga-3">
            <v-btn variant="tonal" rounded="lg" :to="'/student/notebook'">
              {{ t("notebook.review.backToNotebook") }}
            </v-btn>
            <v-btn
              v-if="wrongItemsInSession.length"
              color="warning"
              variant="tonal"
              rounded="lg"
              @click="retryWrongQuestions"
            >
              {{ t("notebook.review.retryWrong") }}
            </v-btn>
            <v-btn
              v-if="notebookStore.summary.dueToday > 0"
              color="primary"
              rounded="lg"
              @click="loadSession"
            >
              {{ t("notebook.review.continueReview") }}
            </v-btn>
          </div>
        </div>
      </v-card>

      <!-- ══════════════════════════════════════
           Question Card
      ══════════════════════════════════════ -->
      <v-card v-else-if="currentItem" rounded="xl" elevation="2" class="overflow-hidden">

        <!-- Card header strip: type chip + box badge -->
        <div class="question-card-header d-flex align-center justify-space-between px-5 py-3">
          <v-chip
            size="small"
            color="primary"
            variant="flat"
            class="font-weight-bold"
          >
            {{ t(`notebook.questionTypes.${currentItem.question?.type}`, currentItem.question?.type) }}
          </v-chip>
          <div class="box-badge d-flex align-center ga-1" :title="t('notebook.boxLabel', { box: currentItem.box })">
            <span
              v-for="n in 5"
              :key="n"
              class="box-dot"
              :class="n <= currentItem.box ? 'box-dot--active' : ''"
            />
          </div>
        </div>

        <div class="pa-5 pa-sm-6">
          <!-- Question text -->
          <div class="question-text text-body-1 font-weight-bold mb-6">
            {{ currentItem.question?.content }}
          </div>

          <!-- ── Answer options ── -->
          <div class="d-flex flex-column ga-3 mb-5">
            <button
              v-for="(option, idx) in currentItem.question?.options || []"
              :key="option.id"
              class="option-tile"
              :class="[
                `option-tile--${optionColor(option.id) || 'default'}`,
                optionVariant(option.id) === 'flat' ? 'option-tile--filled' : '',
                selectedOptionId === option.id && !reviewResult ? 'option-tile--selected' : '',
                (Boolean(reviewResult) || submitting) ? 'option-tile--disabled' : '',
              ]"
              :disabled="Boolean(reviewResult) || submitting"
              @click="selectedOptionId = option.id"
            >
              <span class="option-letter">{{ String.fromCharCode(65 + idx) }}</span>
              <span class="option-content">{{ option.content }}</span>
            </button>
          </div>

          <!-- Submit error -->
          <v-alert v-if="submitError" type="error" variant="tonal" class="mb-4" rounded="lg">
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

          <!-- Result feedback banner -->
          <div
            v-if="reviewResult"
            class="result-banner mb-4 rounded-xl pa-4 d-flex align-center justify-space-between flex-wrap ga-2"
            :class="reviewResult.isCorrect ? 'result-banner--correct' : 'result-banner--wrong'"
          >
            <div class="d-flex align-center ga-2">
              <v-icon :icon="reviewResult.isCorrect ? 'mdi-check-circle' : 'mdi-close-circle'" size="22" />
              <span class="font-weight-bold text-body-2">{{ boxFeedbackMessage }}</span>
            </div>
            <v-btn
              v-if="!reviewResult.isCorrect"
              size="small"
              variant="tonal"
              color="primary"
              prepend-icon="mdi-sparkles"
              :loading="explainLoading"
              :disabled="explainLoading"
              @click="handleExplainCurrent"
            >
              {{ t("notebook.explain.whyWrong") }}
            </v-btn>
          </div>

          <!-- Explain box -->
          <NotebookExplainBox
            v-if="reviewResult && !reviewResult.isCorrect"
            :loading="explainLoading"
            :error="explainError"
            :can-retry="explainCanRetry"
            :data="explainData"
            class="mb-4"
            @retry="handleExplainCurrent"
          />

          <!-- Action row -->
          <div class="d-flex align-center justify-end flex-wrap ga-3">
            <v-btn
              v-if="reviewResult && !reviewResult.isCorrect && !current.answerLocked"
              variant="tonal"
              color="secondary"
              size="large"
              rounded="lg"
              :loading="practiceStarting"
              @click="startPractice({ mode: 'SIMILAR', questionId: current.questionId, count: 3 })"
            >
              <v-icon start>mdi-lightning-bolt-outline</v-icon>
              {{ t("notebook.practice.similarBtn") }}
            </v-btn>
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
        </div>
      </v-card>

      <NotebookDetailDialog v-model="detailOpen" :question-id="detailQuestionId" />
    </v-container>
  </StudentDashboardLayout>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { useNotebookPractice } from "../../composables/useNotebookPractice";
import StudentDashboardLayout from "../../layouts/StudentDashboardLayout.vue";
import EmptyState from "../../components/shared/EmptyState.vue";
import NotebookDetailDialog from "../../components/notebook/NotebookDetailDialog.vue";
import NotebookExplainBox from "../../components/notebook/NotebookExplainBox.vue";
import { explainQuestion, getSession, submitReview } from "../../services/notebook";
import { useNotebookStore } from "../../stores/notebook";
import { useGamificationStore } from "../../stores/gamification";

const route = useRoute();
const { t } = useI18n();
const { starting: practiceStarting, startPractice } = useNotebookPractice();
const notebookStore = useNotebookStore();
const gamificationStore = useGamificationStore();

const questions = ref([]);
const currentIndex = ref(0);
const selectedOptionId = ref(null);
const reviewResult = ref(null);
const explainLoading = ref(false);
const explainError = ref("");
const explainCanRetry = ref(false);
const explainData = ref(null);
const explainSessionCache = new Map();
const loading = ref(false);
const submitting = ref(false);
const loadError = ref("");
const submitError = ref("");
const canRetrySubmit = ref(false);
const finished = ref(false);
const stats = ref({ correct: 0, wrong: 0, promoted: 0, mastered: 0 });
const wrongItemsInSession = ref([]);
const detailOpen = ref(false);
const detailQuestionId = ref(null);

const currentItem = computed(() => questions.value[currentIndex.value] ?? null);

const boxFeedbackMessage = computed(() => {
  const res = reviewResult.value;
  if (!res) return "";
  if (res.status === "MASTERED") return t("notebook.review.masteredMsg");
  if (!res.isCorrect) return t("notebook.review.wrongResetMsg");
  if (res.early || res.boxAfter === res.boxBefore) {
    return t("notebook.review.earlyReviewMsg");
  }
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

function resetSessionState() {
  finished.value = false;
  currentIndex.value = 0;
  selectedOptionId.value = null;
  reviewResult.value = null;
  explainLoading.value = false;
  explainError.value = "";
  explainCanRetry.value = false;
  explainData.value = null;
  submitError.value = "";
  stats.value = { correct: 0, wrong: 0, promoted: 0, mastered: 0 };
  wrongItemsInSession.value = [];
}

async function loadSession() {
  loading.value = true;
  loadError.value = "";
  resetSessionState();

  try {
    const mode = route.query.mode || "due";
    const chapterId = route.query.chapterId ? Number(route.query.chapterId) : undefined;
    const lessonId = route.query.lessonId ? Number(route.query.lessonId) : undefined;
    const data = await getSession({ mode, chapterId, lessonId, limit: 20 });
    const list = (data.items || []).filter((item) =>
      ["MCQ", "TRUE_FALSE"].includes(item.question?.type),
    );
    const targetQid = route.query.questionId ? Number(route.query.questionId) : null;
    if (targetQid) {
      const idx = list.findIndex((item) => item.questionId === targetQid);
      if (idx > 0) {
        const [target] = list.splice(idx, 1);
        list.unshift(target);
      }
    }
    questions.value = list;
  } catch (err) {
    loadError.value = err?.message || t("notebook.loadError");
  } finally {
    loading.value = false;
  }
}

function retryWrongQuestions() {
  const retryList = [...wrongItemsInSession.value];
  resetSessionState();
  questions.value = retryList;
}

function openDetail(questionId) {
  detailQuestionId.value = questionId;
  detailOpen.value = true;
}

async function handleExplainCurrent() {
  const q = currentQuestion.value;
  if (!q || explainLoading.value) return;
  const cacheKey = `${q.questionId}:${reviewResult.value?.selectedOptionId ?? ""}`;
  if (explainSessionCache.has(cacheKey)) {
    explainData.value = explainSessionCache.get(cacheKey);
    return;
  }

  explainLoading.value = true;
  explainError.value = "";
  explainCanRetry.value = false;
  try {
    const res = await explainQuestion(q.questionId);
    explainData.value = res;
    explainSessionCache.set(cacheKey, res);
  } catch (err) {
    if (err?.status === 403) {
      explainError.value = t("notebook.explain.lockedError");
    } else if (err?.status === 429) {
      explainError.value = t("notebook.explain.rateLimitError");
    } else {
      explainError.value = err?.message || t("notebook.explain.genericError");
      explainCanRetry.value = true;
    }
  } finally {
    explainLoading.value = false;
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
      wrongItemsInSession.value.push(currentItem.value);
    }
    notebookStore.loadSummary();
    gamificationStore.notifyXp(res.xpAwarded, res.newBadges);
    gamificationStore.loadMe();
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
  explainLoading.value = false;
  explainError.value = "";
  explainCanRetry.value = false;
  explainData.value = null;
  if (currentIndex.value + 1 < questions.value.length) {
    currentIndex.value += 1;
  } else {
    finished.value = true;
  }
}

onMounted(() => {
  notebookStore.loadSummary();
  loadSession();
});
</script>

<style scoped>
/* ── Box indicator dots ── */
.box-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  background: rgba(var(--v-theme-on-surface), 0.15);
  transition: background 0.2s;
}
.box-dot--active {
  background: #f59e0b;
}

/* ── Top bar ── */
.review-topbar {
  min-height: 40px;
}

/* ── Question header strip ── */
.question-card-header {
  background: linear-gradient(135deg, #e8f4fd 0%, #f0f7ff 100%);
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.12);
}

/* ── Question text ── */
.question-text {
  font-size: 1.1rem;
  line-height: 1.65;
  color: rgb(var(--v-theme-on-surface));
}

/* ── Option tiles ── */
.option-tile {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 54px;
  padding: 10px 16px;
  border-radius: 12px;
  border: 2px solid rgba(var(--v-theme-on-surface), 0.14);
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 500;
  line-height: 1.4;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  white-space: normal;
}
.option-tile:hover:not(.option-tile--disabled) {
  border-color: rgba(var(--v-theme-primary), 0.5);
  background: rgba(var(--v-theme-primary), 0.05);
}
.option-tile--selected {
  border-color: rgb(var(--v-theme-primary)) !important;
  background: rgba(var(--v-theme-primary), 0.08) !important;
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.15);
}
.option-tile--primary.option-tile--filled {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.08);
}
.option-tile--success.option-tile--filled {
  border-color: rgb(var(--v-theme-success));
  background: rgba(var(--v-theme-success), 0.1);
  color: rgb(var(--v-theme-success));
}
.option-tile--error.option-tile--filled {
  border-color: rgb(var(--v-theme-error));
  background: rgba(var(--v-theme-error), 0.1);
  color: rgb(var(--v-theme-error));
}
.option-tile--disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

/* Letter badge */
.option-letter {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
  font-size: 0.75rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.option-tile--selected .option-letter {
  background: rgb(var(--v-theme-primary));
  color: white;
}
.option-tile--success.option-tile--filled .option-letter {
  background: rgb(var(--v-theme-success));
  color: white;
}
.option-tile--error.option-tile--filled .option-letter {
  background: rgb(var(--v-theme-error));
  color: white;
}

.option-content {
  flex: 1;
}

/* ── Result banner ── */
.result-banner {
  font-size: 0.95rem;
}
.result-banner--correct {
  background: rgba(var(--v-theme-success), 0.1);
  border: 1.5px solid rgba(var(--v-theme-success), 0.4);
  color: rgb(var(--v-theme-success));
}
.result-banner--wrong {
  background: rgba(var(--v-theme-error), 0.08);
  border: 1.5px solid rgba(var(--v-theme-error), 0.35);
  color: rgb(var(--v-theme-error));
}

/* ── Summary header strip ── */
.summary-header {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, #1a73e8 100%);
}

/* ── Stat cards ── */
.stat-card {
  min-height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.stat-success {
  background: rgba(var(--v-theme-success), 0.1);
  color: rgb(var(--v-theme-success));
}
.stat-error {
  background: rgba(var(--v-theme-error), 0.1);
  color: rgb(var(--v-theme-error));
}
.stat-primary {
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}
.stat-warning {
  background: rgba(var(--v-theme-warning), 0.1);
  color: rgb(var(--v-theme-warning));
}
</style>
