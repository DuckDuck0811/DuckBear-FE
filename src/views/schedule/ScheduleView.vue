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
              <span class="week-date-label">{{ t('schedule.weekOf', { start: formatRangeDate(weekStart), end: formatRangeDate(weekEnd) }) }}</span>
              <span class="week-date-year">{{ weekStart.getFullYear() }}</span>
            </div>
            <div class="week-controls">
              <v-btn
                icon="mdi-chevron-left"
                variant="outlined"
                color="primary"
                size="small"
                :aria-label="t('schedule.previousWeek')"
                @click="weekOffset--"
              />
              <v-btn
                variant="tonal"
                color="primary"
                size="small"
                class="text-none font-weight-bold"
                :disabled="weekOffset === 0"
                @click="weekOffset = 0"
              >
                {{ t('schedule.thisWeek') }}
              </v-btn>
              <v-btn
                icon="mdi-chevron-right"
                variant="outlined"
                color="primary"
                size="small"
                :aria-label="t('schedule.nextWeek')"
                @click="weekOffset++"
              />
            </div>
          </div>

          <div class="schedule-stats">
            <div class="schedule-stat">
              <v-icon icon="mdi-calendar-check-outline" color="primary" size="19" />
              <span><strong>{{ weeklyEvents.length }}</strong> {{ t('schedule.deadlines') }}</span>
            </div>
            <div class="schedule-stat">
              <v-icon icon="mdi-progress-clock" color="warning" size="19" />
              <span><strong>{{ pendingCount }}</strong> {{ t('schedule.pending') }}</span>
            </div>
          </div>
        </v-card>

        <v-progress-linear v-if="loading" indeterminate color="primary" rounded class="mb-5" />

        <div v-if="!loading && !weeklyEvents.length && !errorMessage" class="schedule-empty pa-8 text-center">
          <v-avatar color="primary" variant="tonal" size="68" class="mb-4">
            <v-icon icon="mdi-calendar-blank-outline" size="34" />
          </v-avatar>
          <h2>{{ t('schedule.noEvents') }}</h2>
          <p>{{ t(isStudent ? 'schedule.studentSubtitle' : 'schedule.teacherSubtitle') }}</p>
          <v-btn
            color="primary"
            variant="tonal"
            rounded="pill"
            class="mt-2 text-none font-weight-bold"
            @click="router.push('/assignments')"
          >
            {{ t('schedule.manageAssignments') }}
          </v-btn>
        </div>

        <section v-else-if="!loading" class="schedule-calendar">
          <div class="week-day-strip" role="tablist" :aria-label="t('schedule.title')">
            <button
              v-for="day in days"
              :key="day.key"
              type="button"
              role="tab"
              class="week-day-button"
              :class="{
                'week-day-selected': selectedDayKey === day.key,
                'week-day-today': day.isToday,
                'week-day-has-events': day.events.length,
              }"
              :aria-selected="selectedDayKey === day.key"
              @click="selectedDayKey = day.key"
            >
              <span class="week-day-name">{{ day.weekdayShort }}</span>
              <span class="week-day-date">{{ day.dayNumber }}</span>
              <span class="week-day-month">{{ day.monthLabel }}</span>
              <span v-if="day.events.length" class="week-day-event-count">
                {{ day.events.length }}
              </span>
              <span v-else class="week-day-dot-spacer" />
            </button>
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
const weekOffset = ref(0)
const selectedDayKey = ref('')

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

const weekStart = computed(() => {
  const date = new Date()
  date.setDate(date.getDate() + weekOffset.value * 7)
  return getMonday(date)
})

const weekEnd = computed(() => {
  const date = new Date(weekStart.value)
  date.setDate(date.getDate() + 6)
  return date
})

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

const weeklyEvents = computed(() => {
  const start = weekStart.value
  const end = new Date(weekEnd.value)
  end.setDate(end.getDate() + 1)

  return assignments.value
    .filter(assignment => assignment.deadline)
    .map(assignment => {
      const deadline = new Date(assignment.deadline)
      return {
        ...assignment,
        deadlineDate: deadline,
        status: getEventStatus(assignment, deadline),
      }
    })
    .filter(assignment => assignment.deadlineDate >= start && assignment.deadlineDate < end)
    .sort((a, b) => a.deadlineDate - b.deadlineDate)
})

const pendingCount = computed(() => weeklyEvents.value.filter(event => (
  isStudent.value ? event.status !== 'submitted' : event.status !== 'overdue'
)).length)

const days = computed(() => {
  const today = dateKey(new Date())
  const todayStart = startOfDay(new Date())
  const dateLocale = locale.value === 'vi' ? 'vi-VN' : 'en-US'
  const weekdayFormatter = new Intl.DateTimeFormat(dateLocale, { weekday: 'long' })
  const shortWeekdayFormatter = new Intl.DateTimeFormat(dateLocale, { weekday: 'short' })
  const shortMonthFormatter = new Intl.DateTimeFormat(dateLocale, { month: 'short' })
  const longDateFormatter = new Intl.DateTimeFormat(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart.value)
    date.setDate(date.getDate() + index)
    const key = dateKey(date)
    return {
      key,
      weekday: weekdayFormatter.format(date),
      weekdayShort: shortWeekdayFormatter.format(date),
      dayNumber: date.getDate(),
      monthLabel: shortMonthFormatter.format(date),
      longDate: longDateFormatter.format(date),
      isToday: key === today,
      isPast: date < todayStart,
      events: weeklyEvents.value
        .filter(event => dateKey(event.deadlineDate) === key)
        .map(event => ({ ...event, id: event.id, title: event.title, deadline: event.deadlineDate })),
    }
  })
})

const selectedDay = computed(() => days.value.find(day => day.key === selectedDayKey.value) || days.value[0])
const selectedDayEvents = computed(() => selectedDay.value?.events || [])

watch([weekOffset, weeklyEvents], () => {
  const todayKey = dateKey(new Date())
  const todayInWeek = days.value.find(day => day.key === todayKey)
  if (weekOffset.value === 0 && todayInWeek?.events.length) {
    selectedDayKey.value = todayKey
    return
  }

  const todayStart = startOfDay(new Date())
  const nearestEvent = weeklyEvents.value.find(event => event.deadlineDate >= todayStart) || weeklyEvents.value[0]
  selectedDayKey.value = nearestEvent ? dateKey(nearestEvent.deadlineDate) : (todayInWeek?.key || dateKey(weekStart.value))
}, { immediate: true })

function formatRangeDate(date) {
  return date.toLocaleDateString(locale.value === 'vi' ? 'vi-VN' : 'en-US', { day: 'numeric', month: 'short' })
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

.week-day-strip {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10px;
  padding: 14px;
  border: 1px solid #e1eaf7;
  border-radius: 20px;
  background: #fff;
}

.week-day-button {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 112px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: 1px solid transparent;
  border-radius: 15px;
  background: #f8faff;
  color: #667085;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
}

.week-day-button:hover {
  transform: translateY(-2px);
  border-color: #cfe0ff;
  background: #f0f6ff;
}

.week-day-selected {
  border-color: #2f7cf6 !important;
  background: linear-gradient(160deg, #347ef5, #1f5fd0) !important;
  color: #fff !important;
  box-shadow: 0 8px 18px rgba(47, 124, 246, 0.2);
}

.week-day-today:not(.week-day-selected) {
  border-color: #a9caff;
  background: #eff6ff;
}

.week-day-name {
  font-size: 0.76rem;
  font-weight: 700;
  text-transform: capitalize;
}

.week-day-date {
  color: #172b4d;
  font-size: 1.6rem;
  font-weight: 900;
  line-height: 1.1;
}

.week-day-selected .week-day-date {
  color: #fff;
}

.week-day-month {
  font-size: 0.72rem;
  font-weight: 600;
}

.week-day-event-count,
.week-day-dot-spacer {
  display: grid;
  min-width: 18px;
  height: 18px;
  margin-top: 2px;
  place-items: center;
}

.week-day-event-count {
  padding: 0 5px;
  border-radius: 999px;
  background: #dff8ed;
  color: #087443;
  font-size: 0.68rem;
  font-weight: 900;
}

.week-day-selected .week-day-event-count {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.week-day-dot-spacer::after {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #d7e1ef;
  content: '';
}

.week-day-selected .week-day-dot-spacer::after {
  background: rgba(255, 255, 255, 0.75);
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

  .week-day-strip {
    gap: 6px;
    padding: 8px;
  }

  .week-day-button {
    min-height: 96px;
    border-radius: 12px;
  }

  .week-day-name {
    font-size: 0.68rem;
  }

  .week-day-date {
    font-size: 1.3rem;
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

  .week-day-strip {
    gap: 4px;
    padding: 6px;
  }

  .week-day-button {
    min-height: 86px;
    gap: 3px;
  }

  .week-day-name {
    font-size: 0.62rem;
  }

  .week-day-date {
    font-size: 1.15rem;
  }

  .week-day-month {
    font-size: 0.62rem;
  }

  .agenda-empty {
    justify-content: flex-start;
    padding: 16px;
  }
}
</style>
