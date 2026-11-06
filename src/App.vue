<template>
  <v-app>
    <RouterView />
  </v-app>
</template>

<script setup>
import { onBeforeUnmount, watch } from "vue";
import { useI18n } from "vue-i18n";
import { API_BASE_URL } from "./services/api";
import { useAuthStore } from "./stores/auth";
import { useNotificationsStore } from "./stores/notifications";
import { useQuestionBankStore } from "./stores/questionBank";

const { t } = useI18n();
const authStore = useAuthStore();
const questionBankStore = useQuestionBankStore();
const notificationsStore = useNotificationsStore();
let classSocket = null;
let connectionVersion = 0;
const handleSessionExpired = () => {
  questionBankStore.clearAllDrafts();
  authStore.logout();
};
window.addEventListener("auth:session-expired", handleSessionExpired);

watch(
  () => [authStore.token, authStore.user?.role, authStore.user?.id, authStore.user?.userId, authStore.user?.email],
  async ([token, role, id, userId, email]) => {
    const currentVersion = ++connectionVersion;
    classSocket?.disconnect();
    classSocket = null;
    notificationsStore.setOwner(id || userId || email);
    if (!token || !["TEACHER", "ADMIN", "STUDENT"].includes(role)) return;

    const { io } = await import("socket.io-client");
    if (currentVersion !== connectionVersion) return;
    classSocket = io(new URL(API_BASE_URL).origin, {
      auth: { token },
      reconnection: true,
    });

    if (["TEACHER", "ADMIN"].includes(role)) {
      classSocket.on("classes.join-request", (request) => {
        notificationsStore.add({
          type: "join-request",
          title: t("notifications.joinRequestTitle"),
          message: t("notifications.joinRequest", request),
          url: "/classes",
          icon: "mdi-account-plus-outline",
        });
        window.dispatchEvent(new CustomEvent("classes:refresh"));
      });
      classSocket.on("classes.assignment-activity", (activity) => {
        window.dispatchEvent(new CustomEvent("activity-log:assignment-event", { detail: activity }));
      });
    }

    if (role === "STUDENT") {
      classSocket.on("classes.assignment-reminder", (reminder) => {
        notificationsStore.add({
          type: "assignment-reminder",
          title: t("notifications.assignmentReminderTitle"),
          message: t("notifications.assignmentReminder", reminder),
          url: reminder.url,
          icon: "mdi-bell-ring-outline",
        });
      });
    }

    classSocket.on("connect", () => {
      window.dispatchEvent(new CustomEvent("activity-log:reconnected"));
    });
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  window.removeEventListener("auth:session-expired", handleSessionExpired);
  connectionVersion += 1;
  classSocket?.disconnect();
});
</script>
