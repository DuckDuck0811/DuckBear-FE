<template>
  <div class="map-answer-input">
    <!-- Direction card grid -->
    <div class="direction-grid">
      <!-- Up first (top center) -->
      <div class="direction-slot up-slot">
        <div
          v-if="options[0]"
          class="direction-card"
          :class="{
            'dir--selected': isSelected(options[0].id),
            'dir--correct': isSelected(options[0].id) && feedback === 'correct',
            'dir--wrong': isSelected(options[0].id) && feedback === 'wrong',
            'dir--disabled': disabled,
          }"
          @click="selectOption(options[0].id)"
        >
          <span class="dir-arrow">⬆️</span>
          <span class="dir-text">{{ options[0].content }}</span>
        </div>
      </div>

      <!-- Middle row: Left, Confirm, Right -->
      <div class="middle-row">
        <div
          v-if="options[1]"
          class="direction-card"
          :class="{
            'dir--selected': isSelected(options[1].id),
            'dir--correct': isSelected(options[1].id) && feedback === 'correct',
            'dir--wrong': isSelected(options[1].id) && feedback === 'wrong',
            'dir--disabled': disabled,
          }"
          @click="selectOption(options[1].id)"
        >
          <span class="dir-arrow">⬅️</span>
          <span class="dir-text">{{ options[1].content }}</span>
        </div>

        <!-- Compass center -->
        <div class="compass-center">🧭</div>

        <div
          v-if="options[2]"
          class="direction-card"
          :class="{
            'dir--selected': isSelected(options[2].id),
            'dir--correct': isSelected(options[2].id) && feedback === 'correct',
            'dir--wrong': isSelected(options[2].id) && feedback === 'wrong',
            'dir--disabled': disabled,
          }"
          @click="selectOption(options[2].id)"
        >
          <span class="dir-arrow">➡️</span>
          <span class="dir-text">{{ options[2].content }}</span>
        </div>
      </div>

      <!-- Down last (bottom center) -->
      <div class="direction-slot down-slot">
        <div
          v-if="options[3]"
          class="direction-card"
          :class="{
            'dir--selected': isSelected(options[3].id),
            'dir--correct': isSelected(options[3].id) && feedback === 'correct',
            'dir--wrong': isSelected(options[3].id) && feedback === 'wrong',
            'dir--disabled': disabled,
          }"
          @click="selectOption(options[3].id)"
        >
          <span class="dir-arrow">⬇️</span>
          <span class="dir-text">{{ options[3].content }}</span>
        </div>
      </div>
    </div>

    <!-- Extra options beyond 4 shown as normal cards -->
    <div v-if="options.length > 4" class="extra-options mt-3">
      <div
        v-for="(opt, idx) in options.slice(4)"
        :key="opt.id"
        class="direction-card direction-card--wide"
        :class="{
          'dir--selected': isSelected(opt.id),
          'dir--correct': isSelected(opt.id) && feedback === 'correct',
          'dir--wrong': isSelected(opt.id) && feedback === 'wrong',
          'dir--disabled': disabled,
        }"
        @click="selectOption(opt.id)"
      >
        <span class="dir-text">{{ opt.content }}</span>
      </div>
    </div>

    <!-- Confirm button -->
    <div class="confirm-area mt-4">
      <v-btn
        color="green-darken-3"
        size="large"
        rounded="pill"
        :disabled="disabled || !hasSelection"
        class="font-weight-black px-8 elevation-4"
        @click="onConfirm"
      >
        🗺️ Chọn Hướng Đi
      </v-btn>
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

const hasSelection = computed(() => {
  if (!props.modelValue || typeof props.modelValue !== "object") return false;
  return !!props.modelValue.selectedOptionId;
});

function isSelected(optionId) {
  if (props.modelValue && typeof props.modelValue === "object") {
    return props.modelValue.selectedOptionId === optionId;
  }
  return props.modelValue === optionId;
}

function selectOption(optionId) {
  if (props.disabled) return;
  const payload = { selectedOptionId: optionId, selectedOptionIds: [optionId] };
  emit("update:modelValue", payload);
}

function onConfirm() {
  if (props.disabled || !hasSelection.value) return;
  emit("confirm");
}
</script>

<style scoped>
.map-answer-input {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.direction-grid {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 480px;
}

.direction-slot {
  display: flex;
  justify-content: center;
  width: 100%;
}

.middle-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  justify-content: center;
}

.compass-center {
  font-size: 2.4rem;
  flex-shrink: 0;
  animation: compassSpin 8s linear infinite;
}

@keyframes compassSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.direction-card {
  background: #fff;
  border: 3px solid #6b9e6b;
  border-radius: 16px;
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 110px;
  max-width: 160px;
  transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-align: center;
  box-shadow: 0 3px 8px rgba(0,0,0,0.12);
}

.direction-card:hover:not(.dir--disabled) {
  transform: scale(1.07);
  border-color: #2e7d32;
  box-shadow: 0 6px 18px rgba(46,125,50,0.35);
}

.direction-card--wide {
  flex-direction: row;
  min-width: 100%;
  max-width: 100%;
  margin-bottom: 8px;
}

.extra-options {
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.dir-arrow {
  font-size: 1.8rem;
  line-height: 1;
}

.dir-text {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1b5e20;
  line-height: 1.3;
}

.dir--selected {
  background: #e8f5e9 !important;
  border-color: #2e7d32 !important;
  box-shadow: 0 0 0 3px rgba(46,125,50,0.3), 0 6px 18px rgba(46,125,50,0.25) !important;
}

.dir--correct {
  background: #c8e6c9 !important;
  border-color: #1b5e20 !important;
  box-shadow: 0 0 20px rgba(27,94,32,0.5) !important;
}

.dir--wrong {
  background: #ffcdd2 !important;
  border-color: #c62828 !important;
  box-shadow: 0 0 20px rgba(198,40,40,0.4) !important;
}

.dir--disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.confirm-area {
  display: flex;
  justify-content: center;
}

@media (max-width: 375px) {
  .direction-card {
    min-width: 90px;
    padding: 10px 10px;
  }
  .dir-text { font-size: 0.82rem; }
  .dir-arrow { font-size: 1.5rem; }
}
</style>
