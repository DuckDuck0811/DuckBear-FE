<template>
  <div v-if="total > pageSize" class="list-pagination">
    <v-pagination
      :model-value="modelValue"
      :length="Math.ceil(total / pageSize)"
      :total-visible="5"
      density="comfortable"
      rounded="circle"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: Number, required: true },
  total: { type: Number, required: true },
  pageSize: { type: Number, default: 20 },
})
defineEmits(['update:modelValue'])
</script>

<style scoped>
.list-pagination { display: flex; justify-content: center; padding: 16px 8px; }
</style>
