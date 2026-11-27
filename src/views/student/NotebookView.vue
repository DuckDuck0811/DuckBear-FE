<template>
  <StudentDashboardLayout>
    <v-container class="py-6 px-4 px-md-8" style="max-width: 1120px">

      <!-- ① Compact banner -->
      <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-5">
        <div>
          <div class="text-overline text-medium-emphasis">{{ t('notebook.eyebrow') }}</div>
          <h1 class="text-h6 font-weight-bold">{{ t('notebook.title') }}</h1>
        </div>
      </div>

      <!-- ② Hero card: "Hôm nay cần ôn X câu" + nút chính + menu + chuỗi ngày -->
      <v-card rounded="xl" border elevation="0" class="pa-4 mb-5 hero-card" color="surface">
        <div class="d-flex flex-wrap align-center justify-space-between ga-4">

          <!-- Left: summary text + streak -->
          <div>
            <div class="text-h5 font-weight-black">
              <template v-if="dueToday > 0">
                {{ t('notebook.hero.dueCount', { count: dueToday }) }}
              </template>
              <template v-else>
                {{ t('notebook.hero.allDone') }}
              </template>
            </div>
            <div class="text-body-2 text-medium-emphasis mt-1">
              <template v-if="dueToday > 0">{{ t('notebook.hero.dueHint') }}</template>
              <template v-else>{{ t('notebook.hero.allDoneHint') }}</template>
            </div>
            <div v-if="stats?.streakDays > 0" class="d-flex align-center ga-1 mt-2 text-caption text-medium-emphasis">
              <v-icon size="14" color="warning">mdi-fire</v-icon>
              {{ t('notebook.hero.streak', { days: stats.streakDays }) }}
            </div>
          </div>

          <!-- Right: action buttons -->
          <div class="d-flex flex-wrap align-center ga-2">
            <!-- Primary CTA -->
            <v-btn
              color="primary"
              rounded="lg"
              size="large"
              prepend-icon="mdi-play-circle-outline"
              :to="dueToday > 0 ? '/student/notebook/review?mode=due' : '/student/notebook/review?mode=free'"
            >
              {{ dueToday > 0 ? t('notebook.quickReview.reviewDue', { count: dueToday }) : t('notebook.quickReview.reviewFree') }}
            </v-btn>

            <!-- "Chế độ khác" dropdown -->
            <v-menu>
              <template #activator="{ props: menuProps }">
                <v-btn
                  v-bind="menuProps"
                  variant="tonal"
                  rounded="lg"
                  append-icon="mdi-chevron-down"
                >
                  {{ t('notebook.hero.otherModes') }}
                </v-btn>
              </template>
              <v-list density="compact" rounded="lg">
                <v-list-item
                  prepend-icon="mdi-repeat"
                  :title="t('notebook.quickReview.reviewFrequent')"
                  to="/student/notebook/review?mode=frequent"
                />
                <v-divider v-if="chapters.length" />
                <v-list-subheader v-if="chapters.length">
                  {{ t('notebook.quickReview.reviewByChapter') }}
                </v-list-subheader>
                <v-list-item
                  v-for="ch in chapters"
                  :key="ch.chapterId"
                  :title="ch.title"
                  :subtitle="`${ch.dueCount > 0 ? ch.dueCount + ' ' + t('notebook.tabs.due') + ' · ' : ''}${ch.active} ${t('notebook.tabs.active')}`"
                  :to="`/student/notebook/review?mode=chapter&chapterId=${ch.chapterId}`"
                />
              </v-list>
            </v-menu>
          </div>
        </div>
      </v-card>

      <!-- ③ Question list: tabs + chapter filter -->
      <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
        <FilterChips v-model="activeTab" :items="tabItems" />
        <v-select
          v-model="selectedChapterId"
          :items="chapterOptions"
          item-title="title"
          item-value="chapterId"
          :label="t('notebook.chapterFilter')"
          clearable
          density="compact"
          variant="outlined"
          hide-details
          style="min-width: 220px; max-width: 300px"
          @update:model-value="onFilterChange"
        />
      </div>

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
        <div class="d-flex align-center justify-space-between flex-wrap ga-2">
          <span>{{ errorMessage }}</span>
          <v-btn size="small" variant="text" color="error" @click="loadItems">
            {{ t('notebook.retry') }}
          </v-btn>
        </div>
      </v-alert>

      <div v-if="loading" class="d-flex flex-column ga-3">
        <v-skeleton-loader v-for="n in 3" :key="n" type="article" rounded="xl" />
      </div>

      <EmptyState
        v-else-if="items.length === 0"
        :icon="emptyState.icon"
        :title="emptyState.title"
        :description="emptyState.description"
      />

      <div v-else class="d-flex flex-column ga-3">
        <v-card
          v-for="item in items"
          :key="item.id"
          rounded="xl"
          border
          elevation="0"
          class="pa-4 cursor-pointer"
          @click="openDetail(item.questionId)"
        >
          <div class="d-flex flex-wrap align-start justify-space-between ga-3">
            <div class="flex-grow-1" style="min-width: 240px">
              <div class="d-flex align-center flex-wrap ga-2 mb-2">
                <v-chip size="small" color="primary" variant="tonal">
                  {{ t(`notebook.questionTypes.${item.question?.type}`, item.question?.type) }}
                </v-chip>
                <span
                  v-if="item.question?.lesson"
                  class="text-caption text-medium-emphasis"
                >
                  {{ item.question.lesson.chapter?.title }} · {{ item.question.lesson.title }}
                </span>
              </div>
              <div class="text-body-1 font-weight-medium">
                {{ truncate(item.question?.content) }}
              </div>
            </div>

            <div class="d-flex flex-column align-end ga-2">
              <div class="d-flex align-center ga-1" :aria-label="t('notebook.boxLabel', { box: item.box })">
                <span class="text-caption text-medium-emphasis mr-1">
                  {{ t('notebook.boxLabel', { box: item.box }) }}
                </span>
                <span
                  v-for="dot in 5"
                  :key="dot"
                  class="leitner-dot"
                  :class="{ 'leitner-dot-active': dot <= item.box }"
                />
              </div>
              <div class="d-flex align-center ga-2 text-caption text-medium-emphasis">
                <span>{{ t('notebook.wrongCount', { count: item.wrongCount }) }}</span>
                <span>·</span>
                <v-chip
                  size="x-small"
                  :color="isDue(item) ? 'warning' : 'default'"
                  variant="tonal"
                >
                  {{ formatNextReview(item) }}
                </v-chip>
              </div>
            </div>
          </div>
        </v-card>

        <ListPagination
          v-if="totalPages > 1"
          v-model:page="page"
          :length="totalPages"
          class="mt-4"
          @update:page="loadItems"
        />
      </div>

      <!-- ④ Statistics section — collapsed by default -->
      <v-expansion-panels class="mt-6" flat>
        <v-expansion-panel rounded="xl" elevation="0" class="stats-panel">
          <v-expansion-panel-title class="font-weight-bold text-subtitle-2">
            <v-icon class="mr-2" size="18">mdi-chart-bar</v-icon>
            {{ t('notebook.statsSection.title') }}
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <div class="pt-2">

              <!-- 4 stat cards -->
              <template v-if="statsLoading">
                <v-row dense class="mb-4">
                  <v-col v-for="n in 4" :key="n" cols="6" md="3">
                    <v-skeleton-loader type="list-item-two-line" rounded="xl" />
                  </v-col>
                </v-row>
              </template>
              <template v-else-if="stats">
                <v-row dense class="mb-4">
                  <v-col cols="6" md="3">
                    <v-card rounded="xl" border elevation="0" class="pa-4 h-100">
                      <div class="text-caption text-medium-emphasis">{{ t('notebook.stats.totalWrong') }}</div>
                      <div class="text-h5 font-weight-black mt-1">{{ stats.totalWrong }}</div>
                    </v-card>
                  </v-col>
                  <v-col cols="6" md="3">
                    <v-card rounded="xl" border elevation="0" class="pa-4 h-100">
                      <div class="text-caption text-medium-emphasis">{{ t('notebook.stats.mastered') }}</div>
                      <div class="text-h5 font-weight-black text-success mt-1">
                        {{ stats.mastered }}
                        <span class="text-body-2 font-weight-medium text-medium-emphasis">({{ stats.masteredRate }}%)</span>
                      </div>
                    </v-card>
                  </v-col>
                  <v-col cols="6" md="3">
                    <v-card rounded="xl" border elevation="0" class="pa-4 h-100">
                      <div class="text-caption text-medium-emphasis">{{ t('notebook.stats.reviewedThisWeek') }}</div>
                      <div class="text-h5 font-weight-black text-primary mt-1">
                        {{ stats.reviewedThisWeek }}
                        <span class="text-body-2 font-weight-medium text-medium-emphasis">
                          · {{ t('notebook.stats.accuracyFmt', { pct: stats.accuracyThisWeek }) }}
                        </span>
                      </div>
                    </v-card>
                  </v-col>
                  <v-col cols="6" md="3">
                    <v-card rounded="xl" border elevation="0" class="pa-4 h-100">
                      <div class="text-caption text-medium-emphasis">{{ t('notebook.stats.streakDays') }}</div>
                      <div class="text-h5 font-weight-black text-warning mt-1">
                        {{ stats.streakDays }} {{ t('notebook.stats.daysUnit') }}
                      </div>
                    </v-card>
                  </v-col>
                </v-row>

                <!-- 14-day chart: only when >= 3 days have data -->
                <v-card rounded="xl" border elevation="0" class="pa-4 mb-4">
                  <div class="d-flex align-center justify-space-between mb-3">
                    <span class="text-subtitle-2 font-weight-bold">{{ t('notebook.stats.chartTitle') }}</span>
                    <div class="d-flex align-center ga-3 text-caption text-medium-emphasis">
                      <span class="d-flex align-center ga-1">
                        <span class="legend-dot bg-success" /> {{ t('notebook.review.correctCount') }}
                      </span>
                      <span class="d-flex align-center ga-1">
                        <span class="legend-dot bg-error" /> {{ t('notebook.review.wrongCount') }}
                      </span>
                    </div>
                  </div>
                  <template v-if="chartDaysWithData >= 3">
                    <div class="chart-bars">
                      <div
                        v-for="day in stats.reviewsByDay"
                        :key="day.date"
                        class="chart-col"
                        :title="`${day.date}: ${day.correct} ✓ / ${day.wrong} ✗`"
                      >
                        <div class="chart-stack">
                          <div
                            v-if="day.wrong > 0"
                            class="bar-wrong"
                            :style="{ height: `${(day.wrong / maxDayTotal) * 100}%` }"
                          />
                          <div
                            v-if="day.correct > 0"
                            class="bar-correct"
                            :style="{ height: `${(day.correct / maxDayTotal) * 100}%` }"
                          />
                        </div>
                        <span class="chart-label">{{ day.date.slice(8, 10) }}</span>
                      </div>
                    </div>
                  </template>
                  <div v-else class="text-body-2 text-medium-emphasis text-center py-4">
                    {{ t('notebook.stats.chartNeedMoreDays') }}
                  </div>
                </v-card>

                <!-- Weak chapters -->
                <div v-if="stats.weakChapters?.length" class="mb-2">
                  <div class="text-subtitle-2 font-weight-bold mb-3">{{ t('notebook.weakChapters.title') }}</div>
                  <div class="d-flex flex-column ga-3">
                    <div
                      v-for="ch in stats.weakChapters"
                      :key="ch.chapterId"
                      class="d-flex flex-wrap align-center justify-space-between ga-3"
                    >
                      <div class="flex-grow-1" style="min-width: 220px">
                        <div class="d-flex align-center justify-space-between mb-1">
                          <span class="text-body-2 font-weight-medium">{{ ch.title }}</span>
                          <span class="text-caption text-medium-emphasis">
                            {{ ch.mastered }}/{{ ch.active + ch.mastered }} {{ t('notebook.tabs.mastered') }}
                          </span>
                        </div>
                        <v-progress-linear
                          :model-value="chapterProgress(ch)"
                          color="success"
                          bg-color="grey-lighten-3"
                          height="6"
                          rounded
                        />
                      </div>
                      <v-btn
                        size="small"
                        variant="tonal"
                        color="primary"
                        rounded="lg"
                        :to="`/student/notebook/review?mode=chapter&chapterId=${ch.chapterId}`"
                      >
                        {{ t('notebook.weakChapters.reviewChapter') }}
                      </v-btn>
                    </div>
                  </div>
                </div>
              </template>

              <v-alert v-if="statsError" type="error" variant="tonal" density="compact">
                {{ statsError }}
                <template #append>
                  <v-btn size="small" variant="text" color="error" @click="loadStats">{{ t('notebook.retry') }}</v-btn>
                </template>
              </v-alert>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

    </v-container>

    <NotebookDetailDialog
      v-model="detailOpen"
      :question-id="detailQuestionId"
      @dismissed="onDismissed"
    />
  </StudentDashboardLayout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import StudentDashboardLayout from '../../layouts/StudentDashboardLayout.vue';
import FilterChips from '../../components/shared/FilterChips.vue';
import EmptyState from '../../components/shared/EmptyState.vue';
import ListPagination from '../../components/shared/ListPagination.vue';
import NotebookDetailDialog from '../../components/notebook/NotebookDetailDialog.vue';
import { getChapters, getNotebook, getStats } from '../../services/notebook';
import { useNotebookStore } from '../../stores/notebook';

const { t } = useI18n();
const notebookStore = useNotebookStore();

// ---- list state ----
const activeTab = ref('due');
const selectedChapterId = ref(null);
const page = ref(1);
const limit = 20;
const total = ref(0);
const items = ref([]);
const loading = ref(false);
const errorMessage = ref('');

// ---- stats state ----
const stats = ref(null);
const statsLoading = ref(false);
const statsError = ref('');
const chapters = ref([]);

// ---- detail dialog ----
const detailOpen = ref(false);
const detailQuestionId = ref(null);

// ---- computed ----
const dueToday = computed(() => notebookStore.summary.dueToday ?? 0);

const chapterOptions = computed(() => chapters.value);

const tabItems = computed(() => [
  { value: 'due',      label: `${t('notebook.tabs.due')} (${notebookStore.summary.dueToday})` },
  { value: 'active',   label: `${t('notebook.tabs.active')} (${notebookStore.summary.active})` },
  { value: 'mastered', label: `${t('notebook.tabs.mastered')} (${notebookStore.summary.mastered})` },
  { value: 'all',      label: `${t('notebook.tabs.all')} (${notebookStore.summary.active + notebookStore.summary.mastered})` },
]);

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit)));

const emptyState = computed(() => {
  if (activeTab.value === 'due')
    return { icon: 'mdi-check-decagram-outline', title: t('notebook.empty.dueTitle'), description: t('notebook.empty.dueDescription') };
  if (activeTab.value === 'mastered')
    return { icon: 'mdi-trophy-outline', title: t('notebook.empty.masteredTitle'), description: t('notebook.empty.masteredDescription') };
  return { icon: 'mdi-notebook-outline', title: t('notebook.empty.activeTitle'), description: t('notebook.empty.activeDescription') };
});

const maxDayTotal = computed(() => {
  const list = stats.value?.reviewsByDay || [];
  return Math.max(1, ...list.map((d) => d.correct + d.wrong));
});

const chartDaysWithData = computed(() => {
  const list = stats.value?.reviewsByDay || [];
  return list.filter((d) => d.correct + d.wrong > 0).length;
});

// ---- helpers ----
function truncate(text = '', max = 160) {
  return text.length <= max ? text : `${text.slice(0, max).trim()}...`;
}

function isDue(item) {
  if (item.status === 'MASTERED') return false;
  return new Date(item.nextReviewAt).getTime() <= Date.now();
}

function formatNextReview(item) {
  if (item.status === 'MASTERED') return t('notebook.masteredBadge');
  const diffMs = new Date(item.nextReviewAt).getTime() - Date.now();
  if (diffMs <= 0) return t('notebook.dueNow');
  const days = Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
  return t('notebook.reviewInDays', { days });
}

function chapterProgress(ch) {
  const total = ch.active + ch.mastered;
  return total > 0 ? Math.round((ch.mastered / total) * 100) : 0;
}

function openDetail(questionId) {
  detailQuestionId.value = questionId;
  detailOpen.value = true;
}

function onDismissed() {
  notebookStore.loadSummary();
  loadStats();
  loadChapters();
  loadItems();
}

function onFilterChange() {
  page.value = 1;
  loadItems();
}

// ---- data fetching ----
async function loadStats() {
  statsLoading.value = true;
  statsError.value = '';
  try {
    stats.value = await getStats();
  } catch (err) {
    statsError.value = err?.message || t('notebook.loadError');
  } finally {
    statsLoading.value = false;
  }
}

async function loadChapters() {
  try {
    chapters.value = await getChapters();
  } catch {
    chapters.value = [];
  }
}

async function loadItems() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const params = { page: page.value, limit };
    if (activeTab.value === 'due')      params.due = true;
    else if (activeTab.value === 'active')   params.status = 'ACTIVE';
    else if (activeTab.value === 'mastered') params.status = 'MASTERED';
    if (selectedChapterId.value) params.unit = selectedChapterId.value;
    const data = await getNotebook(params);
    items.value = data.items || [];
    total.value = Number(data.total ?? 0);
  } catch (err) {
    errorMessage.value = err?.message || t('notebook.loadError');
  } finally {
    loading.value = false;
  }
}

// Auto-select sensible default tab once summary is loaded
watch(dueToday, (val) => {
  if (activeTab.value === 'due' && val === 0) {
    activeTab.value = 'active';
  }
}, { immediate: false });

watch(activeTab, () => {
  page.value = 1;
  loadItems();
});

onMounted(async () => {
  await notebookStore.loadSummary();
  // After summary loads, pick default tab
  if (notebookStore.summary.dueToday === 0) {
    activeTab.value = 'active';
  }
  loadStats();
  loadChapters();
  loadItems();
});
</script>

<style scoped>
/* Leitner dots */
.leitner-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background-color: #dbe6f5;
  display: inline-block;
}
.leitner-dot-active {
  background-color: rgb(var(--v-theme-primary));
}
.cursor-pointer {
  cursor: pointer;
}

/* Stats expansion panel border */
.stats-panel {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important;
}

/* 14-day chart */
.chart-bars {
  display: grid;
  grid-template-columns: repeat(14, minmax(0, 1fr));
  gap: 6px;
  align-items: end;
  height: 96px;
}
.chart-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}
.chart-stack {
  flex: 1;
  width: 100%;
  max-width: 18px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 1px;
  background: #e2e8f0; /* visible grey base even at 0 */
  border-radius: 4px;
  overflow: hidden;
}
.bar-correct {
  background-color: rgb(var(--v-theme-success));
  width: 100%;
}
.bar-wrong {
  background-color: rgb(var(--v-theme-error));
  width: 100%;
}
.chart-label {
  font-size: 10px;
  color: #64748b;
  margin-top: 4px;
}
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  display: inline-block;
}

/* Mobile: hero card sticky at top inside scroll container */
@media (max-width: 599px) {
  .hero-card {
    position: sticky;
    top: 0;
    z-index: 10;
  }
}
</style>
