<template>
  <div class="mb-6">
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
      <div class="d-flex align-center justify-space-between flex-wrap ga-2">
        <span>{{ error }}</span>
        <v-btn size="small" variant="text" color="error" @click="$emit('retry')">
          {{ t("notebook.retry") }}
        </v-btn>
      </div>
    </v-alert>

    <v-row v-if="loading" dense class="mb-4">
      <v-col v-for="n in 4" :key="n" cols="6" md="3">
        <v-skeleton-loader type="list-item-two-line" rounded="xl" />
      </v-col>
    </v-row>

    <template v-else-if="stats">
      <v-row dense class="mb-4">
        <v-col cols="6" md="3">
          <v-card rounded="xl" border elevation="0" class="pa-4 h-100">
            <div class="text-caption text-medium-emphasis">{{ t("notebook.stats.totalWrong") }}</div>
            <div class="text-h5 font-weight-black mt-1">{{ stats.totalWrong }}</div>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card rounded="xl" border elevation="0" class="pa-4 h-100">
            <div class="text-caption text-medium-emphasis">{{ t("notebook.stats.mastered") }}</div>
            <div class="text-h5 font-weight-black text-success mt-1">
              {{ stats.mastered }}
              <span class="text-body-2 font-weight-medium text-medium-emphasis">
                ({{ stats.masteredRate }}%)
              </span>
            </div>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card rounded="xl" border elevation="0" class="pa-4 h-100">
            <div class="text-caption text-medium-emphasis">{{ t("notebook.stats.reviewedThisWeek") }}</div>
            <div class="text-h5 font-weight-black text-primary mt-1">
              {{ stats.reviewedThisWeek }}
              <span class="text-body-2 font-weight-medium text-medium-emphasis">
                ({{ stats.accuracyThisWeek }}%)
              </span>
            </div>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card rounded="xl" border elevation="0" class="pa-4 h-100">
            <div class="text-caption text-medium-emphasis">{{ t("notebook.stats.streakDays") }}</div>
            <div class="text-h5 font-weight-black text-warning mt-1">
              {{ stats.streakDays }} {{ t("notebook.stats.daysUnit") }}
            </div>
          </v-card>
        </v-col>
      </v-row>

      <v-card rounded="xl" border elevation="0" class="pa-4">
        <div class="d-flex align-center justify-space-between mb-3">
          <span class="text-subtitle-2 font-weight-bold">
            {{ t("notebook.stats.chartTitle") }}
          </span>
          <div class="d-flex align-center ga-3 text-caption text-medium-emphasis">
            <span class="d-flex align-center ga-1">
              <span class="legend-dot bg-success" /> {{ t("notebook.review.correctCount") }}
            </span>
            <span class="d-flex align-center ga-1">
              <span class="legend-dot bg-error" /> {{ t("notebook.review.wrongCount") }}
            </span>
          </div>
        </div>
        <div class="chart-bars">
          <div
            v-for="day in stats.reviewsByDay"
            :key="day.date"
            class="chart-col"
            :title="`${day.date}: ${day.correct} / ${day.wrong}`"
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
      </v-card>
    </template>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps({
  stats: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: "" },
});

defineEmits(["retry"]);
const { t } = useI18n();

const maxDayTotal = computed(() => {
  const list = props.stats?.reviewsByDay || [];
  const max = Math.max(1, ...list.map((d) => d.correct + d.wrong));
  return max;
});
</script>

<style scoped>
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
  background: #f1f5f9;
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
</style>
