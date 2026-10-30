<template>
  <v-navigation-drawer
    v-if="isStudent"
    v-model="drawerOpen"
    :permanent="!mobile"
    :temporary="mobile"
    :width="288"
    class="student-sidebar"
    :aria-label="t('studentSidebar.aria')"
  >
    <div class="student-sidebar-brand px-5 py-5">
      <div class="text-overline font-weight-bold">DUCKBEAR CLASSROOM</div>
      <div class="text-body-2">{{ t('studentSidebar.subtitle') }}</div>
    </div>

    <nav class="px-3 pb-5" :aria-label="t('studentSidebar.menu')">
      <h2 class="student-sidebar-heading px-3 mb-2">
        {{ t('studentSidebar.learning') }}
      </h2>
      <template v-for="item in items" :key="item.label">
        <RouterLink
          v-if="item.to"
          :to="item.to"
          class="student-sidebar-link"
          :class="{ 'student-sidebar-link-active': isActive(item) }"
          :aria-current="isActive(item) ? 'page' : undefined"
          @click="closeOnMobile"
        >
          <v-icon :icon="item.icon" size="20" />
          <span>{{ t(item.label) }}</span>
        </RouterLink>
        <div
          v-else
          class="student-sidebar-link student-sidebar-link-disabled"
          aria-disabled="true"
        >
          <v-icon :icon="item.icon" size="20" />
          <span class="student-sidebar-link-label">{{ t(item.label) }}</span>
          <span class="student-coming-soon">{{ t('sidebar.comingSoon') }}</span>
        </div>
      </template>
    </nav>
  </v-navigation-drawer>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useDisplay } from "vuetify";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "../../stores/auth";

const route = useRoute();
const authStore = useAuthStore();
const { mobile } = useDisplay({ mobileBreakpoint: "md" });
const { t } = useI18n();
const drawerOpen = ref(false);
const isStudent = computed(() => authStore.user?.role === "STUDENT");
const items = [
  { label: "studentSidebar.overview", icon: "mdi-view-dashboard-outline", to: "/student", match: ["student-dashboard"] },
  { label: "studentSidebar.classes", icon: "mdi-account-group-outline", to: "/classes", match: ["classes"] },
  { label: "studentSidebar.curriculum", icon: "mdi-bookshelf", to: "/", match: ["books", "book-detail", "lesson-detail"] },
  { label: "studentSidebar.assignments", icon: "mdi-clipboard-text-outline" },
  { label: "studentSidebar.results", icon: "mdi-chart-box-outline" },
  { label: "studentSidebar.chatbot", icon: "mdi-robot-outline" },
  { label: "studentSidebar.profile", icon: "mdi-account-circle-outline" },
];

function isActive(item) {
  return item.match?.includes(route.name);
}

function closeOnMobile() {
  if (mobile.value) drawerOpen.value = false;
}

function toggleFromHeader() {
  if (mobile.value && isStudent.value) drawerOpen.value = !drawerOpen.value;
}

watch(mobile, (isMobile) => {
  drawerOpen.value = !isMobile;
}, { immediate: true });

onMounted(() => window.addEventListener("student-sidebar:toggle", toggleFromHeader));
onBeforeUnmount(() => window.removeEventListener("student-sidebar:toggle", toggleFromHeader));
</script>

<style scoped>
.student-sidebar {
  border-right: 1px solid #e4ecf7;
  background: #fff;
}

.student-sidebar-brand {
  margin-bottom: 16px;
  border-bottom: 1px solid #edf2fa;
  color: #147d72;
}

.student-sidebar-heading {
  color: #8492a6;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.student-sidebar-link {
  display: flex;
  min-height: 44px;
  align-items: center;
  gap: 12px;
  margin: 3px 0;
  padding: 0 12px;
  border-radius: 13px;
  color: #475467;
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
  transition: background-color 0.16s ease, color 0.16s ease;
}

.student-sidebar-link > span {
  white-space: nowrap;
}

.student-sidebar-link:hover,
.student-sidebar-link:focus-visible {
  outline: none;
  background: #e9f8f5;
  color: #147d72;
}

.student-sidebar-link-active {
  background: #e2f6f1;
  color: #147d72;
}

.student-sidebar-link-disabled {
  color: #9aa6b6;
  cursor: not-allowed;
}

.student-sidebar-link-label {
  flex: 1;
  min-width: 0;
}

.student-coming-soon {
  flex: none;
  color: #8492a6;
  font-size: 0.58rem;
  font-weight: 700;
}
</style>
