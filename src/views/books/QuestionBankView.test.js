import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const componentSource = readFileSync(
  new URL("./QuestionBankView.vue", import.meta.url),
  "utf8",
);

test("caps the desktop curriculum column at 300px", () => {
  assert.match(
    componentSource,
    /\.question-bank-workspace\s*\{[^}]*grid-template-columns:\s*minmax\(280px,\s*300px\)\s+minmax\(0,\s*1fr\);/,
  );
});
