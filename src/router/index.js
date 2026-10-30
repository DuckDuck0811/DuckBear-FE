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
    path: "/classes/:id",
    name: "class-detail",
    component: () => import("../views/classes/ClassSeatMapView.vue"),
    meta: { roles: ["TEACHER", "ADMIN"] },
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
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("accessToken");
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }
  const landingPath = user?.role === "STUDENT" ? "/student" : "/";

  if (to.path !== "/login" && !to.path.startsWith("/register") && !token) {
    next("/login");
  } else if ((to.path === "/login" || to.path.startsWith("/register")) && token) {
    next(landingPath);
  } else if (to.meta.roles && !to.meta.roles.includes(user?.role)) {
    next(landingPath);
  } else {
    next();
  }
});

export default router;
