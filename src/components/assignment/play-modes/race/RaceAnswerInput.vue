<template>
  <div class="race-answer-input">
    <div class="racing-lanes-grid">
      <div
        v-for="(option, idx) in options"
        :key="option.id"
        class="race-lane-choice"
        :class="{
          'lane--selected': isSelected(option.id),
          'lane--boost': isSelected(option.id) && feedback === 'correct',
          'lane--slow': isSelected(option.id) && feedback === 'wrong',
        }"
        @click="steerIntoLane(option.id)"
      >
        <div class="lane-header">
          <span class="lane-number">LÀN {{ getOptionLetter(idx) }}</span>
          <span v-if="isSelected(option.id)" class="lane-car">🏎️</span>
        </div>
        <div class="lane-text-content">
          {{ option.content }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  question: { type: Object, required: true },
  modelValue: { type: [Object, Number, String], default: () => ({}) },
  disabled: { type: Boolean, default: false },
  feedback: { type: String, default: null },
});

const emit = defineEmits(["update:modelValue", "confirm"]);

const options = computed(() => props.question?.options || []);

function isSelected(optionId) {
  if (props.modelValue && typeof props.modelValue === "object") {
    if (props.question.type === "MULTI_MCQ") {
      return Array.isArray(props.modelValue.selectedOptionIds) &&
        props.modelValue.selectedOptionIds.includes(optionId);
    }
    return props.modelValue.selectedOptionId === optionId;
  }
  return props.modelValue === optionId;
}

function getOptionLetter(idx) {
  return String.fromCharCode(65 + idx);
}

function steerIntoLane(optionId) {
  if (props.disabled) return;
  const payload = { selectedOptionId: optionId, selectedOptionIds: [optionId] };
  emit("update:modelValue", payload);
  emit("confirm", { optionId, payload });
}
</script>

<style scoped>
.racing-lanes-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  width: 100%;
}

@media (max-width: 540px) {
  .racing-lanes-grid {
    grid-template-columns: 1fr;
  }
}

.race-lane-choice {
  background: #ffffff;
  border: 3px solid #cbd5e1;
  border-radius: 18px;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  color: #0f172a;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.race-lane-choice:hover:not(.lane--disabled) {
  border-color: #f97316;
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 10px 24px rgba(249, 115, 22, 0.25);
  background: #fff7ed;
}

.lane-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  border-bottom: 1.5px dashed #fed7aa;
  padding-bottom: 6px;
}

.lane-number {
  font-size: 0.9rem;
  font-weight: 900;
  color: #c2410c;
  background: #ffedd5;
  padding: 2px 10px;
  border-radius: 6px;
}

.lane-car {
  font-size: 1.6rem;
  animation: carVibrate 0.15s infinite alternate;
}

.lane-text-content {
  font-size: 1.3rem;
  font-weight: 800;
  line-height: 1.4;
  color: #0f172a;
}

.lane--selected {
  border-color: #ea580c !important;
  background: #fff7ed !important;
  box-shadow: 0 0 20px rgba(234, 88, 12, 0.35) !important;
}

.lane--boost {
  border-color: #10b981 !important;
  background: #ecfdf5 !important;
  box-shadow: 0 0 25px rgba(16, 185, 129, 0.5) !important;
}

.lane--slow {
  border-color: #ef4444 !important;
  background: #fef2f2 !important;
}

@keyframes carVibrate {
  0% { transform: translateY(0); }
  100% { transform: translateY(-3px); }
}
</style>
