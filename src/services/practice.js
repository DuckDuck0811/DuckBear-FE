import { api } from "./api";

export function getPracticeSuggestions() {
  return api("/practice/suggestions");
}

export function createPracticeSession(lessonId, mode = "LESSON", count = 5) {
  return api("/practice/sessions", {
    method: "POST",
    body: JSON.stringify({
      lessonId: Number(lessonId),
      mode,
      count: Number(count),
    }),
  });
}

export function answerPracticeQuestion(sessionId, questionId, selectedOptionId) {
  return api(`/practice/sessions/${encodeURIComponent(String(sessionId))}/answer`, {
    method: "POST",
    body: JSON.stringify({
      questionId: Number(questionId),
      selectedOptionId,
    }),
  });
}

export function finishPracticeSession(sessionId) {
  return api(`/practice/sessions/${encodeURIComponent(String(sessionId))}/finish`, {
    method: "POST",
  });
}

export function getPracticeSessions(limit = 10) {
  return api(`/practice/sessions?limit=${encodeURIComponent(String(limit))}`);
}

export function reportPracticeQuestion(questionId) {
  return api(`/practice/questions/${encodeURIComponent(String(questionId))}/report`, {
    method: "POST",
  });
}
