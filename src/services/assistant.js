import { api } from "./api";

export function getOverview() {
  return api("/assistant/overview");
}

export function getCoach() {
  return api("/assistant/coach");
}

export function refreshCoach() {
  return api("/assistant/coach/refresh", {
    method: "POST",
    body: JSON.stringify({}),
  });
}
