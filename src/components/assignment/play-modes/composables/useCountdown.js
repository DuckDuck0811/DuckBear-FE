import { computed, onBeforeUnmount, ref } from 'vue';

export function useCountdown() {
  const timeLeft = ref(0);
  const totalSeconds = ref(0);
  const isRunning = ref(false);
  let timerId = null;

  const isWarning = computed(() => timeLeft.value > 0 && timeLeft.value <= 5);
  const progress = computed(() => {
    if (totalSeconds.value <= 0) return 1;
    return timeLeft.value / totalSeconds.value;
  });

  const formattedTime = computed(() => {
    const m = Math.floor(timeLeft.value / 60);
    const s = timeLeft.value % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  });

  function start(seconds, onExpire) {
    stop();
    totalSeconds.value = seconds;
    timeLeft.value = seconds;
    isRunning.value = true;

    timerId = setInterval(() => {
      if (timeLeft.value > 1) {
        timeLeft.value -= 1;
      } else {
        timeLeft.value = 0;
        stop();
        if (typeof onExpire === 'function') {
          onExpire();
        }
      }
    }, 1000);
  }

  function stop() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    isRunning.value = false;
  }

  function reset(seconds) {
    stop();
    totalSeconds.value = seconds;
    timeLeft.value = seconds;
  }

  onBeforeUnmount(() => {
    stop();
  });

  return {
    timeLeft,
    totalSeconds,
    isRunning,
    isWarning,
    progress,
    formattedTime,
    start,
    stop,
    reset,
  };
}
