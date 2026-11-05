import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/login",
    name: "login",
    component: () => import("../views/auth/LoginView.vue"),
  },
  {
    path: "/register",
    name: "register",
    component: () => import("../views/auth/RegisterRoleView.vue"),
  },
  {
    path: "/register/:role(student|teacher)",
    name: "register-form",
    component: () => import("../views/auth/LoginView.vue"),
  },
  {
    path: "/student",
    name: "student-dashboard",
    component: () => import("../views/student/StudentDashboardView.vue"),
    meta: { roles: ["STUDENT"] },
  },
  {
    path: "/profile",
    name: "profile",
    component: () => import("../views/profile/ProfileView.vue"),
    meta: { roles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"] },
  },
  {
    path: "/",
    name: "books",
    component: () => import("../views/books/BooksView.vue"),
  },
  {
    path: "/classes",
    name: "classes",
    component: () => import("../views/classes/ClassesView.vue"),
  },
  {
    path: "/manual-assignments",
    name: "manual-assignments",
    component: () => import("../views/classes/ClassManualAssignmentsView.vue"),
    meta: { roles: ["TEACHER", "ADMIN", "STUDENT"] },
  },
  {
    path: "/classes/:id",
    name: "class-detail",
    component: () => import("../views/classes/ClassSeatMapView.vue"),
    meta: { roles: ["TEACHER", "ADMIN"] },
  },
  {
    path: "/classes/:id/manual-assignments",
    name: "class-manual-assignments",
    component: () => import("../views/classes/ClassManualAssignmentsView.vue"),
    meta: { roles: ["TEACHER", "ADMIN", "STUDENT"] },
  },
  {
    path: "/books/:id",
    name: "book-detail",
    component: () => import("../views/books/BookDetailView.vue"),
  },
  {
    path: "/question-bank",
    name: "question-bank",
    component: () => import("../views/books/QuestionBankView.vue"),
    meta: { roles: ["TEACHER", "ADMIN"] },
  },
  {
    path: "/assignments",
    name: "assignments",
    component: () => import("../views/assignments/AssignmentsView.vue"),
    meta: { roles: ["TEACHER", "ADMIN", "STUDENT"] },
  },
  {
    path: "/submissions",
    name: "submissions",
    component: () => import("../views/assignments/SubmissionsView.vue"),
    meta: { roles: ["TEACHER"] },
  },
  {
    path: "/submissions/:assignmentId",
    name: "submission-detail",
    component: () => import("../views/assignments/SubmissionDetailView.vue"),
    meta: { roles: ["TEACHER"] },
  },
  {
    path: "/results",
    name: "results",
    component: () => import("../views/student/AttemptHistoryView.vue"),
    meta: { roles: ["STUDENT"] },
  },
  {
    path: "/exam-bank",
    name: "exam-bank",
    component: () => import("../views/assignments/ExamBankView.vue"),
    meta: { roles: ["TEACHER", "ADMIN"] },
  },
  {
    path: "/teacher/overview",
    name: "teacher-overview",
    component: () => import("../views/teacher/TeacherOverviewView.vue"),
    meta: { roles: ["TEACHER", "ADMIN"] },
  },
  {
    path: "/schedule",
    name: "schedule",
    component: () => import("../views/schedule/ScheduleView.vue"),
    meta: { roles: ["TEACHER", "STUDENT"] },
  },
  {
    path: "/activity-log",
    name: "activity-log",
    component: () => import("../views/assignments/ActivityLogView.vue"),
    meta: { roles: ["TEACHER"] },
  },
  {
    path: "/assignments/:id/do",
    name: "assignment-take",
    component: () => import("../views/assignments/AssignmentTakeView.vue"),
    meta: { roles: ["STUDENT"] },
  },
  {
    path: "/lessons/:id",
    name: "lesson-detail",
    component: () => import("../views/lessons/LessonView.vue"),
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("../views/NotFoundView.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation Guard
router.beforeEach((to) => {
  const token = localStorage.getItem("accessToken");
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }
  const landingPath =
    user?.role === "STUDENT"
      ? "/student"
      : user?.role === "TEACHER"
      ? "/teacher/overview"
      : "/";

  if (to.path !== "/login" && !to.path.startsWith("/register") && !token) {
    return "/login";
  } else if ((to.path === "/login" || to.path.startsWith("/register")) && token) {
    return landingPath;
  } else if (to.meta.roles && !to.meta.roles.includes(user?.role)) {
    return landingPath;
  }
  return true;
});

export default router;
