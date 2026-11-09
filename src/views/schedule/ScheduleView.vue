<template>
  <StudentScheduleView v-if="isStudent" />
  <TeacherScheduleView v-else />
</template>

<script setup>
import { computed } from "vue";
import { useAuthStore } from "../../stores/auth";
import StudentScheduleView from "./StudentScheduleView.vue";
import TeacherScheduleView from "./TeacherScheduleView.vue";

const authStore = useAuthStore();
const isStudent = computed(() => authStore.user?.role === "STUDENT");
</script>
