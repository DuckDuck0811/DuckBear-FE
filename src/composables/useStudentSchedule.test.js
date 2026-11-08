import test from 'node:test'
import assert from 'node:assert/strict'
import { ref } from 'vue'
import {
  getLocalDateKey,
  getWeekDates,
  getMonthGrid,
  groupEventsByDate,
  groupUpcomingEvents,
  getStudentEventStatus,
  useStudentSchedule,
} from './useStudentSchedule.js'

test('week range starts Monday and contains Sunday at year boundary', () => {
  const days = getWeekDates(new Date(2027, 0, 3, 13))
  assert.equal(days.length, 7)
  assert.equal(getLocalDateKey(days[0]), '2026-12-28')
  assert.equal(getLocalDateKey(days[6]), '2027-01-03')
})

test('month grid covers complete Monday-to-Sunday weeks', () => {
  const days = getMonthGrid(new Date(2026, 10, 15))
  assert.equal(getLocalDateKey(days[0]), '2026-10-26')
  assert.equal(getLocalDateKey(days.at(-1)), '2026-12-06')
  assert.equal(days.length % 7, 0)
  assert.ok(days.some((day) => day.getMonth() === 10 && day.getDate() === 30))
})

test('groups events by local calendar date, independent of UTC date text', () => {
  const deadline = new Date(2026, 10, 7, 0, 15)
  const groups = groupEventsByDate([{ id: 'a', deadlineDate: deadline.toISOString() }])
  assert.deepEqual([...groups.keys()], [getLocalDateKey(deadline)])
  assert.equal(groups.get(getLocalDateKey(deadline))[0].id, 'a')
})

test('upcoming groups separate overdue, remaining today, and the next three local days', () => {
  const now = new Date(2026, 10, 7, 12)
  const at = (day, hour = 18) => new Date(2026, 10, day, hour)
  const events = [
    { id: 'past', deadlineDate: at(6), status: 'overdue' },
    { id: 'now', deadlineDate: new Date(now), status: 'upcoming' },
    { id: 'today', deadlineDate: at(7, 18), status: 'upcoming' },
    { id: 'day1', deadlineDate: at(8), status: 'upcoming' },
    { id: 'day3', deadlineDate: at(10), status: 'upcoming' },
    { id: 'day4', deadlineDate: at(11), status: 'upcoming' },
    { id: 'submitted', deadlineDate: at(7, 17), status: 'submitted' },
  ]
  const groups = groupUpcomingEvents(events, now)
  assert.deepEqual(groups.overdue.map((event) => event.id), ['past'])
  assert.deepEqual(groups.today.map((event) => event.id), ['now', 'today'])
  assert.deepEqual(groups.nextThreeDays.map((event) => event.id), ['day1', 'day3'])
})

test('deadline at the current instant is not overdue; submitted status takes precedence', () => {
  const now = new Date(2026, 10, 7, 12)
  assert.equal(getStudentEventStatus({ deadline: now.toISOString() }, now), 'upcoming')
  assert.equal(getStudentEventStatus({ deadline: new Date(now.getTime() - 1).toISOString() }, now), 'overdue')
  assert.equal(getStudentEventStatus({ deadline: new Date(now.getTime() - 1).toISOString(), myAttempts: [{ submittedAt: now }] }, now), 'submitted')
})

test('composable defaults to the current week and filters calendar plus due groups by class', () => {
  const now = new Date(2026, 10, 7, 12)
  const assignments = ref([
    { id: 1, title: 'Class one', classId: 1, deadline: new Date(2026, 10, 8, 12).toISOString() },
    { id: 2, title: 'Class two', classId: 2, deadline: new Date(2026, 10, 9, 12).toISOString() },
  ])
  const schedule = useStudentSchedule({ assignments, manualAssignments: ref([]), classes: ref([{ id: 1 }, { id: 2 }]), now: () => now })
  assert.equal(schedule.viewMode.value, 'week')
  assert.equal(schedule.calendarDays.value.length, 7)
  assert.equal(schedule.visibleEvents.value.length, 2)
  schedule.selectedClassId.value = 1
  assert.deepEqual(schedule.visibleEvents.value.map((event) => event.id), [1])
  assert.deepEqual(schedule.upcoming.value.nextThreeDays.map((event) => event.id), [1])
  schedule.setViewMode('month')
  assert.equal(schedule.calendarDays.value.length % 7, 0)
})
