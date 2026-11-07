import { computed, unref } from 'vue'

function toDate(value) {
  const date = value instanceof Date ? new Date(value) : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function getLocalDateKey(value) {
  const date = toDate(value)
  if (!date) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function startOfLocalDay(value) {
  const date = toDate(value)
  if (!date) return null
  date.setHours(0, 0, 0, 0)
  return date
}

export function getWeekDates(value) {
  const start = startOfLocalDay(value)
  if (!start) return []
  const mondayOffset = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - mondayOffset)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return date
  })
}

export function getMonthGrid(value) {
  const anchor = toDate(value)
  if (!anchor) return []
  const firstDay = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const start = startOfLocalDay(firstDay)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  const lastDay = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)
  const end = startOfLocalDay(lastDay)
  end.setDate(end.getDate() + (6 - ((end.getDay() + 6) % 7)))
  const length = Math.round((localDayNumber(end) - localDayNumber(start)) / 86400000) + 1
  return Array.from({ length }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return date
  })
}

function localDayNumber(value) {
  const date = toDate(value)
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
}

function eventDeadline(event) {
  return toDate(event?.deadlineDate || event?.deadline)
}

export function groupEventsByDate(events = []) {
  const groups = new Map()
  for (const event of events) {
    const deadline = eventDeadline(event)
    if (!deadline) continue
    const key = getLocalDateKey(deadline)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push({ ...event, deadlineDate: deadline })
  }
  for (const dayEvents of groups.values()) dayEvents.sort((a, b) => eventDeadline(a) - eventDeadline(b))
  return groups
}

export function groupUpcomingEvents(events = [], now = new Date()) {
  const currentTime = toDate(now)
  const todayKey = getLocalDateKey(currentTime)
  const todayNumber = localDayNumber(currentTime)
  const groups = { overdue: [], today: [], nextThreeDays: [] }

  for (const event of events) {
    if (event?.status === 'submitted') continue
    const deadline = eventDeadline(event)
    if (!deadline) continue
    if (deadline < currentTime) {
      groups.overdue.push({ ...event, deadlineDate: deadline })
      continue
    }
    const dayDifference = (localDayNumber(deadline) - todayNumber) / 86400000
    if (getLocalDateKey(deadline) === todayKey) groups.today.push({ ...event, deadlineDate: deadline })
    else if (dayDifference >= 1 && dayDifference <= 3) groups.nextThreeDays.push({ ...event, deadlineDate: deadline })
  }

  for (const group of Object.values(groups)) group.sort((a, b) => eventDeadline(a) - eventDeadline(b))
  return groups
}

export function getStudentEventStatus(assignment, now = new Date()) {
  const deadline = toDate(assignment?.deadlineDate || assignment?.deadline)
  if (!deadline) return 'upcoming'
  if (assignment.type === 'manual') {
    if (assignment.submissions?.some((submission) => submission.submittedAt)) return 'submitted'
    return deadline < now ? 'overdue' : 'upcoming'
  }
  const attempts = assignment.myAttempts || []
  if (attempts.some((attempt) => attempt.submittedAt)) return 'submitted'
  if (attempts.some((attempt) => attempt.startedAt && !attempt.submittedAt)) return 'inProgress'
  return deadline < now ? 'overdue' : 'upcoming'
}

export function useStudentSchedule({ assignments, manualAssignments, classes, now = () => new Date() }) {
  const events = computed(() => {
    const quizzes = unref(assignments) || []
    const manual = (unref(manualAssignments) || []).map((assignment) => ({
      ...assignment,
      type: 'manual',
      id: `manual-${assignment.id}`,
      manualAssignmentId: assignment.id,
    }))
    return [...quizzes, ...manual]
      .filter((assignment) => assignment.deadline)
      .map((assignment) => {
        const deadlineDate = toDate(assignment.deadline)
        return deadlineDate ? { ...assignment, deadlineDate, status: getStudentEventStatus(assignment, now()) } : null
      })
      .filter(Boolean)
      .sort((a, b) => a.deadlineDate - b.deadlineDate)
  })
  const upcoming = computed(() => groupUpcomingEvents(events.value, now()))
  const byDay = computed(() => groupEventsByDate(events.value))
  const classOptions = computed(() => unref(classes) || [])

  return { events, upcoming, byDay, classOptions }
}
