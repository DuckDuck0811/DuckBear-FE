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

export function submitReview({ questionId, selectedOptionId }) {
  return api("/notebook/review", {
    method: "POST",
    body: { questionId, selectedOptionId },
  });
}
