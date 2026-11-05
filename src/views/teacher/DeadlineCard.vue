<template>
  <div class="deadline-card">
    <div class="deadline-card-main">
      <div class="deadline-card-row">
        <span class="deadline-card-title">{{ item.title }}</span>
        <span class="deadline-badge" :class="mode === 'overdue' ? 'deadline-badge--error' : 'deadline-badge--warn'">
          <v-icon size="11" :icon="mode === 'overdue' ? 'mdi-alert-octagon' : 'mdi-timer-sand'" />
          {{ mode === 'overdue' ? t('overview.overdueTitle') : deadlineLabel }}
        </span>
      </div>
      <span class="deadline-card-meta">{{ item.className }}</span>

      <!-- Thanh tiến độ -->
      <div class="deadline-progress-row">
        <span class="deadline-progress-label">
          {{ t('overview.submittedProgress', { submitted: item.submittedCount, total: item.totalStudents }) }}
        </span>
        <div class="deadline-progress-track">
          <div
            class="deadline-progress-fill"
            :style="{ width: progressPct + '%' }"
            :class="mode === 'overdue' ? 'deadline-progress-fill--error' : 'deadline-progress-fill--warn'"
          />
        </div>
        <span class="deadline-not-submitted">{{ item.notSubmittedCount }} chưa nộp</span>
      </div>
    </div>

    <div class="deadline-card-actions">
      <v-tooltip :text="remindDisabledReason" :disabled="canRemind" location="top">
        <template #activator="{ props: tooltipProps }">
          <v-btn
            v-bind="tooltipProps"
            size="small"
            :color="canRemind ? 'primary' : 'grey'"
            :variant="canRemind ? 'flat' : 'tonal'"
            :class="['text-none', { 'remind-button--cooldown': !canRemind }]"
            :aria-label="t('overview.remindBtn')"
            :aria-disabled="String(!canRemind)"
            @click="requestReminder"
          >
            <v-icon size="14" icon="mdi-bell-outline" class="mr-1" />
            {{ t('overview.remindBtn') }}
          </v-btn>
        </template>
      </v-tooltip>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTeacherOverviewStore } from '../../stores/teacherOverview'

const props = defineProps({
  item: { type: Object, required: true },
  mode: { type: String, default: 'upcoming' }, // 'upcoming' | 'overdue'
})
const emit = defineEmits(['remind'])

const { t, locale } = useI18n()
const overviewStore = useTeacherOverviewStore()
const reminderClock = ref(Date.now())
let reminderClockTimer

const progressPct = computed(() => {
  if (!props.item.totalStudents) return 0
  return Math.round((props.item.submittedCount / props.item.totalStudents) * 100)
})

const canRemind = computed(() => {
  reminderClock.value
  return overviewStore.canRemind(props.item.assignmentId)
})

const lastReminderTime = computed(() => {
  const ts = overviewStore.lastReminderAt[props.item.assignmentId]
  if (!ts) return ''
  return new Intl.DateTimeFormat(locale.value === 'vi' ? 'vi-VN' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts))
})

const remindDisabledReason = computed(() => t('overview.remindCooldownDetail', {
  time: lastReminderTime.value,
  minutes: 45,
}))

function requestReminder() {
  if (!canRemind.value) return
  emit('remind', props.item)
}

onMounted(() => {
  reminderClockTimer = setInterval(() => {
    reminderClock.value = Date.now()
  }, 15_000)
})

onBeforeUnmount(() => clearInterval(reminderClockTimer))

const deadlineLabel = computed(() => {
  if (!props.item.deadline) return ''
  const diff = new Date(props.item.deadline).getTime() - Date.now()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'Dưới 1 giờ'
  if (hours < 24) return `Còn ${hours} giờ`
  const days = Math.floor(hours / 24)
  return `Còn ${days} ngày`
})
</script>

<style scoped>
.deadline-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  background: #f8fbff;
  border: 1px solid #e4ecf7;
  border-radius: 12px;
}

.deadline-card-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.deadline-card-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.deadline-card-title {
  font-size: 0.88rem;
  font-weight: 750;
  color: #172b4d;
}

.deadline-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  border-radius: 8px;
  font-size: 0.65rem;
  font-weight: 800;
}

.deadline-badge--warn {
  background: #fff4e5;
  color: #b54708;
}

.deadline-badge--error {
  background: #fff1f3;
  color: #c01048;
}

.deadline-card-meta {
  font-size: 0.75rem;
  color: #667085;
}

/* Thanh tiến độ */
.deadline-progress-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.deadline-progress-label {
  font-size: 0.72rem;
  color: #344054;
  font-weight: 600;
  white-space: nowrap;
}

.deadline-progress-track {
  flex: 1;
  height: 6px;
  background: #e4ecf7;
  border-radius: 3px;
  overflow: hidden;
}

.deadline-progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.deadline-progress-fill--warn { background: #f79009; }
.deadline-progress-fill--error { background: #f04438; }

.deadline-not-submitted {
  font-size: 0.7rem;
  color: #f04438;
  font-weight: 700;
  white-space: nowrap;
}

.deadline-card-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.remind-button--cooldown {
  opacity: 0.62;
}
</style>

