import test from "node:test";
import assert from "node:assert/strict";
import { createPinia, setActivePinia } from "pinia";
import { useQuestionBankStore } from "./questionBank.js";

test("keeps drafts by user and lesson and clears only the selected lesson", () => {
  setActivePinia(createPinia());
  const store = useQuestionBankStore();
  const firstDraft = { type: "MCQ", content: "Draft one" };
  const otherLessonDraft = { type: "ESSAY", content: "Different lesson" };
  store.setDrafts(1, 10, [firstDraft]);
  store.setDrafts(1, 11, [otherLessonDraft]);
  store.setDrafts(2, 10, [{ type: "FILL", content: "Different user" }]);

  store.clearLesson(1, 10);

  assert.deepEqual(store.draftsFor(1, 10), []);
  assert.deepEqual(store.draftsFor(1, 11), [otherLessonDraft]);
  assert.equal(store.draftsFor(2, 10).length, 1);
  assert.equal(store.hasPendingDrafts, true);
});

test("updates and removes drafts without persisting them", () => {
  setActivePinia(createPinia());
  const store = useQuestionBankStore();
  store.setDrafts(1, 10, [
    { type: "MCQ", content: "First" },
    { type: "ESSAY", content: "Second" },
  ]);

  store.updateDraft(1, 10, 0, { type: "MCQ", content: "Edited" });
  store.removeDraft(1, 10, 1);

  assert.deepEqual(store.draftsFor(1, 10), [
    { type: "MCQ", content: "Edited" },
  ]);
  store.clearAllDrafts();
  assert.equal(store.hasPendingDrafts, false);
});
