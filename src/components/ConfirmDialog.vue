<script setup>
import ConfirmDialogCommon from './common/ConfirmDialog.vue'
</script>

<template>
  <ConfirmDialogCommon
    v-bind="$attrs"
    @confirm="$emit('confirm')"
    @cancel="$emit('cancel')"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>
