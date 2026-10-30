<script setup>
const props = defineProps({
  modelValue: {
    type: [Number, String, null],
    default: null,
  },
  items: {
    type: Array,
    default: () => [
      { label: 'Tất cả khối lớp', value: null },
      ...Array.from({ length: 12 }, (_, i) => ({
        label: `Lớp ${i + 1}`,
        value: i + 1,
      })),
    ],
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

function handleSelect(val) {
  emit('update:modelValue', val)
  emit('change', val)
}
</script>

<template>
  <div class="filter-chips-wrapper">
    <div class="filter-title text-caption font-weight-bold text-secondary text-uppercase mb-2 d-flex align-center">
      <v-icon icon="mdi-filter-variant" size="16" color="primary" class="mr-1" />
      <span>Khối lớp học tập</span>
    </div>

    <v-chip-group
      :model-value="modelValue"
      selected-class="chip-active-shub"
      mandatory
      class="shub-chip-group"
      @update:model-value="handleSelect"
    >
      <v-chip
        v-for="item in items"
        :key="item.value ?? 'all'"
        :value="item.value"
        filter
        rounded="pill"
        variant="flat"
        class="filter-chip-item font-weight-bold px-4"
      >
        {{ item.label }}
      </v-chip>
    </v-chip-group>
  </div>
</template>

<style scoped>
.filter-title {
  letter-spacing: 0.08em;
  color: #667085;
}

:deep(.filter-chip-item) {
  background: #FFFFFF !important;
  color: #475467 !important;
  border: 1px solid #DCE7F7 !important;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  font-size: 0.85rem !important;
}

:deep(.filter-chip-item:hover) {
  border-color: #2F7CF6 !important;
  color: #2F7CF6 !important;
  background: #F4F8FF !important;
}

:deep(.chip-active-shub) {
  background: #2F7CF6 !important;
  color: #FFFFFF !important;
  border-color: #2F7CF6 !important;
  box-shadow: 0 4px 12px rgba(47, 124, 246, 0.28) !important;
}
</style>

