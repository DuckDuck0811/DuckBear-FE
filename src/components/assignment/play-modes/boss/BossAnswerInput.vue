<template>
  <div class="boss-answer-input">
    <div class="magic-cards-grid">
      <div
        v-for="(option, idx) in options"
        :key="option.id"
        class="magic-card"
        :class="{
          'card--selected': isSelected(option.id),
          'card--correct': feedback === 'correct' && isSelected(option.id),
          'card--wrong': feedback === 'wrong' && isSelected(option.id),
          'card--disabled': disabled,
        }"
        @click="chooseCard(option.id)"
      >
        <div class="card-emblem">{{ cardEmblems[idx % cardEmblems.length] }}</div>
        <div class="card-letter">{{ getLetter(idx) }}</div>
        <div class="card-text">{{ option.content }}</div>
        <div class="card-shine" />
      </div>
    </div>

    <div class="attack-row mt-5">
      <v-btn
        color="red-darken-2"
        size="large"
        rounded="pill"
        class="font-weight-black attack-btn"
        :disabled="disabled || !hasSelection"
        @click="emit('confirm')"
      >
        TẤN CÔNG! ⚔️
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  question: { type: Object, required: true },
  modelValue: { type: [Object, Number, String], default: () => ({}) },
  disabled: { type: Boolean, default: false },
  feedback: { type: String, default: null },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const cardEmblems = ['⚔️', '🛡️', '🔮', '✨', '🗡️', '🏹']
const options = computed(() => props.question?.options || [])

const hasSelection = computed(() => {
  if (!props.modelValue || typeof props.modelValue !== 'object') return !!props.modelValue
  return !!(props.modelValue.selectedOptionId || props.modelValue.selectedOptionIds?.length)
})

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

function chooseCard(optionId) {
  if (props.disabled) return
  const payload = { selectedOptionId: optionId, selectedOptionIds: [optionId] }
  emit('update:modelValue', payload)
}
</script>

<style scoped>
.boss-answer-input { width: 100%; }

.magic-cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  width: 100%;
}

@media (max-width: 540px) {
  .magic-cards-grid {
    grid-template-columns: 1fr;
  }
}

.magic-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  background: #ffffff;
  border: 3px solid #cbd5e1;
  border-radius: 20px;
  padding: 20px 16px 18px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
  user-select: none;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
}

.magic-card:hover:not(.card--disabled) {
  transform: translateY(-5px) scale(1.02);
  border-color: #8b5cf6;
  box-shadow: 0 10px 25px rgba(139, 92, 246, 0.25);
  background: #faf5ff;
}

.card--disabled {
  cursor: default;
  opacity: 0.75;
}

.card--selected {
  border-color: #7c3aed !important;
  box-shadow: 0 0 24px rgba(124, 58, 237, 0.4) !important;
  background: #f5f3ff !important;
}

.card--correct {
  border-color: #10b981 !important;
  box-shadow: 0 0 24px rgba(16, 185, 129, 0.45) !important;
  background: #ecfdf5 !important;
}

.card--wrong {
  border-color: #ef4444 !important;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.4) !important;
  background: #fef2f2 !important;
  animation: cardShake 0.4s ease;
}

.card-emblem {
  font-size: 2.2rem;
  line-height: 1;
}

.card-letter {
  font-size: 0.85rem;
  font-weight: 900;
  color: #6b21a8;
  letter-spacing: 1px;
  background: #ede9fe;
  border-radius: 8px;
  padding: 3px 12px;
}

.card-text {
  font-size: 1.3rem;
  font-weight: 900;
  color: #0f172a;
  text-align: center;
  line-height: 1.4;
}

/* Shine effect */
.card-shine {
  position: absolute;
  top: -60%;
  left: -60%;
  width: 50%;
  height: 150%;
  background: linear-gradient(105deg, transparent, rgba(255,255,255,0.08), transparent);
  transform: skewX(-20deg);
  pointer-events: none;
  transition: left 0.5s ease;
}
.magic-card:hover .card-shine {
  left: 130%;
}

.attack-row {
  display: flex;
  justify-content: center;
}

.attack-btn {
  min-width: 200px;
  font-size: 1.1rem;
  letter-spacing: 1px;
}

@keyframes cardShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px) rotate(-3deg); }
  75% { transform: translateX(10px) rotate(3deg); }
}

@media (max-width: 375px) {
  .magic-cards-grid {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .magic-card {
    padding: 14px 10px 12px;
  }
  .card-emblem { font-size: 1.5rem; }
}
</style>
