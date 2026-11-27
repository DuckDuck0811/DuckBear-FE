# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: notebook.spec.ts >> Wrong Notebook UI (TEST_ fixtures) >> language switching, mobile layout, and role redirects behave correctly
- Location: e2e\notebook.spec.ts:454:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.option-btn').first()
Expected: visible
Timeout: 7000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('.option-btn').first() with timeout 7000ms
  - waiting for locator('.option-btn').first()

```

```yaml
- banner:
  - button "Về trang chủ DuckBear": DuckBear CLASSROOM
  - button "Open student menu"
  - button "Notifications (0)"
  - button "Language": EN
  - button "Classes"
  - text: T
  - button "Profile"
  - button
- navigation "Student navigation":
  - navigation "Student menu":
    - heading "LEARNING SPACE" [level=2]
    - link "Overview":
      - /url: /student
    - link "My classes":
      - /url: /classes
    - link "Curriculum library":
      - /url: /
    - link "Online assignments":
      - /url: /assignments
    - link "Wrong Notebook 2":
      - /url: /student/notebook
    - link "Manual assignments":
      - /url: /manual-assignments
    - link "Study calendar":
      - /url: /schedule
    - link "Learning results":
      - /url: /results
    - text: AI learning assistant Coming soon
    - link "Profile":
      - /url: /profile
- main:
  - link "Back to Notebook":
    - /url: /student/notebook
  - alert:
    - text: Internal server error
    - button "Retry"
- button "Mở trợ lý học tập"
```

# Test source

```ts
  371 |       {
  372 |         headers: {
  373 |           Authorization: `Bearer ${(await page.evaluate(() => localStorage.getItem("accessToken"))) || ""}`,
  374 |         },
  375 |       },
  376 |     );
  377 |     const dueItems = (await questionResponse.json()).items;
  378 |     const firstItem = dueItems[0];
  379 |     const correctId = questionFixtures.get(firstItem.questionId)?.correctOptionId;
  380 |     const correctOption = firstItem.question.options.find(
  381 |       (option: { id: number }) => option.id === correctId,
  382 |     );
  383 |     await page.getByRole("button", { name: correctOption.content }).click();
  384 |     await expect(check).toBeEnabled();
  385 |     await check.click();
  386 |     await expect(page.getByText(/Lên hộp 2, ôn lại sau 3 ngày/)).toBeVisible();
  387 |     await expect(
  388 |       page.locator(".student-sidebar-link").filter({ hasText: "Sổ câu sai" }).locator(".v-chip"),
  389 |     ).toHaveText("4");
  390 |     await expect(
  391 |       page.getByRole("button", { name: correctOption.content }),
  392 |     ).toHaveClass(/text-success/);
  393 |     await screenshot(page, "05-review-correct-feedback.png");
  394 | 
  395 |     await page.reload();
  396 |     await expect(page.getByText(/Câu 1\/4/)).toBeVisible();
  397 |     await screenshot(page, "06-review-refresh.png");
  398 |   });
  399 | 
  400 |   test("400 and 404 review responses show errors and advance to the next question", async ({ page }) => {
  401 |     await login(page);
  402 |     await page.goto("/student/notebook/review");
  403 |     let attempt = 0;
  404 |     await page.route(
  405 |       (url) => url.pathname === "/notebook/review",
  406 |       async (route) => {
  407 |         attempt += 1;
  408 |         await route.fulfill({
  409 |           status: attempt === 1 ? 400 : 404,
  410 |           contentType: "application/json",
  411 |           body: JSON.stringify({
  412 |             message: attempt === 1 ? "Simulated bad request" : "Simulated not found",
  413 |           }),
  414 |         });
  415 |       },
  416 |     );
  417 | 
  418 |     for (const [expectedMessage, nextProgress] of [
  419 |       ["Simulated bad request", "Câu 2/4"],
  420 |       ["Simulated not found", "Câu 3/4"],
  421 |     ]) {
  422 |       await page.locator(".option-btn").first().click();
  423 |       await page.getByRole("button", { name: "Kiểm tra" }).click();
  424 |       await expect(page.getByText(expectedMessage)).toBeVisible();
  425 |       await expect(page.getByText(nextProgress)).toBeVisible({ timeout: 4_000 });
  426 |     }
  427 |     await screenshot(page, "07-review-400-404.png");
  428 |   });
  429 | 
  430 |   test("network review errors can be retried without losing the selection", async ({ page }) => {
  431 |     await login(page);
  432 |     await page.goto("/student/notebook/review");
  433 |     let attempts = 0;
  434 |     await page.route(
  435 |       (url) => url.pathname === "/notebook/review",
  436 |       async (route) => {
  437 |         attempts += 1;
  438 |         if (attempts === 1) {
  439 |           await route.abort();
  440 |           return;
  441 |         }
  442 |         await route.continue();
  443 |       },
  444 |     );
  445 |     await page.locator(".option-btn").first().click();
  446 |     await page.getByRole("button", { name: "Kiểm tra" }).click();
  447 |     await expect(page.getByText("Lỗi kết nối mạng. Vui lòng thử lại.")).toBeVisible();
  448 |     await expect(page.getByRole("button", { name: "Thử lại" })).toBeVisible();
  449 |     await screenshot(page, "08-review-network-error.png");
  450 |     await page.getByRole("button", { name: "Thử lại" }).click();
  451 |     await expect(page.locator(".v-alert").filter({ hasText: /Lên hộp|Quay về hộp/ })).toBeVisible();
  452 |   });
  453 | 
  454 |   test("language switching, mobile layout, and role redirects behave correctly", async ({ page }) => {
  455 |     await login(page);
  456 |     await page.setViewportSize({ width: 375, height: 667 });
  457 |     await page.goto("/student/notebook");
  458 |     await page.locator(".language-switch").click();
  459 |     await page.getByText("English", { exact: true }).click();
  460 |     await expect(page.getByText("Wrong Notebook").first()).toBeVisible();
  461 |     const bodyText = await page.locator("body").innerText();
  462 |     expect(bodyText).not.toMatch(/\bnotebook\.[\w.]+\b/);
  463 |     let dimensions = await page.evaluate(() => ({
  464 |       clientWidth: document.documentElement.clientWidth,
  465 |       scrollWidth: document.documentElement.scrollWidth,
  466 |     }));
  467 |     expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  468 |     await screenshot(page, "12-notebook-mobile-en.png");
  469 | 
  470 |     await page.goto("/student/notebook/review");
> 471 |     await expect(page.locator(".option-btn").first()).toBeVisible();
      |                                                       ^ Error: expect(locator).toBeVisible() failed
  472 |     const buttonHeight = await page.locator(".option-btn").first().evaluate(
  473 |       (element) => element.getBoundingClientRect().height,
  474 |     );
  475 |     expect(buttonHeight).toBeGreaterThanOrEqual(52);
  476 |     dimensions = await page.evaluate(() => ({
  477 |       clientWidth: document.documentElement.clientWidth,
  478 |       scrollWidth: document.documentElement.scrollWidth,
  479 |     }));
  480 |     expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  481 |     await screenshot(page, "13-review-mobile.png");
  482 | 
  483 |     await login(page, "TEACHER");
  484 |     await page.goto("/student/notebook");
  485 |     await expect(page).toHaveURL("http://127.0.0.1:4173/");
  486 |     await screenshot(page, "14-teacher-redirect.png");
  487 | 
  488 |     await login(page, "ADMIN");
  489 |     await page.goto("/student/notebook");
  490 |     await expect(page).toHaveURL("http://127.0.0.1:4173/");
  491 |     await screenshot(page, "15-admin-redirect.png");
  492 |   });
  493 | 
  494 |   test("review can finish, summary counts are shown, and empty state follows", async ({ page }) => {
  495 |     await login(page);
  496 |     await page.goto("/student/notebook/review");
  497 |     while (await page.getByText(/Câu \d+\/\d+/).count()) {
  498 |       const progressText = await page.getByText(/^Câu \d+\/\d+$/).innerText();
  499 |       const [, current, total] = progressText.match(/Câu (\d+)\/(\d+)/) || [];
  500 |       const currentQuestionText = await page.locator(".text-h6").innerText();
  501 |       const response = await page.request.get(
  502 |         `${apiBaseUrl}/notebook?due=true&page=1&limit=50`,
  503 |         {
  504 |           headers: {
  505 |             Authorization: `Bearer ${(await page.evaluate(() => localStorage.getItem("accessToken"))) || ""}`,
  506 |           },
  507 |         },
  508 |       );
  509 |       const items = (await response.json()).items;
  510 |       const item = items.find(
  511 |         (entry: { questionId: number }) =>
  512 |           questionFixtures.has(entry.questionId) &&
  513 |           entry.question.content === currentQuestionText,
  514 |       );
  515 |       const questionId = item?.questionId;
  516 |       const correctId = questionId && questionFixtures.get(questionId)?.correctOptionId;
  517 |       const correctOption = item?.question.options.find(
  518 |         (option: { id: number }) => option.id === correctId,
  519 |       );
  520 |       if (!correctOption) throw new Error(`Missing correct option for review item ${questionId}`);
  521 | 
  522 |       await page.getByRole("button", { name: correctOption.content }).click();
  523 |       await page.getByRole("button", { name: "Kiểm tra" }).click();
  524 |       await expect(page.getByText(/Lên hộp|Đã thuộc/)).toBeVisible();
  525 |       if (current === total) {
  526 |         await page.getByRole("button", { name: "Xem tổng kết" }).click();
  527 |         break;
  528 |       }
  529 |       await page.getByRole("button", { name: "Câu tiếp theo" }).click();
  530 |     }
  531 |     await expect(page.getByText("Hoàn thành phiên ôn tập!")).toBeVisible();
  532 |     await screenshot(page, "09-review-summary.png");
  533 | 
  534 |     await page.goto("/student");
  535 |     await expect(page.getByText("Đã ôn xong hôm nay")).toBeVisible();
  536 |     await expect(
  537 |       page.locator(".student-sidebar-link").filter({ hasText: "Sổ câu sai" }).locator(".v-chip"),
  538 |     ).toHaveCount(0);
  539 |     await screenshot(page, "10-dashboard-done.png");
  540 | 
  541 |     await page.goto("/student/notebook/review");
  542 |     await expect(page.getByText("Hôm nay không còn câu nào cần ôn, giỏi quá!")).toBeVisible();
  543 |     await screenshot(page, "11-review-empty.png");
  544 |   });
  545 | });
  546 | 
```