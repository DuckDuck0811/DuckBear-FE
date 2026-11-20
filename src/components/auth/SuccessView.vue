<template>
  <div class="success-view text-center pa-2">
    <!-- Mascot DuckBear mỉm cười chúc mừng -->
    <div class="d-flex justify-center mb-5">
      <DuckBearMascot mood="success" />
    </div>

    <!-- Badge icon tròn xanh thành công -->
    <div class="success-badge-icon mb-4">
      <v-avatar color="success" size="64" class="elevation-3">
        <v-icon icon="mdi-check-bold" size="32" color="white" />
      </v-avatar>
    </div>

    <!-- Tiêu đề lớn -->
    <h2 class="text-h4 font-weight-black text-grey-darken-4 mb-3">
      Đổi mật khẩu thành công!
    </h2>

    <!-- Mô tả chi tiết -->
    <p class="text-body-1 text-grey-darken-1 mb-8" style="line-height: 1.6; max-width: 380px; margin: 0 auto;">
      Mật khẩu tài khoản của bạn đã được cập nhật an toàn. Vui lòng sử dụng mật khẩu mới để đăng nhập vào DuckBear.
    </p>

    <!-- Nút chính về trang đăng nhập -->
    <v-btn
      color="primary"
      size="x-large"
      block
      rounded="pill"
      class="btn-gradient-primary font-weight-black text-h6"
      style="height: 56px;"
      prepend-icon="mdi-login"
      @click="emit('to-login')"
    >
      Về trang đăng nhập
    </v-btn>
  </div>
</template>

<script setup>
import DuckBearMascot from "./DuckBearMascot.vue";

const emit = defineEmits(["to-login"]);
</script>

<style scoped>
.success-view {
  animation: scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.success-badge-icon {
  display: inline-block;
  animation: bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.btn-gradient-primary {
  background: linear-gradient(90deg, #22708F 0%, #2F7BF5 100%) !important;
  color: #FFFFFF !important;
  box-shadow: 0 8px 20px -4px rgba(47, 123, 245, 0.42) !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-gradient-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px -4px rgba(47, 123, 245, 0.5) !important;
}

.btn-gradient-primary:active {
  transform: translateY(1px);
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.92);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes bounceIn {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  50% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .success-view,
  .success-badge-icon,
  .btn-gradient-primary {
    animation: none !important;
    transition: none !important;
    transform: none !important;
  }
}
</style>
