<template>
  <div class="boss-answer-input">
    <!-- Non-MCQ fallback -->
    <template v-if="!isMCQ">
      <QuestionItem
        :question="question"
        :model-value="modelValue"
        :disabled="disabled"
        @answered="(v) => emit('update:modelValue', v)"
      />
      <div class="attack-row mt-4">
        <v-btn
          color="red-darken-2"
          size="large"
          rounded="pill"
          class="font-weight-black attack-btn"
          :disabled="disabled"
          @click="emit('confirm')"
        >
          TẤN CÔNG! ⚔️
        </v-btn>
      </div>
    </template>

    <!-- MCQ: Magic card options -->
    <template v-else>
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

const cardEmblems = ['⚔️', '🛡️', '🔮', '✨', '🗡️', '🏹']

const isMCQ = computed(() =>
  props.question?.type === 'MCQ' || props.question?.type === 'MULTI_MCQ'
)
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
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 14px;
  width: 100%;
}

.magic-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: linear-gradient(145deg, #2d1b69, #4c1d95);
  border: 2.5px solid rgba(167,139,250,0.4);
  border-radius: 20px;
  padding: 20px 14px 16px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
  user-select: none;
}

.magic-card:hover:not(.card--disabled) {
  transform: translateY(-6px) scale(1.04);
  border-color: rgba(167,139,250,0.9);
  box-shadow: 0 8px 30px rgba(139,92,246,0.5);
}

.card--disabled {
  cursor: default;
  opacity: 0.75;
}

.card--selected {
  border-color: #a78bfa !important;
  box-shadow: 0 0 24px rgba(167,139,250,0.7), inset 0 0 20px rgba(167,139,250,0.1) !important;
  background: linear-gradient(145deg, #3730a3, #6d28d9) !important;
}

.card--correct {
  border-color: #22c55e !important;
  box-shadow: 0 0 24px rgba(34,197,94,0.6) !important;
  background: linear-gradient(145deg, #14532d, #15803d) !important;
}

.card--wrong {
  border-color: #ef4444 !important;
  box-shadow: 0 0 20px rgba(239,68,68,0.5) !important;
  animation: cardShake 0.4s ease;
}

.card-emblem {
  font-size: 2rem;
  line-height: 1;
}

.card-letter {
  font-size: 0.75rem;
  font-weight: 900;
  color: #c4b5fd;
  letter-spacing: 1px;
  background: rgba(255,255,255,0.1);
  border-radius: 6px;
  padding: 2px 10px;
}

.card-text {
  font-size: 0.95rem;
  font-weight: 800;
  color: #ede9fe;
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
