# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: notebook.spec.ts >> Wrong Notebook UI (TEST_ fixtures) >> notebook tabs, filters, pagination, and response privacy work
- Location: e2e\notebook.spec.ts:306:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 500
```

# Test source

```ts
  216 |         lastWrongOption: question.options[1].id,
  217 |         nextReviewAt:
  218 |           index < 2
  219 |             ? new Date(Date.now() - 60_000)
  220 |             : new Date(Date.now() + 24 * 60 * 60 * 1000),
  221 |         status: index === 20 ? "MASTERED" : "ACTIVE",
  222 |       })),
  223 |     });
  224 |   });
  225 | 
  226 |   test.afterAll(async () => {
  227 |     try {
  228 |       const users = await prisma.user.findMany({
  229 |         where: { email: { startsWith: runTag.toLowerCase() } },
  230 |         select: { id: true },
  231 |       });
  232 |       const userIds = users.map(({ id }) => id);
  233 |       const assignments = await prisma.assignment.findMany({
  234 |         where: { title: { startsWith: runTag } },
  235 |         select: { id: true },
  236 |       });
  237 |       const assignmentIds = assignments.map(({ id }) => id);
  238 |       const attempts = await prisma.attempt.findMany({
  239 |         where: {
  240 |           OR: [
  241 |             { studentId: { in: userIds.length ? userIds : [-1] } },
  242 |             { assignmentId: { in: assignmentIds.length ? assignmentIds : [-1] } },
  243 |           ],
  244 |         },
  245 |         select: { id: true },
  246 |       });
  247 |       const attemptIds = attempts.map(({ id }) => id);
  248 |       if (attemptIds.length) {
  249 |         await prisma.attemptQuestionCheck.deleteMany({
  250 |           where: { attemptId: { in: attemptIds } },
  251 |         });
  252 |         await prisma.attemptAnswer.deleteMany({
  253 |           where: { attemptId: { in: attemptIds } },
  254 |         });
  255 |         await prisma.attempt.deleteMany({ where: { id: { in: attemptIds } } });
  256 |       }
  257 |       if (assignmentIds.length) {
  258 |         await prisma.assignment.deleteMany({ where: { id: { in: assignmentIds } } });
  259 |       }
  260 |       if (userIds.length) {
  261 |         await prisma.wrongNotebook.deleteMany({
  262 |           where: { studentId: { in: userIds } },
  263 |         });
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
> 316 |     expect(response.status()).toBe(200);
      |                               ^ Error: expect(received).toBe(expected) // Object.is equality
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
  364 |     await expect(progress).toBeVisible();
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
```