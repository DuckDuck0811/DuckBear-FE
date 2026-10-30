import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/login",
    name: "login",
    component: () => import("../views/LoginView.vue"),
  },
  {
    path: "/register",
    name: "register",
    component: () => import("../views/RegisterRoleView.vue"),
  },
  {
    path: "/register/:role(student|teacher)",
    name: "register-form",
    component: () => import("../views/LoginView.vue"),
  },
  {
    path: "/",
    name: "books",
    component: () => import("../views/BooksView.vue"),
  },
  {
    path: "/classes",
    name: "classes",
    component: () => import("../views/ClassesView.vue"),
  },
  {
    path: "/books/:id",
    name: "book-detail",
    component: () => import("../views/BookDetailView.vue"),
  },
  {
    path: "/lessons/:id",
    name: "lesson-detail",
    component: () => import("../views/LessonView.vue"),
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

  if (to.path !== "/login" && !to.path.startsWith("/register") && !token) {
    next("/login");
  } else if ((to.path === "/login" || to.path.startsWith("/register")) && token) {
    next("/");
  } else {
    next();
  }
});

export default router;
