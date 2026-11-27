# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: notebook.spec.ts >> Wrong Notebook UI (TEST_ fixtures) >> student dashboard and sidebar reflect real assignment-submit data
- Location: e2e\notebook.spec.ts:288:3

# Error details

```
Error: page.goto: net::ERR_ABORTED at http://127.0.0.1:4173/login
Call log:
  - navigating to "http://127.0.0.1:4173/login", waiting until "load"

```

# Test source

```ts
  1   | import { createRequire } from "node:module";
  2   | import { mkdir } from "node:fs/promises";
  3   | import { randomUUID } from "node:crypto";
  4   | import { resolve } from "node:path";
  5   | import { expect, test, type Page } from "@playwright/test";
  6   | 
  7   | const root = process.cwd();
  8   | const backendRequire = createRequire(resolve(root, "../../BE/package.json"));
  9   | backendRequire("dotenv").config({
  10  |   path: resolve(root, "../../BE/.env"),
  11  |   quiet: true,
  12  | });
  13  | const { PrismaClient } = backendRequire("@prisma/client");
  14  | const { PrismaPg } = backendRequire("@prisma/adapter-pg");
  15  | const { hash } = backendRequire("bcryptjs");
  16  | const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  17  | if (!databaseUrl) throw new Error("Missing BE database connection configuration");
  18  | 
  19  | const prisma = new PrismaClient({
  20  |   adapter: new PrismaPg({ connectionString: databaseUrl }),
  21  | });
  22  | const apiBaseUrl = "http://127.0.0.1:3000";
  23  | const runTag = `TEST_NOTEBOOK_UI_${Date.now()}_${randomUUID().slice(0, 8)}`;
  24  | const password = `${runTag}!Aa1`;
  25  | const accounts: Record<string, { email: string; id: number }> = {};
  26  | const questionFixtures = new Map<number, { correctOptionId: number }>();
  27  | const screenshotsDir = resolve(root, "e2e/screenshots");
  28  | 
  29  | let studentId: number;
  30  | let teacherId: number;
  31  | let lessonId: number;
  32  | 
  33  | async function createUser(role: string) {
  34  |   const email = `${runTag.toLowerCase()}_${role.toLowerCase()}@example.test`;
  35  |   const user = await prisma.user.create({
  36  |     data: {
  37  |       email,
  38  |       fullName: `${runTag} ${role}`,
  39  |       passwordHash: await hash(password, 4),
  40  |       role,
  41  |     },
  42  |   });
  43  |   accounts[role] = { email, id: user.id };
  44  |   return user;
  45  | }
  46  | 
  47  | async function createQuestion(title: string, lesson: number) {
  48  |   const question = await prisma.question.create({
  49  |     data: {
  50  |       lessonId: lesson,
  51  |       createdById: teacherId,
  52  |       type: "MCQ",
  53  |       content: `${runTag} ${title}`,
  54  |       explanation: `${runTag} explanation ${title}`,
  55  |       isPublic: true,
  56  |       options: {
  57  |         create: [0, 1, 2, 3].map((index) => ({
  58  |           content: `${runTag} ${title} option ${index + 1}`,
  59  |           isCorrect: index === 0,
  60  |         })),
  61  |       },
  62  |     },
  63  |     include: { options: true },
  64  |   });
  65  |   questionFixtures.set(question.id, {
  66  |     correctOptionId: question.options[0].id,
  67  |   });
  68  |   return question;
  69  | }
  70  | 
  71  | async function apiRequest(path: string, token: string, body?: unknown) {
  72  |   const response = await fetch(`${apiBaseUrl}${path}`, {
  73  |     method: body === undefined ? "GET" : "POST",
  74  |     headers: {
  75  |       Authorization: `Bearer ${token}`,
  76  |       "Content-Type": "application/json",
  77  |     },
  78  |     ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  79  |   });
  80  |   if (!response.ok) {
  81  |     throw new Error(`Fixture request ${path} failed with HTTP ${response.status}`);
  82  |   }
  83  |   return response.json();
  84  | }
  85  | 
  86  | async function login(page: Page, role = "STUDENT") {
  87  |   await page.goto("/login");
  88  |   await page.evaluate(() => {
  89  |     localStorage.removeItem("accessToken");
  90  |     localStorage.removeItem("user");
  91  |   });
> 92  |   await page.goto("/login");
      |              ^ Error: page.goto: net::ERR_ABORTED at http://127.0.0.1:4173/login
  93  |   await page.locator('input[type="email"]').fill(accounts[role].email);
  94  |   await page.locator('input[type="password"]').fill(password);
  95  |   await page.locator('form button[type="submit"]').click();
  96  |   await expect(page).toHaveURL(role === "STUDENT" ? /\/student\/?$/ : /\/$/);
  97  | }
  98  | 
  99  | async function screenshot(page: Page, name: string) {
  100 |   await page.screenshot({
  101 |     path: resolve(screenshotsDir, name),
  102 |     fullPage: true,
  103 |   });
  104 | }
  105 | 
  106 | function keysDeep(value: unknown): string[] {
  107 |   if (Array.isArray(value)) return value.flatMap(keysDeep);
  108 |   if (!value || typeof value !== "object") return [];
  109 |   return Object.entries(value).flatMap(([key, child]) => [key, ...keysDeep(child)]);
  110 | }
  111 | 
  112 | test.describe("Wrong Notebook UI (TEST_ fixtures)", () => {
  113 |   test.beforeAll(async () => {
  114 |     test.setTimeout(180_000);
  115 |     await mkdir(screenshotsDir, { recursive: true });
  116 | 
  117 |     const teacher = await createUser("TEACHER");
  118 |     teacherId = teacher.id;
  119 |     const student = await createUser("STUDENT");
  120 |     studentId = student.id;
  121 |     await createUser("ADMIN");
  122 | 
  123 |     const schoolClass = await prisma.class.create({
  124 |       data: {
  125 |         name: `${runTag} Class`,
  126 |         gradeLevel: 9,
  127 |         schoolYear: "2026-2027",
  128 |         joinCode: `T${randomUUID().replaceAll("-", "").slice(0, 7).toUpperCase()}`,
  129 |         homeroomTeacherId: teacherId,
  130 |         students: { create: [{ studentId }] },
  131 |       },
  132 |     });
  133 |     const book = await prisma.book.create({
  134 |       data: {
  135 |         title: `${runTag} Book`,
  136 |         subject: "Mathematics",
  137 |         gradeLevel: 9,
  138 |         createdById: teacherId,
  139 |         chapters: {
  140 |           create: {
  141 |             title: `${runTag} Chapter`,
  142 |             lessons: {
  143 |               create: { title: `${runTag} Lesson`, content: `${runTag} content` },
  144 |             },
  145 |           },
  146 |         },
  147 |       },
  148 |       include: { chapters: { include: { lessons: true } } },
  149 |     });
  150 |     lessonId = book.chapters[0].lessons[0].id;
  151 | 
  152 |     const submittedQuestions = await Promise.all(
  153 |       ["Submitted wrong 1", "Submitted wrong 2", "Submitted wrong 3"].map(
  154 |         (title) => createQuestion(title, lessonId),
  155 |       ),
  156 |     );
  157 |     const assignment = await prisma.assignment.create({
  158 |       data: {
  159 |         title: `${runTag} Online assignment`,
  160 |         createdById: teacherId,
  161 |         classId: schoolClass.id,
  162 |         lessonId,
  163 |         maxAttempts: 3,
  164 |         shuffleOptions: true,
  165 |         questions: {
  166 |           create: submittedQuestions.map((question, orderIndex) => ({
  167 |             questionId: question.id,
  168 |             orderIndex,
  169 |             points: 1,
  170 |           })),
  171 |         },
  172 |       },
  173 |     });
  174 | 
  175 |     const loginResponse = await fetch(`${apiBaseUrl}/auth/login`, {
  176 |       method: "POST",
  177 |       headers: { "Content-Type": "application/json" },
  178 |       body: JSON.stringify({ email: accounts.STUDENT.email, password }),
  179 |     });
  180 |     if (!loginResponse.ok) {
  181 |       throw new Error(`Fixture login failed with HTTP ${loginResponse.status}`);
  182 |     }
  183 |     const { accessToken } = await loginResponse.json();
  184 |     const { attemptId } = await apiRequest(
  185 |       `/assignments/${assignment.id}/start`,
  186 |       accessToken,
  187 |       {},
  188 |     );
  189 |     await apiRequest(
  190 |       `/assignments/attempts/${attemptId}/submit`,
  191 |       accessToken,
  192 |       {
```