<template>
  <v-card rounded="xl" border elevation="0" class="pa-4 mb-6">
    <div class="d-flex flex-wrap align-center justify-space-between ga-3">
      <div>
        <div class="text-subtitle-1 font-weight-bold">
          {{ t("notebook.quickReview.title") }}
        </div>
        <div class="text-caption text-medium-emphasis">
          {{
            dueToday > 0
              ? t("notebook.quickReview.dueHint", { count: dueToday })
              : t("notebook.quickReview.freeHint")
          }}
        </div>
      </div>

      <div class="d-flex flex-wrap align-center ga-2">
        <v-btn
          color="primary"
          rounded="lg"
          prepend-icon="mdi-play-circle-outline"
          :to="
            dueToday > 0
              ? '/student/notebook/review?mode=due'
              : '/student/notebook/review?mode=free'
          "
        >
          {{
            dueToday > 0
              ? t("notebook.quickReview.reviewDue", { count: dueToday })
              : t("notebook.quickReview.reviewFree")
          }}
        </v-btn>

        <v-btn
          variant="tonal"
          rounded="lg"
          prepend-icon="mdi-repeat"
          to="/student/notebook/review?mode=frequent"
        >
          {{ t("notebook.quickReview.reviewFrequent") }}
        </v-btn>

        <v-menu v-if="chapters.length">
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              variant="outlined"
              rounded="lg"
              append-icon="mdi-chevron-down"
            >
              {{ t("notebook.quickReview.reviewByChapter") }}
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item
              v-for="ch in chapters"
              :key="ch.chapterId"
              :title="ch.title"
              :subtitle="`${ch.active} ${t('notebook.tabs.active')}`"
              :to="`/student/notebook/review?mode=chapter&chapterId=${ch.chapterId}`"
            />
          </v-list>
        </v-menu>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { useI18n } from "vue-i18n";

defineProps({
  dueToday: { type: Number, default: 0 },
  chapters: { type: Array, default: () => [] },
});

const { t } = useI18n();
</script>
