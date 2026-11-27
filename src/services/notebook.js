import { api } from "./api";

export function getNotebook(params = {}) {
  const search = new URLSearchParams();
  if (params.due !== undefined && params.due !== null) {
    search.set("due", String(params.due));
  }
  if (params.unit) {
    search.set("unit", String(params.unit));
  }
  if (params.status) {
    search.set("status", String(params.status));
  }
  if (params.page) {
    search.set("page", String(params.page));
  }
  if (params.limit) {
    search.set("limit", String(params.limit));
  }
  const qs = search.toString();
  return api(`/notebook${qs ? `?${qs}` : ""}`);
}

export function getSummary() {
  return api("/notebook/summary");
}

export function getStats() {
  return api("/notebook/stats");
}

export function getChapters() {
  return api("/notebook/chapters");
}

export function getSession(params = {}) {
  const search = new URLSearchParams();
  if (params.mode) search.set("mode", String(params.mode));
  if (params.chapterId) search.set("chapterId", String(params.chapterId));
  if (params.lessonId) search.set("lessonId", String(params.lessonId));
  if (params.limit) search.set("limit", String(params.limit));
  const qs = search.toString();
  return api(`/notebook/session${qs ? `?${qs}` : ""}`);
}

export function getDetail(questionId) {
  return api(`/notebook/${questionId}`);
}

export function dismissQuestion(questionId) {
  return api(`/notebook/${questionId}/dismiss`, {
    method: "POST",
  });
}

export function submitReview({ questionId, selectedOptionId }) {
  return api("/notebook/review", {
    method: "POST",
    body: { questionId, selectedOptionId },
  });
}
