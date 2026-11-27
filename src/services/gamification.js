import { api } from "./api";

export function getMe() {
  return api("/gamification/me");
}

export function getLeaderboard(classId) {
  return api(`/gamification/leaderboard?classId=${encodeURIComponent(String(classId))}`);
}

export function updateSettings(leaderboardAnonymous) {
  return api("/gamification/settings", {
    method: "PATCH",
    body: JSON.stringify({ leaderboardAnonymous: Boolean(leaderboardAnonymous) }),
  });
}
