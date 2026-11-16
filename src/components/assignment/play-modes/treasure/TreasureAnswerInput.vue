<template>
  <div class="treasure-answer-input">
    <div class="dig-sites-grid">
      <button
        v-for="(option, idx) in options"
        :key="option.id"
        type="button"
        class="dig-site-card"
        :class="{
          'site--selected': isSelected(option.id),
          'site--gem': isSelected(option.id) && feedback === 'correct',
          'site--dust': isSelected(option.id) && feedback === 'wrong',
        }"
        :disabled="disabled"
        @click="digAtSite(option.id)"
      >
        <div class="site-header">
          <span class="site-marker">📍 ĐIỂM {{ getOptionLetter(idx) }}</span>
          <span class="site-shovel">⛏️</span>
        </div>
        <div class="site-text">
          {{ option.content }}
        </div>
      </button>
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

function digAtSite(optionId) {
  if (props.disabled) return;
  const payload = { selectedOptionId: optionId, selectedOptionIds: [optionId] };
  emit("update:modelValue", payload);
  emit("confirm", { optionId, payload });
}
</script>

<style scoped>
.dig-sites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 16px;
  width: 100%;
}

.dig-site-card {
  background: #fef3c7;
  border: 3px solid #d97706;
  border-radius: 18px;
  padding: 16px 20px;
  cursor: pointer;
  outline: none;
  text-align: left;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 6px 16px rgba(180, 83, 9, 0.15);
}

.dig-site-card:hover:not(:disabled) {
  transform: translateY(-4px) scale(1.02);
  border-color: #b45309;
  box-shadow: 0 10px 24px rgba(180, 83, 9, 0.3);
}

.site-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  border-bottom: 1.5px dashed #f59e0b;
  padding-bottom: 6px;
}

.site-marker {
  font-size: 0.9rem;
  font-weight: 900;
  color: #92400e;
}

.site-text {
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1.4;
  color: #78350f;
}

.site--selected {
  border-color: #b45309 !important;
  background: #fde68a !important;
}

.site--gem {
  border-color: #10b981 !important;
  background: #ecfdf5 !important;
  box-shadow: 0 0 24px rgba(16, 185, 129, 0.6) !important;
}

.site--dust {
  border-color: #ef4444 !important;
  background: #fee2e2 !important;
}
</style>
