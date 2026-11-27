<template>
  <v-card v-if="loading || chapters.length" rounded="xl" border elevation="0" class="pa-4 mb-6">
    <div class="text-subtitle-1 font-weight-bold mb-3">
      {{ t("notebook.weakChapters.title") }}
    </div>

    <div v-if="loading" class="d-flex flex-column ga-2">
      <v-skeleton-loader v-for="n in 2" :key="n" type="list-item-two-line" />
    </div>

    <div v-else class="d-flex flex-column ga-3">
      <div
        v-for="ch in chapters"
        :key="ch.chapterId"
        class="d-flex flex-wrap align-center justify-space-between ga-3"
      >
        <div class="flex-grow-1" style="min-width: 220px">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-body-2 font-weight-medium">{{ ch.title }}</span>
            <span class="text-caption text-medium-emphasis">
              {{ ch.mastered }}/{{ ch.active + ch.mastered }} {{ t("notebook.tabs.mastered") }}
            </span>
          </div>
          <v-progress-linear
            :model-value="progressValue(ch)"
            color="success"
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
          {{ t("notebook.weakChapters.reviewChapter") }}
        </v-btn>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { useI18n } from "vue-i18n";

defineProps({
  chapters: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

const { t } = useI18n();

function progressValue(ch) {
  const total = ch.active + ch.mastered;
  return total > 0 ? Math.round((ch.mastered / total) * 100) : 0;
}
</script>
