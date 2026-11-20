<template>
  <div
    class="countdown-bar"
    :class="{
      'countdown-bar--urgent': isUrgent,
      'countdown-bar--expired': isExpired,
    }"
    role="timer"
    :aria-label="isExpired ? 'Mã OTP đã hết hạn' : `Thời gian còn lại: ${formattedTime}`"
  >
    <!-- Vòng tiến trình tròn SVG -->
    <div class="ring-wrapper">
      <svg viewBox="0 0 36 36" class="progress-ring">
        <!-- Vòng nền -->
        <path
          class="ring-bg"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        <!-- Vòng tiến trình giảm dần -->
        <path
          class="ring-stroke"
          :stroke-dasharray="`${progressPercent}, 100`"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
      </svg>
      <v-icon
        :icon="isExpired ? 'mdi-alert-circle' : isUrgent ? 'mdi-timer-alert' : 'mdi-clock-outline'"
        size="16"
        class="ring-icon"
      />
    </div>

    <!-- Thông điệp đếm ngược chính -->
    <div class="countdown-text flex-grow-1">
      <template v-if="isExpired">
        <span class="text-expired font-weight-bold">Mã đã hết hạn. Vui lòng bấm Gửi lại mã.</span>
      </template>
      <template v-else>
        <span>Mã sẽ hết hạn sau </span>
        <strong class="time-number font-weight-black">{{ formattedTime }}</strong>
      </template>
    </div>

    <!-- Trạng thái gửi lại mã bên phải -->
    <div class="resend-badge text-caption font-weight-bold">
      <template v-if="resendIn > 0">
        <span>Gửi lại sau {{ resendIn }}s</span>
      </template>
      <template v-else>
        <span class="text-can-resend">Có thể gửi lại</span>
      </template>
    </div>
  </div>
</template>

<script setup>
defineProps({
  formattedTime: {
    type: String,
    default: "10:00",
  },
  progressPercent: {
    type: Number,
    default: 100,
  },
  resendIn: {
    type: Number,
    default: 60,
  },
  isUrgent: {
    type: Boolean,
    default: false,
  },
  isExpired: {
    type: Boolean,
    default: false,
  },
  canResend: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped>
.countdown-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: #FFF4DC;
  border: 1px solid #F6DFA9;
  border-radius: 16px;
  padding: 10px 16px;
  color: #7A4B1A;
  font-size: 0.88rem;
  transition: all 0.3s ease;
}

.ring-wrapper {
  position: relative;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-bg {
  fill: none;
  stroke: #F6DFA9;
  stroke-width: 3.2;
}

.ring-stroke {
  fill: none;
  stroke: #E58A0B;
  stroke-width: 3.2;
  stroke-linecap: round;
  transition: stroke-dasharray 0.35s ease, stroke 0.3s ease;
}

.ring-icon {
  position: absolute;
  color: #E58A0B;
}

.countdown-text {
  line-height: 1.35;
}

.time-number {
  font-family: 'Nunito', monospace;
  font-size: 0.95rem;
  letter-spacing: 0.5px;
}

.resend-badge {
  color: #9A6A2E;
  white-space: nowrap;
}

.text-can-resend {
  color: #2F7BF5;
}

/* Khi còn dưới 1 phút: chuyển sang cảnh báo đỏ */
.countdown-bar--urgent {
  background-color: #FDF2F2;
  border-color: #F8B4B4;
  color: #D93F3F;
}

.countdown-bar--urgent .ring-bg {
  stroke: #FBD5D5;
}

.countdown-bar--urgent .ring-stroke,
.countdown-bar--urgent .ring-icon {
  stroke: #D93F3F;
  color: #D93F3F;
}

.countdown-bar--urgent .time-number {
  color: #D93F3F;
}

/* Khi đã hết hạn */
.countdown-bar--expired {
  background-color: #FEF2F2;
  border-color: #FCA5A5;
  color: #B91C1C;
}

.countdown-bar--expired .ring-stroke {
  stroke: #B91C1C;
}

.text-expired {
  color: #B91C1C;
}

@media (max-width: 440px) {
  .countdown-bar {
    padding: 8px 12px;
    font-size: 0.8rem;
    gap: 8px;
  }
}
</style>
