<template>
  <div class="question-overview">
    <v-card
      v-if="loading"
      class="overview-skeleton pa-6 rounded-xl"
      variant="tonal"
      aria-busy="true"
    >
      <v-skeleton-loader type="image, article, list-item-three-line" />
    </v-card>
    <v-alert v-else-if="error" type="error" variant="tonal" rounded="xl">
      <div class="d-flex flex-wrap align-center justify-space-between ga-3">
        <span>{{ error }}</span
        ><v-btn variant="text" @click="emit('retry')">{{
          t("classSeatMap.retry")
        }}</v-btn>
      </div>
    </v-alert>
    <template v-else-if="book">
      <v-card
        class="overview-hero pa-4 rounded-xl mb-4"
        :style="heroStyle"
        variant="flat"
      >
        <div class="hero-main">
          <div
            class="hero-progress"
            :style="progressStyle"
            role="img"
            :aria-label="t('questionBank.coveragePercent', { percent })"
          >
            <span>{{ t("questionBank.percentShort", { percent }) }}</span>
          </div>
          <div class="hero-copy">
            <v-chip
              v-if="!canManage"
              size="small"
              color="white"
              variant="outlined"
              class="mb-2"
              >{{ t("questionBank.readOnlyLabel") }}</v-chip
            >
            <h2 class="text-h5 font-weight-black mb-1">{{ book.title }}</h2>
            <p class="text-body-2 mb-0">{{ heroSummary }}</p>
          </div>
        </div>
        <div class="hero-actions">
          <v-btn
            v-if="canManage && firstEmptyLesson"
            color="white"
            variant="flat"
            prepend-icon="mdi-arrow-down-right"
            @click="emit('select-lesson', firstEmptyLesson)"
            >{{ t("questionBank.goToFirstEmptyLesson") }}</v-btn
          >
          <v-btn
            v-if="recentLesson"
            color="white"
            variant="outlined"
            prepend-icon="mdi-history"
            @click="emit('continue')"
            >{{ t("questionBank.continueRecent") }}</v-btn
          >
        </div>
      </v-card>

      <div
        class="map-heading d-flex flex-wrap align-center justify-space-between ga-3 mb-3"
      >
        <h3 class="text-h6 font-weight-bold mb-0">
          {{ t("questionBank.coverageMap") }}
        </h3>
        <div
          class="coverage-legend"
          :aria-label="t('questionBank.coverageLegend')"
        >
          <span
            ><i class="legend-empty">{{ t("questionBank.emptyMark") }}</i
            >{{ t("questionBank.noQuestions") }}</span
          >
          <span
            ><i class="legend-low">{{ t("questionBank.rangeOneToFive") }}</i
            >{{ t("questionBank.oneToFive") }}</span
          >
          <span
            ><i class="legend-mid">{{ t("questionBank.rangeSixToTen") }}</i
            >{{ t("questionBank.sixToTen") }}</span
          >
          <span
            ><i class="legend-high">{{ t("questionBank.rangeElevenPlus") }}</i
            >{{ t("questionBank.elevenPlus") }}</span
          >
          <span
            ><i class="legend-thin"><b /></i
            >{{ t("questionBank.thinQuestionsLabel") }}</span
          >
        </div>
      </div>
      <v-card
        v-if="!units.length"
        class="pa-5 text-body-2 text-medium-emphasis rounded-xl"
        variant="tonal"
        >{{ t("questionBank.noLessons") }}</v-card
      >
      <div v-else class="unit-grid">
        <section v-for="unit in units" :key="unit.id" class="unit-row">
          <div class="unit-heading">
            <strong>{{ unit.title }}</strong>
          </div>
          <span class="unit-coverage">{{
            t("questionBank.unitCoverage", {
              count: unit.filled,
              total: unit.lessons.length,
            })
          }}</span>
          <div class="lesson-map">
            <v-tooltip
              v-for="(lesson, index) in unit.lessons"
              :key="lesson.id"
              :text="lessonTooltip(unit, index, lesson)"
              location="top"
            >
              <template #activator="{ props: tooltipProps }">
                <v-btn
                  v-bind="tooltipProps"
                  class="lesson-tile"
                  :class="tileClass(lesson)"
                  :aria-label="lessonAria(unit, index, lesson)"
                  :title="lessonTooltip(unit, index, lesson)"
                  @click="
                    emit('select-lesson', { book, chapter: unit, lesson })
                  "
                >
                  <span class="lesson-tile-number">{{
                    t("questionBank.lessonNumberShort", { number: index + 1 })
                  }}</span>
                  <span class="lesson-tile-count">{{ tileText(lesson) }}</span>
                  <span
                    v-if="isThin(lesson)"
                    class="lesson-thin-mark"
                    aria-hidden="true"
                    >!</span
                  >
                  <i
                    v-if="isThin(lesson)"
                    class="lesson-thin-dot"
                    aria-hidden="true"
                  />
                </v-btn>
              </template>
            </v-tooltip>
          </div>
        </section>
      </div>
    </template>
    <v-card
      v-else
      class="overview-empty pa-8 rounded-xl text-center"
      variant="tonal"
    >
      <v-icon
        icon="mdi-book-open-page-variant-outline"
        size="42"
        color="primary"
        class="mb-2"
      />
      <p class="text-body-2 text-medium-emphasis mb-0">
        {{ t("questionBank.selectBookHint") }}
      </p>
      <v-btn
        v-if="recentLesson"
        class="mt-4"
        color="primary"
        variant="tonal"
        prepend-icon="mdi-history"
        @click="emit('continue')"
        >{{ t("questionBank.continueRecent") }}</v-btn
      >
    </v-card>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  getSubjectTheme,
  subjectThemeGradient,
  subjectThemeStyle,
} from "../../utils/subjectTheme.js";

const props = defineProps({
  book: { type: Object, default: null },
  loading: Boolean,
  error: { type: String, default: "" },
  canManage: Boolean,
  recentLesson: { type: Object, default: null },
});
const emit = defineEmits(["retry", "select-lesson", "continue"]);
const { t } = useI18n();
const units = computed(() =>
  (props.book?.chapters || []).map((chapter) => {
    const lessons = chapter.lessons || [];
    return {
      ...chapter,
      lessons,
      filled: lessons.filter((lesson) => Number(lesson?._count?.questions) > 0)
        .length,
    };
  }),
);
const total = computed(() =>
  units.value.reduce((sum, unit) => sum + unit.lessons.length, 0),
);
const filled = computed(() =>
  units.value.reduce((sum, unit) => sum + unit.filled, 0),
);
const percent = computed(() =>
  total.value ? Math.round((filled.value * 100) / total.value) : 0,
);
const emptyCount = computed(() => total.value - filled.value);
const heroSummary = computed(() =>
  !total.value
    ? t("questionBank.noLessons")
    : emptyCount.value
      ? t("questionBank.coverageSummary", {
          count: filled.value,
          total: total.value,
          empty: emptyCount.value,
        })
      : t("questionBank.coverageComplete", {
          count: filled.value,
          total: total.value,
        }),
);
const firstEmptyLesson = computed(() => {
  const unit = units.value.find((item) =>
    item.lessons.some((lesson) => !questionCount(lesson)),
  );
  const lesson = unit?.lessons.find((item) => !questionCount(item));
  return lesson ? { book: props.book, chapter: unit, lesson } : null;
});
const subjectTheme = computed(() =>
  getSubjectTheme(props.book?.subject, props.book?.gradeLevel),
);
const heroStyle = computed(() => ({
  ...subjectThemeStyle(subjectTheme.value),
  "--subject-gradient": subjectThemeGradient(subjectTheme.value),
}));
const progressStyle = computed(() => ({
  "--progress-percent": `${percent.value}%`,
}));
const THIN_QUESTION_THRESHOLD = 5;
function isThin(lesson) {
  const count = questionCount(lesson);
  return count > 0 && count < THIN_QUESTION_THRESHOLD;
}
function questionCount(lesson) {
  return Number(lesson?._count?.questions) || 0;
}
function tileClass(lesson) {
  const count = questionCount(lesson);
  if (!count) return "lesson-tile--empty";
  if (count <= THIN_QUESTION_THRESHOLD)
    return `lesson-tile--low${isThin(lesson) ? " lesson-tile--thin" : ""}`;
  if (count <= 10) return "lesson-tile--mid";
  return "lesson-tile--high";
}
function tileText(lesson) {
  return questionCount(lesson);
}
function lessonAria(unit, index, lesson) {
  return t("questionBank.lessonTileLabel", {
    unit: unit.title,
    number: index + 1,
    title: lesson.title,
    count: questionCount(lesson),
  });
}
function lessonTooltip(unit, index, lesson) {
  return isThin(lesson)
    ? t("questionBank.thinLessonTooltip", {
        unit: unit.title,
        number: index + 1,
        title: lesson.title,
        count: questionCount(lesson),
      })
    : lessonAria(unit, index, lesson);
}
</script>

<style scoped>
.overview-hero {
  display: flex;
  min-height: 104px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 20px;
  background: var(--subject-gradient);
  color: rgb(var(--v-theme-on-secondary));
}
.hero-main {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 14px;
}
.hero-copy {
  min-width: 0;
}
.hero-copy h2 {
  overflow-wrap: anywhere;
}
.hero-progress {
  --progress-percent: 0%;
  display: grid;
  width: 72px;
  height: 72px;
  flex: 0 0 72px;
  place-items: center;
  border-radius: 50%;
  background: conic-gradient(
    rgb(var(--v-theme-on-secondary)) var(--progress-percent),
    rgba(var(--v-theme-on-secondary), 0.25) 0
  );
  position: relative;
  font-size: 18px;
  font-weight: 800;
}
.hero-progress::before {
  position: absolute;
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: rgb(var(--v-theme-secondary));
  content: "";
}
.hero-progress span {
  z-index: 1;
}
.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.coverage-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  color: rgb(var(--v-theme-on-surface));
  font-size: 13px;
}
.coverage-legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.coverage-legend i {
  display: inline-grid;
  width: 32px;
  height: 25px;
  place-items: center;
  border-radius: 5px;
  font-size: 11px;
  font-style: normal;
  font-weight: 800;
}
.legend-empty {
  border: 1px dashed rgb(var(--v-theme-warning));
  background: rgba(var(--v-theme-warning), 0.16);
  color: rgb(var(--v-theme-on-surface));
}
.legend-low {
  background: rgba(var(--v-theme-success), 0.22);
  color: rgb(var(--v-theme-on-surface));
}
.legend-mid {
  background: rgba(var(--v-theme-success), 0.68);
  color: rgb(var(--v-theme-on-success));
}
.legend-high {
  background: rgb(var(--v-theme-success));
  color: rgb(var(--v-theme-on-success));
}
.unit-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px 16px;
}
.unit-row {
  min-width: 0;
  padding: 8px 2px 10px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}
.unit-heading {
  min-width: 0;
  margin-bottom: 0;
  font-size: 14px;
}
.unit-heading strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.unit-coverage {
  display: block;
  min-height: 18px;
  margin: 3px 0 7px;
  color: rgba(var(--v-theme-on-surface), 0.72);
  font-size: 13px;
}
.lesson-map {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.lesson-tile {
  position: relative;
  width: 42px;
  min-width: 42px;
  height: 42px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 800;
}
.lesson-tile :deep(.v-btn__content) {
  width: 100%;
  height: 100%;
}
.lesson-tile-number {
  position: absolute;
  top: 2px;
  left: 4px;
  font-size: 9px;
  font-weight: 600;
  line-height: 1;
}
.lesson-tile-count {
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
}
.lesson-thin-mark {
  position: absolute;
  top: 1px;
  right: 3px;
  color: rgb(var(--v-theme-warning));
  font-size: 9px;
  font-weight: 900;
  line-height: 1;
}
.lesson-thin-dot {
  position: absolute;
  top: 12px;
  right: 4px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgb(var(--v-theme-warning));
}
.legend-thin {
  border: 1px solid rgba(var(--v-theme-warning), 0.7);
  background: rgba(var(--v-theme-warning), 0.14);
}
.legend-thin b {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgb(var(--v-theme-warning));
}
.lesson-tile--empty {
  border: 1px dashed rgb(var(--v-theme-warning));
  background: rgba(var(--v-theme-warning), 0.16);
  color: rgb(var(--v-theme-on-surface));
}
.lesson-tile--low {
  background: rgba(var(--v-theme-success), 0.22);
  color: rgb(var(--v-theme-on-surface));
}
.lesson-tile--mid {
  background: rgba(var(--v-theme-success), 0.68);
  color: rgb(var(--v-theme-on-success));
}
.lesson-tile--high {
  background: rgb(var(--v-theme-success));
  color: rgb(var(--v-theme-on-success));
}
.lesson-tile:focus-visible {
  outline: 3px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
.overview-skeleton {
  background: rgba(var(--v-theme-primary), 0.05);
}
@media (min-width: 1280px) {
  .unit-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 1023.98px) {
  .unit-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .overview-hero {
    align-items: flex-start;
  }
  .hero-actions {
    width: 100%;
  }
  .hero-actions :deep(.v-btn) {
    flex: 1 1 100%;
  }
}
@media (prefers-reduced-motion: reduce) {
  .hero-progress {
    animation: none !important;
    transition: none !important;
  }
}
</style>
