<template>
  <aside class="student-upcoming-panel" :aria-label="t('schedule.upcomingAssignmentsTitle')">
    <h2>{{ t('schedule.upcomingAssignmentsTitle') }}</h2>
    <section v-for="group in groups" :key="group.key" class="upcoming-group">
      <h3 :class="`upcoming-group-title upcoming-group-title--${group.key}`">
        <v-icon :icon="group.icon" size="16" aria-hidden="true" />
        <span>{{ t(group.label) }}</span>
        <v-chip size="x-small" :color="group.color" variant="tonal">{{ items[group.key]?.length || 0 }}</v-chip>
      </h3>
      <div v-if="items[group.key]?.length" class="upcoming-group-items">
        <StudentScheduleEvent v-for="event in items[group.key]" :key="event.id" :event="event" @open="emit('open-event', $event)" />
      </div>
      <p v-else class="upcoming-empty">{{ t('schedule.noUpcomingInGroup') }}</p>
    </section>
  </aside>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import StudentScheduleEvent from './StudentScheduleEvent.vue'

defineProps({ items: { type: Object, default: () => ({ overdue: [], today: [], nextThreeDays: [] }) } })
const emit = defineEmits(['open-event'])
const { t } = useI18n()
const groups = [
  { key: 'overdue', label: 'schedule.overdue', icon: 'mdi-alert-circle', color: 'error' },
  { key: 'today', label: 'schedule.today', icon: 'mdi-calendar-today', color: 'primary' },
  { key: 'nextThreeDays', label: 'schedule.nextThreeDays', icon: 'mdi-clock-fast', color: 'warning' },
]
</script>

<style scoped>
.student-upcoming-panel { min-width: 0; padding: 14px; border: 1px solid rgba(var(--v-theme-primary), .18); border-radius: 14px; background: rgb(var(--v-theme-surface)); }
.student-upcoming-panel h2 { margin: 0 0 10px; color: rgb(var(--v-theme-on-surface)); font-size: 15px; font-weight: 850; }
.upcoming-group { padding: 9px 0; border-top: 1px solid rgba(var(--v-theme-on-surface), .1); }
.upcoming-group-title { display: flex; align-items: center; gap: 6px; margin: 0 0 7px; color: rgb(var(--v-theme-on-surface)); font-size: 13px; font-weight: 750; }
.upcoming-group-title .v-chip { margin-left: auto; }
.upcoming-group-title--overdue > .v-icon { color: rgb(var(--v-theme-error)); }
.upcoming-group-title--today > .v-icon { color: rgb(var(--v-theme-primary)); }
.upcoming-group-title--nextThreeDays > .v-icon { color: rgb(var(--v-theme-warning)); }
.upcoming-group-items { display: grid; gap: 6px; }
.upcoming-empty { margin: 0 0 0 22px; color: rgba(var(--v-theme-on-surface), .55); font-size: 12px; }
</style>
