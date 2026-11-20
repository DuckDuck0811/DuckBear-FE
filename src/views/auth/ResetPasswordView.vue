<template>
  <main class="auth-page">
    <v-card class="auth-card pa-6 pa-sm-8" elevation="2" rounded="xl">
      <div class="text-center mb-6">
        <div class="brand-badge mb-3"><span>D</span> DuckBear</div>
        <h1 class="text-h5 font-weight-bold">Nhập mã OTP</h1>
        <p class="text-body-2 text-medium-emphasis mt-2 mb-0">
          Mã được gửi đến {{ email }} và có hiệu lực trong 10 phút.
        </p>
      </div>

      <v-alert
        v-if="message"
        :type="error ? 'error' : 'success'"
        variant="tonal"
        rounded="lg"
        class="mb-4"
      >
        {{ message }}
      </v-alert>

      <v-form v-if="!complete" ref="form" @submit.prevent="submit">
        <v-text-field
          v-model="otp"
          label="Mã OTP 6 số"
          inputmode="numeric"
          autocomplete="one-time-code"
          prepend-inner-icon="mdi-numeric"
          :rules="otpRules"
          variant="outlined"
          rounded="lg"
        />
        <v-text-field
          v-model="newPassword"
          label="Mật khẩu mới"
          type="password"
          autocomplete="new-password"
          prepend-inner-icon="mdi-lock-outline"
          :rules="passwordRules"
          variant="outlined"
          rounded="lg"
        />
        <v-text-field
          v-model="confirmPassword"
          label="Nhập lại mật khẩu"
          type="password"
          autocomplete="new-password"
          prepend-inner-icon="mdi-lock-check-outline"
          :rules="confirmationRules"
          variant="outlined"
          rounded="lg"
          class="mt-2"
        />
        <div class="d-flex justify-space-between align-center mb-4">
          <v-btn variant="text" color="primary" size="small" @click="changeEmail">
            Đổi email
          </v-btn>
          <v-btn
            variant="text"
            color="primary"
            size="small"
            :disabled="loading || resendIn > 0"
            @click="resendOtp"
          >
            {{ resendIn > 0 ? `Gửi lại sau ${resendIn}s` : "Gửi lại mã" }}
          </v-btn>
        </div>
        <v-btn
          type="submit"
          color="primary"
          size="large"
          block
          rounded="pill"
          :loading="loading"
        >
          Xác nhận OTP và đổi mật khẩu
        </v-btn>
      </v-form>

      <div class="text-center mt-5">
        <router-link class="text-primary text-decoration-none" to="/login">
          Quay lại đăng nhập
        </router-link>
      </div>
    </v-card>
  </main>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const form = ref(null);
const email = ref(sessionStorage.getItem("passwordResetEmail") || "");
const otp = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const complete = ref(false);
const error = ref(false);
const message = ref("");
const sentAt = Number(route.query.sentAt) || Date.now();
const resendIn = ref(
  Math.min(60, Math.max(0, 60 - Math.floor((Date.now() - sentAt) / 1000))),
);
const otpRules = [
  (value) => !!value || "Vui lòng nhập mã OTP",
  (value) => /^\d{6}$/.test(value) || "Mã OTP gồm 6 chữ số",
];
const passwordRules = [
  (value) => !!value || "Mật khẩu không được để trống",
  (value) => (value && value.length >= 6) || "Mật khẩu cần ít nhất 6 ký tự",
];
const confirmationRules = [
  (value) => !!value || "Vui lòng nhập lại mật khẩu",
  (value) => value === newPassword.value || "Mật khẩu nhập lại chưa khớp",
];
let resendTimer;

function startResendTimer() {
  window.clearInterval(resendTimer);
  resendIn.value = 60;
  resendTimer = window.setInterval(() => {
    resendIn.value -= 1;
    if (resendIn.value <= 0) window.clearInterval(resendTimer);
  }, 1000);
}

function changeEmail() {
  sessionStorage.removeItem("passwordResetEmail");
  router.push("/forgot-password");
}

async function resendOtp() {
  if (resendIn.value > 0 || loading.value) return;
  loading.value = true;
  error.value = false;
  try {
    await auth.requestPasswordReset({ email: email.value });
    message.value = "Nếu email này có tài khoản, mã OTP mới đã được gửi.";
    startResendTimer();
    await router.replace({ query: { sentAt: String(Date.now()) } });
  } catch (cause) {
    error.value = true;
    message.value =
      cause.status === 503
        ? "Chưa thể gửi email đặt lại mật khẩu lúc này. Vui lòng thử lại sau hoặc liên hệ quản trị viên."
        : cause.message || "Không gửi được mã OTP. Vui lòng thử lại.";
  } finally {
    loading.value = false;
  }
}

async function submit() {
  const result = await form.value.validate();
  if (!result.valid) return;

  loading.value = true;
  error.value = false;
  message.value = "";
  try {
    await auth.resetPassword({
      email: email.value,
      otp: otp.value,
      newPassword: newPassword.value,
    });
    complete.value = true;
    sessionStorage.removeItem("passwordResetEmail");
    await router.replace("/login?passwordReset=1");
  } catch (cause) {
    error.value = true;
    message.value = cause.message || "Không thể đổi mật khẩu. Vui lòng thử lại.";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (!email.value) {
    router.replace("/forgot-password");
    return;
  }
  if (resendIn.value > 0) {
    resendTimer = window.setInterval(() => {
      resendIn.value -= 1;
      if (resendIn.value <= 0) window.clearInterval(resendTimer);
    }, 1000);
  }
});

onBeforeUnmount(() => window.clearInterval(resendTimer));
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: linear-gradient(135deg, #e9f7fc, #f5f8ff);
}

.auth-card {
  width: min(100%, 460px);
}

.brand-badge {
  color: #236d8b;
  font-size: 1.15rem;
  font-weight: 800;
}

.brand-badge span {
  display: inline-grid;
  width: 30px;
  height: 30px;
  place-items: center;
  margin-right: 6px;
  border-radius: 9px;
  background: #236d8b;
  color: white;
}
</style>
