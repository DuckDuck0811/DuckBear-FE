import { computed, ref, unref } from "vue";

function toDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getLocalDateKey(value) {
  const date = toDate(value);
  if (!date) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function startOfLocalDay(value) {
  const date = toDate(value);
  if (!date) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

export function getWeekDates(value) {
  const start = startOfLocalDay(value);
  if (!start) return [];
  const mondayOffset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - mondayOffset);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

export function getMonthGrid(value) {
  const anchor = toDate(value);
  if (!anchor) return [];
  const firstDay = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = startOfLocalDay(firstDay);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const lastDay = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const end = startOfLocalDay(lastDay);
  end.setDate(end.getDate() + (6 - ((end.getDay() + 6) % 7)));
  const length =
    Math.round((localDayNumber(end) - localDayNumber(start)) / 86400000) + 1;
  return Array.from({ length }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function localDayNumber(value) {
  const date = toDate(value);
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function eventDeadline(event) {
  return toDate(event?.deadlineDate || event?.deadline);
}

export function groupEventsByDate(events = []) {
  const groups = new Map();
  for (const event of events) {
    const deadline = eventDeadline(event);
    if (!deadline) continue;
    const key = getLocalDateKey(deadline);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ ...event, deadlineDate: deadline });
  }
  for (const dayEvents of groups.values())
    dayEvents.sort((a, b) => eventDeadline(a) - eventDeadline(b));
  return groups;
}

export function groupUpcomingEvents(events = [], now = new Date()) {
  const currentTime = toDate(now);
  const todayKey = getLocalDateKey(currentTime);
  const todayNumber = localDayNumber(currentTime);
  const groups = { overdue: [], today: [], nextThreeDays: [] };

  for (const event of events) {
    if (event?.status === "submitted") continue;
    const deadline = eventDeadline(event);
    if (!deadline) continue;
    if (deadline < currentTime) {
      groups.overdue.push({ ...event, deadlineDate: deadline });
      continue;
    }
    const dayDifference = (localDayNumber(deadline) - todayNumber) / 86400000;
    if (getLocalDateKey(deadline) === todayKey)
      groups.today.push({ ...event, deadlineDate: deadline });
    else if (dayDifference >= 1 && dayDifference <= 3)
      groups.nextThreeDays.push({ ...event, deadlineDate: deadline });
  }

  for (const group of Object.values(groups))
    group.sort((a, b) => eventDeadline(a) - eventDeadline(b));
  return groups;
}

export function getStudentEventStatus(assignment, now = new Date()) {
  const deadline = toDate(assignment?.deadlineDate || assignment?.deadline);
  if (!deadline) return "upcoming";
  if (assignment.type === "manual") {
    if (assignment.submissions?.some((submission) => submission.submittedAt))
      return "submitted";
    return deadline < now ? "overdue" : "upcoming";
  }
  const attempts = assignment.myAttempts || [];
  if (attempts.some((attempt) => attempt.submittedAt)) return "submitted";
  if (attempts.some((attempt) => attempt.startedAt && !attempt.submittedAt))
    return "inProgress";
  return deadline < now ? "overdue" : "upcoming";
}

export function useStudentSchedule({
  assignments,
  manualAssignments,
  classes,
  now = () => new Date(),
}) {
  const viewMode = ref("week");
  const anchorDate = ref(startOfLocalDay(now()));
  const selectedClassId = ref(null);
  const events = computed(() => {
    const quizzes = (unref(assignments) || []).map((assignment) => ({
      ...assignment,
      type: "quiz",
    }));
    const manual = (unref(manualAssignments) || []).map((assignment) => ({
      ...assignment,
      type: "manual",
      id: `manual-${assignment.id}`,
      manualAssignmentId: assignment.id,
    }));
    return [...quizzes, ...manual]
      .filter((assignment) => assignment.deadline)
      .map((assignment) => {
        const deadlineDate = toDate(assignment.deadline);
        return deadlineDate
          ? {
              ...assignment,
              deadlineDate,
              status: getStudentEventStatus(assignment, now()),
            }
          : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.deadlineDate - b.deadlineDate);
  });
  const visibleEvents = computed(() =>
    events.value.filter(
      (event) =>
        selectedClassId.value === null ||
        Number(event.classId || event.class?.id) ===
          Number(selectedClassId.value),
    ),
  );
  const upcoming = computed(() =>
    groupUpcomingEvents(visibleEvents.value, now()),
  );
  const byDay = computed(() => groupEventsByDate(visibleEvents.value));
  const classOptions = computed(() => unref(classes) || []);
  const calendarDays = computed(() => {
    const dates =
      viewMode.value === "week"
        ? getWeekDates(anchorDate.value)
        : getMonthGrid(anchorDate.value);
    const todayKey = getLocalDateKey(now());
    const currentMonth = anchorDate.value.getMonth();
    return dates.map((date) => ({
      date,
      key: getLocalDateKey(date),
      isToday: getLocalDateKey(date) === todayKey,
      isCurrentMonth: date.getMonth() === currentMonth,
      events: byDay.value.get(getLocalDateKey(date)) || [],
    }));
  });

  function setViewMode(mode) {
    if (!["week", "month"].includes(mode) || mode === viewMode.value) return;
    viewMode.value = mode;
    if (mode === "month")
      anchorDate.value = new Date(
        anchorDate.value.getFullYear(),
        anchorDate.value.getMonth(),
        1,
      );
  }

  function movePeriod(direction) {
    const next = new Date(anchorDate.value);
    if (viewMode.value === "week") next.setDate(next.getDate() + direction * 7);
    else next.setMonth(next.getMonth() + direction);
    anchorDate.value = next;
  }

  function goToToday() {
    anchorDate.value = startOfLocalDay(now());
  }

  return {
    viewMode,
    anchorDate,
    selectedClassId,
    events,
    visibleEvents,
    upcoming,
    byDay,
    calendarDays,
    classOptions,
    setViewMode,
    movePeriod,
    goToToday,
  };
}
