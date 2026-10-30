<template>
  <v-app-bar
    color="white"
    flat
    class="border-b px-2 px-md-6"
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
      {{ t('classes') }}
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
          {{ userInitial }}
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
        <span class="d-none d-sm-inline">{{ t('logout') }}</span>
      </v-btn>
    </div>
  </v-app-bar>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import DuckBearMascot from "./DuckBearMascot.vue";

const router = useRouter();
const authStore = useAuthStore();
const { t, locale } = useI18n();
const languageOptions = [
  { title: "Tiếng Việt", value: "vi" },
  { title: "English", value: "en" },
];

const user = computed(() => authStore.user);

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
  const eventName = user.value?.role === "STUDENT"
    ? "student-sidebar:toggle"
    : "teacher-sidebar:toggle";
  window.dispatchEvent(new Event(eventName));
}

function setLocale(value) {
  locale.value = value;
  localStorage.setItem("locale", value);
}

function handleLogout() {
  authStore.logout();
  router.push("/login");
}

function goHome() {
  router.push("/");
}
</script>

<style scoped>
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

@media (max-width: 600px) {
  .language-switch {
    min-width: 44px;
    padding: 0 8px;
  }
}
</style>
