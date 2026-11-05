import test from 'node:test'
import assert from 'node:assert/strict'
import { getTeacherOverviewSummary } from './teacherOverviewSummary.js'

test('overview summary uses the same grading list and sums actionable block items', () => {
  const grading = [
    { assignmentId: 1, count: 2 },
    { assignmentId: 2, count: 4 },
    { assignmentId: 3, count: 4 },
    { assignmentId: 4, count: 10 },
  ]
  const summary = getTeacherOverviewSummary({
    totalActions: 999, // Server aggregate is intentionally ignored in favor of the block lists.
    grading,
    upcoming: [{ assignmentId: 5 }, { assignmentId: 6 }],
    overdue: [{ assignmentId: 7 }],
    joinRequests: [{ id: 8 }, { id: 9 }, { id: 10 }],
  })

  assert.equal(summary.grading, grading)
  assert.equal(summary.gradingCount, 4)
  assert.equal(summary.totalActions, 10)
  assert.deepEqual(summary.grading.map((item) => item.count), [2, 4, 4, 10])
})

test('overview summary safely handles missing overview data', () => {
  const summary = getTeacherOverviewSummary(null)

  assert.equal(summary.gradingCount, 0)
  assert.equal(summary.totalActions, 0)
  assert.deepEqual(summary.grading, [])
})
