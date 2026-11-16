<template>
  <div class="space-answer-input">
    <!-- Non-MCQ fallback -->
    <template v-if="!isMCQ">
      <QuestionItem
        :question="question"
        :model-value="modelValue"
        :disabled="disabled"
        @answered="(v) => emit('update:modelValue', v)"
      />
      <div class="launch-row mt-4">
        <v-btn
          color="cyan"
          size="large"
          rounded="pill"
          class="font-weight-black launch-btn"
          :disabled="disabled"
          @click="emit('confirm')"
        >
          Phóng Tên Lửa 🚀
        </v-btn>
      </div>
    </template>

    <!-- MCQ: planets -->
    <template v-else>
      <div class="planets-grid">
        <div
          v-for="(option, idx) in options"
          :key="option.id"
          class="planet-item"
          :class="{
            'planet--selected': isSelected(option.id),
            'planet--correct': feedback === 'correct' && isSelected(option.id),
            'planet--wrong': feedback === 'wrong' && isSelected(option.id),
            'planet--disabled': disabled,
          }"
          :style="{ '--planet-color': planetColors[idx % planetColors.length] }"
          @click="choosePlanet(option.id)"
        >
          <div class="planet-body">
            <span class="planet-letter">{{ getLetter(idx) }}</span>
            <div class="planet-ring" />
          </div>
          <div class="planet-label">{{ option.content }}</div>
          <div v-if="feedback === 'correct' && isSelected(option.id)" class="star-burst">⭐</div>
        </div>
      </div>

      <div class="launch-row mt-5">
        <v-btn
          color="cyan"
          size="large"
          rounded="pill"
          class="font-weight-black launch-btn"
          :disabled="disabled || !hasSelection"
          @click="emit('confirm')"
        >
          Phóng Tên Lửa 🚀
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

const planetColors = ['#7c3aed', '#2563eb', '#0891b2', '#16a34a', '#d97706', '#dc2626', '#db2777']

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

function choosePlanet(optionId) {
  if (props.disabled) return
  const payload = { selectedOptionId: optionId, selectedOptionIds: [optionId] }
  emit('update:modelValue', payload)
}
</script>

<style scoped>
.space-answer-input {
  width: 100%;
}

.planets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 20px;
  width: 100%;
}

.planet-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  user-select: none;
}

.planet-item:hover:not(.planet--disabled) {
  transform: translateY(-6px) scale(1.07);
}

.planet--disabled {
  cursor: default;
  opacity: 0.75;
}

.planet-body {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--planet-color) 60%, white), var(--planet-color));
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 0 0 3px transparent, 0 6px 20px rgba(0, 0, 0, 0.5);
  transition: box-shadow 0.3s ease;
}

.planet--selected .planet-body {
  box-shadow: 0 0 0 4px #fff, 0 0 24px 8px var(--planet-color), 0 6px 20px rgba(0,0,0,0.5);
}

.planet--correct .planet-body {
  box-shadow: 0 0 0 4px #fbbf24, 0 0 30px 10px #fbbf24, 0 6px 20px rgba(0,0,0,0.5);
}

.planet--wrong .planet-body {
  animation: planetShake 0.4s ease;
  box-shadow: 0 0 0 4px #ef4444, 0 0 20px 6px #ef4444, 0 6px 20px rgba(0,0,0,0.5);
}

.planet-ring {
  position: absolute;
  width: 100px;
  height: 20px;
  border-radius: 50%;
  border: 4px solid color-mix(in srgb, var(--planet-color) 70%, transparent);
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) rotateX(70deg);
  pointer-events: none;
}

.planet-letter {
  font-size: 1.3rem;
  font-weight: 900;
  color: #fff;
  z-index: 2;
  text-shadow: 0 1px 4px rgba(0,0,0,0.6);
}

.planet-label {
  margin-top: 10px;
  background: rgba(255,255,255,0.1);
  border: 1.5px solid rgba(255,255,255,0.3);
  border-radius: 12px;
  padding: 8px 12px;
  text-align: center;
  color: #e2e8f0;
  font-size: 0.95rem;
  font-weight: 700;
  width: 100%;
  backdrop-filter: blur(4px);
}

.planet--selected .planet-label {
  border-color: #fff;
  background: rgba(255,255,255,0.18);
  color: #fff;
}

.star-burst {
  position: absolute;
  top: -14px;
  right: -6px;
  font-size: 1.5rem;
  animation: starPop 0.4s ease;
}

.launch-row {
  display: flex;
  justify-content: center;
}

.launch-btn {
  min-width: 200px;
  letter-spacing: 0.5px;
  font-size: 1rem;
}

@keyframes planetShake {
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
}

@keyframes starPop {
  0% { transform: scale(0) rotate(-30deg); opacity: 0; }
  60% { transform: scale(1.4) rotate(10deg); opacity: 1; }
  100% { transform: scale(1) rotate(0); opacity: 1; }
}

@media (max-width: 375px) {
  .planets-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .planet-body {
    width: 56px;
    height: 56px;
  }
}
</style>
