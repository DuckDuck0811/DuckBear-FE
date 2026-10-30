<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import DuckBearMascot from './DuckBearMascot.vue'

const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.user)

const userInitial = computed(() => {
  const name = user.value?.fullName || user.value?.email || 'D'
  return name.trim().charAt(0).toUpperCase()
})

const roleDisplayName = computed(() => {
  const role = user.value?.role
  if (role === 'TEACHER') return 'Giáo viên'
  if (role === 'STUDENT') return 'Học sinh'
  if (role === 'ADMIN') return 'Quản trị viên'
  return role || 'Thành viên'
})

const roleColor = computed(() => {
  const role = user.value?.role
  if (role === 'TEACHER') return 'primary'
  if (role === 'STUDENT') return 'success'
  if (role === 'ADMIN') return 'purple'
  return 'info'
})

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

function goHome() {
  router.push('/')
}
</script>

<template>
  <v-app-bar
    color="white"
    flat
    class="border-b px-2 px-md-6"
    height="70"
    style="border-color: #E4ECF7 !important; z-index: 100;"
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
          <span class="text-primary font-weight-black">Duck</span><span class="text-orange font-weight-black">Bear</span>
        </div>
        <div class="brand-sub font-weight-bold">
          CLASSROOM
        </div>
      </div>
    </div>

    <v-spacer />

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
          <div class="user-name font-weight-bold text-truncate" style="max-width: 180px;">
            {{ user.fullName || user.email }}
          </div>
          <v-chip
            :color="roleColor"
            size="x-small"
            variant="tonal"
            class="font-weight-bold mt-1"
          >
            <v-icon
              :icon="user.role === 'TEACHER' ? 'mdi-school' : 'mdi-account-check'"
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
        <span class="d-none d-sm-inline">Đăng xuất</span>
      </v-btn>
    </div>
  </v-app-bar>
</template>

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
  color: #2F7CF6;
}

.avatar-shub {
  background: linear-gradient(135deg, #2F7CF6 0%, #1F5FD0 100%) !important;
  box-shadow: 0 3px 8px rgba(47, 124, 246, 0.3);
}

.user-name {
  font-size: 0.88rem;
  color: #1D2939;
  line-height: 1.2;
}
</style>

