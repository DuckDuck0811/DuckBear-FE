import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import { onBeforeRouteLeave, useRoute } from "vue-router";
import { api } from "../services/api";

export function useAssignmentSession() {
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
  const checkedQuestions = reactive({});  // questionId (string) → { isCorrect: boolean | null }
  const currentIndex = ref(0);
  const now = ref(Date.now());
  let timer = null;
  let screenHidden = false;

  const questions = computed(() => assignment.value?.questions || []);
  const currentQuestionItem = computed(() => questions.value[currentIndex.value] || null);
  const totalQuestions = computed(() => questions.value.length);
  const isFirstQuestion = computed(() => currentIndex.value === 0);
  const isLastQuestion = computed(
    () => currentIndex.value >= totalQuestions.value - 1,
  );

  const resolvedPlayMode = computed(() => {
    return (
      assignment.value?.resolved_play_mode ||
      assignment.value?.resolvedPlayMode ||
      "classic"
    );
  });

  const rawPlayMode = computed(() => {
    return (
      assignment.value?.play_mode ||
      assignment.value?.playMode ||
      "auto"
    );
  });

  const level = computed(() => {
    return Number(assignment.value?.level) || 3;
  });

  // Tính thời gian hết hạn
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

  const timeLabel = computed(() => {
    if (remainingSeconds.value === null) return "";
    const m = Math.floor(remainingSeconds.value / 60);
    const s = remainingSeconds.value % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  });

  function setAnswer(questionId, patch) {
    if (!answers[questionId]) {
      answers[questionId] = {
        selectedOptionId: null,
        selectedOptionIds: [],
        answerText: "",
        matchAnswers: {},
        dropTargets: {},
      };
    }
    Object.assign(answers[questionId], patch);
    persistDraft();
  }

  function persistDraft() {
    if (attemptId.value) {
      localStorage.setItem(
        `assignment-attempt-${attemptId.value}`,
        JSON.stringify(answers),
      );
    }
  }

  function goTo(index) {
    if (index >= 0 && index < totalQuestions.value) {
      currentIndex.value = index;
    }
  }

  function next() {
    if (!isLastQuestion.value) {
      currentIndex.value += 1;
    }
  }

  function prev() {
    if (!isFirstQuestion.value) {
      currentIndex.value -= 1;
    }
  }

  function hasAnswer(questionId) {
    const a = answers[questionId];
    if (!a) return false;
    const hasSingle =
      a.selectedOptionId !== null && a.selectedOptionId !== undefined;
    const hasMulti =
      Array.isArray(a.selectedOptionIds) && a.selectedOptionIds.length > 0;
    const hasText =
      typeof a.answerText === "string" && a.answerText.trim().length > 0;
    const hasMatch = a.matchAnswers && Object.keys(a.matchAnswers).length > 0;
    return hasSingle || hasMulti || hasText || hasMatch;
  }

  async function checkQuestion(questionId, payload = {}) {
    if (!attemptId.value) return null;
    const a = answers[questionId] || {};
    const selectedIds = Array.isArray(payload.selectedOptionIds)
      ? payload.selectedOptionIds
      : payload.selectedOptionId !== undefined
        ? [payload.selectedOptionId]
        : Array.isArray(a.selectedOptionIds) && a.selectedOptionIds.length > 0
          ? a.selectedOptionIds
          : a.selectedOptionId
            ? [a.selectedOptionId]
            : [];

    const body = {
      selectedOptionIds: selectedIds,
      answerText: payload.answerText !== undefined ? payload.answerText : a.answerText,
      matchAnswers: payload.matchAnswers !== undefined ? payload.matchAnswers : a.matchAnswers,
    };

    const assignmentId = assignment.value?.id || route.params.id;
    const res = await api.post(
      `/assignments/${assignmentId}/attempts/${attemptId.value}/questions/${questionId}/check`,
      body,
    );
    // Lưu local để mini-game biết câu nào đã check
    if (res && res.questionId !== undefined) {
      checkedQuestions[String(res.questionId)] = { isCorrect: res.isCorrect ?? null };
    }
    return res;
  }

  async function submit() {
    if (!attemptId.value || submitting.value) return;
    submitting.value = true;
    errorMessage.value = "";
    try {
      result.value = await api(
        `/assignments/attempts/${attemptId.value}/submit`,
        {
          method: "POST",
          body: {
            answers: questions.value.map(({ question }) => ({
              questionId: question.id,
              selectedOptionIds:
                question.type === "MULTI_MCQ"
                  ? answers[question.id]?.selectedOptionIds || []
                  : answers[question.id]?.selectedOptionId
                    ? [answers[question.id].selectedOptionId]
                    : [],
              answerText: answers[question.id]?.answerText || undefined,
              matchAnswers:
                question.type === "MATCHING"
                  ? answers[question.id]?.matchAnswers
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

      // Populate checkedQuestions từ server (để khôi phục game state)
      if (Array.isArray(started.checkedQuestions)) {
        for (const { questionId, isCorrect } of started.checkedQuestions) {
          checkedQuestions[String(questionId)] = { isCorrect };
        }
      }

      for (const { question } of assignment.value.questions) {
        answers[question.id] = {
          selectedOptionId: null,
          selectedOptionIds: [],
          answerText: "",
          matchAnswers: {},
          dropTargets: {},
        };
      }
      try {
        const saved = JSON.parse(
          localStorage.getItem(`assignment-attempt-${attemptId.value}`) || "{}",
        );
        for (const questionId of Object.keys(answers)) {
          if (saved[questionId]) {
            answers[questionId] = {
              ...answers[questionId],
              ...saved[questionId],
            };
          }
        }
      } catch {
        /* Bỏ qua bản nháp hỏng */
      }
    } catch (error) {
      errorMessage.value = error.message;
    } finally {
      loading.value = false;
    }
  }

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

  // Tự động nộp bài khi hết giờ
  let autoSubmitted = false;
  const monitor = window.setInterval(() => {
    if (
      remainingSeconds.value === 0 &&
      !autoSubmitted &&
      attemptId.value &&
      !result.value
    ) {
      autoSubmitted = true;
      submit();
    }
  }, 1000);
  onBeforeUnmount(() => window.clearInterval(monitor));

  return {
    assignment,
    questions,
    currentQuestionItem,
    totalQuestions,
    currentIndex,
    isFirstQuestion,
    isLastQuestion,
    answers,
    checkedQuestions,
    attemptId,
    attemptNo,
    startedAt,
    result,
    loading,
    submitting,
    errorMessage,
    resolvedPlayMode,
    rawPlayMode,
    level,
    timeLeft: remainingSeconds,
    remainingSeconds,
    timeLabel,
    setAnswer,
    goTo,
    next,
    prev,
    hasAnswer,
    checkQuestion,
    submit,
  };
}

export default useAssignmentSession;
