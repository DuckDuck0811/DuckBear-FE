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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
  width: 100%;
}

.race-lane-choice {
  background: #1e293b;
  border: 3px solid #475569;
  border-radius: 18px;
  padding: 16px 18px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  color: white;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.race-lane-choice:hover:not(.lane--disabled) {
  border-color: #f97316;
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 8px 20px rgba(249, 115, 22, 0.3);
}

.lane-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.2);
  padding-bottom: 6px;
}

.lane-number {
  font-size: 0.9rem;
  font-weight: 900;
  color: #fdba74;
}

.lane-car {
  font-size: 1.6rem;
  animation: carVibrate 0.15s infinite alternate;
}

.lane-text-content {
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1.4;
  color: #f8fafc;
}

.lane--selected {
  border-color: #f97316 !important;
  background: #334155;
}

.lane--boost {
  border-color: #10b981 !important;
  background: #064e3b !important;
  box-shadow: 0 0 25px rgba(16, 185, 129, 0.6);
}

.lane--slow {
  border-color: #ef4444 !important;
  background: #450a0a !important;
}

@keyframes carVibrate {
  0% { transform: translateY(0); }
  100% { transform: translateY(-3px); }
}
</style>
