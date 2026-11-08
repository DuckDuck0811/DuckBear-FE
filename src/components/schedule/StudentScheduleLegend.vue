<template>
  <div class="student-schedule-legend" role="group" :aria-label="t('schedule.statusLegend')">
    <span><v-icon icon="mdi-check-circle" color="success" size="15" aria-hidden="true" />{{ t('schedule.submitted') }}</span>
    <span><v-icon icon="mdi-alert-circle" color="error" size="15" aria-hidden="true" />{{ t('schedule.overdue') }}</span>
    <span><v-icon icon="mdi-progress-clock" color="warning" size="15" aria-hidden="true" />{{ t('schedule.inProgress') }}</span>
    <span><v-icon icon="mdi-clock-outline" color="primary" size="15" aria-hidden="true" />{{ t('schedule.upcoming') }}</span>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<style scoped>
.student-schedule-legend { display: flex; flex-wrap: wrap; gap: 8px 16px; padding: 8px 0 12px; color: rgb(var(--v-theme-on-surface)); font-size: 13px; }
.student-schedule-legend span { display: inline-flex; align-items: center; gap: 5px; }
</style>
