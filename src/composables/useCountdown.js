import { ref, computed, onMounted, onBeforeUnmount } from "vue";

/**
 * Composable quản lý đồng hồ đếm ngược 10 phút (OTP validity) và 60s (Resend Cooldown)
 * @param {number} totalSeconds Thời hạn mã OTP (mặc định 600s = 10 phút)
 * @param {number} resendSeconds Thời gian chờ gửi lại mã (mặc định 60s)
 */
export function useCountdown(totalSeconds = 600, resendSeconds = 60) {
  const timeLeft = ref(totalSeconds);
  const resendIn = ref(resendSeconds);
  let timer = null;

  const isExpired = computed(() => timeLeft.value <= 0);
  const canResend = computed(() => resendIn.value <= 0);
  const isUrgent = computed(() => timeLeft.value > 0 && timeLeft.value <= 60);

  // Định dạng thời gian MM:SS
  const formattedTime = computed(() => {
    const mins = Math.floor(Math.max(0, timeLeft.value) / 60);
    const secs = Math.max(0, timeLeft.value) % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  });

  // Tỷ lệ phần trăm còn lại (100 -> 0)
  const progressPercent = computed(() => {
    return Math.max(0, Math.min(100, (timeLeft.value / totalSeconds) * 100));
  });

  function start() {
    stop();
    timer = window.setInterval(() => {
      if (timeLeft.value > 0) {
        timeLeft.value -= 1;
      }
      if (resendIn.value > 0) {
        resendIn.value -= 1;
      }
    }, 1000);
  }

  function stop() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function triggerResend() {
    resendIn.value = resendSeconds;
    timeLeft.value = totalSeconds;
    start();
  }

  function reset() {
    timeLeft.value = totalSeconds;
    resendIn.value = resendSeconds;
    start();
  }

  onMounted(() => {
    start();
  });

  onBeforeUnmount(() => {
    stop();
  });

  return {
    timeLeft,
    resendIn,
    isExpired,
    canResend,
    isUrgent,
    formattedTime,
    progressPercent,
    start,
    stop,
    triggerResend,
    reset,
  };
}
