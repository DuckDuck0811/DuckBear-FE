import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getFruitClimbProgress,
  getFruitClimbTrackDistance,
  getFruitQuestionDuration,
  hasCompleteMatchingAnswer,
} from "./fruitMode.helpers.js";

test("climb progress maps the first and last questions to the track endpoints", () => {
  for (const total of [10, 20, 40]) {
    assert.equal(getFruitClimbProgress(1, total), 0);
    assert.equal(getFruitClimbProgress(total, total), 1);
  }

  assert.ok(Math.abs(getFruitClimbProgress(19, 40) - 0.47) < 0.01);
  assert.equal(getFruitClimbProgress(1, 1), 1);
});

test("climb track ends below the flag after leaving room for the squirrel", () => {
  assert.equal(getFruitClimbTrackDistance(592, 138, 0, 61, 35.52), 349.48);
  assert.ok(getFruitClimbTrackDistance(328, 100, 50, 48, 19.68) > 100);
  assert.ok(getFruitClimbTrackDistance(402, 140, 50, 82, 24.12) > 90);
});

test("question timers use per-question or assignment limits before type defaults", () => {
  assert.equal(getFruitQuestionDuration({ type: "MCQ" }, {}, null), 15);
  assert.equal(getFruitQuestionDuration({ type: "MULTI_MCQ" }, {}, null), 15);
  assert.equal(getFruitQuestionDuration({ type: "FILL" }, {}, null), 60);
  assert.equal(getFruitQuestionDuration({ type: "MATCHING" }, {}, null), 60);
  assert.equal(getFruitQuestionDuration({ type: "ESSAY" }, {}, null), 60);
  assert.equal(
    getFruitQuestionDuration({ type: "ESSAY", timeLimitSeconds: 90 }, {}, null),
    90,
  );
  assert.equal(
    getFruitQuestionDuration(
      { type: "ESSAY" },
      { questionTimeLimitSeconds: 120 },
      null,
    ),
    120,
  );
  assert.equal(
    getFruitQuestionDuration(
      { type: "ESSAY", timeLimitSeconds: 90 },
      { questionTimeLimitSeconds: 120 },
      45,
    ),
    45,
  );
});

test("matching answers are ready only after every pair has a non-empty target", () => {
  const question = {
    options: [{ id: 1 }, { id: 2 }],
  };

  assert.equal(hasCompleteMatchingAnswer(question, { matchAnswers: {} }), false);
  assert.equal(
    hasCompleteMatchingAnswer(question, { matchAnswers: { 1: "A" } }),
    false,
  );
  assert.equal(
    hasCompleteMatchingAnswer(question, {
      matchAnswers: { 1: "A", 2: "  " },
    }),
    false,
  );
  assert.equal(
    hasCompleteMatchingAnswer(question, { matchAnswers: { 1: "A", 2: "B" } }),
    true,
  );
});
