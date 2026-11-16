<template>
  <div class="tower-staircase" role="listbox" :aria-label="'Bậc thang lựa chọn đáp án'">
    <button
      v-for="(option, idx) in options"
      :key="option.id"
      type="button"
      class="stair-step"
      role="option"
      :aria-selected="isSelected(option.id)"
      :class="{
        'stair--selected': isSelected(option.id),
        'stair--correct': feedback === 'correct' && isSelected(option.id),
        'stair--wrong': feedback === 'wrong' && isSelected(option.id),
        'stair--disabled': disabled,
      }"
      :disabled="disabled"
      @click="onPick(option.id)"
    >
      <!-- Khối bậc đá 3D phía dưới làm trụ -->
      <div class="stone-base-3d"></div>

      <!-- Mặt trước của bậc thang đá -->
      <div class="stair-surface">
        <!-- Huy hiệu bậc A, B, C, D -->
        <div class="stair-tag">
          <span class="stair-gem">💠</span>
          <span class="stair-letter">{{ letters[idx] }}</span>
        </div>

        <!-- Nội dung đáp án chữ to, rõ nét -->
        <span class="stair-content-text">{{ option.content }}</span>

        <!-- Biểu tượng trạng thái sau khi check -->
        <div class="stair-status-mark" v-if="isSelected(option.id) && feedback">
          <span v-if="feedback === 'correct'" class="mark-sparkle">⭐</span>
          <span v-else-if="feedback === 'wrong'" class="mark-dust">💨</span>
        </div>
      </div>
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
.tower-staircase {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
}

.stair-step {
  display: flex;
  flex-direction: column;
  width: 100%;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  position: relative;
  outline: none;
  text-align: left;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Mặt bậc thang chính */
.stair-surface {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px 20px;
  background: #ffffff;
  border: 3px solid #cbd5e1;
  border-radius: 18px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  position: relative;
  z-index: 2;
  transition: all 0.2s ease;
}

/* Khối bóng 3D của bậc đá */
.stone-base-3d {
  position: absolute;
  bottom: -6px;
  left: 0;
  right: 0;
  height: 14px;
  background: #94a3b8;
  border-radius: 18px;
  z-index: 1;
  transition: all 0.2s ease;
}

/* Hover bậc thang: nhấc lên */
.stair-step:hover:not(:disabled) {
  transform: translateY(-4px);
}

.stair-step:hover:not(:disabled) .stair-surface {
  border-color: #38bdf8;
  background: #f0f9ff;
}

.stair-step:hover:not(:disabled) .stone-base-3d {
  background: #0284c7;
  bottom: -9px;
  height: 16px;
}

/* Bậc thang đang được chọn (Highlighted) */
.stair--selected .stair-surface {
  border-color: #f59e0b !important;
  background: #fffbeb !important;
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.25) !important;
}

.stair--selected .stone-base-3d {
  background: #d97706 !important;
  bottom: -8px;
}

.stair--selected .stair-tag {
  background: #f59e0b !important;
  border-color: #d97706 !important;
  color: #ffffff !important;
}

/* Bậc nhảy ĐÚNG: Sáng rực xanh ngọc */
.stair--correct .stair-surface {
  border-color: #10b981 !important;
  background: #ecfdf5 !important;
  box-shadow: 0 0 24px rgba(16, 185, 129, 0.4) !important;
}

.stair--correct .stone-base-3d {
  background: #059669 !important;
}

.stair--correct .stair-tag {
  background: #10b981 !important;
  border-color: #059669 !important;
  color: #ffffff !important;
}

/* Bậc nhảy SAI: Rung lắc nhẹ */
.stair--wrong .stair-surface {
  border-color: #ef4444 !important;
  background: #fef2f2 !important;
  animation: stairShake 0.45s ease;
}

.stair--wrong .stone-base-3d {
  background: #dc2626 !important;
}

@keyframes stairShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}

/* Huy hiệu ký tự bậc A, B, C, D */
.stair-tag {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 44px;
  height: 44px;
  background: #f1f5f9;
  border: 2px solid #cbd5e1;
  border-radius: 14px;
  color: #334155;
  font-weight: 900;
  font-size: 1.15rem;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.stair-gem {
  font-size: 0.95rem;
}

.stair-letter {
  margin-top: -1px;
}

/* Nội dung đáp án */
.stair-content-text {
  flex: 1;
  font-size: 1.25rem;
  font-weight: 800;
  color: #1e293b;
  line-height: 1.45;
}

.stair-status-mark {
  font-size: 1.5rem;
  margin-left: 8px;
}

.stair--disabled {
  opacity: 0.8;
  cursor: default;
}

/* Responsive */
@media (max-width: 480px) {
  .stair-surface {
    padding: 12px 14px;
    gap: 10px;
    border-radius: 14px;
  }
  .stair-content-text {
    font-size: 1.05rem;
  }
  .stair-tag {
    min-width: 38px;
    height: 38px;
    font-size: 1rem;
    border-radius: 10px;
  }
}
</style>
