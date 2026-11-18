import assert from "node:assert/strict";
import { test } from "node:test";
import { computed, createRenderer, ref } from "vue";
import { useQuizGame } from "./useQuizGame.js";

function createGame(checkQuestion = async () => ({ isCorrect: true })) {
  const originalWindow = globalThis.window;
  const originalLocalStorage = globalThis.localStorage;
  globalThis.window = { matchMedia: () => ({ matches: false }) };
  globalThis.localStorage = {
    getItem: () => "false",
    setItem: () => {},
  };

  const currentIndex = ref(0);
  let nextCalls = 0;
  const session = {
    checkedQuestions: {},
    currentIndex,
    isLastQuestion: computed(() => currentIndex.value === 1),
    questions: ref([{ question: { id: 1 } }, { question: { id: 2 } }]),
    setAnswer: () => {},
    checkQuestion,
    goTo: (index) => {
      currentIndex.value = index;
    },
    next: () => {
      nextCalls += 1;
      currentIndex.value += 1;
    },
  };
  let game;
  const app = createRenderer({
    patchProp: () => {},
    insert: () => {},
    remove: () => {},
    createElement: () => ({}),
    createText: () => ({}),
    createComment: () => ({}),
    setText: () => {},
    setElementText: () => {},
    parentNode: () => null,
    nextSibling: () => null,
  }).createApp({
    setup() {
      game = useQuizGame(session);
      return () => null;
    },
  });
  app.mount({});

  return {
    app,
    game,
    getNextCalls: () => nextCalls,
    restoreGlobals: () => {
      globalThis.window = originalWindow;
      globalThis.localStorage = originalLocalStorage;
    },
  };
}

test("manual continuation cancels the pending automatic advance", async (t) => {
  const testGame = createGame();
  t.after(() => {
    testGame.app.unmount();
    testGame.restoreGlobals();
  });

  await testGame.game.submitAndCheck(1, {}, { delayNext: 30 });
  testGame.game.continueToNext();
  await new Promise((resolve) => setTimeout(resolve, 60));

  assert.equal(testGame.getNextCalls(), 1);
});

test("automatic advance still runs when manual continuation is unused", async (t) => {
  const testGame = createGame();
  t.after(() => {
    testGame.app.unmount();
    testGame.restoreGlobals();
  });

  await testGame.game.submitAndCheck(1, {}, { delayNext: 20 });
  await new Promise((resolve) => setTimeout(resolve, 40));

  assert.equal(testGame.getNextCalls(), 1);
});

test("resolution callback waits for a check result", async (t) => {
  let resolveCheck;
  const testGame = createGame(
    () =>
      new Promise((resolve) => {
        resolveCheck = resolve;
      }),
  );
  t.after(() => {
    testGame.app.unmount();
    testGame.restoreGlobals();
  });

  const results = [];
  const submission = testGame.game.submitAndCheck(
    1,
    {},
    { delayNext: 1000, onResolved: (...result) => results.push(result) },
  );
  await Promise.resolve();

  assert.equal(results.length, 0);
  resolveCheck({ isCorrect: false });
  await submission;

  assert.deepEqual(results, [[false, { isCorrect: false }]]);
  testGame.game.continueToNext();
});

test("resolution callback is skipped when the check returns no result", async (t) => {
  const testGame = createGame(async () => null);
  t.after(() => {
    testGame.app.unmount();
    testGame.restoreGlobals();
  });

  let callbackCalled = false;
  await testGame.game.submitAndCheck(
    1,
    {},
    { delayNext: 1000, onResolved: () => (callbackCalled = true) },
  );

  assert.equal(callbackCalled, false);
  testGame.game.continueToNext();
});
