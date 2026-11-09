<template>
  <v-app-bar
    color="white"
    flat
    class="app-header border-b px-2 px-md-6"
    height="70"
    style="border-color: #e4ecf7 !important; z-index: 100"
  >
    <!-- Logo DuckBear & Mascot -->
    <div
      class="d-flex align-center cursor-pointer brand-header"
      role="button"
      tabindex="0"
      aria-label="Về trang chủ DuckBear"
      @click="goHome"
      @keydown.enter="goHome"
      @keydown.space.prevent="goHome"
    >
      <DuckBearMascot :size="42" mood="greeting" class="mr-2" />
      <div>
        <div class="brand-text">
          <span class="text-primary font-weight-black">Duck</span
          ><span class="text-orange font-weight-black">Bear</span>
        </div>
        <div class="brand-sub font-weight-bold">CLASSROOM</div>
      </div>
    </div>

    <v-btn
      v-if="['TEACHER', 'STUDENT'].includes(user?.role)"
      class="d-md-none ml-2"
      icon="mdi-menu"
      variant="text"
      color="primary"
      :aria-label="t(user?.role === 'STUDENT' ? 'studentMenu' : 'teacherMenu')"
      @click="toggleTeacherSidebar"
    />

    <v-spacer />

    <v-menu
      v-if="user"
      v-model="notificationsOpen"
      location="bottom end"
      :close-on-content-click="false"
    >
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          icon
          variant="tonal"
          color="primary"
          class="notification-bell mr-2"
          :aria-label="`${t('notifications.title')} (${notifications.count})`"
        >
          <v-icon icon="mdi-bell-outline" />
          <span v-if="notifications.count" class="notification-count">
            {{ notifications.count > 99 ? "99+" : notifications.count }}
          </span>
        </v-btn>
      </template>
      <v-card class="notification-menu" rounded="lg" elevation="8">
        <div class="notification-menu-heading">
          {{ t("notifications.title") }}
        </div>
        <v-divider />
        <div v-if="notifications.items.length" class="notification-list">
          <v-list density="comfortable" class="py-1">
            <v-list-item
              v-for="item in notifications.items"
              :key="item.id"
              :prepend-icon="item.icon || 'mdi-bell-outline'"
              :title="item.title"
              :subtitle="item.message"
              class="notification-item"
              @click="openNotification(item)"
            >
              <template #append>
                <span class="notification-time">{{
                  formatNotificationTime(item.createdAt)
                }}</span>
              </template>
            </v-list-item>
          </v-list>
        </div>
        <div v-else class="notification-empty">
          {{ t("notifications.empty") }}
        </div>
      </v-card>
    </v-menu>

    <v-menu location="bottom end">
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          variant="tonal"
          color="primary"
          prepend-icon="mdi-translate"
          class="language-switch mr-2"
          :aria-label="t('language')"
        >
          {{ locale.toUpperCase() }}
        </v-btn>
      </template>
      <v-list density="compact" min-width="150">
        <v-list-item
          v-for="option in languageOptions"
          :key="option.value"
          :title="option.title"
          :active="locale === option.value"
          @click="setLocale(option.value)"
        />
      </v-list>
    </v-menu>

    <v-btn
      v-if="user"
      variant="tonal"
      color="primary"
      prepend-icon="mdi-account-group-outline"
      class="mr-3"
      @click="router.push('/classes')"
    >
      {{ t("classes") }}
    </v-btn>

    <!-- Khu vực Người dùng & Đăng xuất -->
    <div v-if="user" class="d-flex align-center">
      <!-- Thông tin tài khoản -->
      <div class="d-flex align-center mr-3">
        <v-avatar
          size="38"
          color="primary"
          class="mr-3 text-white font-weight-bold avatar-shub"
        >
          <v-img
            v-if="showAvatarImage"
            :src="user.avatarUrl"
            alt="Ảnh đại diện"
            cover
            @error="failedAvatarUrl = user.avatarUrl"
          />
          <span v-else>{{ userInitial }}</span>
        </v-avatar>

        <div class="text-left d-none d-sm-block mr-2">
          <div
            class="user-name font-weight-bold text-truncate"
            style="max-width: 180px"
          >
            {{ user.fullName || user.email }}
          </div>
          <v-chip
            :color="roleColor"
            size="x-small"
            variant="tonal"
            class="font-weight-bold mt-1"
          >
            <v-icon
              :icon="
                user.role === 'TEACHER' ? 'mdi-school' : 'mdi-account-check'
              "
              size="12"
              class="mr-1"
            />
            {{ roleDisplayName }}
          </v-chip>
        </div>
      </div>

      <v-btn
        icon="mdi-account-edit-outline"
        variant="text"
        color="primary"
        size="small"
        class="mr-1"
        :title="t('sidebar.profile')"
        :aria-label="t('sidebar.profile')"
        @click="router.push('/profile')"
      />

      <!-- Nút Đăng xuất Outlined Pill -->
      <v-btn
        color="error"
        variant="outlined"
        size="small"
        rounded="pill"
        prepend-icon="mdi-logout"
        class="text-none font-weight-bold px-3 ml-1"
        @click="handleLogout"
      >
        <span class="d-none d-sm-inline">{{ t("logout") }}</span>
      </v-btn>
    </div>
  </v-app-bar>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import { useQuestionBankStore } from "../../stores/questionBank";
import { useNotificationsStore } from "../../stores/notifications";
import DuckBearMascot from "./DuckBearMascot.vue";

const router = useRouter();
const authStore = useAuthStore();
const questionBankStore = useQuestionBankStore();
const notifications = useNotificationsStore();
const { t, locale } = useI18n();
const languageOptions = [
  { title: "Tiếng Việt", value: "vi" },
  { title: "English", value: "en" },
];

const user = computed(() => authStore.user);
const notificationsOpen = ref(false);
const failedAvatarUrl = ref(null);
const showAvatarImage = computed(
  () =>
    Boolean(user.value?.avatarUrl) &&
    failedAvatarUrl.value !== user.value.avatarUrl,
);

watch(
  () => user.value?.avatarUrl,
  () => {
    failedAvatarUrl.value = null;
  },
);

const userInitial = computed(() => {
  const name = user.value?.fullName || user.value?.email || "D";
  return name.trim().charAt(0).toUpperCase();
});

const roleDisplayName = computed(() => {
  const role = user.value?.role;
  if (role === "TEACHER") return "Giáo viên";
  if (role === "STUDENT") return "Học sinh";
  if (role === "ADMIN") return "Quản trị viên";
  return role || "Thành viên";
});

const roleColor = computed(() => {
  const role = user.value?.role;
  if (role === "TEACHER") return "primary";
  if (role === "STUDENT") return "success";
  if (role === "ADMIN") return "purple";
  return "info";
});

function toggleTeacherSidebar() {
  const eventName =
    user.value?.role === "STUDENT"
      ? "student-sidebar:toggle"
      : "teacher-sidebar:toggle";
  window.dispatchEvent(new Event(eventName));
}

function setLocale(value) {
  locale.value = value;
  localStorage.setItem("locale", value);
}

function handleLogout() {
  if (
    questionBankStore.hasPendingDrafts &&
    !window.confirm(t("questionBank.confirmLogoutWithDrafts"))
  )
    return;
  authStore.logout();
  router.push("/login");
}

function openNotification(item) {
  notifications.dismiss(item.id);
  notificationsOpen.value = false;
  if (item.url) router.push(item.url);
}

function formatNotificationTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale.value, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function goHome() {
  router.push("/");
}
</script>

<style scoped>
.app-header {
  position: fixed !important;
  top: 0 !important;
  left: 0;
  right: 0;
  z-index: 100;
}

.cursor-pointer {
  cursor: pointer;
}

.brand-header {
  user-select: none;
  transition: transform 0.2s ease;
}
.brand-header:hover {
  transform: scale(1.02);
}

.brand-text {
  font-size: 1.35rem;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.brand-sub {
  font-size: 0.65rem;
  letter-spacing: 0.18em;
  color: #2f7cf6;
}

.avatar-shub {
  background: linear-gradient(135deg, #2f7cf6 0%, #1f5fd0 100%) !important;
  box-shadow: 0 3px 8px rgba(47, 124, 246, 0.3);
}

.user-name {
  font-size: 0.88rem;
  color: #1d2939;
  line-height: 1.2;
}

.notification-menu {
  width: min(420px, calc(100vw - 24px));
  max-height: min(520px, calc(100vh - 90px));
  overflow: hidden;
}

.notification-bell {
  position: relative;
  overflow: visible !important;
}

.notification-count {
  position: absolute;
  top: -3px;
  right: -3px;
  display: inline-flex;
  min-width: 19px;
  height: 19px;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  border: 2px solid #fff;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  pointer-events: none;
  z-index: 2;
}

.notification-menu-heading {
  padding: 16px 20px;
  color: #1d2939;
  font-weight: 700;
}

.notification-list {
  max-height: min(450px, calc(100vh - 160px));
  overflow-y: auto;
}

.notification-item {
  cursor: pointer;
}

.notification-item :deep(.v-list-item-subtitle) {
  display: -webkit-box;
  overflow: hidden;
  white-space: normal;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.notification-time {
  color: #8492a6;
  font-size: 0.75rem;
  white-space: nowrap;
}

.notification-empty {
  padding: 28px 20px;
  color: #8492a6;
  text-align: center;
}

@media (max-width: 600px) {
  .language-switch {
    min-width: 44px;
    padding: 0 8px;
  }
}
</style>
