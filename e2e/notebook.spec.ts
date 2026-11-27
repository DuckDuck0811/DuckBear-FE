import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const root = process.cwd();
const backendRequire = createRequire(resolve(root, "../../BE/package.json"));
backendRequire("dotenv").config({
  path: resolve(root, "../../BE/.env"),
  quiet: true,
});
const { PrismaClient } = backendRequire("@prisma/client");
const { PrismaPg } = backendRequire("@prisma/adapter-pg");
const { hash } = backendRequire("bcryptjs");
const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("Missing BE database connection configuration");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});
const apiBaseUrl = "http://127.0.0.1:3000";
const runTag = `TEST_NOTEBOOK_UI_${Date.now()}_${randomUUID().slice(0, 8)}`;
const password = `${runTag}!Aa1`;
const accounts: Record<string, { email: string; id: number }> = {};
const questionFixtures = new Map<number, { correctOptionId: number }>();
const screenshotsDir = resolve(root, "e2e/screenshots");

let studentId: number;
let teacherId: number;
let lessonId: number;

async function createUser(role: string) {
  const email = `${runTag.toLowerCase()}_${role.toLowerCase()}@example.test`;
  const user = await prisma.user.create({
    data: {
      email,
      fullName: `${runTag} ${role}`,
      passwordHash: await hash(password, 4),
      role,
    },
  });
  accounts[role] = { email, id: user.id };
  return user;
}

async function createQuestion(title: string, lesson: number) {
  const question = await prisma.question.create({
    data: {
      lessonId: lesson,
      createdById: teacherId,
      type: "MCQ",
      content: `${runTag} ${title}`,
      explanation: `${runTag} explanation ${title}`,
      isPublic: true,
      options: {
        create: [0, 1, 2, 3].map((index) => ({
          content: `${runTag} ${title} option ${index + 1}`,
          isCorrect: index === 0,
        })),
      },
    },
    include: { options: true },
  });
  questionFixtures.set(question.id, {
    correctOptionId: question.options[0].id,
  });
  return question;
}

async function apiRequest(path: string, token: string, body?: unknown) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok) {
    throw new Error(`Fixture request ${path} failed with HTTP ${response.status}`);
  }
  return response.json();
}

async function login(page: Page, role = "STUDENT") {
  await page.goto("/login");
  await page.evaluate(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
  });
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(accounts[role].email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(role === "STUDENT" ? /\/student\/?$/ : /\/$/);
}

async function screenshot(page: Page, name: string) {
  await page.screenshot({
    path: resolve(screenshotsDir, name),
    fullPage: true,
  });
}

function keysDeep(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(keysDeep);
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => [key, ...keysDeep(child)]);
}

test.describe("Wrong Notebook UI (TEST_ fixtures)", () => {
  test.beforeAll(async () => {
    test.setTimeout(180_000);
    await mkdir(screenshotsDir, { recursive: true });

    const teacher = await createUser("TEACHER");
    teacherId = teacher.id;
    const student = await createUser("STUDENT");
    studentId = student.id;
    await createUser("ADMIN");

    const schoolClass = await prisma.class.create({
      data: {
        name: `${runTag} Class`,
        gradeLevel: 9,
        schoolYear: "2026-2027",
        joinCode: `T${randomUUID().replaceAll("-", "").slice(0, 7).toUpperCase()}`,
        homeroomTeacherId: teacherId,
        students: { create: [{ studentId }] },
      },
    });
    const book = await prisma.book.create({
      data: {
        title: `${runTag} Book`,
        subject: "Mathematics",
        gradeLevel: 9,
        createdById: teacherId,
        chapters: {
          create: {
            title: `${runTag} Chapter`,
            lessons: {
              create: { title: `${runTag} Lesson`, content: `${runTag} content` },
            },
          },
        },
      },
      include: { chapters: { include: { lessons: true } } },
    });
    lessonId = book.chapters[0].lessons[0].id;

    const submittedQuestions = await Promise.all(
      ["Submitted wrong 1", "Submitted wrong 2", "Submitted wrong 3"].map(
        (title) => createQuestion(title, lessonId),
      ),
    );
    const assignment = await prisma.assignment.create({
      data: {
        title: `${runTag} Online assignment`,
        createdById: teacherId,
        classId: schoolClass.id,
        lessonId,
        maxAttempts: 3,
        shuffleOptions: true,
        questions: {
          create: submittedQuestions.map((question, orderIndex) => ({
            questionId: question.id,
            orderIndex,
            points: 1,
          })),
        },
      },
    });

    const loginResponse = await fetch(`${apiBaseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: accounts.STUDENT.email, password }),
    });
    if (!loginResponse.ok) {
      throw new Error(`Fixture login failed with HTTP ${loginResponse.status}`);
    }
    const { accessToken } = await loginResponse.json();
    const { attemptId } = await apiRequest(
      `/assignments/${assignment.id}/start`,
      accessToken,
      {},
    );
    await apiRequest(
      `/assignments/attempts/${attemptId}/submit`,
      accessToken,
      {
        answers: submittedQuestions.map((question) => ({
          questionId: question.id,
          selectedOptionIds: [question.options[1].id],
        })),
      },
    );
    await prisma.wrongNotebook.updateMany({
      where: { studentId, questionId: { in: submittedQuestions.map(({ id }) => id) } },
      data: { nextReviewAt: new Date(Date.now() - 60_000) },
    });

    const extraQuestions = await Promise.all(
      Array.from({ length: 21 }, (_, index) =>
        createQuestion(`List item ${index + 1}`, lessonId),
      ),
    );
    await prisma.wrongNotebook.createMany({
      data: extraQuestions.map((question, index) => ({
        studentId,
        questionId: question.id,
        box: index === 20 ? 5 : 1,
        wrongCount: 1,
        correctStreak: index === 20 ? 4 : 0,
        lastWrongOption: question.options[1].id,
        nextReviewAt:
          index < 2
            ? new Date(Date.now() - 60_000)
            : new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: index === 20 ? "MASTERED" : "ACTIVE",
      })),
    });
  });

  test.afterAll(async () => {
    try {
      const users = await prisma.user.findMany({
        where: { email: { startsWith: runTag.toLowerCase() } },
        select: { id: true },
      });
      const userIds = users.map(({ id }) => id);
      const assignments = await prisma.assignment.findMany({
        where: { title: { startsWith: runTag } },
        select: { id: true },
      });
      const assignmentIds = assignments.map(({ id }) => id);
      const attempts = await prisma.attempt.findMany({
        where: {
          OR: [
            { studentId: { in: userIds.length ? userIds : [-1] } },
            { assignmentId: { in: assignmentIds.length ? assignmentIds : [-1] } },
          ],
        },
        select: { id: true },
      });
      const attemptIds = attempts.map(({ id }) => id);
      if (attemptIds.length) {
        await prisma.attemptQuestionCheck.deleteMany({
          where: { attemptId: { in: attemptIds } },
        });
        await prisma.attemptAnswer.deleteMany({
          where: { attemptId: { in: attemptIds } },
        });
        await prisma.attempt.deleteMany({ where: { id: { in: attemptIds } } });
      }
      if (assignmentIds.length) {
        await prisma.assignment.deleteMany({ where: { id: { in: assignmentIds } } });
      }
      if (userIds.length) {
        await prisma.wrongNotebook.deleteMany({
          where: { studentId: { in: userIds } },
        });
        await prisma.reviewLog.deleteMany({
          where: { studentId: { in: userIds } },
        });
      }
      await prisma.question.deleteMany({
        where: { content: { startsWith: runTag } },
      });
      await prisma.classStudent.deleteMany({
        where: { class: { name: { startsWith: runTag } } },
      });
      await prisma.class.deleteMany({
        where: { name: { startsWith: runTag } },
      });
      await prisma.book.deleteMany({
        where: { title: { startsWith: runTag } },
      });
      await prisma.user.deleteMany({
        where: { email: { startsWith: runTag.toLowerCase() } },
      });
    } finally {
      await prisma.$disconnect();
    }
  });

  test("student dashboard and sidebar reflect real assignment-submit data", async ({ page }) => {
    const vueErrors: string[] = [];
    page.on("console", (message) => {
      if (/\[Vue warn\]|\[i18n\]|missing translation/i.test(message.text())) {
        vueErrors.push(message.text());
      }
    });
    page.on("pageerror", (error) => vueErrors.push(error.message));
    await login(page);
    await expect(page.getByText("Hôm nay cần ôn: 5 câu")).toBeVisible();
    const notebookLink = page.locator(".student-sidebar-link").filter({
      hasText: "Sổ câu sai",
    });
    await expect(notebookLink.locator(".v-chip")).toHaveText("5");
    await screenshot(page, "01-dashboard-due.png");
    expect(vueErrors).toEqual([]);
  });

  test("notebook tabs, filters, pagination, and response privacy work", async ({ page }) => {
    await login(page);
    const notebookResponse = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/notebook" &&
        response.request().method() === "GET",
    );
    await page.goto("/student/notebook");
    const response = await notebookResponse;
    const payload = await response.json();
    expect(response.status()).toBe(200);
    expect(keysDeep(payload).map((key) => key.toLowerCase())).not.toEqual(
      expect.arrayContaining(["iscorrect", "answertext", "explanation"]),
    );
    await expect(page.getByText("Sổ câu sai").first()).toBeVisible();
    await expect(page.getByText(/Cần ôn hôm nay \(5\)/)).toBeVisible();
    await screenshot(page, "02-notebook-due-list.png");

    await page.getByText(/Đang học \(23\)/).click();
    await expect(page.locator(".list-pagination")).toBeVisible();
    await page.locator(".v-pagination__next button").click();
    await expect(page.locator(".v-pagination__item--is-active")).toContainText("2");
    await page.getByLabel("Lọc theo mã bài / chương").fill(String(lessonId));
    await expect(page.locator(".v-card").filter({ hasText: runTag })).toBeVisible();

    await page.getByText(/Đã thuộc \(1\)/).click();
    await expect(page.getByText(`${runTag} List item 21`)).toBeVisible();
    await screenshot(page, "03-notebook-mastered-tab.png");
  });

  test("loading skeleton and retry are shown for list network errors", async ({ page }) => {
    await login(page);
    let firstRequest = true;
    await page.route(
      (url) => url.pathname === "/notebook",
      async (route) => {
        if (firstRequest) {
          firstRequest = false;
          await new Promise((resolveWait) => setTimeout(resolveWait, 700));
          await route.abort();
          return;
        }
        await route.continue();
      },
    );
    await page.goto("/student/notebook");
    await expect(page.locator(".v-skeleton-loader").first()).toBeVisible();
    await expect(page.getByText(/Không thể kết nối|Không tải được danh sách/)).toBeVisible();
    await screenshot(page, "04-notebook-load-error.png");
    await page.getByRole("button", { name: "Thử lại" }).click();
    await expect(page.locator(".v-skeleton-loader")).toHaveCount(0);
    await expect(page.getByText(runTag, { exact: false }).first()).toBeVisible();
  });

  test("review shows grading feedback, supports refresh, and updates the badge", async ({ page }) => {
    await login(page);
    await page.goto("/student/notebook/review");
    const progress = page.getByText(/Câu 1\/5/);
    await expect(progress).toBeVisible();
    await expect(page.getByText(/explanation/i)).toHaveCount(0);
    const check = page.getByRole("button", { name: "Kiểm tra" });
    await expect(check).toBeDisabled();

    const questionResponse = await page.request.get(
      `${apiBaseUrl}/notebook?due=true&page=1&limit=50`,
      {
        headers: {
          Authorization: `Bearer ${(await page.evaluate(() => localStorage.getItem("accessToken"))) || ""}`,
        },
      },
    );
    const dueItems = (await questionResponse.json()).items;
    const firstItem = dueItems[0];
    const correctId = questionFixtures.get(firstItem.questionId)?.correctOptionId;
    const correctOption = firstItem.question.options.find(
      (option: { id: number }) => option.id === correctId,
    );
    await page.getByRole("button", { name: correctOption.content }).click();
    await expect(check).toBeEnabled();
    await check.click();
    await expect(page.getByText(/Lên hộp 2, ôn lại sau 3 ngày/)).toBeVisible();
    await expect(
      page.locator(".student-sidebar-link").filter({ hasText: "Sổ câu sai" }).locator(".v-chip"),
    ).toHaveText("4");
    await expect(
      page.getByRole("button", { name: correctOption.content }),
    ).toHaveClass(/text-success/);
    await screenshot(page, "05-review-correct-feedback.png");

    await page.reload();
    await expect(page.getByText(/Câu 1\/4/)).toBeVisible();
    await screenshot(page, "06-review-refresh.png");
  });

  test("400 and 404 review responses show errors and advance to the next question", async ({ page }) => {
    await login(page);
    await page.goto("/student/notebook/review");
    let attempt = 0;
    await page.route(
      (url) => url.pathname === "/notebook/review",
      async (route) => {
        attempt += 1;
        await route.fulfill({
          status: attempt === 1 ? 400 : 404,
          contentType: "application/json",
          body: JSON.stringify({
            message: attempt === 1 ? "Simulated bad request" : "Simulated not found",
          }),
        });
      },
    );

    for (const [expectedMessage, nextProgress] of [
      ["Simulated bad request", "Câu 2/4"],
      ["Simulated not found", "Câu 3/4"],
    ]) {
      await page.locator(".option-btn").first().click();
      await page.getByRole("button", { name: "Kiểm tra" }).click();
      await expect(page.getByText(expectedMessage)).toBeVisible();
      await expect(page.getByText(nextProgress)).toBeVisible({ timeout: 4_000 });
    }
    await screenshot(page, "07-review-400-404.png");
  });

  test("network review errors can be retried without losing the selection", async ({ page }) => {
    await login(page);
    await page.goto("/student/notebook/review");
    let attempts = 0;
    await page.route(
      (url) => url.pathname === "/notebook/review",
      async (route) => {
        attempts += 1;
        if (attempts === 1) {
          await route.abort();
          return;
        }
        await route.continue();
      },
    );
    await page.locator(".option-btn").first().click();
    await page.getByRole("button", { name: "Kiểm tra" }).click();
    await expect(page.getByText("Lỗi kết nối mạng. Vui lòng thử lại.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Thử lại" })).toBeVisible();
    await screenshot(page, "08-review-network-error.png");
    await page.getByRole("button", { name: "Thử lại" }).click();
    await expect(page.locator(".v-alert").filter({ hasText: /Lên hộp|Quay về hộp/ })).toBeVisible();
  });

  test("language switching, mobile layout, and role redirects behave correctly", async ({ page }) => {
    await login(page);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/student/notebook");
    await page.locator(".language-switch").click();
    await page.getByText("English", { exact: true }).click();
    await expect(page.getByText("Wrong Notebook").first()).toBeVisible();
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toMatch(/\bnotebook\.[\w.]+\b/);
    let dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
    await screenshot(page, "12-notebook-mobile-en.png");

    await page.goto("/student/notebook/review");
    await expect(page.locator(".option-btn").first()).toBeVisible();
    const buttonHeight = await page.locator(".option-btn").first().evaluate(
      (element) => element.getBoundingClientRect().height,
    );
    expect(buttonHeight).toBeGreaterThanOrEqual(52);
    dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
    await screenshot(page, "13-review-mobile.png");

    await login(page, "TEACHER");
    await page.goto("/student/notebook");
    await expect(page).toHaveURL("http://127.0.0.1:4173/");
    await screenshot(page, "14-teacher-redirect.png");

    await login(page, "ADMIN");
    await page.goto("/student/notebook");
    await expect(page).toHaveURL("http://127.0.0.1:4173/");
    await screenshot(page, "15-admin-redirect.png");
  });

  test("review can finish, summary counts are shown, and empty state follows", async ({ page }) => {
    await login(page);
    await page.goto("/student/notebook/review");
    while (await page.getByText(/Câu \d+\/\d+/).count()) {
      const progressText = await page.getByText(/^Câu \d+\/\d+$/).innerText();
      const [, current, total] = progressText.match(/Câu (\d+)\/(\d+)/) || [];
      const currentQuestionText = await page.locator(".text-h6").innerText();
      const response = await page.request.get(
        `${apiBaseUrl}/notebook?due=true&page=1&limit=50`,
        {
          headers: {
            Authorization: `Bearer ${(await page.evaluate(() => localStorage.getItem("accessToken"))) || ""}`,
          },
        },
      );
      const items = (await response.json()).items;
      const item = items.find(
        (entry: { questionId: number }) =>
          questionFixtures.has(entry.questionId) &&
          entry.question.content === currentQuestionText,
      );
      const questionId = item?.questionId;
      const correctId = questionId && questionFixtures.get(questionId)?.correctOptionId;
      const correctOption = item?.question.options.find(
        (option: { id: number }) => option.id === correctId,
      );
      if (!correctOption) throw new Error(`Missing correct option for review item ${questionId}`);

      await page.getByRole("button", { name: correctOption.content }).click();
      await page.getByRole("button", { name: "Kiểm tra" }).click();
      await expect(page.getByText(/Lên hộp|Đã thuộc/)).toBeVisible();
      if (current === total) {
        await page.getByRole("button", { name: "Xem tổng kết" }).click();
        break;
      }
      await page.getByRole("button", { name: "Câu tiếp theo" }).click();
    }
    await expect(page.getByText("Hoàn thành phiên ôn tập!")).toBeVisible();
    await screenshot(page, "09-review-summary.png");

    await page.goto("/student");
    await expect(page.getByText("Đã ôn xong hôm nay")).toBeVisible();
    await expect(
      page.locator(".student-sidebar-link").filter({ hasText: "Sổ câu sai" }).locator(".v-chip"),
    ).toHaveCount(0);
    await screenshot(page, "10-dashboard-done.png");

    await page.goto("/student/notebook/review");
    await expect(page.getByText("Hôm nay không còn câu nào cần ôn, giỏi quá!")).toBeVisible();
    await screenshot(page, "11-review-empty.png");
  });
});
