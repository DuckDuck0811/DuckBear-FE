<template>
  <div class="streak-answer-input">
    <!-- Non-MCQ fallback -->
    <template v-if="!isMCQ">
      <QuestionItem
        :question="question"
        :model-value="modelValue"
        :disabled="disabled"
        @answered="(v) => emit('update:modelValue', v)"
      />
      <div class="confirm-row mt-4">
        <v-btn
          color="orange-darken-2"
          size="large"
          rounded="pill"
          class="font-weight-black"
          :disabled="disabled"
          @click="emit('confirm')"
        >
          Xác Nhận 🔥
        </v-btn>
      </div>
    </template>

    <!-- MCQ: 2-column grid with keyboard shortcuts -->
    <template v-else>
      <div class="options-grid">
        <button
          v-for="(option, idx) in options"
          :key="option.id"
          class="option-btn"
          :class="{
            'option--selected': isSelected(option.id),
            'option--correct': feedback === 'correct' && isSelected(option.id),
            'option--wrong': feedback === 'wrong' && isSelected(option.id),
            'option--disabled': disabled,
          }"
          :disabled="disabled"
          @click="chooseOption(option.id)"
        >
          <span class="option-key-badge">{{ getLetter(idx) }}</span>
          <span class="option-text">{{ option.content }}</span>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import QuestionItem from '../../QuestionItem.vue'

const props = defineProps({
  question: { type: Object, required: true },
  modelValue: { type: [Object, Number, String], default: () => ({}) },
  disabled: { type: Boolean, default: false },
  feedback: { type: String, default: null },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const isMCQ = computed(() =>
  props.question?.type === 'MCQ' || props.question?.type === 'MULTI_MCQ'
)
const options = computed(() => props.question?.options || [])

function isSelected(optionId) {
  if (props.modelValue && typeof props.modelValue === 'object') {
    if (props.question?.type === 'MULTI_MCQ') {
      return Array.isArray(props.modelValue.selectedOptionIds) &&
        props.modelValue.selectedOptionIds.includes(optionId)
    }
    return props.modelValue.selectedOptionId === optionId
  }
  return props.modelValue === optionId
}

function getLetter(idx) {
  return String.fromCharCode(65 + idx)
}

function chooseOption(optionId) {
  if (props.disabled) return
  const payload = { selectedOptionId: optionId, selectedOptionIds: [optionId] }
  emit('update:modelValue', payload)
  emit('confirm')
}
</script>

<style scoped>
.streak-answer-input {
  width: 100%;
}

.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  width: 100%;
}

.option-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #ffffff;
  border: 3px solid #cbd5e1;
  border-radius: 18px;
  padding: 18px 20px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-align: left;
  color: #0f172a;
  font-size: 1.25rem;
  font-weight: 800;
  min-height: 72px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}

.option-btn:hover:not(.option--disabled) {
  background: #fff7ed;
  border-color: #f97316;
  transform: scale(1.02);
  box-shadow: 0 10px 24px rgba(249, 115, 22, 0.2);
}

.option-btn:disabled,
.option--disabled {
  cursor: default;
  opacity: 0.75;
}

.option--selected {
  background: #ffedd5 !important;
  border-color: #ea580c !important;
  box-shadow: 0 0 20px rgba(234, 88, 12, 0.35) !important;
}

.option--correct {
  background: #ecfdf5 !important;
  border-color: #10b981 !important;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.5) !important;
}

.option--wrong {
  background: #fef2f2 !important;
  border-color: #ef4444 !important;
  animation: optionShake 0.4s ease;
}

.option-key-badge {
  min-width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #ffedd5;
  color: #c2410c;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 900;
  flex-shrink: 0;
}

.option-text {
  flex: 1;
  line-height: 1.4;
}

.confirm-row {
  display: flex;
  justify-content: center;
}

@keyframes optionShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}

@media (max-width: 375px) {
  .options-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .option-btn {
    padding: 14px 12px;
    min-height: 60px;
    font-size: 0.95rem;
  }
}
</style>
