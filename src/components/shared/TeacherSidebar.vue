<template>
  <v-navigation-drawer
    v-if="isTeacher"
    v-model="drawerOpen"
    :permanent="!mobile"
    :temporary="mobile"
    :width="288"
    class="teacher-sidebar"
    :aria-label="t('sidebar.aria')"
  >
    <div class="sidebar-brand px-5 py-5">
      <div class="text-overline text-primary font-weight-bold">DUCKBEAR CLASSROOM</div>
      <div class="text-body-2 text-medium-emphasis">{{ t('sidebar.workspace') }}</div>
    </div>

    <nav class="px-3 pb-5" :aria-label="t('sidebar.menu')">
      <section v-for="group in groups" :key="group.title" class="mb-4">
        <h2 class="sidebar-group-title px-3 mb-2">{{ t(group.title) }}</h2>
        <template v-for="item in group.items" :key="item.label">
          <RouterLink
            v-if="item.to"
            :to="item.to"
            class="sidebar-link"
            :class="{ 'sidebar-link-active': isActive(item) }"
            :aria-current="isActive(item) ? 'page' : undefined"
            @click="closeOnMobile"
          >
            <v-icon :icon="item.icon" size="20" />
            <span>{{ t(item.label) }}</span>
          </RouterLink>
          <div v-else class="sidebar-link sidebar-link-disabled" aria-disabled="true">
            <v-icon :icon="item.icon" size="20" />
            <span class="sidebar-link-label">{{ t(item.label) }}</span>
            <span class="coming-soon">{{ t('sidebar.comingSoon') }}</span>
          </div>
        </template>
      </section>
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
const isTeacher = computed(() => authStore.user?.role === "TEACHER");

const groups = computed(() => [
  {
    title: "sidebar.learningSpace",
    items: [
      { label: "sidebar.curriculum", icon: "mdi-bookshelf", to: "/", match: ["books"] },
      { label: "sidebar.classes", icon: "mdi-account-group-outline", to: "/classes", match: ["classes", "class-detail"] },
    ],
  },
  {
    title: "sidebar.materials",
    items: [
      { label: "sidebar.chapters", icon: "mdi-book-open-page-variant", to: "/", match: ["book-detail", "lesson-detail"] },
      { label: "sidebar.questionBank", icon: "mdi-comment-question-outline", to: "/question-bank", match: ["question-bank"] },
    ],
  },
  {
    title: "sidebar.assignments",
    items: [
      { label: "sidebar.createAssignment", icon: "mdi-file-edit-outline" },
      { label: "sidebar.examBank", icon: "mdi-folder-text-outline" },
    ],
  },
  {
    title: "sidebar.progress",
    items: [
      { label: "sidebar.submissions", icon: "mdi-cloud-upload-outline" },
      { label: "sidebar.results", icon: "mdi-chart-box-outline" },
      { label: "sidebar.activityLog", icon: "mdi-history" },
    ],
  },
  {
    title: "sidebar.account",
    items: [{ label: "sidebar.profile", icon: "mdi-account-cog-outline" }],
  },
]);

function isActive(item) {
  return item.match?.includes(route.name);
}

function closeOnMobile() {
  if (mobile.value) drawerOpen.value = false;
}

function toggleFromHeader() {
  if (mobile.value && isTeacher.value) drawerOpen.value = !drawerOpen.value;
}

watch(mobile, (isMobile) => {
  drawerOpen.value = !isMobile;
}, { immediate: true });

onMounted(() => window.addEventListener("teacher-sidebar:toggle", toggleFromHeader));
onBeforeUnmount(() => window.removeEventListener("teacher-sidebar:toggle", toggleFromHeader));
</script>

<style scoped>
.teacher-sidebar {
  border-right: 1px solid #e4ecf7;
  background: #fff;
}

.sidebar-brand {
  border-bottom: 1px solid #edf2fa;
  margin-bottom: 16px;
}

.sidebar-group-title {
  color: #8492a6;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.sidebar-link {
  display: flex;
  min-height: 42px;
  align-items: center;
  gap: 12px;
  padding: 0 12px;
  margin: 3px 0;
  border-radius: 12px;
  color: #475467;
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
  transition: background-color 0.16s ease, color 0.16s ease;
}

.sidebar-link > span {
  white-space: nowrap;
}

.sidebar-link:hover,
.sidebar-link:focus-visible {
  outline: none;
  background: #f1f6ff;
  color: #2167d8;
}

.sidebar-link-active {
  background: #e8f1ff;
  color: #2167d8;
}

.sidebar-link-disabled {
  color: #9aa6b6;
  cursor: not-allowed;
}

.sidebar-link-label {
  flex: 1;
}

.coming-soon {
  flex: none;
  font-size: 0.58rem;
  font-weight: 700;
  color: #8492a6;
}
</style>
