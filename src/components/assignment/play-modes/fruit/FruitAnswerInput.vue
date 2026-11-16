<template>
  <div class="fruit-answer-input">
    <div class="hanging-fruits-container">
      <div
        v-for="(option, idx) in options"
        :key="option.id"
        class="fruit-hanging-item"
        :class="{
          'fruit--selected': isSelected(option.id),
          'fruit--harvested': isSelected(option.id) && feedback === 'correct',
          'fruit--shake': isSelected(option.id) && feedback === 'wrong',
        }"
        @click="chooseFruit(option.id)"
      >
        <div class="fruit-stem"></div>
        <div class="fruit-apple-body">
          <span class="fruit-letter">{{ getOptionLetter(idx) }}</span>
          <span class="fruit-apple-emoji">🍎</span>
        </div>
        <div class="fruit-option-card">
          <span class="fruit-option-text">{{ option.content }}</span>
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
  feedback: { type: String, default: null }, // 'correct' | 'wrong' | null
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

function chooseFruit(optionId) {
  if (props.disabled) return;
  const payload = { selectedOptionId: optionId, selectedOptionIds: [optionId] };
  emit("update:modelValue", payload);
  emit("confirm", { optionId, payload });
}
</script>

<style scoped>
.hanging-fruits-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  width: 100%;
}

@media (max-width: 540px) {
  .hanging-fruits-container {
    grid-template-columns: 1fr;
  }
}

.fruit-hanging-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
}

.fruit-hanging-item:hover:not(.fruit--disabled) {
  transform: translateY(-4px) scale(1.03);
}

.fruit-stem {
  width: 4px;
  height: 16px;
  background: #78350f;
  border-radius: 2px;
}

.fruit-apple-body {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fruit-apple-emoji {
  font-size: 52px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
}

.fruit-letter {
  position: absolute;
  font-size: 1.1rem;
  font-weight: 900;
  color: #ffffff;
  z-index: 2;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
}

.fruit-option-card {
  margin-top: 8px;
  background: #ffffff;
  border: 2px solid #fed7aa;
  border-radius: 14px;
  padding: 10px 14px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  width: 100%;
}

.fruit-option-text {
  font-size: 1.1rem;
  font-weight: 800;
  color: #1e293b;
}

.fruit--selected .fruit-option-card {
  border-color: #ef4444;
  background: #fef2f2;
}

.fruit--harvested {
  animation: dropIntoBasket 0.8s ease forwards;
}

.fruit--shake {
  animation: fruitShake 0.4s ease;
}

@keyframes fruitShake {
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(-12deg); }
  75% { transform: rotate(12deg); }
}

@keyframes dropIntoBasket {
  0% { transform: translateY(0); opacity: 1; }
  50% { transform: translateY(30px) scale(0.9); opacity: 0.8; }
  100% { transform: translateY(60px) scale(0.4); opacity: 0; }
}
</style>
