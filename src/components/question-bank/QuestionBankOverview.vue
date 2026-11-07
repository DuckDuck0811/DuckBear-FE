<template>
  <div class="question-overview">
    <v-card v-if="loading" class="overview-skeleton pa-6 rounded-xl" variant="tonal" aria-busy="true">
      <v-skeleton-loader type="image, article, list-item-three-line" />
    </v-card>
    <v-alert v-else-if="error" type="error" variant="tonal" rounded="xl">
      <div class="d-flex flex-wrap align-center justify-space-between ga-3">
        <span>{{ error }}</span><v-btn variant="text" @click="emit('retry')">{{ t('classSeatMap.retry') }}</v-btn>
      </div>
    </v-alert>
    <template v-else-if="book">
      <v-card class="overview-hero pa-5 pa-md-7 rounded-xl mb-5" :style="heroStyle" variant="flat">
        <div class="hero-main">
          <div class="hero-progress" :style="progressStyle" role="img" :aria-label="t('questionBank.coveragePercent', { percent })"><span>{{ t('questionBank.percentShort', { percent }) }}</span></div>
          <div class="hero-copy">
            <v-chip v-if="!canManage" size="small" color="white" variant="outlined" class="mb-2">{{ t('questionBank.readOnlyLabel') }}</v-chip>
            <h2 class="text-h5 font-weight-black mb-2">{{ book.title }}</h2>
            <p class="text-body-1 mb-0">{{ heroSummary }}</p>
          </div>
        </div>
        <div class="hero-actions">
          <v-btn v-if="canManage && firstEmptyChapter" color="white" variant="flat" prepend-icon="mdi-auto-fix" @click="emit('ai', firstEmptyChapter)">{{ t('questionBank.aiForUnit', { unit: firstEmptyChapter.title }) }}</v-btn>
          <v-btn v-if="recentLesson" color="white" variant="outlined" prepend-icon="mdi-history" @click="emit('continue')">{{ t('questionBank.continueRecent') }}</v-btn>
        </div>
      </v-card>

      <div class="map-heading d-flex flex-wrap align-center justify-space-between ga-3 mb-3">
        <h3 class="text-h6 font-weight-bold mb-0">{{ t('questionBank.coverageMap') }}</h3>
        <div class="coverage-legend" :aria-label="t('questionBank.coverageLegend')">
          <span><i class="legend-empty">{{ t('questionBank.emptyMark') }}</i>{{ t('questionBank.noQuestions') }}</span>
          <span><i class="legend-low">1–5</i>{{ t('questionBank.oneToFive') }}</span>
          <span><i class="legend-mid">6–10</i>{{ t('questionBank.sixToTen') }}</span>
          <span><i class="legend-high">11+</i>{{ t('questionBank.elevenPlus') }}</span>
        </div>
      </div>
      <v-card v-if="!units.length" class="pa-5 text-body-2 text-medium-emphasis rounded-xl" variant="tonal">{{ t('questionBank.noLessons') }}</v-card>
      <v-card v-for="unit in units" :key="unit.id" class="unit-row pa-4 mb-3 rounded-xl" variant="outlined">
        <div class="unit-heading">
          <strong>{{ unit.title }}</strong>
          <span>{{ t('questionBank.unitCoverage', { count: unit.filled, total: unit.lessons.length }) }}</span>
        </div>
        <div class="lesson-map">
          <v-tooltip v-for="(lesson, index) in unit.lessons" :key="lesson.id" :text="lessonAria(unit, index, lesson)" location="top">
            <template #activator="{ props: tooltipProps }">
              <v-btn v-bind="tooltipProps" class="lesson-tile" :class="tileClass(lesson)" :aria-label="lessonAria(unit, index, lesson)" :title="lessonAria(unit, index, lesson)" @click="emit('select-lesson', { book, chapter: unit, lesson })">
                {{ tileText(lesson) }}
              </v-btn>
            </template>
          </v-tooltip>
        </div>
      </v-card>
    </template>
    <v-card v-else class="overview-empty pa-8 rounded-xl text-center" variant="tonal">
      <v-icon icon="mdi-book-open-page-variant-outline" size="42" color="primary" class="mb-2" />
      <p class="text-body-2 text-medium-emphasis mb-0">{{ t('questionBank.selectBookHint') }}</p>
      <v-btn v-if="recentLesson" class="mt-4" color="primary" variant="tonal" prepend-icon="mdi-history" @click="emit('continue')">{{ t('questionBank.continueRecent') }}</v-btn>
    </v-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({ book: { type: Object, default: null }, loading: Boolean, error: { type: String, default: '' }, canManage: Boolean, recentLesson: { type: Object, default: null } })
const emit = defineEmits(['retry', 'select-lesson', 'ai', 'continue'])
const { t } = useI18n()
const units = computed(() => (props.book?.chapters || []).map((chapter) => {
  const lessons = chapter.lessons || []
  return { ...chapter, lessons, filled: lessons.filter((lesson) => Number(lesson?._count?.questions) > 0).length }
}))
const total = computed(() => units.value.reduce((sum, unit) => sum + unit.lessons.length, 0))
const filled = computed(() => units.value.reduce((sum, unit) => sum + unit.filled, 0))
const percent = computed(() => total.value ? Math.round(filled.value * 100 / total.value) : 0)
const emptyCount = computed(() => total.value - filled.value)
const heroSummary = computed(() => emptyCount.value ? t('questionBank.coverageSummary', { count: filled.value, total: total.value, empty: emptyCount.value }) : t('questionBank.coverageComplete', { count: filled.value, total: total.value }))
const firstEmptyChapter = computed(() => units.value.find((unit) => unit.lessons.some((lesson) => !(Number(lesson?._count?.questions) > 0))) || null)
const hue = computed(() => {
  const subject = String(props.book?.subject || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const id = Math.abs(Number(props.book?.id) || 1)
  if (subject.includes('anh')) return '--v-theme-pink'
  if (subject.includes('su')) return '--v-theme-orange'
  if (subject.includes('dia')) return '--v-theme-green'
  if (subject.includes('van') || subject.includes('ngu')) return '--v-theme-purple'
  if (subject.includes('toan')) return '--v-theme-primary'
  return id % 2 ? '--v-theme-primary' : '--v-theme-secondary'
})
const heroStyle = computed(() => ({ '--hero-color': `var(${hue.value})` }))
const progressStyle = computed(() => ({ '--progress-percent': `${percent.value}%` }))
function questionCount(lesson) { return Number(lesson?._count?.questions) || 0 }
function tileClass(lesson) {
  const count = questionCount(lesson)
  if (!count) return 'lesson-tile--empty'
  if (count <= 5) return 'lesson-tile--low'
  if (count <= 10) return 'lesson-tile--mid'
  return 'lesson-tile--high'
}
function tileText(lesson) { return questionCount(lesson) || t('questionBank.emptyMark') }
function lessonAria(unit, index, lesson) { return t('questionBank.lessonTileLabel', { unit: unit.title, number: index + 1, count: questionCount(lesson) }) }
</script>

<style scoped>
.overview-hero { --hero-color: var(--v-theme-primary); display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 24px; background: linear-gradient(125deg, color-mix(in srgb, rgb(var(--hero-color)) 30%, rgb(var(--v-theme-secondary))), rgb(var(--v-theme-secondary))); color: rgb(var(--v-theme-on-secondary)); }
.hero-main { display: flex; min-width: 0; align-items: center; gap: 20px; }
.hero-copy { min-width: 0; }
.hero-copy h2 { overflow-wrap: anywhere; }
.hero-progress { --progress-percent: 0%; display: grid; width: 94px; height: 94px; flex: 0 0 94px; place-items: center; border-radius: 50%; background: conic-gradient(rgb(var(--v-theme-on-secondary)) var(--progress-percent), rgba(var(--v-theme-on-secondary), .25) 0); position: relative; font-size: 21px; font-weight: 800; }
.hero-progress::before { position: absolute; width: 76px; height: 76px; border-radius: 50%; background: rgb(var(--v-theme-secondary)); content: ''; }
.hero-progress span { z-index: 1; }
.hero-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.coverage-legend { display: flex; flex-wrap: wrap; gap: 8px 14px; color: rgb(var(--v-theme-on-surface)); font-size: 13px; }
.coverage-legend span { display: inline-flex; align-items: center; gap: 6px; }
.coverage-legend i { display: inline-grid; width: 32px; height: 25px; place-items: center; border-radius: 5px; font-size: 11px; font-style: normal; font-weight: 800; }
.legend-empty { border: 1px dashed rgb(var(--v-theme-warning)); background: rgba(var(--v-theme-warning), .16); color: rgb(var(--v-theme-on-surface)); }
.legend-low { background: rgba(var(--v-theme-success), .22); color: rgb(var(--v-theme-on-surface)); }.legend-mid { background: rgba(var(--v-theme-success), .68); color: rgb(var(--v-theme-on-success)); }.legend-high { background: rgb(var(--v-theme-success)); color: rgb(var(--v-theme-on-success)); }
.unit-row { border-color: rgba(var(--v-theme-on-surface), .14); background: rgb(var(--v-theme-surface)); }
.unit-heading { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 6px 16px; margin-bottom: 12px; font-size: 14px; }
.unit-heading span { color: rgba(var(--v-theme-on-surface), .72); font-size: 13px; }
.lesson-map { display: flex; flex-wrap: wrap; gap: 8px; }
.lesson-tile { width: 42px; min-width: 42px; height: 42px; padding: 0; border: 1px solid transparent; border-radius: 8px; font-size: 14px; font-weight: 800; }
.lesson-tile--empty { border: 1px dashed rgb(var(--v-theme-warning)); background: rgba(var(--v-theme-warning), .16); color: rgb(var(--v-theme-on-surface)); }
.lesson-tile--low { background: rgba(var(--v-theme-success), .22); color: rgb(var(--v-theme-on-surface)); }.lesson-tile--mid { background: rgba(var(--v-theme-success), .68); color: rgb(var(--v-theme-on-success)); }.lesson-tile--high { background: rgb(var(--v-theme-success)); color: rgb(var(--v-theme-on-success)); }
.lesson-tile:focus-visible { outline: 3px solid rgb(var(--v-theme-primary)); outline-offset: 2px; }
.overview-skeleton { background: rgba(var(--v-theme-primary), .05); }
@media (max-width: 700px) { .overview-hero { align-items: flex-start; }.hero-main { align-items: flex-start; }.hero-progress { width: 72px; height: 72px; flex-basis: 72px; font-size: 18px; }.hero-progress::before { width: 58px; height: 58px; }.hero-actions { width: 100%; }.hero-actions :deep(.v-btn) { flex: 1 1 100%; } }
@media (prefers-reduced-motion: reduce) { .hero-progress { animation: none !important; transition: none !important; } }
</style>
