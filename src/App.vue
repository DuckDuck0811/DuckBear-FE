<template>
  <v-app>
    <RouterView />
    <v-snackbar
      v-model="notification.show"
      color="primary"
      timeout="9000"
      location="top end"
    >
      {{ notification.message }}
      <template #actions>
        <v-btn variant="text" @click="openClassRequests">Xem yêu cầu</v-btn>
        <v-btn variant="text" @click="notification.show = false">Đóng</v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { onBeforeUnmount, reactive, watch } from "vue";
import { useRouter } from "vue-router";
import { API_BASE_URL } from "./services/api";
import { useAuthStore } from "./stores/auth";

const router = useRouter();
const authStore = useAuthStore();
const notification = reactive({ show: false, message: "" });
let classSocket = null;
let connectionVersion = 0;

function openClassRequests() {
  notification.show = false;
  router.push("/classes");
}

watch(
  () => [authStore.token, authStore.user?.role],
  async ([token, role]) => {
    const currentVersion = ++connectionVersion;
    classSocket?.disconnect();
    classSocket = null;
    if (!token || !["TEACHER", "ADMIN"].includes(role)) return;

    const { io } = await import("socket.io-client");
    if (currentVersion !== connectionVersion) return;
    classSocket = io(new URL(API_BASE_URL).origin, {
      auth: { token },
      reconnection: true,
    });
    classSocket.on("classes.join-request", (request) => {
      notification.message = `${request.studentName} vừa xin tham gia lớp ${request.className}.`;
      notification.show = true;
      window.dispatchEvent(new CustomEvent("classes:refresh"));
    });
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  connectionVersion += 1;
  classSocket?.disconnect();
});
</script>
