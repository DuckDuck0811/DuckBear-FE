<template>
  <v-layout class="schedule-page min-vh-100">
    <AppHeader />
    <TeacherSidebar />
    <StudentSidebar />

    <v-main>
      <v-container class="schedule-container py-6 px-4 px-md-8">
        <header class="schedule-hero mb-6">
          <div class="schedule-hero-icon">
            <v-icon icon="mdi-calendar-month-outline" size="28" />
          </div>
          <div class="schedule-hero-copy">
            <div class="schedule-eyebrow">{{ t('schedule.eyebrow') }}</div>
            <h1>{{ t('schedule.title') }}</h1>
            <p>{{ t(isStudent ? 'schedule.studentSubtitle' : 'schedule.teacherSubtitle') }}</p>
          </div>
        </header>

        <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-5">
          {{ errorMessage }}
        </v-alert>

        <v-card class="week-toolbar rounded-xl pa-4 mb-5" elevation="0">
          <div class="week-toolbar-main">
            <div class="week-date-heading">
              <span class="week-date-label">{{ monthTitle }}</span>
            </div>
            <div class="week-controls">
              <v-btn
                icon="mdi-chevron-left"
                variant="outlined"
                color="primary"
                size="small"
                :aria-label="t('schedule.previousMonth')"
                @click="monthOffset--"
              />
              <v-btn
                variant="tonal"
                color="primary"
                size="small"
                class="text-none font-weight-bold"
                :disabled="monthOffset === 0"
                @click="goToCurrentMonth"
              >
                {{ t('schedule.currentMonth') }}
              </v-btn>
              <v-btn
                icon="mdi-chevron-right"
                variant="outlined"
                color="primary"
                size="small"
                :aria-label="t('schedule.nextMonth')"
                @click="monthOffset++"
              />
            </div>
          </div>

          <div class="schedule-stats">
            <div class="schedule-stat">
              <v-icon icon="mdi-calendar-check-outline" color="primary" size="19" />
              <span><strong>{{ monthEvents.length }}</strong> {{ t('schedule.deadlinesMonth') }}</span>
            </div>
            <div class="schedule-stat">
              <v-icon icon="mdi-progress-clock" color="warning" size="19" />
              <span><strong>{{ pendingCount }}</strong> {{ t('schedule.pending') }}</span>
            </div>
          </div>
        </v-card>

        <v-progress-linear v-if="loading" indeterminate color="primary" rounded class="mb-5" />

        <section v-if="!loading && !errorMessage" class="schedule-calendar">
          <div class="month-calendar">
            <div class="month-weekdays" role="row">
              <div v-for="weekday in weekdayNames" :key="weekday" class="month-weekday" role="columnheader">
                {{ weekday }}
              </div>
            </div>
            <div class="month-grid" role="grid" :aria-label="monthTitle">
              <template v-for="day in calendarDays" :key="day.key">
                <button
                  type="button"
                  role="gridcell"
                  class="month-day-cell"
                  :class="{
                    'month-day-outside': !day.isCurrentMonth,
                    'month-day-today': day.isToday,
                    'month-day-selected': selectedDayKey === day.key,
                    'month-day-has-events': day.events.length,
                  }"
                  :aria-label="`${day.longDate}${day.events.length ? `, ${day.events.length}` : ''}`"
                  :aria-selected="selectedDayKey === day.key"
                  @click="selectCalendarDay(day)"
                >
                  <span class="month-day-number">{{ day.dayNumber }}</span>
                  <span v-if="day.isToday" class="month-day-today-mark">{{ t('schedule.today') }}</span>
                  <span class="month-day-event-list">
                    <span
                      v-for="event in day.events.slice(0, 2)"
                      :key="event.id"
                      class="month-event-pill"
                      :class="`month-event-${event.status}`"
                      :title="`${formatTime(event.deadline)} · ${event.title}`"
                    >
                      <span class="month-event-time">{{ formatTime(event.deadline) }}</span>
                      <span class="month-event-title">{{ event.title }}</span>
                    </span>
                    <span v-if="day.events.length > 2" class="month-event-more">
                      +{{ day.events.length - 2 }} {{ t('schedule.moreEvents') }}
                    </span>
                  </span>
                  <span v-if="day.events.length" class="month-day-mobile-count">
                    {{ day.events.length }}
                  </span>
                </button>
              </template>
            </div>
          </div>

          <div class="selected-day-agenda">
            <header class="agenda-heading">
              <div>
                <div class="agenda-eyebrow">{{ selectedDay?.weekday }}</div>
                <h2>{{ selectedDay?.longDate }}</h2>
              </div>
              <v-chip v-if="selectedDay?.isToday" color="primary" variant="tonal" size="small" class="font-weight-bold">
                {{ t('schedule.today') }}
              </v-chip>
            </header>

            <div v-if="selectedDayEvents.length" class="agenda-events">
              <article
                v-for="event in selectedDayEvents"
                :key="event.id"
                class="agenda-event"
                :class="`agenda-event-${event.status}`"
              >
                <div class="agenda-event-time">
                  <v-icon icon="mdi-clock-outline" size="17" />
                  <span>{{ formatTime(event.deadline) }}</span>
                </div>
                <div class="agenda-event-main">
                  <div class="agenda-event-title" :title="event.title">{{ event.title }}</div>
                  <div class="agenda-event-context">
                    <span v-if="event.class?.name"><v-icon icon="mdi-account-group-outline" size="14" />{{ event.class.name }}</span>
                    <span v-if="event.lesson?.title"><v-icon icon="mdi-book-open-page-variant-outline" size="14" />{{ event.lesson.title }}</span>
                    <span v-if="isStudent && event.createdBy?.fullName"><v-icon icon="mdi-account-outline" size="14" />{{ event.createdBy.fullName }}</span>
                  </div>
                </div>
                <div class="agenda-event-actions">
                  <v-chip size="small" variant="tonal" :color="statusColor(event.status)" class="font-weight-bold">
                    {{ t(`schedule.${event.status}`) }}
                  </v-chip>
                  <v-btn
                    v-if="isStudent"
                    color="primary"
                    variant="tonal"
                    size="small"
                    rounded="pill"
                    class="text-none font-weight-bold"
                    @click="router.push(`/assignments/${event.id}/do`)"
                  >
                    {{ t('schedule.openAssignment') }}
                    <v-icon end icon="mdi-arrow-right" size="16" />
                  </v-btn>
                  <v-btn
                    v-else
                    color="primary"
                    variant="text"
                    size="small"
                    rounded="pill"
                    class="text-none font-weight-bold"
                    @click="router.push('/assignments')"
                  >
                    {{ t('schedule.manageAssignments') }}
                    <v-icon end icon="mdi-arrow-right" size="16" />
                  </v-btn>
                </div>
              </article>
            </div>

            <div v-else class="agenda-empty">
              <v-icon icon="mdi-coffee-outline" size="24" />
              <div>
                <strong>{{ t('schedule.noDayEvents') }}</strong>
                <span>{{ t('schedule.noEvents') }}</span>
              </div>
            </div>
          </div>
        </section>
      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import AppHeader from '../../components/shared/AppHeader.vue'
import TeacherSidebar from '../../components/shared/TeacherSidebar.vue'
import StudentSidebar from '../../components/shared/StudentSidebar.vue'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../services/api'

const { t, locale } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const isStudent = computed(() => authStore.user?.role === 'STUDENT')
const assignments = ref([])
const loading = ref(true)
const errorMessage = ref('')
const monthOffset = ref(0)
const selectedDayKey = ref('')
const preserveSelectedOnMonthChange = ref(false)

function startOfDay(date) {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

function getMonday(date) {
  const result = startOfDay(date)
  const day = result.getDay()
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1))
  return result
}

const monthDate = computed(() => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + monthOffset.value, 1)
})

const monthTitle = computed(() => new Intl.DateTimeFormat(
  locale.value === 'vi' ? 'vi-VN' : 'en-US',
  { month: 'long', year: 'numeric' },
).format(monthDate.value))

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getEventStatus(assignment, deadline) {
  if (isStudent.value) {
    const attempts = assignment.myAttempts || []
    if (attempts.some(attempt => attempt.submittedAt)) return 'submitted'
    if (attempts.some(attempt => attempt.startedAt && !attempt.submittedAt)) return 'inProgress'
  }
  return deadline < new Date() ? 'overdue' : 'upcoming'
}

const allEvents = computed(() => assignments.value
    .filter(assignment => assignment.deadline)
    .map(assignment => {
      const deadline = new Date(assignment.deadline)
      return {
        ...assignment,
        deadlineDate: deadline,
        status: getEventStatus(assignment, deadline),
      }
    })
    .filter(assignment => !Number.isNaN(assignment.deadlineDate.getTime()))
    .sort((a, b) => a.deadlineDate - b.deadlineDate))

const monthEvents = computed(() => allEvents.value.filter(event => (
  event.deadlineDate.getFullYear() === monthDate.value.getFullYear()
  && event.deadlineDate.getMonth() === monthDate.value.getMonth()
)))

const pendingCount = computed(() => monthEvents.value.filter(event => (
  isStudent.value ? event.status !== 'submitted' : event.status !== 'overdue'
)).length)

const weekdayNames = computed(() => {
  const dateLocale = locale.value === 'vi' ? 'vi-VN' : 'en-US'
  const formatter = new Intl.DateTimeFormat(dateLocale, { weekday: 'short' })
  return Array.from({ length: 7 }, (_, index) => formatter.format(new Date(2024, 0, index + 1)))
})

const calendarDays = computed(() => {
  const today = dateKey(new Date())
  const dateLocale = locale.value === 'vi' ? 'vi-VN' : 'en-US'
  const weekdayFormatter = new Intl.DateTimeFormat(dateLocale, { weekday: 'long' })
  const longDateFormatter = new Intl.DateTimeFormat(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })
  const firstOfMonth = new Date(monthDate.value)
  const gridStart = getMonday(firstOfMonth)
  const lastOfMonth = new Date(monthDate.value.getFullYear(), monthDate.value.getMonth() + 1, 0)
  const gridEnd = getMonday(lastOfMonth)
  gridEnd.setDate(gridEnd.getDate() + 6)

  const dates = []
  for (const date = new Date(gridStart); date <= gridEnd; date.setDate(date.getDate() + 1)) {
    const key = dateKey(date)
    dates.push({
      key,
      date: new Date(date),
      weekday: weekdayFormatter.format(date),
      dayNumber: date.getDate(),
      longDate: longDateFormatter.format(date),
      isToday: key === today,
      isCurrentMonth: date.getMonth() === monthDate.value.getMonth(),
      events: allEvents.value
        .filter(event => dateKey(event.deadlineDate) === key)
        .map(event => ({ ...event, deadline: event.deadlineDate })),
    })
  }
  return dates
})

const selectedDay = computed(() => calendarDays.value.find(day => day.key === selectedDayKey.value) || calendarDays.value[0])
const selectedDayEvents = computed(() => selectedDay.value?.events || [])

watch([monthOffset, monthEvents], () => {
  if (preserveSelectedOnMonthChange.value && calendarDays.value.some(day => day.key === selectedDayKey.value)) {
    preserveSelectedOnMonthChange.value = false
    return
  }

  const todayKey = dateKey(new Date())
  const todayInMonth = calendarDays.value.find(day => day.key === todayKey)
  if (monthOffset.value === 0 && todayInMonth?.events.length) {
    selectedDayKey.value = todayKey
    return
  }

  const todayStart = startOfDay(new Date())
  const nearestEvent = monthEvents.value.find(event => event.deadlineDate >= todayStart) || monthEvents.value[0]
  selectedDayKey.value = nearestEvent
    ? dateKey(nearestEvent.deadlineDate)
    : (todayInMonth?.key || dateKey(monthDate.value))
}, { immediate: true })

function selectCalendarDay(day) {
  selectedDayKey.value = day.key
  if (day.isCurrentMonth) return

  const monthDifference = (day.date.getFullYear() - monthDate.value.getFullYear()) * 12
    + day.date.getMonth() - monthDate.value.getMonth()
  preserveSelectedOnMonthChange.value = true
  monthOffset.value += monthDifference
}

function goToCurrentMonth() {
  monthOffset.value = 0
  selectedDayKey.value = dateKey(new Date())
}

function formatTime(date) {
  return date.toLocaleTimeString(locale.value === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' })
}

function statusColor(status) {
  return { submitted: 'success', inProgress: 'primary', overdue: 'error', upcoming: 'warning' }[status]
}

async function loadAssignments() {
  loading.value = true
  errorMessage.value = ''
  try {
    const result = await api('/assignments/mine')
    assignments.value = Array.isArray(result) ? result : []
  } catch (error) {
    errorMessage.value = error?.message || t('schedule.loadError')
  } finally {
    loading.value = false
  }
}

onMounted(loadAssignments)
</script>

<style scoped>
.schedule-page {
  background: #f4f8ff;
}

.schedule-container {
  max-width: 1120px;
}

.schedule-hero {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 24px 28px;
  border: 1px solid #dce9fb;
  border-radius: 24px;
  background: linear-gradient(120deg, #fff 0%, #edf5ff 100%);
}

.schedule-hero-icon {
  display: grid;
  width: 58px;
  height: 58px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid #d8e7ff;
  border-radius: 18px;
  background: #fff;
  color: #2f7cf6;
  box-shadow: 0 8px 20px rgba(47, 124, 246, 0.1);
}

.schedule-eyebrow {
  color: #2f7cf6;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.11em;
}

.schedule-hero h1 {
  margin: 3px 0;
  color: #172b4d;
  font-size: clamp(1.45rem, 3vw, 2rem);
  font-weight: 900;
}

.schedule-hero p {
  margin: 0;
  color: #667085;
  font-size: 0.95rem;
}

.week-toolbar {
  border: 1px solid #e1eaf7;
  background: #fff;
}

.week-toolbar-main,
.schedule-stats,
.week-controls {
  display: flex;
  align-items: center;
}

.week-toolbar-main {
  justify-content: space-between;
  gap: 16px;
}

.week-date-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
}

.week-date-label {
  color: #172b4d;
  font-size: 1.1rem;
  font-weight: 800;
}

.week-date-year {
  color: #8492a6;
  font-size: 0.9rem;
  font-weight: 700;
}

.week-controls {
  gap: 8px;
}

.schedule-stats {
  flex-wrap: wrap;
  gap: 22px;
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid #edf2fa;
}

.schedule-stat {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #667085;
  font-size: 0.88rem;
}

.schedule-stat strong {
  color: #172b4d;
}

.schedule-empty {
  border: 1px dashed #cbdcf4;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.78);
}

.schedule-empty h2 {
  color: #172b4d;
  font-size: 1.2rem;
  font-weight: 800;
}

.schedule-empty p {
  margin: 6px 0 0;
  color: #667085;
}

.schedule-calendar {
  display: grid;
  gap: 16px;
}

.month-calendar {
  overflow: hidden;
  border: 1px solid #dfe8f5;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(38, 78, 130, 0.06);
}

.month-weekdays,
.month-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.month-weekdays {
  background: #f4f8ff;
}

.month-weekday {
  padding: 13px 8px;
  border-bottom: 1px solid #e7eef8;
  color: #667b98;
  font-size: 0.75rem;
  font-weight: 800;
  text-align: center;
  text-transform: uppercase;
}

.month-day-cell {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 126px;
  flex-direction: column;
  align-items: stretch;
  gap: 5px;
  padding: 9px 8px;
  border: 0;
  border-right: 1px solid #edf1f7;
  border-bottom: 1px solid #edf1f7;
  background: #fff;
  color: #172b4d;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease, box-shadow 0.15s ease;
}

.month-day-cell:nth-child(7n) {
  border-right: 0;
}

.month-day-cell:hover {
  z-index: 1;
  background: #f5f9ff;
  box-shadow: inset 0 0 0 2px #b8d3ff;
}

.month-day-outside {
  background: #fafbfd;
  color: #a6b1c1;
}

.month-day-number {
  display: grid;
  width: 28px;
  height: 28px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  color: #344054;
  font-size: 0.86rem;
  font-weight: 750;
}

.month-day-outside .month-day-number {
  color: #a6b1c1;
}

.month-day-today .month-day-number {
  background: #eaf2ff;
  color: #2167d8;
}

.month-day-selected {
  z-index: 1;
  background: #f1f6ff;
  box-shadow: inset 0 0 0 2px #2f7cf6;
}

.month-day-selected .month-day-number {
  background: #2f7cf6;
  color: #fff;
}

.month-day-today-mark {
  position: absolute;
  top: 14px;
  right: 8px;
  color: #2f7cf6;
  font-size: 0.63rem;
  font-weight: 800;
}

.month-day-event-list {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.month-event-pill {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  padding: 3px 5px;
  border-radius: 6px;
  background: #fff5df;
  color: #875b00;
  font-size: 0.68rem;
  line-height: 1.35;
}

.month-event-submitted { background: #e9f9f1; color: #087443; }
.month-event-inProgress { background: #eaf2ff; color: #175cd3; }
.month-event-overdue { background: #ffefed; color: #b42318; }

.month-event-time {
  flex: 0 0 auto;
  font-weight: 800;
}

.month-event-title {
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.month-event-more {
  padding-left: 5px;
  color: #667085;
  font-size: 0.65rem;
  font-weight: 700;
}

.month-day-mobile-count {
  display: none;
}

.selected-day-agenda {
  min-height: 210px;
  padding: 22px;
  border: 1px solid #e1eaf7;
  border-radius: 20px;
  background: #fff;
}

.agenda-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid #edf2fa;
}

.agenda-eyebrow {
  color: #2f7cf6;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: capitalize;
}

.agenda-heading h2 {
  margin: 2px 0 0;
  color: #172b4d;
  font-size: 1.2rem;
  font-weight: 900;
}

.agenda-events {
  display: grid;
  gap: 10px;
}

.agenda-event {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr) auto;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border: 1px solid #e3ebf7;
  border-left: 4px solid #ffb020;
  border-radius: 15px;
  background: #fbfdff;
}

.agenda-event-submitted { border-left-color: #2bc48a; }
.agenda-event-inProgress { border-left-color: #2f7cf6; }
.agenda-event-overdue { border-left-color: #f04438; }
.agenda-event-upcoming { border-left-color: #ffb020; }

.agenda-event-time {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #475467;
  font-size: 0.9rem;
  font-weight: 800;
  white-space: nowrap;
}

.agenda-event-main {
  min-width: 0;
}

.agenda-event-title {
  overflow: hidden;
  color: #172b4d;
  font-size: 1rem;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.agenda-event-context {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 5px;
  color: #7b8798;
  font-size: 0.78rem;
}

.agenda-event-context span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.agenda-event-context span :deep(.v-icon) {
  flex: 0 0 auto;
}

.agenda-event-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}

.agenda-empty {
  display: flex;
  min-height: 112px;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border: 1px dashed #d8e4f3;
  border-radius: 15px;
  background: #f9fbff;
  color: #98a2b3;
}

.agenda-empty > :deep(.v-icon) {
  color: #91a9c7;
}

.agenda-empty div {
  display: grid;
  gap: 2px;
}

.agenda-empty strong {
  color: #475467;
  font-size: 0.92rem;
}

.agenda-empty span {
  font-size: 0.8rem;
}

@media (max-width: 760px) {
  .schedule-hero {
    align-items: flex-start;
    padding: 20px;
  }

  .month-day-cell {
    min-height: 108px;
    padding: 7px 6px;
  }

  .month-event-pill {
    font-size: 0.62rem;
  }

  .month-event-time {
    display: none;
  }

  .agenda-event {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .selected-day-agenda {
    padding: 17px;
  }

  .agenda-event-actions {
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .week-toolbar-main {
    align-items: flex-start;
    flex-direction: column;
  }

  .week-controls {
    width: 100%;
    justify-content: space-between;
  }

  .schedule-hero-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
  }

  .schedule-hero p {
    font-size: 0.84rem;
  }

  .month-calendar {
    border-radius: 14px;
  }

  .month-weekday {
    padding: 9px 1px;
    font-size: 0.59rem;
  }

  .month-day-cell {
    min-height: 68px;
    padding: 4px;
  }

  .month-day-number {
    width: 24px;
    height: 24px;
    font-size: 0.75rem;
  }

  .month-day-today-mark,
  .month-day-event-list {
    display: none;
  }

  .month-day-mobile-count {
    position: absolute;
    right: 4px;
    bottom: 4px;
    display: grid;
    min-width: 17px;
    height: 17px;
    place-items: center;
    padding: 0 4px;
    border-radius: 999px;
    background: #e1efff;
    color: #175cd3;
    font-size: 0.62rem;
    font-weight: 900;
  }

  .month-day-selected .month-day-mobile-count {
    background: #2f7cf6;
    color: #fff;
  }

  .agenda-empty {
    justify-content: flex-start;
    padding: 16px;
  }
}
</style>
