<template>
  <div class="fruit-grid" role="listbox" :aria-label="'Chọn cành quả'">
    <button
      v-for="(option, idx) in options"
      :key="option.id"
      type="button"
      class="fruit-card"
      role="option"
      :aria-selected="isSelected(option.id)"
      :class="{
        'fruit--selected': isSelected(option.id),
        'fruit--correct': feedback === 'correct' && isSelected(option.id),
        'fruit--wrong': feedback === 'wrong' && isSelected(option.id),
        'fruit--disabled': disabled,
      }"
      :disabled="disabled"
      @click="onPick(option.id)"
    >
      <div class="fruit-stem"></div>
      <div class="fruit-head">
        <span class="fruit-emoji">🍎</span>
        <span class="fruit-letter">{{ letters[idx] }}</span>
      </div>
      <div class="fruit-text">{{ option.content }}</div>
    </button>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  question: { type: Object, required: true },
  modelValue: { type: Object, default: () => ({}) },
  disabled: { type: Boolean, default: false },
  feedback: { type: String, default: null },
  selectedId: { type: Number, default: null },
});

const emit = defineEmits(["select"]);

const letters = ["A", "B", "C", "D", "E"];
const options = computed(() => props.question?.options || []);

function isSelected(optionId) {
  if (props.selectedId !== null) return props.selectedId === optionId;
  if (props.modelValue && typeof props.modelValue === "object") {
    if (props.question.type === "MULTI_MCQ") {
      return (
        Array.isArray(props.modelValue.selectedOptionIds) &&
        props.modelValue.selectedOptionIds.includes(optionId)
      );
    }
    return props.modelValue.selectedOptionId === optionId;
  }
  return false;
}

function onPick(optionId) {
  if (props.disabled) return;
  emit("select", optionId);
}
</script>

<style scoped>
.fruit-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  width: 100%;
}

@media (max-width: 520px) {
  .fruit-grid {
    grid-template-columns: 1fr;
  }
}

.fruit-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #ffffff;
  border: 3px solid #cbd5e1;
  border-radius: 18px;
  padding: 10px 14px 14px;
  position: relative;
  cursor: pointer;
  text-align: center;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  outline: none;
}

.fruit-stem {
  width: 4px;
  height: 12px;
  background: #92400e;
  border-radius: 2px;
  margin-top: -12px;
  margin-bottom: 2px;
}

.fruit-head {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 6px;
}

.fruit-emoji {
  font-size: 2.2rem;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15));
  transition: transform 0.2s ease;
}

.fruit-letter {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -40%);
  color: #ffffff;
  font-weight: 900;
  font-size: 0.95rem;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
  pointer-events: none;
}

.fruit-text {
  font-size: 1.15rem;
  font-weight: 800;
  color: #1e293b;
  line-height: 1.35;
}

.fruit-card:hover:not(:disabled) {
  transform: translateY(-4px) scale(1.02);
  border-color: #f59e0b;
  box-shadow: 0 10px 20px rgba(245, 158, 11, 0.2);
}

.fruit-card:hover:not(:disabled) .fruit-emoji {
  transform: scale(1.1) rotate(5deg);
}

.fruit--selected {
  border-color: #f59e0b !important;
  background: #fef3c7 !important;
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.3) !important;
  transform: translateY(-4px) scale(1.02) !important;
}

.fruit--correct {
  border-color: #10b981 !important;
  background: #dcfce7 !important;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.5) !important;
  animation: fruitHarvest 0.5s ease forwards;
}

.fruit--wrong {
  border-color: #ef4444 !important;
  background: #fee2e2 !important;
  animation: fruitShake 0.4s ease;
}

@keyframes fruitHarvest {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

@keyframes fruitShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px) rotate(-3deg); }
  75% { transform: translateX(6px) rotate(3deg); }
}

@media (prefers-reduced-motion: reduce) {
  .fruit-card,
  .fruit-emoji,
  .fruit--correct,
  .fruit--wrong {
    animation: none !important;
    transform: none !important;
    transition: none !important;
  }
}
</style>
