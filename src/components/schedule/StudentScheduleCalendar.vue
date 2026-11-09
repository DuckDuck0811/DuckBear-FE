<template>
  <section
    class="student-calendar"
    :class="`student-calendar--${mode}`"
    :aria-label="
      t(mode === 'week' ? 'schedule.weekCalendar' : 'schedule.monthCalendar')
    "
  >
    <div class="calendar-weekdays" aria-hidden="true">
      <span v-for="weekday in weekdays" :key="weekday">{{ weekday }}</span>
    </div>
    <div class="calendar-days">
      <section
        v-for="day in days"
        :key="day.key"
        class="calendar-day"
        :class="{
          'calendar-day--week': mode === 'week',
          'calendar-day--outside': !day.isCurrentMonth && mode === 'month',
          'calendar-day--today': day.isToday,
        }"
        :aria-label="dayLabel(day)"
      >
        <header class="calendar-day-header">
          <strong>{{ day.date.getDate() }}</strong>
          <span v-if="day.isToday" class="today-mark">{{
            t("schedule.today")
          }}</span>
        </header>
        <div class="calendar-day-events">
          <StudentScheduleEvent
            v-for="event in day.events"
            :key="event.id"
            :event="event"
            compact
            @open="emit('open-event', $event)"
          />
          <span
            v-if="mode === 'week' && !day.events.length"
            class="calendar-day-empty"
            >{{ t("schedule.noDayEvents") }}</span
          >
        </div>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import StudentScheduleEvent from "./StudentScheduleEvent.vue";

const props = defineProps({
  mode: { type: String, required: true },
  days: { type: Array, default: () => [] },
});
const emit = defineEmits(["open-event"]);
const { t, locale } = useI18n();
const weekdays = computed(() =>
  Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(locale.value === "vi" ? "vi-VN" : "en-US", {
      weekday: "short",
    }).format(new Date(2024, 0, index + 1)),
  ),
);
function dayLabel(day) {
  return new Intl.DateTimeFormat(locale.value === "vi" ? "vi-VN" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(day.date);
}
</script>

<style scoped>
.student-calendar {
  min-width: 0;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-primary), 0.16);
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
}
.calendar-weekdays,
.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}
.calendar-weekdays {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgba(var(--v-theme-primary), 0.035);
}
.calendar-weekdays span {
  padding: 8px 4px;
  color: rgba(var(--v-theme-on-surface), 0.65);
  font-size: 11px;
  font-weight: 700;
  text-align: center;
}
.calendar-day {
  min-width: 0;
  min-height: 104px;
  padding: 7px;
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.1);
}
.calendar-day:nth-child(7n) {
  border-right: 0;
}
.calendar-day--week {
  min-height: 210px;
}
.calendar-day--outside {
  background: rgba(var(--v-theme-on-surface), 0.025);
  color: rgba(var(--v-theme-on-surface), 0.48);
}
.calendar-day--today {
  background: rgba(var(--v-theme-primary), 0.055);
}
.calendar-day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  margin-bottom: 5px;
  color: rgb(var(--v-theme-on-surface));
  font-size: 12px;
}
.today-mark {
  color: rgb(var(--v-theme-primary));
  font-size: 9px;
  font-weight: 800;
}
.calendar-day-events {
  display: grid;
  align-content: start;
  gap: 4px;
}
.calendar-day-empty {
  padding: 3px;
  color: rgba(var(--v-theme-on-surface), 0.4);
  font-size: 10px;
}
@media (max-width: 1150px) {
  .calendar-day {
    padding: 4px;
  }
  .calendar-day--week {
    min-height: 175px;
  }
  .calendar-day-header {
    font-size: 11px;
  }
}
</style>
