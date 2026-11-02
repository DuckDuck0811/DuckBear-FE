<template>
  <v-layout
    class="student-dashboard min-vh-100"
    :class="`student-dashboard--${gradeStyle}`"
  >
    <AppHeader />
    <StudentSidebar />
    <v-main class="pb-16">
      <slot />
    </v-main>
  </v-layout>
</template>

<script setup>
import AppHeader from "../components/shared/AppHeader.vue";
import StudentSidebar from "../components/shared/StudentSidebar.vue";
  
defineProps({
  gradeStyle: { type: String, default: "neutral" },
});
</script>

<style scoped>
.student-dashboard {
  min-height: 100vh;
  background: #f4f8ff;
}

.student-dashboard--primary :deep(.student-welcome) {
  background: linear-gradient(120deg, #fff4d7 0%, #e8f8ff 100%);
}

.student-dashboard--middle :deep(.student-welcome) {
  background: linear-gradient(120deg, #e1f8f3 0%, #eff5ff 100%);
}

.student-dashboard--high :deep(.student-welcome) {
  background: linear-gradient(120deg, #edf2fa 0%, #f8faff 100%);
}

.student-dashboard--high :deep(.student-class-card:hover) {
  transform: none;
}
</style>
