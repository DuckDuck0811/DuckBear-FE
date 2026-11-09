import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const stylesheet = readFileSync(
  new URL("./style.css", import.meta.url),
  "utf8",
);

test("success snackbars use the primary blue instead of green", () => {
  const successSnackbarRule = stylesheet.match(
    /\.v-snackbar__wrapper\.bg-success\s*\{([^}]*)\}/,
  );

  assert.ok(successSnackbarRule, "success snackbar styles should be defined");
  assert.match(
    successSnackbarRule[1],
    /background-color:\s*#2f7cf6\s*!important/i,
  );
  assert.match(successSnackbarRule[1], /color:\s*#fff\s*!important/i);
  assert.doesNotMatch(successSnackbarRule[1], /#2bc48a/i);
});
