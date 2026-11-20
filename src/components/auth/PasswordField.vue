<template>
  <div class="password-field-wrapper">
    <v-text-field
      :model-value="modelValue"
      :label="label"
      :placeholder="placeholder"
      :type="showPassword ? 'text' : 'password'"
      autocomplete="new-password"
      variant="outlined"
      rounded="xl"
      density="comfortable"
      :color="isConfirmation && isMatch ? 'success' : 'primary'"
      :prepend-inner-icon="isConfirmation ? 'mdi-lock-check-outline' : 'mdi-lock-outline'"
      :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
      :rules="rules"
      :error-messages="errorMessages"
      :messages="isConfirmation && isMatch ? ['Mật khẩu đã khớp'] : undefined"
      :class="{
        'field--match-success': isConfirmation && isMatch,
      }"
      hide-details="auto"
      class="custom-pwd-field"
      @click:append-inner="showPassword = !showPassword"
      @update:model-value="emit('update:modelValue', $event)"
      @focus="emit('focus')"
      @blur="emit('blur')"
    />
  </div>
</template>

<script setup>
import { ref } from "vue";

defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  label: {
    type: String,
    default: "Mật khẩu",
  },
  placeholder: {
    type: String,
    default: "",
  },
  isConfirmation: {
    type: Boolean,
    default: false,
  },
  isMatch: {
    type: Boolean,
    default: false,
  },
  rules: {
    type: Array,
    default: () => [],
  },
  errorMessages: {
    type: [String, Array],
    default: () => [],
  },
});

const emit = defineEmits(["update:modelValue", "focus", "blur"]);
const showPassword = ref(false);
</script>

<style scoped>
.password-field-wrapper {
  width: 100%;
}

.custom-pwd-field :deep(.v-field) {
  border-radius: 16px !important;
  background-color: #FFFFFF;
  transition: all 0.2s ease;
}

.custom-pwd-field :deep(.v-field:hover) {
  background-color: #FAFCFE;
}

/* Khi mật khẩu nhập lại khớp hoàn hảo */
.field--match-success :deep(.v-field__outline) {
  --v-field-border-opacity: 1 !important;
  color: #2E9E6B !important;
}

.field--match-success :deep(.v-messages__message) {
  color: #2E9E6B !important;
  font-weight: 700;
}
</style>
