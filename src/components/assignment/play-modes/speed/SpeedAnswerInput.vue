<template>
  <div class="speed-answer-input" :class="{ 'is-timeout': isTimeout }">
    <!-- Timeout overlay -->
    <div v-if="isTimeout" class="timeout-banner">
      ⏰ Đã Bỏ Qua — Hết Thời Gian!
    </div>

    <!-- 2×2 option grid -->
    <div class="speed-grid">
      <div
        v-for="(option, idx) in displayOptions"
        :key="option.id"
        class="speed-option"
        :class="{
          'opt--selected': isSelected(option.id),
          'opt--correct': isSelected(option.id) && feedback === 'correct',
          'opt--wrong': isSelected(option.id) && feedback === 'wrong',
          'opt--timeout': isTimeout,
          [`opt--color-${idx}`]: true,
        }"
        @click="selectOption(option.id)"
      >
        <span class="opt-shortcut">{{ idx + 1 }}</span>
        <span class="opt-text">{{ option.content }}</span>
        <span v-if="isSelected(option.id) && feedback === 'correct'" class="opt-badge">✅</span>
        <span v-else-if="isSelected(option.id) && feedback === 'wrong'" class="opt-badge">❌</span>
      </div>
    </div>

    <!-- Extra options if more than 4 -->
    <div v-if="extraOptions.length" class="extra-options mt-3">
      <div
        v-for="(option, idx) in extraOptions"
        :key="option.id"
        class="speed-option speed-option--wide"
        :class="{
          'opt--selected': isSelected(option.id),
          'opt--correct': isSelected(option.id) && feedback === 'correct',
          'opt--wrong': isSelected(option.id) && feedback === 'wrong',
          'opt--timeout': isTimeout,
        }"
        @click="selectOption(option.id)"
      >
        <span class="opt-shortcut">{{ idx + 5 }}</span>
        <span class="opt-text">{{ option.content }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount } from "vue";

const props = defineProps({
  question: { type: Object, required: true },
  modelValue: { type: [Object, Number, String], default: () => ({}) },
  disabled: { type: Boolean, default: false },
  feedback: { type: String, default: null },
});

const emit = defineEmits(["update:modelValue", "confirm"]);

const options = computed(() => props.question?.options || []);
const displayOptions = computed(() => options.value.slice(0, 4));
const extraOptions = computed(() => options.value.slice(4));

const isTimeout = computed(() => props.feedback === "timeout");

function isSelected(optionId) {
  if (props.modelValue && typeof props.modelValue === "object") {
    return props.modelValue.selectedOptionId === optionId;
  }
  return props.modelValue === optionId;
}

function selectOption(optionId) {
  if (props.disabled || isTimeout.value) return;
  const payload = { selectedOptionId: optionId, selectedOptionIds: [optionId] };
  emit("update:modelValue", payload);
  emit("confirm", { optionId, payload });
}

// Keyboard shortcuts 1-4 (and beyond)
function handleKeydown(e) {
  if (props.disabled) return;
  const num = parseInt(e.key);
  if (isNaN(num) || num < 1) return;
  const opt = options.value[num - 1];
  if (opt) selectOption(opt.id);
}

onMounted(() => window.addEventListener("keydown", handleKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", handleKeydown));
</script>

<style scoped>
.speed-answer-input {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  position: relative;
}

.timeout-banner {
  width: 100%;
  background: #ef4444;
  color: #fff;
  font-weight: 900;
  font-size: 1rem;
  text-align: center;
  padding: 10px;
  border-radius: 14px;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
  animation: timeoutPulse 0.6s ease infinite alternate;
}

@keyframes timeoutPulse {
  from { opacity: 0.8; }
  to { opacity: 1; }
}

.speed-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
}

.speed-option {
  position: relative;
  border-radius: 20px;
  padding: 18px 14px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-height: 90px;
  justify-content: center;
  font-weight: 800;
  border: 3px solid transparent;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-align: center;
  box-shadow: 0 4px 14px rgba(0,0,0,0.15);
}

.speed-option--wide {
  grid-column: 1 / -1;
  flex-direction: row;
  min-height: 60px;
  gap: 12px;
}

.extra-options {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 10px;
}

/* Per-option color themes */
.opt--color-0 { background: #3b82f6; color: #fff; }
.opt--color-1 { background: #f59e0b; color: #fff; }
.opt--color-2 { background: #10b981; color: #fff; }
.opt--color-3 { background: #8b5cf6; color: #fff; }

.opt--color-0:hover:not(.opt--timeout) { background: #2563eb; transform: scale(1.04); box-shadow: 0 8px 24px rgba(59,130,246,0.45); }
.opt--color-1:hover:not(.opt--timeout) { background: #d97706; transform: scale(1.04); box-shadow: 0 8px 24px rgba(245,158,11,0.45); }
.opt--color-2:hover:not(.opt--timeout) { background: #059669; transform: scale(1.04); box-shadow: 0 8px 24px rgba(16,185,129,0.45); }
.opt--color-3:hover:not(.opt--timeout) { background: #7c3aed; transform: scale(1.04); box-shadow: 0 8px 24px rgba(139,92,246,0.45); }

.opt-shortcut {
  position: absolute;
  top: 8px;
  left: 10px;
  font-size: 0.75rem;
  font-weight: 900;
  opacity: 0.7;
  background: rgba(255,255,255,0.25);
  border-radius: 999px;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.opt-text {
  font-size: 1.1rem;
  font-weight: 800;
  line-height: 1.35;
}

.opt-badge {
  font-size: 1.5rem;
  line-height: 1;
}

.opt--selected {
  border-color: rgba(255,255,255,0.8) !important;
  transform: scale(1.03);
}

.opt--correct {
  background: #16a34a !important;
  border-color: #fff !important;
  box-shadow: 0 0 28px rgba(22,163,74,0.7) !important;
  animation: flashGreen 0.4s ease;
}

.opt--wrong {
  background: #dc2626 !important;
  border-color: #fff !important;
  box-shadow: 0 0 28px rgba(220,38,38,0.7) !important;
  animation: flashRed 0.4s ease;
}

.opt--timeout {
  opacity: 0.55;
  cursor: not-allowed;
  filter: grayscale(0.4);
}

@keyframes flashGreen {
  0% { transform: scale(1); }
  50% { transform: scale(1.08); }
  100% { transform: scale(1.03); }
}

@keyframes flashRed {
  0% { transform: scale(1); }
  25% { transform: scale(1.06) rotate(-1deg); }
  75% { transform: scale(1.06) rotate(1deg); }
  100% { transform: scale(1.03); }
}

@media (max-width: 375px) {
  .speed-option {
    padding: 14px 10px;
    min-height: 76px;
  }
  .opt-text { font-size: 0.95rem; }
}
</style>
