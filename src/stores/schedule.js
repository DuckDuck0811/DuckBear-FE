import { defineStore } from "pinia";

function deadlineTime(deadline) {
  if (deadline instanceof Date) return deadline.getTime();
  return new Date(deadline).getTime();
}

/** Hạn còn trong cửa sổ 7×24 giờ kể từ `now`, gồm đúng thời điểm hiện tại. */
export function isDueWithinSevenDays(deadline, now = new Date()) {
  const time = deadlineTime(deadline);
  if (Number.isNaN(time)) return false;
  const end = new Date(now);
  end.setDate(end.getDate() + 7);
  return time >= now.getTime() && time < end.getTime();
}

/** Mọi bài chưa tới hạn, không cắt 7 ngày. */
export function isUpcomingAssignment(deadline, now = new Date()) {
  const time = deadlineTime(deadline);
  if (Number.isNaN(time)) return false;
  return time >= now.getTime();
}

export const useScheduleStore = defineStore("schedule", {
  getters: {
    dueWithinSevenDays() {
      return (events, now = new Date()) =>
        (events || []).filter((event) =>
          isDueWithinSevenDays(event.deadlineDate, now),
        );
    },
    upcomingAssignments() {
      return (events, now = new Date()) =>
        (events || [])
          .filter((event) => isUpcomingAssignment(event.deadlineDate, now))
          .sort((a, b) => a.deadlineDate - b.deadlineDate);
    },
  },
});
