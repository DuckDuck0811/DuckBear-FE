<template>
  <div
    class="otp-input-container"
    role="group"
    aria-label="Nhập mã xác thực OTP 6 số"
  >
    <div
      v-for="(digit, index) in digits"
      :key="index"
      class="otp-cell-wrapper"
    >
      <input
        :ref="(el) => (inputRefs[index] = el)"
        v-model="digits[index]"
        type="text"
        inputmode="numeric"
        pattern="[0-9]*"
        maxlength="1"
        :autocomplete="index === 0 ? 'one-time-code' : 'off'"
        class="otp-cell"
        :class="{
          'otp-cell--filled': !!digits[index],
          'otp-cell--disabled': disabled,
        }"
        :disabled="disabled"
        :aria-label="`Số thứ ${index + 1}`"
        @input="onInput($event, index)"
        @keydown="onKeydown($event, index)"
        @paste="onPaste($event)"
        @focus="onFocus(index)"
        @blur="onBlur"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "complete", "focus", "blur"]);

const digits = ref(["", "", "", "", "", ""]);
const inputRefs = ref([]);

// Đồng bộ từ modelValue ngoài vào
watch(
  () => props.modelValue,
  (newVal) => {
    const chars = (newVal || "").slice(0, 6).split("");
    for (let i = 0; i < 6; i++) {
      digits.value[i] = chars[i] || "";
    }
  },
  { immediate: true }
);

function updateValue() {
  const code = digits.value.join("");
  emit("update:modelValue", code);
  if (code.length === 6) {
    emit("complete", code);
  }
}

function onInput(event, index) {
  const val = event.target.value;
  // Chỉ nhận ký tự số cuối cùng
  const cleaned = val.replace(/\D/g, "");
  digits.value[index] = cleaned.slice(-1);
  updateValue();

  if (digits.value[index] && index < 5) {
    // Nhảy sang ô tiếp theo
    inputRefs.value[index + 1]?.focus();
    inputRefs.value[index + 1]?.select();
  }
}

function onKeydown(event, index) {
  if (event.key === "Backspace") {
    if (!digits.value[index] && index > 0) {
      // Khi ô hiện tại rỗng mà bấm backspace, lùi về ô trước và xóa
      event.preventDefault();
      digits.value[index - 1] = "";
      updateValue();
      inputRefs.value[index - 1]?.focus();
    } else {
      digits.value[index] = "";
      updateValue();
    }
  } else if (event.key === "ArrowLeft" && index > 0) {
    event.preventDefault();
    inputRefs.value[index - 1]?.focus();
    inputRefs.value[index - 1]?.select();
  } else if (event.key === "ArrowRight" && index < 5) {
    event.preventDefault();
    inputRefs.value[index + 1]?.focus();
    inputRefs.value[index + 1]?.select();
  }
}

function onPaste(event) {
  event.preventDefault();
  const pastedData = (event.clipboardData || window.clipboardData)
    .getData("text")
    .replace(/\D/g, "")
    .slice(0, 6);

  if (!pastedData) return;

  const chars = pastedData.split("");
  for (let i = 0; i < 6; i++) {
    digits.value[i] = chars[i] || "";
  }
  updateValue();

  // Focus ô kế tiếp sau ký tự cuối dán vào hoặc ô cuối cùng
  const targetIdx = Math.min(chars.length, 5);
  inputRefs.value[targetIdx]?.focus();
  inputRefs.value[targetIdx]?.select();
}

function onFocus(index) {
  emit("focus", index);
  inputRefs.value[index]?.select();
}

function onBlur() {
  emit("blur");
}

function clear() {
  digits.value = ["", "", "", "", "", ""];
  updateValue();
  inputRefs.value[0]?.focus();
}

function focusFirst() {
  inputRefs.value[0]?.focus();
}

defineExpose({
  clear,
  focusFirst,
});

onMounted(() => {
  // Tự động focus ô đầu tiên nếu chưa disabled
  if (!props.disabled) {
    focusFirst();
  }
});
</script>

<style scoped>
.otp-input-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.otp-cell-wrapper {
  flex: 1;
  max-width: 68px;
}

.otp-cell {
  width: 100%;
  height: 68px;
  border-radius: 18px;
  border: 2px solid #B9D3E0;
  background-color: #FFFFFF;
  color: #1B5F7B;
  font-family: 'Nunito', -apple-system, sans-serif;
  font-size: 26px;
  font-weight: 800;
  text-align: center;
  outline: none;
  box-sizing: border-box;
  transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
  caret-color: #2F7BF5;
}

/* Hiệu ứng khi hover */
.otp-cell:hover:not(:disabled) {
  border-color: #8EB9CF;
}

/* Ô đang focus: Viền #2F7BF5, glow ring 5px, phóng to 1.07 */
.otp-cell:focus {
  border-color: #2F7BF5 !important;
  box-shadow: 0 0 0 5px rgba(47, 123, 245, 0.18),
              0 4px 12px rgba(47, 123, 245, 0.12);
  transform: scale(1.07);
  z-index: 2;
}

/* Ô đã có ký tự */
.otp-cell--filled {
  border-color: #22708F;
  background-color: #F8FBFE;
}

.otp-cell--disabled {
  background-color: #F1F5F9;
  border-color: #E2E8F0;
  color: #94A3B8;
  cursor: not-allowed;
}

/* Mobile nhỏ (< 400px) */
@media (max-width: 400px) {
  .otp-input-container {
    gap: 6px;
  }
  .otp-cell {
    height: 56px;
    border-radius: 14px;
    font-size: 22px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .otp-cell {
    transition: none !important;
    transform: none !important;
  }
}
</style>
