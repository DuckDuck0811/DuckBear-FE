<template>
  <v-layout class="history-page min-vh-100">
    <AppHeader />
    <StudentSidebar />
    <v-main>
      <v-container class="history-container py-7 px-4 px-md-8">
        <header class="history-hero mb-6">
          <div class="history-icon"><v-icon icon="mdi-chart-box-outline" size="28" /></div>
          <div>
            <div class="history-eyebrow">{{ t('attemptHistory.eyebrow') }}</div>
            <h1>{{ t('attemptHistory.title') }}</h1>
            <p>{{ t('attemptHistory.subtitle') }}</p>
          </div>
        </header>

        <div class="history-stats mb-5">
          <v-card class="history-stat" rounded="xl" variant="flat">
            <span>{{ t('attemptHistory.total') }}</span><strong>{{ attempts.length }}</strong>
          </v-card>
          <v-card class="history-stat" rounded="xl" variant="flat">
            <span>{{ t('attemptHistory.completed') }}</span><strong>{{ completedCount }}</strong>
          </v-card>
          <v-card class="history-stat" rounded="xl" variant="flat">
            <span>{{ t('attemptHistory.average') }}</span><strong>{{ averageScore }}</strong>
          </v-card>
        </div>

        <v-card class="history-card" rounded="xl" variant="flat">
          <div class="history-toolbar">
            <div class="text-h6 font-weight-bold">{{ t('attemptHistory.records') }}</div>
            <v-select v-model="filter" :items="filters" item-title="title" item-value="value" density="compact" variant="outlined" hide-details class="history-filter" />
          </div>

          <div v-if="loading" class="py-12 text-center"><v-progress-circular indeterminate color="primary" /></div>
          <div v-else-if="error" class="pa-8 text-center text-error">{{ error }}</div>
          <div v-else-if="!visibleAttempts.length" class="history-empty">
            <v-icon icon="mdi-notebook-outline" size="40" />
            <strong>{{ t('attemptHistory.emptyTitle') }}</strong>
            <span>{{ t('attemptHistory.emptyBody') }}</span>
            <v-btn color="primary" variant="tonal" rounded="pill" to="/assignments" class="mt-2">{{ t('attemptHistory.goAssignments') }}</v-btn>
          </div>
          <div v-else class="history-list">
            <article v-for="attempt in pagedAttempts" :key="attempt.id" class="history-row">
              <div class="history-row-icon" :class="{ 'is-pending': !attempt.submittedAt }">
                <v-icon :icon="attempt.submittedAt ? 'mdi-check' : 'mdi-progress-clock'" />
              </div>
              <div class="history-row-main">
                <div class="history-row-title">{{ attempt.assignment.title }}</div>
                <div class="history-row-meta">
                  <span v-if="attempt.assignment.class?.name"><v-icon icon="mdi-account-group-outline" size="15" />{{ attempt.assignment.class.name }}</span>
                  <span><v-icon icon="mdi-counter" size="15" />{{ t('attemptHistory.attemptNo', { number: attempt.attemptNo }) }}</span>
                </div>
              </div>
              <div class="history-times">
                <span>{{ t('attemptHistory.started') }} {{ formatDate(attempt.startedAt) }}</span>
                <span v-if="attempt.submittedAt">{{ t('attemptHistory.submitted') }} {{ formatDate(attempt.submittedAt) }}</span>
                <span v-else class="text-warning">{{ t('attemptHistory.inProgress') }}</span>
              </div>
              <v-chip v-if="attempt.score !== null" color="primary" variant="tonal" size="small" class="history-score">
                {{ t('attemptHistory.score', { score: attempt.score }) }}
              </v-chip>
              <v-chip v-else-if="attempt.submittedAt" color="grey" variant="tonal" size="small" class="history-score">{{ t('attemptHistory.notGraded') }}</v-chip>
              <v-btn v-else :to="`/assignments/${attempt.assignment.id}/do`" color="primary" variant="tonal" size="small" rounded="pill">{{ t('attemptHistory.continue') }}</v-btn>
            </article>
          </div>
          <div v-if="!loading && visibleAttempts.length > pageSize" class="history-pagination">
            <span>{{ t('attemptHistory.pageSummary', { from: pageStart, to: pageEnd, total: visibleAttempts.length }) }}</span>
            <v-pagination v-model="page" :length="pageCount" :total-visible="5" density="comfortable" rounded="circle" />
          </div>
        </v-card>
      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../../services/api'
import AppHeader from '../../components/shared/AppHeader.vue'
import StudentSidebar from '../../components/shared/StudentSidebar.vue'

const { t, locale } = useI18n()
const attempts = ref([])
const loading = ref(true)
const error = ref('')
const filter = ref('all')
const page = ref(1)
const pageSize = 20
const filters = computed(() => [
  { title: t('attemptHistory.all'), value: 'all' },
  { title: t('attemptHistory.completed'), value: 'completed' },
  { title: t('attemptHistory.inProgress'), value: 'in-progress' },
])
const completedCount = computed(() => attempts.value.filter(attempt => attempt.submittedAt).length)
const scoredAttempts = computed(() => attempts.value.filter(attempt => attempt.score !== null))
const averageScore = computed(() => scoredAttempts.value.length
  ? `${(scoredAttempts.value.reduce((sum, attempt) => sum + attempt.score, 0) / scoredAttempts.value.length).toFixed(1)}%`
  : '—')
const visibleAttempts = computed(() => attempts.value.filter(attempt => {
  if (filter.value === 'completed') return Boolean(attempt.submittedAt)
  if (filter.value === 'in-progress') return !attempt.submittedAt
  return true
}))
const pageCount = computed(() => Math.max(1, Math.ceil(visibleAttempts.value.length / pageSize)))
const pageStart = computed(() => (page.value - 1) * pageSize + 1)
const pageEnd = computed(() => Math.min(page.value * pageSize, visibleAttempts.value.length))
const pagedAttempts = computed(() => visibleAttempts.value.slice((page.value - 1) * pageSize, page.value * pageSize))

watch(filter, () => { page.value = 1 })
watch(pageCount, count => { if (page.value > count) page.value = count })

function formatDate(value) {
  return new Intl.DateTimeFormat(locale.value === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

onMounted(async () => {
  try {
    attempts.value = await api('/assignments/attempts/mine')
  } catch (cause) {
    error.value = cause?.message || t('attemptHistory.loadError')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.history-page { background: #f5f8fd; }
.history-container { max-width: 1180px; }
.history-hero { display: flex; align-items: center; gap: 16px; padding: 24px; border: 1px solid #e4ecf7; border-radius: 22px; background: linear-gradient(120deg, #fff, #f1f7ff); }
.history-icon { display: grid; width: 54px; height: 54px; flex: none; place-items: center; border-radius: 16px; background: #e7f0ff; color: #347df5; }
.history-eyebrow { color: #347df5; font-size: .75rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.history-hero h1 { margin: 2px 0; color: #1e2c43; font-size: clamp(1.35rem, 3vw, 1.8rem); }
.history-hero p { margin: 0; color: #748198; }
.history-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.history-stat { display: flex; align-items: center; justify-content: space-between; padding: 17px 20px; border: 1px solid #e5edf8; background: #fff; color: #748198; }
.history-stat strong { color: #2874ee; font-size: 1.3rem; }
.history-card { overflow: hidden; border: 1px solid #e5edf8; background: #fff; }
.history-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 22px; border-bottom: 1px solid #edf2f8; }
.history-filter { max-width: 190px; }
.history-list { padding: 4px 22px; }
.history-row { display: flex; align-items: center; gap: 16px; min-width: 0; padding: 16px 0; border-bottom: 1px solid #edf2f8; }
.history-row:last-child { border-bottom: 0; }
.history-row-icon { display: grid; width: 38px; height: 38px; flex: none; place-items: center; border-radius: 12px; background: #e9f8f1; color: #18a66a; }
.history-row-icon.is-pending { background: #fff5df; color: #c78a17; }
.history-row-main { min-width: 180px; flex: 1; }
.history-row-title { overflow: hidden; color: #26364e; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.history-row-meta { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 5px; color: #7c899e; font-size: .8rem; }
.history-row-meta span { display: inline-flex; align-items: center; gap: 4px; }
.history-times { display: flex; flex-direction: column; gap: 4px; color: #68778e; font-size: .8rem; }
.history-score { flex: none; }
.history-empty { display: flex; min-height: 260px; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: #8290a5; text-align: center; }
.history-empty strong { color: #35445b; font-size: 1.05rem; }
.history-pagination { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 22px; border-top: 1px solid #edf2f8; color: #748198; font-size: .82rem; }
@media (max-width: 700px) {
  .history-stats { gap: 8px; }
  .history-stat { flex-direction: column; align-items: flex-start; gap: 6px; padding: 12px; font-size: .78rem; }
  .history-row { align-items: flex-start; gap: 10px; flex-wrap: wrap; }
  .history-row-main { min-width: calc(100% - 52px); }
  .history-times { width: calc(100% - 52px); margin-left: 48px; }
  .history-score, .history-row > .v-btn { margin-left: 48px; }
  .history-pagination { flex-direction: column; align-items: stretch; padding-inline: 12px; }
}
</style>
