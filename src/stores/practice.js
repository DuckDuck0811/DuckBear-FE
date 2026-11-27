import { defineStore } from "pinia";
import { ref } from "vue";
import {
  answerPracticeQuestion,
  createPracticeSession,
  finishPracticeSession,
  getPracticeSessions,
  getPracticeSuggestions,
  reportPracticeQuestion,
} from "../services/practice";

export const usePracticeStore = defineStore("practice", () => {
  const suggestions = ref([]);
  const recentSessions = ref([]);
  const currentSession = ref(null); // { sessionId, totalQuestions, questions }
  const answers = ref({}); // { [questionId]: { selectedOptionId, isCorrect, correctOptionId, explanation, reported } }
  const summary = ref(null); // { correctCount, total, xpAwarded, newBadges }
  const loading = ref(false);
  const generating = ref(false);
  const error = ref("");

  async function loadSuggestions() {
    try {
      suggestions.value = await getPracticeSuggestions();
    } catch {
      suggestions.value = [];
    }
  }

  async function loadSessions(limit = 10) {
    try {
      recentSessions.value = await getPracticeSessions(limit);
    } catch {
      recentSessions.value = [];
    }
  }

  async function startSession(lessonId, mode = "LESSON", count = 5) {
    generating.value = true;
    error.value = "";
    summary.value = null;
    answers.value = {};
    try {
      const data = await createPracticeSession(lessonId, mode, count);
      currentSession.value = data;
      return data;
    } catch (err) {
      error.value = err?.message || "Failed to start practice session";
      throw err;
    } finally {
      generating.value = false;
    }
  }

  async function submitAnswer(sessionId, questionId, selectedOptionId) {
    loading.value = true;
    try {
      const res = await answerPracticeQuestion(sessionId, questionId, selectedOptionId);
      answers.value = {
        ...answers.value,
        [questionId]: {
          selectedOptionId,
          isCorrect: res.isCorrect,
          correctOptionId: res.correctOptionId,
          explanation: res.explanation,
          reported: false,
        },
      };
      return res;
    } finally {
      loading.value = false;
    }
  }

  async function finish(sessionId) {
    loading.value = true;
    try {
      const res = await finishPracticeSession(sessionId);
      summary.value = res;
      return res;
    } finally {
      loading.value = false;
    }
  }

  async function reportQuestion(questionId) {
    await reportPracticeQuestion(questionId);
    if (answers.value[questionId]) {
      answers.value = {
        ...answers.value,
        [questionId]: { ...answers.value[questionId], reported: true },
      };
    }
  }

  function resetSession() {
    currentSession.value = null;
    answers.value = {};
    summary.value = null;
    error.value = "";
  }

  return {
    suggestions,
    recentSessions,
    currentSession,
    answers,
    summary,
    loading,
    generating,
    error,
    loadSuggestions,
    loadSessions,
    startSession,
    submitAnswer,
    finish,
    reportQuestion,
    resetSession,
  };
});
