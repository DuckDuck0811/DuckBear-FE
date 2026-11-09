<template>
  <div
    v-if="classes.length"
    class="student-class-filter"
    role="group"
    :aria-label="t('schedule.filterByClass')"
  >
    <span class="class-filter-label">{{ t("schedule.filterByClass") }}</span>
    <v-btn
      :variant="selectedClassId === null ? 'flat' : 'outlined'"
      :color="selectedClassId === null ? 'primary' : undefined"
      size="small"
      :aria-pressed="selectedClassId === null"
      @click="emit('update:selected-class-id', null)"
      >{{ t("schedule.allClasses") }}</v-btn
    >
    <v-btn
      v-for="schoolClass in classes"
      :key="schoolClass.id"
      :variant="isSelected(schoolClass) ? 'flat' : 'outlined'"
      :color="isSelected(schoolClass) ? 'primary' : undefined"
      size="small"
      :aria-pressed="isSelected(schoolClass)"
      @click="
        emit(
          'update:selected-class-id',
          isSelected(schoolClass) ? null : schoolClass.id,
        )
      "
      >{{ schoolClass.name }}</v-btn
    >
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";

const props = defineProps({
  classes: { type: Array, default: () => [] },
  selectedClassId: { type: [Number, String], default: null },
});
const emit = defineEmits(["update:selected-class-id"]);
const { t } = useI18n();
function isSelected(schoolClass) {
  return (
    props.selectedClassId !== null &&
    Number(props.selectedClassId) === Number(schoolClass.id)
  );
}
</script>

<style scoped>
.student-class-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.class-filter-label {
  margin-right: 4px;
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: 13px;
  font-weight: 700;
}
.student-class-filter :deep(.v-btn:focus-visible) {
  outline: 3px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
</style>
