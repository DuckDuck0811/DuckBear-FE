<template>
  <main class="auth-page">
    <v-card class="auth-card pa-6 pa-sm-8" elevation="2" rounded="xl">
      <div class="text-center mb-6">
        <div class="brand-badge mb-3"><span>D</span> DuckBear</div>
        <h1 class="text-h5 font-weight-bold">Quên mật khẩu?</h1>
        <p class="text-body-2 text-medium-emphasis mt-2 mb-0">
          Nhập email tài khoản để nhận mã OTP đặt lại mật khẩu.
        </p>
      </div>

      <v-alert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        rounded="lg"
        class="mb-4"
      >
        {{ errorMessage }}
      </v-alert>

      <v-form ref="form" @submit.prevent="submit">
        <v-text-field
          v-model="email"
          label="Địa chỉ email"
          type="email"
          autocomplete="email"
          prepend-inner-icon="mdi-email-outline"
          :rules="emailRules"
          variant="outlined"
          rounded="lg"
          class="mb-2"
        />
        <v-btn
          type="submit"
          color="primary"
          size="large"
          block
          rounded="pill"
          :loading="loading"
        >
          Gửi mã OTP
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
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";

const auth = useAuthStore();
const router = useRouter();
const form = ref(null);
const email = ref("");
const loading = ref(false);
const errorMessage = ref("");
const emailRules = [
  (value) => !!value || "Email không được để trống",
  (value) => /.+@.+\..+/.test(value) || "Email không hợp lệ",
];

async function submit() {
  const result = await form.value.validate();
  if (!result.valid) return;

  loading.value = true;
  errorMessage.value = "";
  const normalizedEmail = email.value.trim();
  try {
    await auth.requestPasswordReset({ email: normalizedEmail });
    sessionStorage.setItem("passwordResetEmail", normalizedEmail);
    await router.push({
      path: "/reset-password",
      query: { sentAt: String(Date.now()) },
    });
  } catch (cause) {
    errorMessage.value =
      cause.status === 503
        ? "Chưa thể gửi email đặt lại mật khẩu lúc này. Vui lòng thử lại sau hoặc liên hệ quản trị viên."
        : cause.message || "Không gửi được mã OTP. Vui lòng thử lại.";
  } finally {
    loading.value = false;
  }
}
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
