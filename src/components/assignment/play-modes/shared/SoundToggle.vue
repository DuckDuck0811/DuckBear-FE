<template>
  <button
    type="button"
    class="sound-toggle-btn"
    :class="{ 'sound--muted': !modelValue }"
    :title="modelValue ? 'Tắt âm thanh' : 'Bật âm thanh'"
    :aria-label="modelValue ? 'Tắt âm thanh' : 'Bật âm thanh'"
    @click="$emit('toggle')"
  >
    <span class="sound-icon">{{ modelValue ? '🔊' : '🔇' }}</span>
  </button>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, default: true },
});

defineEmits(['toggle']);
</script>

<style scoped>
.sound-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.6);
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(8px);
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  user-select: none;
}

.sound-toggle-btn:hover {
  transform: scale(1.1);
  background: rgba(15, 23, 42, 0.7);
  border-color: #ffffff;
}

.sound-toggle-btn:active {
  transform: scale(0.95);
}

.sound--muted {
  opacity: 0.65;
  border-color: rgba(239, 68, 68, 0.6);
}

.sound-icon {
  font-size: 1.15rem;
  line-height: 1;
}
</style>
