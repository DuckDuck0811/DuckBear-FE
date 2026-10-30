<template>
  <v-dialog
    :model-value="modelValue"
    max-width="460"
    persistent
    transition="dialog-bottom-transition"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card class="pa-6 rounded-xl confirm-dialog-card">
      <div class="d-flex align-center mb-4">
        <div class="alert-icon-box mr-3 d-flex align-center justify-center">
          <v-icon icon="mdi-alert-circle-outline" color="error" size="28" />
        </div>
        <div>
          <h3 class="dialog-title text-h6 font-weight-black text-error">
            {{ title }}
          </h3>
          <span class="text-caption text-secondary">Cảnh báo thao tác</span>
        </div>
      </div>

      <div class="dialog-msg py-2 text-body-1">
        {{ message }}
      </div>

      <div class="d-flex justify-end ga-3 pt-5 border-t mt-4">
        <v-btn
          variant="text"
          rounded="pill"
          class="font-weight-bold px-4"
          :disabled="loading"
          @click="handleClose"
        >
          Hủy bỏ
        </v-btn>
        <v-btn
          color="error"
          variant="flat"
          rounded="pill"
          class="font-weight-bold px-6"
          :loading="loading"
          @click="handleConfirm"
        >
          Xác nhận xóa
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "Xác nhận xóa",
  },
  message: {
    type: String,
    default:
      "Bạn có chắc chắn muốn xóa mục này không? Thao tác này không thể hoàn tác.",
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "confirm", "cancel"]);

function handleClose() {
  emit("update:modelValue", false);
  emit("cancel");
}

function handleConfirm() {
  emit("confirm");
}
</script>

<style scoped>
.confirm-dialog-card {
  border-radius: 24px !important;
  border: 1px solid #fecdca !important;
  box-shadow: 0 12px 32px rgba(240, 68, 56, 0.15) !important;
}

.alert-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: #fef3f2;
  border: 1px solid #fecdca;
}

.dialog-title {
  line-height: 1.2;
}

.dialog-msg {
  color: #475467;
  line-height: 1.6;
}
</style>
