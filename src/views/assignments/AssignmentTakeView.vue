<template>
  <v-layout
    class="min-vh-100 assignment-take-page"
    :class="'mode-' + resolvedDisplayMode"
  >
    <AppHeader />
    <StudentSidebar />
    <v-main class="pb-16">
      <v-container class="py-7 px-4 px-md-8" style="max-width: 960px">
        <v-btn
          to="/assignments"
          variant="text"
          prepend-icon="mdi-arrow-left"
          class="mb-4"
          >{{ t("assignmentHub.backToAssignments") }}</v-btn
        >
        <v-progress-linear
          v-if="loading"
          indeterminate
          color="primary"
          rounded
        />
        <v-alert v-else-if="errorMessage" type="error" variant="tonal">{{
          errorMessage
        }}</v-alert>

        <template v-else-if="result">
          <v-card class="pa-6 mb-5" rounded="xl">
            <v-avatar color="success" variant="tonal" size="60" class="mb-3"
              ><v-icon icon="mdi-check-bold" size="30"
            /></v-avatar>
            <h1 class="text-h4 font-weight-black">
              {{ t("assignmentHub.submitted") }}
            </h1>
            <p class="text-body-1">
              {{
                result.needsManualGrading
                  ? t("assignmentHub.waitForGrading")
                  : t("assignmentHub.score", { score: result.score ?? 0 })
              }}
            </p>
            <p v-if="result.totalPoints" class="text-body-2 text-secondary">
              {{
                t("assignmentHub.points", {
                  earned: result.earnedPoints,
                  total: result.totalPoints,
                })
              }}
            </p>
          </v-card>
          <v-card
            v-for="(answer, index) in result.answers"
            :key="answer.id"
            class="pa-5 mb-3"
            rounded="xl"
          >
            <div class="d-flex align-center ga-2 mb-2">
              <v-chip size="small" color="primary" variant="tonal">{{
                t("questionBank.questionNumber", { number: index + 1 })
              }}</v-chip
              ><v-chip
                v-if="answer.isCorrect !== null"
                size="small"
                :color="answer.isCorrect ? 'success' : 'error'"
                variant="tonal"
                >{{
                  answer.isCorrect
                    ? t("assignmentHub.correct")
                    : t("assignmentHub.incorrect")
                }}</v-chip
              >
            </div>
            <div class="font-weight-bold mb-2">
              {{ answer.question.content }}
            </div>
            <div v-if="answer.question.answerText" class="text-body-2 mb-1">
              <strong>{{ t("questionBank.answerText") }}:</strong>
              {{ answer.question.answerText }}
            </div>
            <div
              v-if="answer.question.explanation"
              class="text-body-2 text-secondary"
            >
              <strong>{{ t("questionBank.explanation") }}:</strong>
              {{ answer.question.explanation }}
            </div>
          </v-card>
        </template>

        <template v-else-if="assignment">
          <!-- Header Thông tin bài tập -->
          <v-card class="pa-5 pa-md-7 mb-4" rounded="xl">
            <div
              class="d-flex flex-wrap align-center justify-space-between ga-3"
            >
              <div>
                <div class="text-overline text-primary">
                  {{ assignment.class?.name }} ·
                  {{ assignment.lesson?.title || assignment.book?.title }}
                </div>
                <h1 class="text-h4 font-weight-black">
                  {{ assignment.title }}
                </h1>
              </div>
              <v-chip
                v-if="remainingSeconds !== null"
                color="warning"
                variant="tonal"
                prepend-icon="mdi-timer-outline"
                >{{ timeLabel }}</v-chip
              >
            </div>
            <div class="text-body-2 text-secondary mt-2">
              {{
                t("assignmentHub.attemptLabel", {
                  number: attemptNo,
                  max: assignment.maxAttempts
                    ? assignment.maxAttempts
                    : t("assignmentHub.unlimited"),
                })
              }}
            </div>
          </v-card>

          <!-- DECORATOR THEO CHẾ ĐỘ HIỂN THỊ -->
          <FunModeDecorator
            v-if="resolvedDisplayMode === 'fun'"
            :total-questions="totalQuestions"
            :answered-count="answeredCount"
            :stars="stars"
          />
          <CompetitiveModeDecorator
            v-else-if="resolvedDisplayMode === 'competitive'"
            :total-questions="totalQuestions"
            :answered-count="answeredCount"
            :streak="streak"
          />
          <FocusModeDecorator
            v-else
            :total-questions="totalQuestions"
            :answered-count="answeredCount"
            :answered-indices="answeredIndices"
            @jump="scrollToQuestion"
          />

          <!-- DANH SÁCH CÂU HỎI DÙNG CHUNG -->
          <QuestionItem
            v-for="(item, index) in assignment.questions"
            :id="'question-card-' + index"
            :key="item.question.id"
            :item="item"
            :index="index"
            :answer="answers[item.question.id]"
            :mode="resolvedDisplayMode"
            @answered="handleAnswered(index)"
          />

          <div class="d-flex justify-end mt-6">
            <v-btn
              color="primary"
              size="large"
              prepend-icon="mdi-send"
              :loading="submitting"
              rounded="pill"
              class="px-6 font-weight-bold"
              @click="submitAttempt"
              >{{ t("assignmentHub.submit") }}</v-btn
            >
          </div>
        </template>
      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import { onBeforeRouteLeave, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { api } from "../../services/api";
import AppHeader from "../../components/shared/AppHeader.vue";
import StudentSidebar from "../../components/shared/StudentSidebar.vue";
import QuestionItem from "../../components/assignment/QuestionItem.vue";
import FunModeDecorator from "../../components/assignment/modes/FunModeDecorator.vue";
import CompetitiveModeDecorator from "../../components/assignment/modes/CompetitiveModeDecorator.vue";
import FocusModeDecorator from "../../components/assignment/modes/FocusModeDecorator.vue";
import "../../styles/display-modes.css";

const { t } = useI18n();
const route = useRoute();
const loading = ref(true);
const submitting = ref(false);
const errorMessage = ref("");
const assignment = ref(null);
const attemptId = ref(null);
const attemptNo = ref(1);
const startedAt = ref(null);
const result = ref(null);
const answers = reactive({});
const now = ref(Date.now());
const stars = ref(0);
const streak = ref(0);
let timer = null;
let screenHidden = false;

const resolvedDisplayMode = computed(() => {
  return (
    assignment.value?.resolved_display_mode ||
    assignment.value?.resolvedDisplayMode ||
    "focus"
  );
});

const totalQuestions = computed(() => assignment.value?.questions?.length || 0);

const answeredIndices = computed(() => {
  if (!assignment.value?.questions) return [];
  const indices = [];
  assignment.value.questions.forEach(({ question }, index) => {
    const a = answers[question.id];
    if (!a) return;
    const hasSingle = a.selectedOptionId !== null && a.selectedOptionId !== undefined;
    const hasMulti = Array.isArray(a.selectedOptionIds) && a.selectedOptionIds.length > 0;
    const hasText = typeof a.answerText === "string" && a.answerText.trim().length > 0;
    const hasImage = typeof a.imageUrl === "string" && a.imageUrl.length > 0;
    const hasMatch = a.matchAnswers && Object.keys(a.matchAnswers).length > 0;
    if (hasSingle || hasMulti || hasText || hasImage || hasMatch) {
      indices.push(index);
    }
  });
  return indices;
});

const answeredCount = computed(() => answeredIndices.value.length);

function handleAnswered(index) {
  stars.value = answeredCount.value * 2;
  streak.value = answeredCount.value;
}

function scrollToQuestion(index) {
  const el = document.getElementById("question-card-" + index);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

watch(
  answers,
  () => {
    if (attemptId.value)
      localStorage.setItem(
        `assignment-attempt-${attemptId.value}`,
        JSON.stringify(answers),
      );
  },
  { deep: true },
);

const endTime = computed(() => {
  const times = [];
  if (assignment.value?.deadline)
    times.push(new Date(assignment.value.deadline).getTime());
  if (assignment.value?.durationMinutes && startedAt.value)
    times.push(
      new Date(startedAt.value).getTime() +
        assignment.value.durationMinutes * 60000,
    );
  return times.length ? Math.min(...times) : null;
});
const remainingSeconds = computed(() =>
  endTime.value === null
    ? null
    : Math.max(0, Math.floor((endTime.value - now.value) / 1000)),
);
const timeLabel = computed(
  () =>
    `${String(Math.floor(remainingSeconds.value / 60)).padStart(2, "0")}:${String(remainingSeconds.value % 60).padStart(2, "0")}`,
);

onMounted(async () => {
  timer = window.setInterval(() => {
    now.value = Date.now();
  }, 1000);
  document.addEventListener("visibilitychange", trackScreenVisibility);
  await startAttempt();
});
onBeforeUnmount(() => {
  window.clearInterval(timer);
  document.removeEventListener("visibilitychange", trackScreenVisibility);
});

onBeforeRouteLeave(() => {
  if (attemptId.value && !result.value && !document.hidden && !screenHidden) {
    void recordScreenEvent("LEFT");
  }
});

function trackScreenVisibility() {
  if (!attemptId.value || result.value) return;
  if (document.hidden && !screenHidden) {
    screenHidden = true;
    void recordScreenEvent("HIDDEN");
  } else if (!document.hidden && screenHidden) {
    screenHidden = false;
    void recordScreenEvent("RETURNED");
  }
}

function recordScreenEvent(event) {
  if (!attemptId.value) return Promise.resolve();
  return api(`/assignments/attempts/${attemptId.value}/screen-events`, {
    method: "POST",
    body: { event },
  }).catch(() => {});
}

async function startAttempt() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const started = await api(`/assignments/${route.params.id}/start`, {
      method: "POST",
    });
    attemptId.value = started.attemptId;
    attemptNo.value = started.attemptNo;
    startedAt.value = started.startedAt;
    assignment.value = started.assignment;
    for (const { question } of assignment.value.questions) {
      answers[question.id] = {
        selectedOptionId: null,
        selectedOptionIds: [],
        answerText: "",
        imageUrl: null,
        matchAnswers: {},
        dropTargets: {},
      };
    }
    try {
      const saved = JSON.parse(
        localStorage.getItem(`assignment-attempt-${attemptId.value}`) || "{}",
      );
      for (const questionId of Object.keys(answers)) {
        if (saved[questionId])
          answers[questionId] = {
            ...answers[questionId],
            ...saved[questionId],
          };
      }
    } catch {
      /* Ignore an invalid local draft and start with blank answers. */
    }
    stars.value = answeredCount.value * 2;
    streak.value = answeredCount.value;
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
}

async function submitAttempt() {
  if (!attemptId.value || submitting.value) return;
  submitting.value = true;
  errorMessage.value = "";
  try {
    result.value = await api(
      `/assignments/attempts/${attemptId.value}/submit`,
      {
        method: "POST",
        body: {
          answers: assignment.value.questions.map(({ question }) => ({
            questionId: question.id,
            selectedOptionIds:
              question.type === "MULTI_MCQ"
                ? answers[question.id].selectedOptionIds
                : answers[question.id].selectedOptionId
                  ? [answers[question.id].selectedOptionId]
                  : [],
            answerText: answers[question.id].answerText || undefined,
            imageUrl: answers[question.id].imageUrl || undefined,
            matchAnswers:
              question.type === "MATCHING"
                ? answers[question.id].matchAnswers
                : undefined,
          })),
        },
      },
    );
    localStorage.removeItem(`assignment-attempt-${attemptId.value}`);
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    submitting.value = false;
  }
}

watchTimer();
function watchTimer() {
  let autoSubmitted = false;
  const monitor = window.setInterval(() => {
    if (
      remainingSeconds.value === 0 &&
      !autoSubmitted &&
      attemptId.value &&
      !result.value
    ) {
      autoSubmitted = true;
      submitAttempt();
    }
  }, 1000);
  onBeforeUnmount(() => window.clearInterval(monitor));
}
</script>

<style scoped>
.assignment-take-page {
  background: #f4f8ff;
}
.match-select {
  max-width: 300px;
}
.drag-drop-activity {
  display: grid;
  gap: 14px;
}
.drag-instruction {
  margin: 0;
  color: #64748b;
  font-size: 0.88rem;
}
.drag-token-bank {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 9px;
  padding: 14px;
  border: 1px dashed #c7d7ed;
  border-radius: 14px;
  background: #f8fbff;
}
.drag-bank-label {
  flex-basis: 100%;
  color: #52647e;
  font-size: 0.78rem;
  font-weight: 800;
}
.drag-token {
  display: inline-flex;
  min-height: 38px;
  align-items: center;
  gap: 6px;
  padding: 0 13px;
  border: 1px solid #cfe0fa;
  border-radius: 999px;
  background: #fff;
  color: #2e5f9e;
  cursor: grab;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  touch-action: manipulation;
}
.drag-token:active {
  cursor: grabbing;
}
.drag-token--selected {
  border-color: #347af0;
  background: #eaf2ff;
  box-shadow: 0 0 0 3px rgba(52, 122, 240, 0.12);
}
.drag-token--placed {
  opacity: 0.55;
}
.drop-target-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 10px;
}
.drop-target {
  display: grid;
  min-height: 76px;
  gap: 5px;
  padding: 11px 13px;
  border: 1px dashed #aebed3;
  border-radius: 13px;
  background: #fff;
  cursor: copy;
}
.drop-target--filled {
  border-style: solid;
  border-color: #83b0f6;
  background: #f3f8ff;
}
.drop-target-label {
  color: #52647e;
  font-size: 0.82rem;
  font-weight: 800;
}
.drop-target-content {
  color: #1f5fb8;
  font-weight: 800;
}
.drop-target-placeholder {
  color: #9aa6b6;
  font-size: 0.84rem;
}
</style>
