<template>
  <button type="button" class="student-schedule-event" :class="[`student-schedule-event--${event.status || 'upcoming'}`, { 'student-schedule-event--compact': compact }]" :title="event.title" :aria-label="eventAriaLabel" @click="emit('open', event)">
    <span class="event-status-icon" aria-hidden="true"><v-icon :icon="statusIcon" size="15" /></span>
    <span class="event-copy">
      <strong class="event-title">{{ event.title }}</strong>
      <span v-if="!compact" class="event-meta">
        <span v-if="event.class?.name || event.className">{{ event.class?.name || event.className }}</span>
        <span v-if="event.lesson?.title">{{ event.lesson.title }}</span>
        <span>{{ timeLabel }}</span>
      </span>
      <span v-else class="event-meta">{{ timeLabel }}</span>
    </span>
    <v-icon v-if="!compact" icon="mdi-chevron-right" size="17" class="event-open-icon" aria-hidden="true" />
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({ event: { type: Object, required: true }, compact: Boolean })
const emit = defineEmits(['open'])
const { t, locale } = useI18n()
const statusIcon = computed(() => ({ submitted: 'mdi-check-circle', overdue: 'mdi-alert-circle', inProgress: 'mdi-progress-clock', upcoming: 'mdi-clock-outline' }[props.event.status] || 'mdi-clock-outline'))
const timeLabel = computed(() => new Intl.DateTimeFormat(locale.value === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' }).format(props.event.deadlineDate))
const eventAriaLabel = computed(() => t('schedule.studentEventLabel', {
  title: props.event.title,
  status: t(`schedule.${props.event.status || 'upcoming'}`),
  time: timeLabel.value,
}))
</script>

<style scoped>
.student-schedule-event { display: flex; width: 100%; min-width: 0; align-items: flex-start; gap: 7px; padding: 8px 9px; border: 1px solid rgba(var(--v-theme-primary), .18); border-left: 3px solid rgb(var(--v-theme-primary)); border-radius: 9px; background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface)); text-align: left; cursor: pointer; }
.student-schedule-event:hover { border-color: rgba(var(--v-theme-primary), .52); background: rgba(var(--v-theme-primary), .045); }
.student-schedule-event:focus-visible { outline: 3px solid rgb(var(--v-theme-primary)); outline-offset: 2px; }
.student-schedule-event--submitted { border-left-color: rgb(var(--v-theme-success)); }
.student-schedule-event--overdue { border-left-color: rgb(var(--v-theme-error)); }
.student-schedule-event--inProgress { border-left-color: rgb(var(--v-theme-warning)); }
.event-status-icon { flex: 0 0 auto; color: rgb(var(--v-theme-primary)); }
.student-schedule-event--submitted .event-status-icon { color: rgb(var(--v-theme-success)); }
.student-schedule-event--overdue .event-status-icon { color: rgb(var(--v-theme-error)); }
.student-schedule-event--inProgress .event-status-icon { color: rgb(var(--v-theme-warning)); }
.event-copy { display: grid; min-width: 0; flex: 1; gap: 3px; }
.event-title { overflow: hidden; font-size: 13px; line-height: 1.25; text-overflow: ellipsis; }
.event-meta { display: flex; flex-wrap: wrap; gap: 2px 7px; color: rgba(var(--v-theme-on-surface), .68); font-size: 11px; line-height: 1.2; }
.event-open-icon { align-self: center; flex: 0 0 auto; }
.student-schedule-event--compact { align-items: center; gap: 4px; padding: 4px 5px; border-left-width: 2px; border-radius: 6px; }
.student-schedule-event--compact .event-title { font-size: 11px; font-weight: 600; }
.student-schedule-event--compact .event-meta { font-size: 10px; }
@media (prefers-reduced-motion: reduce) { .student-schedule-event { transition: none; } }
</style>
