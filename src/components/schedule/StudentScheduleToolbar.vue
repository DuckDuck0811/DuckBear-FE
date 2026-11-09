<template>
  <header class="student-schedule-toolbar">
    <h1>{{ t("schedule.title") }}</h1>
    <div class="schedule-toolbar-controls">
      <v-btn-toggle
        :model-value="viewMode"
        mandatory
        color="primary"
        density="compact"
        :aria-label="t('schedule.calendarView')"
        @update:model-value="emit('update:view-mode', $event)"
      >
        <v-btn value="week" size="small">{{ t("schedule.weekView") }}</v-btn>
        <v-btn value="month" size="small">{{ t("schedule.monthView") }}</v-btn>
      </v-btn-toggle>
      <div
        class="schedule-range-controls"
        :aria-label="t('schedule.dateNavigation')"
      >
        <v-btn
          icon="mdi-chevron-left"
          variant="text"
          color="primary"
          size="small"
          :aria-label="
            t(
              viewMode === 'week'
                ? 'schedule.previousWeek'
                : 'schedule.previousMonth',
            )
          "
          @click="emit('previous')"
        />
        <strong class="schedule-range-label" aria-live="polite">{{
          rangeLabel
        }}</strong>
        <v-btn
          icon="mdi-chevron-right"
          variant="text"
          color="primary"
          size="small"
          :aria-label="
            t(viewMode === 'week' ? 'schedule.nextWeek' : 'schedule.nextMonth')
          "
          @click="emit('next')"
        />
      </div>
      <v-btn
        variant="tonal"
        color="primary"
        size="small"
        class="today-button"
        @click="emit('today')"
        >{{
          t(
            viewMode === "week"
              ? "schedule.todayButton"
              : "schedule.currentMonth",
          )
        }}</v-btn
      >
    </div>
  </header>
</template>

<script setup>
import { useI18n } from "vue-i18n";

defineProps({
  viewMode: { type: String, required: true },
  rangeLabel: { type: String, required: true },
});
const emit = defineEmits(["update:view-mode", "previous", "next", "today"]);
const { t } = useI18n();
</script>

<style scoped>
.student-schedule-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px 18px;
  margin-bottom: 12px;
}
.student-schedule-toolbar h1 {
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
  font-size: 22px;
  font-weight: 800;
}
.schedule-toolbar-controls,
.schedule-range-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.schedule-range-label {
  min-width: 138px;
  color: rgb(var(--v-theme-on-surface));
  text-align: center;
}
.today-button {
  min-width: 74px;
}
.student-schedule-toolbar :deep(.v-btn:focus-visible) {
  outline: 3px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
@media (max-width: 600px) {
  .student-schedule-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }
  .schedule-toolbar-controls {
    width: 100%;
    flex-wrap: wrap;
    justify-content: space-between;
  }
  .schedule-range-label {
    min-width: 118px;
    font-size: 13px;
  }
}
</style>
