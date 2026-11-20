<template>
  <main class="reset-password-page">
    <!-- 4 hình tròn mờ (blob) trôi chậm bằng CSS animation -->
    <div class="blob-wrapper" aria-hidden="true">
      <div class="blob blob-1" />
      <div class="blob blob-2" />
      <div class="blob blob-3" />
      <div class="blob blob-4" />
    </div>

    <!-- Container thẻ căn giữa màn hình với hiệu ứng xuất hiện Fade + Slide Up -->
    <Transition name="card-slide" appear>
      <v-card
        class="reset-card"
        :class="{ 'card--shake': isShaking }"
        elevation="0"
      >
        <!-- Mascot "gấu + mỏ vịt" nhô lên 52px phía trên card -->
        <div class="mascot-anchor">
          <DuckBearMascot :mood="mascotMood" />
        </div>

        <!-- MÀN HÌNH THÀNH CÔNG (SUCCESS VIEW) -->
        <template v-if="isSuccess">
          <SuccessView @to-login="handleBackToLogin" />
        </template>

        <!-- MÀN HÌNH NHẬP MÃ OTP VÀ ĐẶT LẠI MẬT KHẨU -->
        <template v-else>
          <!-- 1. Logo DuckBear -->
          <div class="d-flex align-center justify-center ga-2 mb-3 brand-logo-row">
            <div class="brand-icon-box">D</div>
            <span class="brand-text">DuckBear</span>
          </div>

          <!-- 2. Tiêu đề trang -->
          <h1 class="page-title text-center mb-2">Nhập mã OTP</h1>

          <!-- 3. Mô tả gửi mã -->
          <p class="page-description text-center mb-6">
            Mã được gửi đến <strong class="text-email font-weight-black">{{ displayEmail }}</strong> và có hiệu lực trong 10 phút.
          </p>

          <!-- Thông báo lỗi (Alert) -->
          <v-slide-y-transition>
            <v-alert
              v-if="errorMessage"
              type="error"
              variant="tonal"
              closable
              rounded="xl"
              class="mb-4 text-body-2 font-weight-bold"
              @click:close="errorMessage = ''"
            >
              {{ errorMessage }}
            </v-alert>
          </v-slide-y-transition>

          <v-form ref="formRef" class="reset-form d-flex flex-column ga-3" @submit.prevent="handleSubmit">
            <!-- 4. 6 ô nhập mã OTP -->
            <div class="form-section">
              <label class="form-label mb-2 d-block">Mã xác thực OTP (6 chữ số)</label>
              <OtpInput
                ref="otpInputRef"
                v-model="otpCode"
                :disabled="isSubmitting || countdown.isExpired.value"
                @focus="onInputFocus"
                @blur="onInputBlur"
                @complete="onOtpComplete"
              />
            </div>

            <!-- 5. Khối đếm ngược 10 phút & chờ gửi lại -->
            <CountdownRing
              :formatted-time="countdown.formattedTime.value"
              :progress-percent="countdown.progressPercent.value"
              :resend-in="countdown.resendIn.value"
              :is-urgent="countdown.isUrgent.value"
              :is-expired="countdown.isExpired.value"
              :can-resend="countdown.canResend.value"
            />

            <!-- 6. Mật khẩu mới & Thước đo độ mạnh -->
            <div class="form-section mt-1">
              <label class="form-label mb-2 d-block">Mật khẩu mới</label>
              <PasswordField
                v-model="newPassword"
                label="Nhập mật khẩu mới"
                placeholder="Tối thiểu 6 ký tự"
                :rules="passwordRules"
                @focus="onInputFocus"
                @blur="onInputBlur"
              />
              <StrengthMeter
                v-if="newPassword"
                :score="strength.score.value"
                :label="strength.label.value"
                :color="strength.color.value"
              />
            </div>

            <!-- 7. Nhập lại mật khẩu mới -->
            <div class="form-section">
              <label class="form-label mb-2 d-block">Xác nhận mật khẩu</label>
              <PasswordField
                v-model="confirmPassword"
                label="Nhập lại mật khẩu mới"
                placeholder="Nhập trùng khớp với mật khẩu mới"
                :is-confirmation="true"
                :is-match="isPasswordMatch"
                :rules="confirmationRules"
                @focus="onInputFocus"
                @blur="onInputBlur"
              />
            </div>

            <!-- 8. Hàng link: Đổi email / Gửi lại mã -->
            <div class="d-flex align-center justify-space-between mt-1 mb-2 action-links-row">
              <v-btn
                variant="text"
                density="compact"
                class="btn-text-link"
                :disabled="isSubmitting"
                @click="handleChangeEmail"
              >
                Đổi email
              </v-btn>

              <v-btn
                variant="text"
                density="compact"
                class="btn-text-link"
                :disabled="isSubmitting || !countdown.canResend.value"
                @click="handleResend"
              >
                {{ countdown.resendIn.value > 0 ? `Gửi lại sau ${countdown.resendIn.value}s` : "Gửi lại mã" }}
              </v-btn>
            </div>

            <!-- 9. Nút chính xác nhận và đổi mật khẩu -->
            <v-btn
              type="submit"
              color="primary"
              size="x-large"
              block
              rounded="pill"
              class="btn-main-submit font-weight-black text-body-1"
              :loading="isSubmitting"
              :disabled="isSubmitDisabled"
            >
              Xác nhận OTP và đổi mật khẩu
            </v-btn>
          </v-form>

          <!-- 10. Link quay lại trang đăng nhập -->
          <div class="text-center mt-5">
            <v-btn
              variant="text"
              class="btn-back-login font-weight-black"
              @click="handleBackToLogin"
            >
              ← Quay lại đăng nhập
            </v-btn>
          </div>
        </template>
      </v-card>
    </Transition>
  </main>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import confetti from "canvas-confetti";
import DuckBearMascot from "../../components/auth/DuckBearMascot.vue";
import OtpInput from "../../components/auth/OtpInput.vue";
import CountdownRing from "../../components/auth/CountdownRing.vue";
import PasswordField from "../../components/auth/PasswordField.vue";
import StrengthMeter from "../../components/auth/StrengthMeter.vue";
import SuccessView from "../../components/auth/SuccessView.vue";
import { useCountdown } from "../../composables/useCountdown";
import { usePasswordStrength } from "../../composables/usePasswordStrength";
import { useAuthStore } from "../../stores/auth";

const props = defineProps({
  email: {
    type: String,
    default: "",
  },
  onVerify: {
    type: Function,
    default: null,
  },
  onResend: {
    type: Function,
    default: null,
  },
});

const emit = defineEmits(["verify", "resend", "change-email", "back-to-login"]);

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

// Lấy email từ prop, sessionStorage hoặc query
const displayEmail = computed(() => {
  return (
    props.email ||
    sessionStorage.getItem("passwordResetEmail") ||
    route.query.email ||
    "hocsinh@duckbear.edu.vn"
  );
});

// Trạng thái form & tương tác
const formRef = ref(null);
const otpInputRef = ref(null);
const otpCode = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const isSubmitting = ref(false);
const isSuccess = ref(false);
const isShaking = ref(false);
const errorMessage = ref("");
const isInputFocused = ref(false);

// Composables
const countdown = useCountdown(600, 60);
const strength = usePasswordStrength(newPassword);

// Kiểm tra mật khẩu khớp nhau
const isPasswordMatch = computed(() => {
  return (
    !!newPassword.value &&
    !!confirmPassword.value &&
    newPassword.value === confirmPassword.value
  );
});

// Nút submit bị vô hiệu hóa khi:
// - Đang gửi
// - OTP chưa đủ 6 chữ số
// - Mã đã hết hạn 10 phút
// - Mật khẩu mới chưa hợp lệ (< 6 ký tự)
// - Mật khẩu nhập lại chưa khớp
const isSubmitDisabled = computed(() => {
  return (
    isSubmitting.value ||
    otpCode.value.length < 6 ||
    countdown.isExpired.value ||
    !strength.isValid.value ||
    !isPasswordMatch.value
  );
});

// Quản lý biểu cảm mascot (normal | typing | success | error)
const mascotMood = computed(() => {
  if (isSuccess.value) return "success";
  if (isShaking.value || (errorMessage.value && !isInputFocused.value)) return "error";
  if (isInputFocused.value) return "typing";
  return "normal";
});

// Focus / Blur handlers
function onInputFocus() {
  isInputFocused.value = true;
  if (errorMessage.value) {
    errorMessage.value = "";
  }
}

function onInputBlur() {
  isInputFocused.value = false;
}

function onOtpComplete() {
  // Khi nhập đủ 6 số, nếu mật khẩu đã khớp thì có thể chuẩn bị submit
}

// Validation rules
const passwordRules = [
  (v) => !!v || "Mật khẩu không được để trống",
  (v) => (v && v.length >= 6) || "Mật khẩu cần ít nhất 6 ký tự",
];

const confirmationRules = [
  (v) => !!v || "Vui lòng nhập lại mật khẩu",
  (v) => v === newPassword.value || "Mật khẩu chưa khớp",
];

// Hiệu ứng pháo hoa ăn mừng khi thành công
function fireConfetti() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#22708F", "#2F7BF5", "#FFB84D", "#2E9E6B"],
    });
  } catch {
    // Bỏ qua nếu canvas không khả dụng
  }
}

// Xử lý nộp form
async function handleSubmit() {
  if (isSubmitDisabled.value) return;

  const valid = await formRef.value?.validate();
  if (valid && !valid.valid) return;

  isSubmitting.value = true;
  errorMessage.value = "";

  try {
    // 1. Nếu có prop onVerify truyền vào
    if (typeof props.onVerify === "function") {
      await props.onVerify(otpCode.value, newPassword.value);
    } else if (auth?.resetPassword) {
      // 2. Tích hợp trực tiếp với authStore
      await auth.resetPassword({
        email: displayEmail.value,
        otp: otpCode.value,
        newPassword: newPassword.value,
      });
    } else {
      // 3. Mock fallback kiểm tra (mã 123456 hoặc bất kỳ số khác 000000)
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (otpCode.value === "000000") {
            reject(new Error("Mã OTP không chính xác hoặc đã hết hạn"));
          } else {
            resolve({ success: true });
          }
        }, 900);
      });
    }

    // Thành công
    isSuccess.value = true;
    emit("verify", { otp: otpCode.value, newPassword: newPassword.value });
    fireConfetti();
  } catch (err) {
    // Thất bại: rung card + báo lỗi + xóa mã OTP
    errorMessage.value = err.message || "Mã OTP không đúng hoặc đã hết hạn. Vui lòng thử lại.";
    triggerShake();
    otpInputRef.value?.clear();
  } finally {
    isSubmitting.value = false;
  }
}

// Kích hoạt hiệu ứng rung card
function triggerShake() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!prefersReducedMotion) {
    isShaking.value = true;
    setTimeout(() => {
      isShaking.value = false;
    }, 600);
  }
}

// Gửi lại mã OTP
async function handleResend() {
  if (!countdown.canResend.value || isSubmitting.value) return;

  isSubmitting.value = true;
  errorMessage.value = "";

  try {
    if (typeof props.onResend === "function") {
      await props.onResend();
    } else if (auth?.requestPasswordReset) {
      await auth.requestPasswordReset({ email: displayEmail.value });
    } else {
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    countdown.triggerResend();
    emit("resend");
    otpInputRef.value?.clear();
  } catch (err) {
    errorMessage.value = err.message || "Chưa thể gửi lại mã OTP lúc này. Vui lòng thử lại sau.";
  } finally {
    isSubmitting.value = false;
  }
}

// Đổi email
function handleChangeEmail() {
  emit("change-email");
  router.push("/forgot-password");
}

// Quay lại đăng nhập
function handleBackToLogin() {
  emit("back-to-login");
  router.push("/login");
}
</script>

<style scoped>
/* 1. TOÀN BỘ KHUNG NỀN */
.reset-password-page {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 20px 40px;
  background: linear-gradient(135deg, #E6F3FA 0%, #EEF4FF 48%, #FFF4E0 100%);
  font-family: 'Nunito', -apple-system, sans-serif;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* 2. CÁC HÌNH TRÒN MỜ (BLOB) TRÔI CHẬM */
.blob-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(64px);
  will-change: transform;
}

/* Blob 1: Lớn teal #22708F (opacity .28) góc trên trái */
.blob-1 {
  width: 360px;
  height: 360px;
  top: -80px;
  left: -90px;
  background-color: #22708F;
  opacity: 0.28;
  animation: floatSlow 16s ease-in-out infinite alternate;
}

/* Blob 2: Cam #FFB84D (opacity .3) góc dưới phải */
.blob-2 {
  width: 340px;
  height: 340px;
  bottom: -60px;
  right: -70px;
  background-color: #FFB84D;
  opacity: 0.3;
  animation: floatSlow 18s ease-in-out infinite alternate-reverse;
}

/* Blob 3: Xanh dương #2F7BF5 (opacity .18) */
.blob-3 {
  width: 280px;
  height: 280px;
  top: 40%;
  right: 15%;
  background-color: #2F7BF5;
  opacity: 0.18;
  animation: floatSlow 20s ease-in-out infinite alternate;
}

/* Blob 4: Teal nhỏ (opacity .16) */
.blob-4 {
  width: 200px;
  height: 200px;
  bottom: 25%;
  left: 10%;
  background-color: #22708F;
  opacity: 0.16;
  animation: floatSlow 14s ease-in-out infinite alternate-reverse;
}

@keyframes floatSlow {
  0% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(25px, -20px) scale(1.06);
  }
  100% {
    transform: translate(-20px, 25px) scale(0.96);
  }
}

/* 3. CARD CHÍNH 480PX */
.reset-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 480px;
  border-radius: 32px !important;
  background: rgba(255, 255, 255, 0.82) !important;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1.5px solid rgba(255, 255, 255, 0.85);
  padding: 84px 40px 32px;
  box-shadow: 0 20px 48px -12px rgba(34, 112, 143, 0.16),
              0 8px 24px -4px rgba(47, 123, 245, 0.10),
              0 2px 6px rgba(0, 0, 0, 0.04) !important;
  box-sizing: border-box;
  overflow: visible !important;
}

/* Mascot nhô lên 52px */
.mascot-anchor {
  position: absolute;
  top: -56px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

/* Logo DuckBear */
.brand-icon-box {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  background-color: #22708F;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 1.05rem;
}

.brand-text {
  font-size: 1.35rem;
  font-weight: 900;
  color: #1B5F7B;
  letter-spacing: -0.3px;
}

/* Tiêu đề & Mô tả */
.page-title {
  font-size: 34px;
  font-weight: 900;
  color: #1B5F7B;
  letter-spacing: -0.5px;
  line-height: 1.2;
}

.page-description {
  font-size: 0.95rem;
  color: #5A6875;
  line-height: 1.55;
}

.text-email {
  color: #1B5F7B;
}

.form-label {
  font-size: 0.88rem;
  font-weight: 700;
  color: #33414D;
}

/* Links */
.btn-text-link {
  color: #1F63D6 !important;
  font-weight: 800 !important;
  font-size: 0.85rem !important;
  padding: 0 4px !important;
}

.btn-back-login {
  color: #1F63D6 !important;
  font-size: 0.95rem !important;
  letter-spacing: 0.1px;
}

/* Nút chính Xác nhận OTP và đổi mật khẩu */
.btn-main-submit {
  background: linear-gradient(90deg, #22708F 0%, #2F7BF5 100%) !important;
  color: #FFFFFF !important;
  height: 56px !important;
  box-shadow: 0 10px 24px -4px rgba(47, 123, 245, 0.45) !important;
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-main-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px -4px rgba(47, 123, 245, 0.55) !important;
}

.btn-main-submit:active:not(:disabled) {
  transform: translateY(1px);
}

.btn-main-submit:disabled {
  opacity: 0.65;
  box-shadow: none !important;
}

/* Hiệu ứng Shake khi OTP sai */
.card--shake {
  animation: shakeCard 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes shakeCard {
  10%, 90% {
    transform: translate3d(-3px, 0, 0);
  }
  20%, 80% {
    transform: translate3d(5px, 0, 0);
  }
  30%, 50%, 70% {
    transform: translate3d(-6px, 0, 0);
  }
  40%, 60% {
    transform: translate3d(6px, 0, 0);
  }
}

/* Card entry transition (Fade + Slide up) */
.card-slide-enter-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.card-slide-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

/* Responsive trên màn hình nhỏ */
@media (max-width: 480px) {
  .reset-password-page {
    padding: 70px 14px 24px;
  }
  .reset-card {
    padding: 74px 20px 24px;
    border-radius: 24px !important;
  }
  .page-title {
    font-size: 28px;
  }
}

/* Tôn trọng prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .blob,
  .card--shake,
  .card-slide-enter-active {
    animation: none !important;
    transition: none !important;
    transform: none !important;
  }
}
</style>
