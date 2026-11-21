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

        <!-- MÀN HÌNH 2 BƯỚC: BƯỚC 1 (OTP) -> BƯỚC 2 (MẬT KHẨU MỚI) -->
        <template v-else>
          <!-- 1. Logo DuckBear -->
          <div class="d-flex align-center justify-center ga-2 mb-3 brand-logo-row">
            <div class="brand-icon-box">D</div>
            <span class="brand-text">DuckBear</span>
          </div>

          <Transition name="step-fade" mode="out-in">
            <!-- BƯỚC 1: NHẬP VÀ XÁC NHẬN MÃ OTP -->
            <div v-if="currentStep === 1" key="step-otp">
              <!-- Tiêu đề & mô tả bước 1 -->
              <h1 class="page-title text-center mb-2">Nhập mã OTP</h1>
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

              <form class="reset-form d-flex flex-column ga-3" @submit.prevent="handleVerifyOtp">
                <!-- 6 ô nhập mã OTP -->
                <div class="form-section">
                  <label class="form-label mb-2 d-block">Mã xác thực OTP (6 chữ số)</label>
                  <OtpInput
                    ref="otpInputRef"
                    v-model="otpCode"
                    :disabled="isSubmitting || countdown.isExpired.value"
                    @focus="onInputFocus"
                    @blur="onInputBlur"
                  />
                </div>

                <!-- Khối đếm ngược 10 phút & chờ gửi lại -->
                <CountdownRing
                  :formatted-time="countdown.formattedTime.value"
                  :progress-percent="countdown.progressPercent.value"
                  :resend-in="countdown.resendIn.value"
                  :is-urgent="countdown.isUrgent.value"
                  :is-expired="countdown.isExpired.value"
                  :can-resend="countdown.canResend.value"
                />

                <!-- Hàng link: Đổi email / Gửi lại mã -->
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

                <!-- Nút xác nhận mã OTP -->
                <v-btn
                  type="submit"
                  color="primary"
                  size="x-large"
                  block
                  rounded="pill"
                  class="btn-main-submit font-weight-black text-body-1"
                  :loading="isSubmitting"
                  :disabled="isOtpSubmitDisabled"
                >
                  Xác nhận mã OTP
                </v-btn>
              </form>

              <!-- Link quay lại trang đăng nhập -->
              <div class="text-center mt-5">
                <v-btn
                  variant="text"
                  class="btn-back-login font-weight-black"
                  @click="handleBackToLogin"
                >
                  ← Quay lại đăng nhập
                </v-btn>
              </div>
            </div>

            <!-- BƯỚC 2: NHẬP MẬT KHẨU MỚI (CHỈ HIỂN THỊ SAU KHI OTP HỢP LỆ) -->
            <div v-else key="step-password">
              <!-- Tiêu đề & mô tả bước 2 -->
              <h1 class="page-title text-center mb-2">Đặt lại mật khẩu mới</h1>
              <p class="page-description text-center mb-6">
                Nhập mật khẩu mới cho tài khoản <strong class="text-email font-weight-black">{{ displayEmail }}</strong>.
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

              <v-form ref="passwordFormRef" class="reset-form d-flex flex-column ga-3" @submit.prevent="handleResetPassword">
                <!-- Mật khẩu mới & Thước đo độ mạnh -->
                <div class="form-section">
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

                <!-- Nhập lại mật khẩu mới -->
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

                <!-- Nút đổi mật khẩu -->
                <v-btn
                  type="submit"
                  color="primary"
                  size="x-large"
                  block
                  rounded="pill"
                  class="btn-main-submit font-weight-black text-body-1 mt-2"
                  :loading="isSubmitting"
                  :disabled="isPasswordSubmitDisabled"
                >
                  Xác nhận đổi mật khẩu
                </v-btn>
              </v-form>

              <!-- Hàng quay lại bước 1 hoặc về đăng nhập -->
              <div class="d-flex align-center justify-space-between mt-5">
                <v-btn
                  variant="text"
                  class="btn-text-link font-weight-black"
                  @click="handleBackToStep1"
                >
                  ← Nhập lại mã OTP
                </v-btn>

                <v-btn
                  variant="text"
                  class="btn-back-login font-weight-black"
                  @click="handleBackToLogin"
                >
                  Đăng nhập
                </v-btn>
              </div>
            </div>
          </Transition>
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

// Trạng thái các bước: 1 = Nhập OTP, 2 = Nhập mật khẩu mới
const currentStep = ref(1);

// Trạng thái form & tương tác
const passwordFormRef = ref(null);
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
const sentAt = Number(route.query.sentAt);
const secondsSinceSend = Number.isFinite(sentAt) && sentAt > 0
  ? Math.floor((Date.now() - sentAt) / 1000)
  : 0;
const countdown = useCountdown(Math.max(0, 600 - secondsSinceSend), 60);
const strength = usePasswordStrength(newPassword);

// Kiểm tra mật khẩu khớp nhau
const isPasswordMatch = computed(() => {
  return (
    !!newPassword.value &&
    !!confirmPassword.value &&
    newPassword.value === confirmPassword.value
  );
});

// Nút submit bước 1 (Xác nhận OTP) bị disabled khi:
const isOtpSubmitDisabled = computed(() => {
  return (
    isSubmitting.value ||
    otpCode.value.length < 6 ||
    countdown.isExpired.value
  );
});

// Nút submit bước 2 (Đổi mật khẩu) bị disabled khi:
const isPasswordSubmitDisabled = computed(() => {
  return (
    isSubmitting.value ||
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

// Validation rules cho mật khẩu
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

// BƯỚC 1: XÁC THỰC MÃ OTP
async function handleVerifyOtp() {
  if (isOtpSubmitDisabled.value) return;

  isSubmitting.value = true;
  errorMessage.value = "";

  try {
    if (auth?.verifyResetOtp) {
      // Gọi API xác thực OTP từ BE (/auth/password/verify-otp)
      await auth.verifyResetOtp({
        email: displayEmail.value,
        otp: otpCode.value,
      });
    } else {
      // Mock fallback: OTP '000000' coi như sai, còn lại coi như đúng
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (otpCode.value === "000000") {
            reject(new Error("Mã OTP không chính xác hoặc đã hết hạn"));
          } else {
            resolve({ valid: true });
          }
        }, 600);
      });
    }

    // OTP đúng -> chuyển sang bước 2 để nhập mật khẩu mới
    currentStep.value = 2;
  } catch (err) {
    errorMessage.value = err.message || "Mã OTP không đúng hoặc đã hết hạn. Vui lòng thử lại.";
    triggerShake();
    otpInputRef.value?.clear();
  } finally {
    isSubmitting.value = false;
  }
}

// BƯỚC 2: XÁC NHẬN ĐẶT LẠI MẬT KHẨU
async function handleResetPassword() {
  if (isPasswordSubmitDisabled.value) return;

  const valid = await passwordFormRef.value?.validate();
  if (valid && !valid.valid) return;

  isSubmitting.value = true;
  errorMessage.value = "";

  try {
    if (typeof props.onVerify === "function") {
      await props.onVerify(otpCode.value, newPassword.value);
    } else if (auth?.resetPassword) {
      await auth.resetPassword({
        email: displayEmail.value,
        otp: otpCode.value,
        newPassword: newPassword.value,
      });
    } else {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    // Đổi mật khẩu thành công -> hiển thị màn hình chúc mừng
    isSuccess.value = true;
    emit("verify", { otp: otpCode.value, newPassword: newPassword.value });
    fireConfetti();
  } catch (err) {
    errorMessage.value = err.message || "Đã có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại.";
    triggerShake();
  } finally {
    isSubmitting.value = false;
  }
}

// Quay lại bước 1
function handleBackToStep1() {
  currentStep.value = 1;
  errorMessage.value = "";
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
  display: grid;
  place-items: center;
  padding: 26px 20px 32px;
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
  animation: floatSlow1 18s ease-in-out infinite alternate;
}

/* Blob 2: Cam #FFB84D (opacity .3) góc dưới phải */
.blob-2 {
  width: 380px;
  height: 380px;
  bottom: -90px;
  right: -90px;
  background-color: #FFB84D;
  opacity: 0.3;
  animation: floatSlow2 22s ease-in-out infinite alternate;
}

/* Blob 3: Xanh dương #2F7BF5 (opacity .18) giữa phải */
.blob-3 {
  width: 260px;
  height: 260px;
  top: 30%;
  right: 10%;
  background-color: #2F7BF5;
  opacity: 0.18;
  animation: floatSlow3 15s ease-in-out infinite alternate;
}

/* Blob 4: Teal nhỏ #22708F (opacity .16) góc dưới trái */
.blob-4 {
  width: 220px;
  height: 220px;
  bottom: 8%;
  left: 8%;
  background-color: #22708F;
  opacity: 0.16;
  animation: floatSlow1 20s ease-in-out infinite alternate reverse;
}

@keyframes floatSlow1 {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(30px, 40px) scale(1.08); }
  100% { transform: translate(-20px, 20px) scale(0.95); }
}

@keyframes floatSlow2 {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-40px, -30px) scale(1.05); }
  100% { transform: translate(25px, -20px) scale(0.96); }
}

@keyframes floatSlow3 {
  0% { transform: translate(0, 0); }
  100% { transform: translate(-30px, 35px); }
}

/* 3. CARD CONTAINER */
.reset-card {
  position: relative;
  margin: 0 auto;
  width: 100%;
  max-width: 540px;
  overflow: visible !important;
  border-radius: 32px !important;
  background: rgba(255, 255, 255, 0.82) !important;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.95) !important;
  box-shadow:
    0 10px 25px -5px rgba(34, 112, 143, 0.08),
    0 20px 40px -10px rgba(47, 123, 245, 0.12),
    0 0 1px 1px rgba(255, 255, 255, 0.9) inset !important;
  padding: 98px 46px 40px !important;
  z-index: 1;
}

/* 4. MASCOT ANCHOR */
.mascot-anchor {
  position: absolute;
  top: -26px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  filter: drop-shadow(0 10px 14px rgba(34, 112, 143, 0.16));
}

/* 5. LOGO BRAND */
.brand-icon-box {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: linear-gradient(135deg, #22708F 0%, #2F7BF5 100%);
  color: #FFFFFF;
  font-weight: 900;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(34, 112, 143, 0.25);
}

.brand-text {
  font-size: 20px;
  font-weight: 800;
  color: #22708F;
  letter-spacing: -0.3px;
}

/* 6. TIÊU ĐỀ & MÔ TẢ */
.page-title {
  font-size: 26px;
  font-weight: 900;
  color: #1A3E54;
  letter-spacing: -0.5px;
}

.page-description {
  font-size: 14px;
  color: #5A7184;
  line-height: 1.5;
  text-wrap: balance;
}

.text-email {
  color: #22708F;
}

/* 7. FORM SECTIONS */
.form-label {
  font-size: 13px;
  font-weight: 800;
  color: #2C3E50;
  letter-spacing: -0.2px;
}

/* 8. ACTION LINKS */
.btn-text-link {
  font-size: 13px !important;
  font-weight: 800 !important;
  color: #22708F !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  padding: 0 4px !important;
  min-width: auto !important;
}

.btn-text-link:hover {
  color: #2F7BF5 !important;
  background-color: transparent !important;
}

/* 9. NÚT CHÍNH */
.btn-main-submit {
  height: 52px !important;
  background: linear-gradient(135deg, #22708F 0%, #2F7BF5 100%) !important;
  color: #FFFFFF !important;
  box-shadow: 0 8px 20px -4px rgba(34, 112, 143, 0.35) !important;
  transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
  text-transform: none !important;
}

.btn-main-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px -4px rgba(34, 112, 143, 0.45) !important;
}

.btn-main-submit:active:not(:disabled) {
  transform: translateY(0);
}

.btn-main-submit:disabled {
  opacity: 0.55 !important;
  background: #A0B4C0 !important;
  box-shadow: none !important;
}

/* 10. QUAY LẠI ĐĂNG NHẬP */
.btn-back-login {
  font-size: 13px !important;
  color: #22708F !important;
  text-transform: none !important;
}

.btn-back-login:hover {
  color: #2F7BF5 !important;
  background: transparent !important;
}

/* 11. HIỆU ỨNG RUNG THẺ (SHAKE ANIMATION) */
.card--shake {
  animation: cardShake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes cardShake {
  10%, 90% { transform: translate3d(-3px, 0, 0); }
  20%, 80% { transform: translate3d(5px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-6px, 0, 0); }
  40%, 60% { transform: translate3d(6px, 0, 0); }
}

/* 12. STEP TRANSITION ANIMATION */
.step-fade-enter-active,
.step-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.step-fade-enter-from {
  opacity: 0;
  transform: translateX(18px);
}

.step-fade-leave-to {
  opacity: 0;
  transform: translateX(-18px);
}

/* 13. CARD TRANSITION */
.card-slide-enter-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.card-slide-enter-from {
  opacity: 0;
  transform: translateY(32px) scale(0.96);
}

/* 14. RESPONSIVE DESIGN */
@media (max-width: 600px) {
  .reset-password-page {
    padding: 26px 16px 24px;
  }

  .reset-card {
    max-width: 100%;
    padding: 96px 24px 28px !important;
    border-radius: 24px !important;
  }

  .page-title {
    font-size: 22px;
  }

  .page-description {
    font-size: 13px;
  }

  .btn-main-submit {
    height: 48px !important;
  }
}

@media (max-height: 720px) {
  .reset-password-page {
    place-items: start center;
    padding-top: 26px;
  }
}

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .blob,
  .reset-card,
  .card--shake,
  .step-fade-enter-active,
  .step-fade-leave-active {
    animation: none !important;
    transition: none !important;
  }
}
</style>
