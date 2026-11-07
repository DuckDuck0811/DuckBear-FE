<template>
  <section class="student-day-list" :aria-label="t(mode === 'week' ? 'schedule.weekCalendar' : 'schedule.monthCalendar')">
    <template v-for="day in displayDays" :key="day.key">
      <section class="student-day-group" :class="{ 'student-day-group--today': day.isToday }">
        <header class="student-day-heading">
          <h2>{{ formatDay(day.date) }}</h2>
          <v-chip v-if="day.isToday" size="x-small" color="primary" variant="tonal">{{ t('schedule.today') }}</v-chip>
          <span class="day-event-count">{{ t('schedule.dayEventCount', { count: day.events.length }) }}</span>
        </header>
        <div v-if="day.events.length" class="student-day-events">
          <StudentScheduleEvent v-for="event in day.events" :key="event.id" :event="event" @open="emit('open-event', $event)" />
        </div>
        <p v-else class="day-no-events">{{ t('schedule.noDayEvents') }}</p>
      </section>
    </template>
    <v-card v-if="!displayDays.length" class="pa-5 text-center text-medium-emphasis" variant="tonal">{{ t('schedule.noEventsInRange') }}</v-card>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import StudentScheduleEvent from './StudentScheduleEvent.vue'

const props = defineProps({ mode: { type: String, required: true }, days: { type: Array, default: () => [] } })
const emit = defineEmits(['open-event'])
const { t, locale } = useI18n()
const displayDays = computed(() => props.days.filter((day) => day.events.length || day.isToday))
function formatDay(date) {
  return new Intl.DateTimeFormat(locale.value === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}
</script>

<style scoped>
.student-day-list { display: grid; gap: 10px; }
.student-day-group { min-width: 0; padding: 12px; border: 1px solid rgba(var(--v-theme-primary), .15); border-radius: 12px; background: rgb(var(--v-theme-surface)); }
.student-day-group--today { border-color: rgba(var(--v-theme-primary), .45); }
.student-day-heading { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-bottom: 8px; }
.student-day-heading h2 { margin: 0 auto 0 0; color: rgb(var(--v-theme-on-surface)); font-size: 14px; font-weight: 800; }
.day-event-count, .day-no-events { color: rgba(var(--v-theme-on-surface), .62); font-size: 12px; }
.day-no-events { margin: 0; }
.student-day-events { display: grid; gap: 6px; }
</style>
