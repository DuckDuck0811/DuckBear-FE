# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: notebook.spec.ts >> Wrong Notebook UI (TEST_ fixtures) >> review shows grading feedback, supports refresh, and updates the badge
- Location: e2e\notebook.spec.ts:360:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/Câu 1\/5/)
Expected: visible
Timeout: 7000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText(/Câu 1\/5/) with timeout 7000ms
  - waiting for getByText(/Câu 1\/5/)

```

```yaml
- banner:
  - button "Về trang chủ DuckBear": DuckBear CLASSROOM
  - button "Thông báo (0)"
  - button "Ngôn ngữ": VI
  - button "Lớp học"
  - text: T TEST_NOTEBOOK_UI_1795762936047_09220766 STUDENT Học sinh
  - button "Hồ sơ cá nhân"
  - button "Đăng xuất"
- navigation "Điều hướng học sinh":
  - navigation "Menu học sinh":
    - heading "GÓC HỌC TẬP" [level=2]
    - link "Tổng quan":
      - /url: /student
    - link "Lớp của em":
      - /url: /classes
    - link "Thư viện giáo trình":
      - /url: /
    - link "Bài tập trực tuyến":
      - /url: /assignments
    - link "Sổ câu sai 2":
      - /url: /student/notebook
    - link "Bài tập thủ công":
      - /url: /manual-assignments
    - link "Lịch học":
      - /url: /schedule
    - link "Kết quả học tập":
      - /url: /results
    - text: Trợ lý học tập AI Sắp ra mắt
    - link "Hồ sơ cá nhân":
      - /url: /profile
- main:
  - link "Về Sổ câu sai":
    - /url: /student/notebook
  - alert:
    - text: Internal server error
    - button "Thử lại"
- button "Mở trợ lý học tập"
```

# Test source

```ts
  264 |         await prisma.reviewLog.deleteMany({
  265 |           where: { studentId: { in: userIds } },
  266 |         });
  267 |       }
  268 |       await prisma.question.deleteMany({
  269 |         where: { content: { startsWith: runTag } },
  270 |       });
  271 |       await prisma.classStudent.deleteMany({
  272 |         where: { class: { name: { startsWith: runTag } } },
  273 |       });
  274 |       await prisma.class.deleteMany({
  275 |         where: { name: { startsWith: runTag } },
  276 |       });
  277 |       await prisma.book.deleteMany({
  278 |         where: { title: { startsWith: runTag } },
  279 |       });
  280 |       await prisma.user.deleteMany({
  281 |         where: { email: { startsWith: runTag.toLowerCase() } },
  282 |       });
  283 |     } finally {
  284 |       await prisma.$disconnect();
  285 |     }
  286 |   });
  287 | 
  288 |   test("student dashboard and sidebar reflect real assignment-submit data", async ({ page }) => {
  289 |     const vueErrors: string[] = [];
  290 |     page.on("console", (message) => {
  291 |       if (/\[Vue warn\]|\[i18n\]|missing translation/i.test(message.text())) {
  292 |         vueErrors.push(message.text());
  293 |       }
  294 |     });
  295 |     page.on("pageerror", (error) => vueErrors.push(error.message));
  296 |     await login(page);
  297 |     await expect(page.getByText("Hôm nay cần ôn: 5 câu")).toBeVisible();
  298 |     const notebookLink = page.locator(".student-sidebar-link").filter({
  299 |       hasText: "Sổ câu sai",
  300 |     });
  301 |     await expect(notebookLink.locator(".v-chip")).toHaveText("5");
  302 |     await screenshot(page, "01-dashboard-due.png");
  303 |     expect(vueErrors).toEqual([]);
  304 |   });
  305 | 
  306 |   test("notebook tabs, filters, pagination, and response privacy work", async ({ page }) => {
  307 |     await login(page);
  308 |     const notebookResponse = page.waitForResponse(
  309 |       (response) =>
  310 |         new URL(response.url()).pathname === "/notebook" &&
  311 |         response.request().method() === "GET",
  312 |     );
  313 |     await page.goto("/student/notebook");
  314 |     const response = await notebookResponse;
  315 |     const payload = await response.json();
  316 |     expect(response.status()).toBe(200);
  317 |     expect(keysDeep(payload).map((key) => key.toLowerCase())).not.toEqual(
  318 |       expect.arrayContaining(["iscorrect", "answertext", "explanation"]),
  319 |     );
  320 |     await expect(page.getByText("Sổ câu sai").first()).toBeVisible();
  321 |     await expect(page.getByText(/Cần ôn hôm nay \(5\)/)).toBeVisible();
  322 |     await screenshot(page, "02-notebook-due-list.png");
  323 | 
  324 |     await page.getByText(/Đang học \(23\)/).click();
  325 |     await expect(page.locator(".list-pagination")).toBeVisible();
  326 |     await page.locator(".v-pagination__next button").click();
  327 |     await expect(page.locator(".v-pagination__item--is-active")).toContainText("2");
  328 |     await page.getByLabel("Lọc theo mã bài / chương").fill(String(lessonId));
  329 |     await expect(page.locator(".v-card").filter({ hasText: runTag })).toBeVisible();
  330 | 
  331 |     await page.getByText(/Đã thuộc \(1\)/).click();
  332 |     await expect(page.getByText(`${runTag} List item 21`)).toBeVisible();
  333 |     await screenshot(page, "03-notebook-mastered-tab.png");
  334 |   });
  335 | 
  336 |   test("loading skeleton and retry are shown for list network errors", async ({ page }) => {
  337 |     await login(page);
  338 |     let firstRequest = true;
  339 |     await page.route(
  340 |       (url) => url.pathname === "/notebook",
  341 |       async (route) => {
  342 |         if (firstRequest) {
  343 |           firstRequest = false;
  344 |           await new Promise((resolveWait) => setTimeout(resolveWait, 700));
  345 |           await route.abort();
  346 |           return;
  347 |         }
  348 |         await route.continue();
  349 |       },
  350 |     );
  351 |     await page.goto("/student/notebook");
  352 |     await expect(page.locator(".v-skeleton-loader").first()).toBeVisible();
  353 |     await expect(page.getByText(/Không thể kết nối|Không tải được danh sách/)).toBeVisible();
  354 |     await screenshot(page, "04-notebook-load-error.png");
  355 |     await page.getByRole("button", { name: "Thử lại" }).click();
  356 |     await expect(page.locator(".v-skeleton-loader")).toHaveCount(0);
  357 |     await expect(page.getByText(runTag, { exact: false }).first()).toBeVisible();
  358 |   });
  359 | 
  360 |   test("review shows grading feedback, supports refresh, and updates the badge", async ({ page }) => {
  361 |     await login(page);
  362 |     await page.goto("/student/notebook/review");
  363 |     const progress = page.getByText(/Câu 1\/5/);
> 364 |     await expect(progress).toBeVisible();
      |                            ^ Error: expect(locator).toBeVisible() failed
  365 |     await expect(page.getByText(/explanation/i)).toHaveCount(0);
  366 |     const check = page.getByRole("button", { name: "Kiểm tra" });
  367 |     await expect(check).toBeDisabled();
  368 | 
  369 |     const questionResponse = await page.request.get(
  370 |       `${apiBaseUrl}/notebook?due=true&page=1&limit=50`,
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
```