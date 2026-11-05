<template>
  <v-layout class="overview-layout min-vh-100">
    <AppHeader />
    <TeacherSidebar />
    <v-main class="overview-main">
      <div class="overview-page">
    <!-- Lời chào -->
    <section class="overview-greeting">
      <div class="greeting-left">
        <h1 class="greeting-title">
          {{ t('overview.greeting', { name: authStore.user?.fullName ?? '' }) }}
        </h1>
        <p v-if="overviewStore.overviewSummary.totalActions > 0" class="greeting-sub">
          {{ t('overview.taskSummary', { n: overviewStore.overviewSummary.totalActions }) }}
        </p>
        <p v-else class="greeting-sub greeting-sub--positive">
          {{ t('overview.noTasks') }}
        </p>
      </div>
      <div class="greeting-badges">
        <v-btn
          to="/assignments"
          color="primary"
          variant="flat"
          prepend-icon="mdi-plus"
          class="greeting-create-button text-none font-weight-bold"
        >
          {{ t('overview.shortcutCreate') }}
        </v-btn>
      </div>
    </section>

    <!-- Loading skeleton -->
    <template v-if="overviewStore.loading">
      <div v-for="i in 4" :key="i" class="overview-skeleton" />
    </template>

    <template v-else>
      <!-- Error -->
      <v-alert v-if="overviewStore.error" type="error" variant="tonal" class="mb-4 overview-error" density="compact">
        {{ overviewStore.error }}
        <template #append>
          <v-btn size="x-small" variant="text" @click="reload">Thử lại</v-btn>
        </template>
      </v-alert>

      <!-- Khối 2: Cần chấm -->
      <section class="overview-section overview-section--grading">
        <div class="overview-section-header overview-section-header--grading">
          <v-icon icon="mdi-pencil-circle-outline" color="orange-darken-2" size="20" />
          <h2 class="overview-section-title">{{ t('overview.gradingTitle') }}</h2>
          <span v-if="overviewStore.overviewSummary.gradingCount" class="overview-section-count">{{ overviewStore.overviewSummary.gradingCount }}</span>
          <v-btn
            v-if="gradingItems.length"
            :href="gradingItems[0].gradingUrl"
            color="primary"
            variant="tonal"
            size="small"
            prepend-icon="mdi-play-fast"
            class="text-none grading-sequential-button"
          >
            {{ t('overview.gradeSequentially') }}
          </v-btn>
        </div>
        <p v-if="!overviewStore.overviewSummary.gradingCount" class="overview-empty">{{ t('overview.gradingEmpty') }}</p>
        <div v-else class="grading-list">
          <div v-for="item in visibleGradingItems" :key="`${item.type}-${item.assignmentId}`" class="grading-row">
            <span class="grading-row-title">{{ item.title }}</span>
            <span class="grading-row-class"><span class="grading-class-dot" />{{ item.className }}</span>
            <span class="grading-row-meta">
              <v-icon size="14" icon="mdi-account-multiple-outline" />
              {{ t('overview.gradingCount', { n: item.count }) }}
            </span>
            <span v-if="item.oldestSubmittedAt" class="grading-row-meta grading-row-waiting">
              <v-icon size="14" icon="mdi-clock-alert-outline" />
              {{ t('overview.waitingSince', { time: timeAgo(item.oldestSubmittedAt) }) }}
            </span>
            <div class="grading-row-action">
              <span class="overview-type-badge">
                {{ item.type === 'quiz' ? t('overview.quizType') : t('overview.manualType') }}
              </span>
              <v-btn
                size="small"
                color="primary"
                variant="flat"
                :href="item.gradingUrl"
                :aria-label="t('overview.gradeNow')"
                class="text-none"
              >
                {{ t('overview.gradeNow') }}
              </v-btn>
            </div>
          </div>
          <v-btn
            v-if="gradingItems.length > 3"
            variant="text"
            color="primary"
            size="small"
            class="text-none grading-more-button"
            @click="showAllGrading = !showAllGrading"
          >
            {{ showAllGrading
              ? t('overview.showLessGrading')
              : t('overview.showMoreGrading', { n: gradingItems.length - 3 }) }}
          </v-btn>
        </div>
      </section>

      <!-- Khối 3: Sắp hết hạn -->
      <section class="overview-section overview-section--upcoming">
        <div class="overview-section-header">
          <v-icon icon="mdi-timer-sand" color="amber-darken-2" size="20" />
          <h2 class="overview-section-title">{{ t('overview.upcomingTitle') }}</h2>
          <span v-if="overviewStore.upcoming.length" class="overview-section-count overview-section-count--warn">
            {{ overviewStore.upcoming.length }}
          </span>
        </div>
        <p class="overview-section-desc">{{ t('overview.upcomingDesc') }}</p>
        <p v-if="!overviewStore.upcoming.length" class="overview-empty">{{ t('overview.upcomingEmpty') }}</p>
        <div v-else class="overview-card-list">
          <DeadlineCard
            v-for="item in overviewStore.upcoming"
            :key="`upcoming-${item.type}-${item.assignmentId}`"
            :item="item"
            mode="upcoming"
            @remind="openRemindConfirm(item)"
          />
        </div>
      </section>

      <!-- Khối 4: Quá hạn -->
      <div
        class="overview-status-grid"
        :class="{
          'overview-status-grid--compact': !overviewStore.overdue.length && !overviewStore.joinRequests.length,
        }"
      >
        <section
          class="overview-section overview-section--overdue"
          :class="{ 'overview-section--empty-inline': !overviewStore.overdue.length }"
        >
          <div v-if="!overviewStore.overdue.length" class="overview-compact-empty">
            <v-icon icon="mdi-check-circle-outline" color="success" size="17" />
            <span>{{ t('overview.overdueEmpty') }}</span>
          </div>
          <template v-else>
            <div class="overview-section-header">
              <v-icon icon="mdi-alert-octagon-outline" color="error" size="20" />
              <h2 class="overview-section-title">{{ t('overview.overdueTitle') }}</h2>
              <span class="overview-section-count overview-section-count--error">
                {{ overviewStore.overdue.length }}
              </span>
            </div>
            <p class="overview-section-desc">{{ t('overview.overdueDesc') }}</p>
            <div class="overview-card-list">
              <DeadlineCard
                v-for="item in overviewStore.overdue"
                :key="`overdue-${item.type}-${item.assignmentId}`"
                :item="item"
                mode="overdue"
                @remind="openRemindConfirm(item)"
              />
            </div>
          </template>
        </section>

      <!-- Khối 5: Yêu cầu vào lớp -->
        <section
          class="overview-section overview-section--requests"
          :class="{ 'overview-section--empty-inline': !overviewStore.joinRequests.length }"
        >
          <div v-if="!overviewStore.joinRequests.length" class="overview-compact-empty">
            <v-icon icon="mdi-check-circle-outline" color="success" size="17" />
            <span>{{ t('overview.joinRequestsEmpty') }}</span>
          </div>
          <template v-else>
            <div class="overview-section-header">
              <v-icon icon="mdi-account-plus-outline" color="indigo" size="20" />
              <h2 class="overview-section-title">{{ t('overview.joinRequestsTitle') }}</h2>
              <span class="overview-section-count">{{ overviewStore.joinRequests.length }}</span>
            </div>
            <div class="overview-card-list">
          <div
            v-for="jr in overviewStore.joinRequests"
            :key="jr.id"
            class="overview-card overview-card--join"
          >
            <v-avatar size="36" color="indigo-lighten-4">
              <v-img v-if="jr.student.avatarUrl" :src="jr.student.avatarUrl" />
              <span v-else class="text-indigo font-weight-bold text-caption">
                {{ initials(jr.student.fullName) }}
              </span>
            </v-avatar>
            <div class="overview-card-main">
              <span class="overview-card-title">{{ jr.student.fullName }}</span>
              <span class="overview-card-meta">{{ jr.class.name }}</span>
              <span class="overview-card-meta">{{ t('overview.sentAt', { time: timeAgo(jr.requestedAt) }) }}</span>
            </div>
            <div class="overview-card-actions">
              <v-btn
                size="small"
                color="success"
                variant="tonal"
                :loading="actionLoading[`approve-${jr.id}`]"
                class="text-none"
                @click="handleJoinRequest(jr, 'approve')"
              >{{ t('overview.approve') }}</v-btn>
              <v-btn
                size="small"
                color="error"
                variant="text"
                :loading="actionLoading[`reject-${jr.id}`]"
                class="text-none"
                @click="handleJoinRequest(jr, 'reject')"
              >{{ t('overview.reject') }}</v-btn>
            </div>
          </div>
            </div>
          </template>
        </section>
      </div>

      <!-- Khối 6: Hoạt động gần đây -->
      <section class="overview-section overview-section--activity">
        <div class="overview-section-header">
          <v-icon icon="mdi-timeline-outline" color="teal" size="20" />
          <h2 class="overview-section-title">{{ t('overview.activityTitle') }}</h2>
          <span
            class="socket-indicator"
            :class="{
              'socket-indicator--live': overviewStore.socketConnected,
              'socket-indicator--reconnecting': overviewStore.socketReconnecting,
            }"
          >
            <span class="socket-dot" />
            {{
              overviewStore.socketReconnecting
                ? t('overview.activityReconnecting')
                : t('overview.activityLive')
            }}
          </span>
        </div>
        <p v-if="!overviewStore.recentActivity.length" class="overview-empty">{{ t('overview.activityEmpty') }}</p>
        <ul v-else class="activity-feed">
          <li
            v-for="(event, idx) in overviewStore.recentActivity"
            :key="idx"
            class="activity-item"
            :class="{ 'activity-item--new': event.isNew }"
          >
            <v-avatar size="28" color="grey-lighten-3">
              <v-img v-if="event.student?.avatarUrl" :src="event.student.avatarUrl" />
              <span v-else class="text-caption text-grey-darken-1 font-weight-bold">
                {{ initials(event.student?.fullName) }}
              </span>
            </v-avatar>
            <div class="activity-text">
              <span v-if="event.type === 'submitted'">
                {{ t('overview.activitySubmitted', {
                  name: event.student?.fullName,
                  assignment: event.meta?.assignmentTitle,
                }) }}
              </span>
              <span v-else-if="event.type === 'join-request'">
                {{ t('overview.activityJoinRequest', {
                  name: event.student?.fullName,
                  class: event.meta?.className,
                }) }}
              </span>
            </div>
            <span class="activity-time">{{ timeAgo(event.at) }}</span>
          </li>
        </ul>
      </section>

      <!-- Khối 7: Lối tắt -->
      <section class="overview-section overview-section--shortcuts">
        <h2 class="overview-section-title mb-3">{{ t('overview.shortcutsTitle') }}</h2>
        <div class="shortcuts-row">
          <RouterLink to="/assignments" class="shortcut-btn">
            <v-icon icon="mdi-file-edit-outline" size="22" />
            <span>{{ t('overview.shortcutCreate') }}</span>
          </RouterLink>
          <RouterLink to="/schedule" class="shortcut-btn">
            <v-icon icon="mdi-calendar-week-outline" size="22" />
            <span>{{ t('overview.shortcutSchedule') }}</span>
          </RouterLink>
          <RouterLink to="/question-bank" class="shortcut-btn">
            <v-icon icon="mdi-comment-question-outline" size="22" />
            <span>{{ t('overview.shortcutQuestionBank') }}</span>
          </RouterLink>
        </div>
      </section>
    </template>

    <!-- Dialog xác nhận nhắc bài -->
    <v-dialog v-model="remindDialog" max-width="360">
      <v-card rounded="xl" elevation="4">
        <v-card-title class="pt-5 px-5 text-body-1 font-weight-bold">
          {{ t('overview.remindConfirm', { n: remindTarget?.notSubmittedCount ?? 0 }) }}
        </v-card-title>
        <v-card-subtitle class="px-5 pb-2 text-body-2">
          {{ remindTarget?.title }} — {{ remindTarget?.className }}
        </v-card-subtitle>
        <v-card-actions class="px-5 pb-4 gap-2">
          <v-spacer />
          <v-btn variant="text" class="text-none" @click="remindDialog = false">
            {{ t('overview.remindConfirmCancel') }}
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            class="text-none"
            :loading="reminding"
            @click="confirmRemind"
          >
            {{ t('overview.remindConfirmOk') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Toast -->
    <v-snackbar v-model="toastVisible" :timeout="3000" location="bottom end" color="success">
      {{ toastMsg }}
    </v-snackbar>
      </div>
    </v-main>
  </v-layout>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { io } from 'socket.io-client'
import { useAuthStore } from '../../stores/auth'
import { useTeacherOverviewStore } from '../../stores/teacherOverview'
import { api, API_BASE_URL } from '../../services/api'
import DeadlineCard from './DeadlineCard.vue'
import AppHeader from '../../components/shared/AppHeader.vue'
import TeacherSidebar from '../../components/shared/TeacherSidebar.vue'

const { t } = useI18n()
const authStore = useAuthStore()
const overviewStore = useTeacherOverviewStore()
const showAllGrading = ref(false)
const gradingItems = computed(() => [...overviewStore.overviewSummary.grading].sort((a, b) => {
  const aTime = a.oldestSubmittedAt ? new Date(a.oldestSubmittedAt).getTime() : Number.POSITIVE_INFINITY
  const bTime = b.oldestSubmittedAt ? new Date(b.oldestSubmittedAt).getTime() : Number.POSITIVE_INFINITY
  return aTime - bTime
}))
const visibleGradingItems = computed(() => showAllGrading.value ? gradingItems.value : gradingItems.value.slice(0, 3))

// ── Socket.IO ─────────────────────────────────────────────────────────
let socket = null

function connectSocket() {
  const token = localStorage.getItem('accessToken')
  if (!token) return

  socket = io(API_BASE_URL, { auth: { token }, transports: ['websocket'] })

  socket.on('connect', () => overviewStore.setSocketStatus(true, false))
  socket.on('disconnect', () => overviewStore.setSocketStatus(false, false))
  socket.on('connect_error', () => overviewStore.setSocketStatus(false, true))

  socket.on('classes.assignment-activity', (payload) => {
    overviewStore.prependActivity({
      type: 'submitted',
      at: payload.submittedAt ?? new Date().toISOString(),
      student: { id: payload.studentId, fullName: payload.studentName, avatarUrl: null },
      meta: {
        assignmentId: payload.assignmentId,
        assignmentTitle: payload.assignmentTitle,
        kind: payload.kind ?? 'quiz',
        classId: payload.classId,
      },
    })
  })

  socket.on('classes.join-request', (payload) => {
    overviewStore.prependActivity({
      type: 'join-request',
      at: payload.requestedAt ?? new Date().toISOString(),
      student: { id: payload.studentId, fullName: payload.studentName, avatarUrl: null },
      meta: {
        classId: payload.classId,
        className: payload.className,
        requestId: payload.requestId,
      },
    })
  })
}

// ── Remind ────────────────────────────────────────────────────────────
const remindDialog = ref(false)
const remindTarget = ref(null)
const reminding = ref(false)
const toastVisible = ref(false)
const toastMsg = ref('')

function openRemindConfirm(item) {
  if (!overviewStore.canRemind(item.assignmentId)) {
    showToast(t('overview.remindCooldown'))
    return
  }
  remindTarget.value = item
  remindDialog.value = true
}

async function confirmRemind() {
  if (!remindTarget.value) return
  reminding.value = true
  try {
    await api(`/classes/${remindTarget.value.classId}/assignment-reminders`, {
      method: 'POST',
      body: {
        assignmentId: remindTarget.value.assignmentId,
        type: remindTarget.value.type === 'manual' ? 'MANUAL' : 'QUIZ',
      },
    })
    overviewStore.markReminded(remindTarget.value.assignmentId)
    showToast(t('overview.remindSuccess', { time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) }))
  } catch {
    showToast('Không thể gửi nhắc. Vui lòng thử lại.')
  } finally {
    reminding.value = false
    remindDialog.value = false
  }
}

// ── Join request ──────────────────────────────────────────────────────
const actionLoading = ref({})

async function handleJoinRequest(jr, action) {
  const key = `${action}-${jr.id}`
  actionLoading.value[key] = true
  try {
    await api(`/classes/${jr.class.id}/join-requests/${jr.id}`, {
      method: 'PATCH',
      body: { action },
    })
    overviewStore.removeJoinRequest(jr.id)
    showToast(action === 'approve' ? 'Đã duyệt yêu cầu.' : 'Đã từ chối yêu cầu.')
  } catch {
    showToast('Thao tác thất bại. Vui lòng thử lại.')
  } finally {
    actionLoading.value[key] = false
  }
}

// ── Helpers ───────────────────────────────────────────────────────────
function showToast(msg) {
  toastMsg.value = msg
  toastVisible.value = true
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'vừa xong'
  if (mins < 60) return `${mins} phút trước`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  return `${days} ngày trước`
}

function initials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

function reload() {
  overviewStore.fetchOverview()
}

// ── Lifecycle ─────────────────────────────────────────────────────────
onMounted(() => {
  overviewStore.fetchOverview()
  connectSocket()
})

onBeforeUnmount(() => {
  socket?.disconnect()
})
</script>

<style scoped>
.overview-layout {
  background: #f4f8ff;
}

.overview-main {
  min-height: 100vh;
  background: #f4f8ff;
}

.overview-page {
  width: 100%;
  max-width: 1480px;
  margin: 0 auto;
  padding: 28px clamp(18px, 3vw, 44px) 56px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 20px;
}

.overview-greeting,
.overview-error,
.overview-skeleton,
.overview-section--grading,
.overview-section--shortcuts {
  grid-column: 1 / -1;
  min-width: 0;
}

/* Greeting */
.overview-greeting {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 24px;
  background: linear-gradient(120deg, #f0f7ff 0%, #fff 100%);
  border: 1px solid #dce9fb;
  border-radius: 18px;
}

.greeting-title {
  font-size: 1.3rem;
  font-weight: 850;
  color: #172b4d;
  margin: 0 0 4px;
}

.greeting-sub {
  font-size: 0.9rem;
  color: #667085;
  margin: 0;
}

.greeting-sub--positive {
  color: #12b76a;
  font-weight: 700;
}

.greeting-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 700;
}

.greeting-badge--warn {
  background: #fff4e5;
  color: #b54708;
  border: 1px solid #fec84b;
}

/* Section */
.overview-section {
  background: #fff;
  border: 1px solid #e4ecf7;
  border-radius: 16px;
  padding: 18px 20px;
}

.overview-section--shortcuts {
  background: #f8fbff;
}

.overview-status-grid {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 20px;
}

.overview-status-grid--compact {
  grid-column: auto;
  grid-template-columns: minmax(0, 1fr);
  align-content: start;
  gap: 6px;
}

.overview-section--activity {
  grid-column: 1 / -1;
}

.overview-section--empty-inline {
  display: flex;
  min-height: 38px;
  align-items: center;
  padding: 6px 4px;
  border: 0;
  background: transparent;
}

.overview-compact-empty {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #667085;
  font-size: 0.82rem;
}

.overview-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.overview-section-header--grading {
  margin-bottom: 12px;
}

.grading-sequential-button {
  flex: none;
}

.overview-section-title {
  font-size: 0.95rem;
  font-weight: 850;
  color: #172b4d;
  flex: 1;
}

.overview-section-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 10px;
  background: #e8f1ff;
  color: #2167d8;
  font-size: 0.72rem;
  font-weight: 800;
}

.overview-section-count--warn {
  background: #fff4e5;
  color: #b54708;
}

.overview-section-count--error {
  background: #fff1f3;
  color: #c01048;
}

.overview-section-desc {
  font-size: 0.78rem;
  color: #667085;
  margin: -6px 0 10px;
}

.overview-empty {
  font-size: 0.82rem;
  color: #98a2b3;
  margin: 4px 0;
}

/* Card list */
.overview-card-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.grading-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.grading-row {
  display: grid;
  grid-template-columns: minmax(130px, 1.5fr) minmax(90px, 0.9fr) minmax(100px, auto) minmax(130px, auto) auto;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 9px 11px;
  border: 1px solid #e4ecf7;
  border-radius: 10px;
  background: #f8fbff;
}

.grading-row-title,
.grading-row-class,
.grading-row-meta {
  min-width: 0;
  overflow: hidden;
  color: #26364e;
  font-size: 0.78rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.grading-row-title {
  font-weight: 750;
}

.grading-row-class,
.grading-row-meta {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.grading-row-class {
  color: #596a82;
}

.grading-class-dot {
  width: 8px;
  height: 8px;
  flex: none;
  border-radius: 50%;
  background: #347cf5;
}

.grading-row-meta {
  color: #667085;
}

.grading-row-waiting {
  color: #b54708;
}

.grading-row-action {
  justify-self: end;
}

.grading-more-button {
  align-self: flex-start;
}

.overview-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #f8fbff;
  border: 1px solid #e4ecf7;
  border-radius: 12px;
}

.overview-card--join {
  align-items: center;
}

.overview-card-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.overview-card-title {
  font-size: 0.88rem;
  font-weight: 750;
  color: #172b4d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.overview-card-meta {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.75rem;
  color: #667085;
}

.overview-card-meta--warn {
  color: #b54708;
}

.overview-card-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.overview-type-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 8px;
  background: #e8f1ff;
  color: #2167d8;
}

/* Activity feed */
.activity-feed {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  transition: background 0.15s ease;
}

.activity-item--new {
  background: #f0f7ff;
  animation: highlight-in 1.2s ease;
}

@keyframes highlight-in {
  from { background: #cce4ff; }
  to { background: #f0f7ff; }
}

.activity-text {
  flex: 1;
  font-size: 0.82rem;
  color: #344054;
}

.activity-time {
  font-size: 0.72rem;
  color: #98a2b3;
  white-space: nowrap;
}

/* Socket indicator */
.socket-indicator {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.7rem;
  font-weight: 600;
  color: #98a2b3;
  margin-left: auto;
}

.socket-indicator--live { color: #12b76a; }
.socket-indicator--reconnecting { color: #f79009; }

.socket-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.socket-indicator--live .socket-dot {
  animation: pulse-dot 1.6s ease infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* Shortcuts */
.shortcuts-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.shortcut-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #c9defc;
  color: #2167d8;
  font-size: 0.84rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.15s ease;
}

.shortcut-btn:hover {
  background: #e8f1ff;
  border-color: #93b4f7;
}

/* Skeleton */
.overview-skeleton {
  height: 90px;
  border-radius: 16px;
  background: linear-gradient(90deg, #f0f4fa 25%, #e4ecf7 50%, #f0f4fa 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (max-width: 1100px) {
  .overview-page {
    grid-template-columns: minmax(0, 1fr);
    max-width: 900px;
  }
}

@media (max-width: 600px) {
  .overview-page {
    padding: 18px 14px 36px;
    gap: 14px;
  }

  .overview-greeting {
    flex-direction: column;
    padding: 18px;
  }

  .greeting-badges {
    width: 100%;
  }

  .greeting-create-button {
    max-width: 100%;
  }

  .overview-section {
    padding: 16px 14px;
  }

  .overview-status-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 6px;
  }

  .overview-section--empty-inline {
    min-height: 34px;
    padding-inline: 2px;
  }

  .overview-section-header--grading {
    flex-wrap: wrap;
  }

  .grading-sequential-button {
    order: 1;
    width: 100%;
    margin-top: 2px;
  }

  .grading-row {
    grid-template-columns: minmax(55px, 1fr) minmax(48px, 0.75fr) auto auto auto;
    gap: 6px;
    padding: 8px 7px;
  }

  .grading-row-title,
  .grading-row-class,
  .grading-row-meta {
    font-size: 0.68rem;
  }

  .grading-row-action :deep(.v-btn) {
    min-width: 0;
    padding-inline: 7px;
    font-size: 0.68rem;
  }

  .overview-card {
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .overview-card-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .activity-item {
    align-items: flex-start;
  }

  .activity-time {
    padding-top: 4px;
  }

  .overview-page :deep(.deadline-card) {
    flex-direction: column;
  }

  .overview-page :deep(.deadline-card-actions) {
    width: 100%;
    align-items: flex-end;
  }
}
</style>

