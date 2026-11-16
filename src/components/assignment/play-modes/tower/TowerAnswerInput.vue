<template>
  <div class="tower-answer-input">
    <div class="stairs-container">
      <button
        v-for="(option, idx) in options"
        :key="option.id"
        type="button"
        class="stair-step-btn"
        :class="{
          'stair-step--selected': isSelected(option.id),
          'stair-step--correct': isSelected(option.id) && feedback === 'correct',
          'stair-step--wrong': isSelected(option.id) && feedback === 'wrong',
          'stair-step--disabled': disabled,
        }"
        :disabled="disabled"
        @click="chooseStep(option.id)"
      >
        <!-- Huy hiệu ký tự A, B, C, D -->
        <span class="stair-letter-badge">
          {{ getOptionLetter(idx) }}
        </span>

        <!-- Nội dung đáp án -->
        <span class="stair-text">
          {{ option.content }}
        </span>

        <!-- Icon chỉ báo trạng thái sau khi nhảy -->
        <span v-if="isSelected(option.id) && feedback === 'correct'" class="stair-feedback-icon text-success">
          ⭐
        </span>
        <span v-else-if="isSelected(option.id) && feedback === 'wrong'" class="stair-feedback-icon text-error">
          💨
        </span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted } from "vue";

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
  return String.fromCharCode(65 + idx); // A, B, C, D...
}

function chooseStep(optionId) {
  if (props.disabled) return;

  let newPayload;
  if (props.question.type === "MULTI_MCQ") {
    const current = Array.isArray(props.modelValue?.selectedOptionIds)
      ? [...props.modelValue.selectedOptionIds]
      : [];
    const foundIdx = current.indexOf(optionId);
    if (foundIdx > -1) {
      current.splice(foundIdx, 1);
    } else {
      current.push(optionId);
    }
    newPayload = { selectedOptionIds: current, selectedOptionId: current[0] ?? null };
  } else {
    newPayload = { selectedOptionId: optionId, selectedOptionIds: [optionId] };
  }

  emit("update:modelValue", newPayload);
  emit("confirm", { optionId, payload: newPayload });
}

// Hỗ trợ phím tắt A-D hoặc 1-4
function handleKeyDown(e) {
  if (props.disabled) return;
  const key = e.key.toUpperCase();
  let idx = -1;
  if (["1", "2", "3", "4", "5"].includes(key)) {
    idx = parseInt(key, 10) - 1;
  } else if (["A", "B", "C", "D", "E"].includes(key)) {
    idx = key.charCodeAt(0) - 65;
  }

  if (idx >= 0 && idx < options.value.length) {
    chooseStep(options.value[idx].id);
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeyDown);
});
</script>

<style scoped>
.stairs-container {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
}

.stair-step-btn {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 16px 22px;
  border-radius: 20px;
  background: #ffffff;
  border: 3px solid #cbd5e1;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.08);
  font-family: inherit;
  cursor: pointer;
  outline: none;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-align: left;
}

.stair-step-btn:hover:not(:disabled) {
  border-color: #f59e0b;
  transform: translateX(8px) scale(1.02);
  box-shadow: 0 12px 24px rgba(245, 158, 11, 0.25);
  background: #fffbeb;
}

.stair-step-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.stair-letter-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f1f5f9;
  font-size: 1.25rem;
  font-weight: 900;
  color: #475569;
  margin-right: 16px;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.stair-text {
  flex: 1;
  font-size: 1.3rem;
  font-weight: 800;
  color: #1e293b;
  line-height: 1.4;
}

.stair-feedback-icon {
  font-size: 1.5rem;
  margin-left: 12px;
}

/* Trạng thái được chọn */
.stair-step--selected {
  border-color: #f59e0b;
  background: #fef3c7;
}
.stair-step--selected .stair-letter-badge {
  background: #f59e0b;
  color: #ffffff;
}

/* Nhảy đúng bậc: Bừng sáng xanh ngọc */
.stair-step--correct {
  border-color: #10b981 !important;
  background: #dcfce7 !important;
  box-shadow: 0 0 24px rgba(16, 185, 129, 0.5) !important;
  animation: correctBounce 0.5s ease;
}
.stair-step--correct .stair-letter-badge {
  background: #10b981 !important;
  color: #ffffff !important;
}

/* Nhảy sai bậc: Rung nhẹ */
.stair-step--wrong {
  border-color: #ef4444 !important;
  background: #fee2e2 !important;
  animation: wrongShake 0.4s ease;
}
.stair-step--wrong .stair-letter-badge {
  background: #ef4444 !important;
  color: #ffffff !important;
}

.stair-step--disabled {
  cursor: default;
  opacity: 0.9;
}

@keyframes correctBounce {
  0% { transform: scale(1); }
  50% { transform: scale(1.06); }
  100% { transform: scale(1); }
}

@keyframes wrongShake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-8px); }
  40%, 80% { transform: translateX(8px); }
}

@media (max-width: 480px) {
  .stair-step-btn {
    padding: 12px 16px;
    border-radius: 16px;
  }
  .stair-text {
    font-size: 1.15rem;
  }
  .stair-letter-badge {
    width: 34px;
    height: 34px;
    font-size: 1.1rem;
    margin-right: 12px;
  }
}
</style>
