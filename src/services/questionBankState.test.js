import test from 'node:test'
import assert from 'node:assert/strict'
import { filterQuestionLists } from './questionBankState.js'

const saved = [
  { id: 1, type: 'MCQ', content: 'Saved choice' },
  { id: 2, type: 'ESSAY', content: 'Saved essay' },
]
const drafts = [
  { type: 'MCQ', content: 'Draft choice' },
  { type: 'FILL', content: 'Draft fill' },
]

test('shows saved and draft questions by default', () => {
  assert.deepEqual(filterQuestionLists(saved, drafts), { saved, drafts })
})

test('filters both groups by question type', () => {
  assert.deepEqual(filterQuestionLists(saved, drafts, { type: 'MCQ' }), {
    saved: [saved[0]],
    drafts: [drafts[0]],
  })
})

test('filters by draft or saved status', () => {
  assert.deepEqual(filterQuestionLists(saved, drafts, { status: 'DRAFT' }), {
    saved: [],
    drafts,
  })
  assert.deepEqual(filterQuestionLists(saved, drafts, { status: 'SAVED' }), {
    saved,
    drafts: [],
  })
})

test('combines type and status filters and returns empty groups when unmatched', () => {
  assert.deepEqual(filterQuestionLists(saved, drafts, { type: 'DRAG_DROP', status: 'DRAFT' }), {
    saved: [],
    drafts: [],
  })
})
