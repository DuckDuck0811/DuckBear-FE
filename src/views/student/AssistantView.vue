<template>
  <StudentDashboardLayout>
    <v-container class="py-6 px-4 px-md-8" style="max-width: 1000px">
      <PageHeader
        :title="t('assistant.title')"
        :subtitle="t('assistant.subtitle')"
      />

      <!-- 1. AI Coach Card -->
      <v-card rounded="xl" border elevation="0" class="pa-4 mb-5">
        <v-skeleton-loader v-if="store.coachLoading && !store.coach" type="article" />
        <v-alert v-else-if="store.coachError && !store.coach" type="error" variant="tonal" class="mb-0">
          <div class="d-flex align-center justify-space-between flex-wrap ga-2">
            <span>{{ store.coachError }}</span>
            <v-btn size="small" variant="outlined" @click="store.loadCoach()">
              {{ t("assistant.retry") }}
            </v-btn>
          </div>
        </v-alert>
        <template v-else-if="store.coach">
          <div class="d-flex flex-wrap align-start justify-space-between ga-3">
            <div class="d-flex align-start ga-3 flex-grow-1">
              <v-avatar color="amber-darken-1" size="48">
                <v-icon color="white" size="28">mdi-duck</v-icon>
              </v-avatar>
              <div class="flex-grow-1">
                <div class="d-flex align-center flex-wrap ga-2 mb-1">
                  <span class="text-subtitle-1 font-weight-bold">{{ t("assistant.coachTitle") }}</span>
                  <v-chip
                    v-if="store.coach.source === 'ai'"
                    size="x-small"
                    color="primary"
                    variant="tonal"
                    prepend-icon="mdi-sparkles"
                  >
                    {{ t("assistant.aiGeneratedLabel") }}
                  </v-chip>
                </div>
                <p class="text-body-1 mb-2">{{ store.coach.summary }}</p>
                <p class="text-body-2 text-primary font-weight-medium mb-1">
                  {{ store.coach.encouragement }}
                </p>
                <p class="text-body-2 text-medium-emphasis mb-0">
                  {{ store.coach.nextStep }}
                </p>
              </div>
            </div>

            <div class="d-flex flex-column align-end ga-1">
              <v-btn
                size="small"
                variant="tonal"
                color="primary"
                prepend-icon="mdi-refresh"
                :loading="store.refreshing"
                :disabled="!store.coach.canRefresh || store.coach.refreshesLeft <= 0"
                @click="store.triggerRefresh()"
              >
                {{ t("assistant.refreshBtn") }} ({{ store.coach.refreshesLeft }})
              </v-btn>
              <span v-if="store.refreshError" class="text-caption text-error">
                {{ store.refreshError }}
              </span>
            </div>
          </div>
        </template>
      </v-card>

      <!-- Overview Sections -->
      <template v-if="store.overviewLoading && !store.overview">
        <v-skeleton-loader type="card" class="mb-4" />
        <v-skeleton-loader type="card" />
      </template>

      <v-alert v-else-if="store.overviewError && !store.overview" type="error" variant="tonal" class="mb-4">
        <div class="d-flex align-center justify-space-between flex-wrap ga-2">
          <span>{{ store.overviewError }}</span>
          <v-btn size="small" variant="outlined" @click="store.loadOverview()">
            {{ t("assistant.retry") }}
          </v-btn>
        </div>
      </v-alert>

      <template v-else-if="store.overview">
        <EmptyState
          v-if="isCompletelyEmpty"
          icon="mdi-school-outline"
          :title="t('assistant.emptyTitle')"
          :description="t('assistant.emptyDesc')"
        />

        <template v-else>
          <!-- 2. Today Tasks + Suggested Next -->
          <v-card rounded="xl" border elevation="0" class="pa-4 mb-5">
            <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-3">
              <h2 class="text-h6 font-weight-bold">{{ t("assistant.todayTitle") }}</h2>
              <v-chip
                v-if="store.overview.todayTasks.overdueCount > 0"
                color="error"
                size="small"
                variant="tonal"
              >
                {{ t("assistant.overdueCount", { count: store.overview.todayTasks.overdueCount }) }}
              </v-chip>
            </div>

            <!-- Highlighted Suggested Next -->
            <v-alert
              color="primary"
              variant="tonal"
              rounded="lg"
              class="mb-4"
            >
              <div class="d-flex flex-wrap align-center justify-space-between ga-3">
                <div>
                  <div class="text-caption font-weight-bold text-uppercase">
                    {{ t("assistant.suggestedNextLabel") }}
                  </div>
                  <div class="text-subtitle-1 font-weight-bold">
                    {{ store.overview.suggestedNext.title }}
                  </div>
                  <div class="text-body-2">{{ store.overview.suggestedNext.reason }}</div>
                </div>
                <v-btn
                  color="primary"
                  variant="flat"
                  :to="store.overview.suggestedNext.route"
                  append-icon="mdi-arrow-right"
                >
                  {{ t("assistant.startNow") }}
                </v-btn>
              </div>
            </v-alert>

            <v-list density="comfortable" class="pa-0">
              <v-list-item
                v-if="store.overview.todayTasks.dueNotebookCount > 0"
                to="/student/notebook/review"
                rounded="lg"
                class="mb-1"
                prepend-icon="mdi-notebook-edit-outline"
              >
                <v-list-item-title class="font-weight-medium">
                  {{ t("assistant.dueNotebookItem", { count: store.overview.todayTasks.dueNotebookCount }) }}
                </v-list-item-title>
                <template #append>
                  <v-chip size="x-small" color="warning" variant="tonal">
                    {{ t("assistant.dueTodayBadge") }}
                  </v-chip>
                </template>
              </v-list-item>

              <v-list-item
                v-for="item in store.overview.todayTasks.onlineAssignmentsDue"
                :key="`online-${item.id}`"
                :to="`/assignments/${item.id}/take`"
                rounded="lg"
                class="mb-1"
                prepend-icon="mdi-clipboard-text-outline"
              >
                <v-list-item-title class="font-weight-medium">{{ item.title }}</v-list-item-title>
                <v-list-item-subtitle v-if="item.deadline">
                  {{ formatDeadline(item.deadline) }}
                </v-list-item-subtitle>
                <template #append>
                  <v-chip
                    size="x-small"
                    :color="item.overdue ? 'error' : 'warning'"
                    variant="tonal"
                  >
                    {{ item.overdue ? t("assistant.overdueBadge") : t("assistant.dueSoonBadge") }}
                  </v-chip>
                </template>
              </v-list-item>

              <v-list-item
                v-for="item in store.overview.todayTasks.manualAssignmentsDue"
                :key="`manual-${item.id}`"
                to="/manual-assignments"
                rounded="lg"
                class="mb-1"
                prepend-icon="mdi-cloud-upload-outline"
              >
                <v-list-item-title class="font-weight-medium">{{ item.title }}</v-list-item-title>
                <v-list-item-subtitle v-if="item.deadline">
                  {{ formatDeadline(item.deadline) }}
                </v-list-item-subtitle>
                <template #append>
                  <v-chip
                    size="x-small"
                    :color="item.overdue ? 'error' : 'warning'"
                    variant="tonal"
                  >
                    {{ item.overdue ? t("assistant.overdueBadge") : t("assistant.dueSoonBadge") }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card>

          <!-- 3. Weaknesses -->
          <v-card
            v-if="store.overview.weaknesses.length > 0"
            rounded="xl"
            border
            elevation="0"
            class="pa-4 mb-5"
          >
            <h2 class="text-h6 font-weight-bold mb-3">{{ t("assistant.weaknessesTitle") }}</h2>
            <v-row dense>
              <v-col
                v-for="w in store.overview.weaknesses"
                :key="w.lessonId"
                cols="12"
                md="4"
              >
                <v-card variant="outlined" rounded="lg" class="pa-3 h-100 d-flex flex-column justify-space-between">
                  <div>
                    <div class="text-caption text-medium-emphasis">{{ w.chapterTitle }}</div>
                    <div class="text-subtitle-2 font-weight-bold mb-2">{{ w.lessonTitle }}</div>
                    <div class="text-caption mb-1">
                      {{ t("assistant.wrongRateLabel", { rate: w.wrongRate, count: w.activeWrongCount }) }}
                    </div>
                    <v-progress-linear
                      :model-value="w.wrongRate"
                      color="warning"
                      height="6"
                      rounded
                      class="mb-3"
                    />
                  </div>
                  <v-btn
                    size="small"
                    variant="tonal"
                    color="primary"
                    :to="w.route"
                    block
                  >
                    {{ t("assistant.reviewThisLesson") }}
                  </v-btn>
                </v-card>
              </v-col>
            </v-row>
          </v-card>

          <!-- 4. Gamification Encouragement -->
          <v-card rounded="xl" border elevation="0" class="pa-4">
            <h2 class="text-h6 font-weight-bold mb-3">{{ t("assistant.encouragementTitle") }}</h2>
            <div class="d-flex flex-wrap align-center ga-3">
              <v-chip color="amber-darken-2" variant="tonal" prepend-icon="mdi-duck">
                {{ t("gamification.level", { level: store.overview.gamification.level }) }} ·
                {{ isEn ? store.overview.gamification.nameEn : store.overview.gamification.name }}
              </v-chip>
              <v-chip color="deep-orange" variant="tonal" prepend-icon="mdi-fire">
                {{ t("gamification.streak", { days: store.overview.gamification.streak }) }}
              </v-chip>
              <v-chip
                v-if="store.overview.gamification.streakAtRisk"
                color="warning"
                variant="tonal"
                prepend-icon="mdi-alert-outline"
              >
                {{ t("assistant.streakAtRisk") }}
              </v-chip>
              <v-chip
                v-if="store.overview.gamification.nextBadgeHint"
                color="primary"
                variant="tonal"
                prepend-icon="mdi-medal-outline"
              >
                {{ t("assistant.nextBadgeHint", { days: store.overview.gamification.nextBadgeHint.remaining }) }}
              </v-chip>
            </div>
          </v-card>
        </template>
      </template>
    </v-container>
  </StudentDashboardLayout>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import StudentDashboardLayout from "../../layouts/StudentDashboardLayout.vue";
import PageHeader from "../../components/shared/PageHeader.vue";
import EmptyState from "../../components/shared/EmptyState.vue";
import { useAssistantStore } from "../../stores/assistant";

const { t, locale } = useI18n();
const store = useAssistantStore();
const isEn = computed(() => String(locale.value).startsWith("en"));

const isCompletelyEmpty = computed(() => {
  const ov = store.overview;
  if (!ov) return false;
  return (
    ov.todayTasks.dueNotebookCount === 0 &&
    ov.todayTasks.onlineAssignmentsDue.length === 0 &&
    ov.todayTasks.manualAssignmentsDue.length === 0 &&
    ov.weaknesses.length === 0 &&
    ov.gamification.xpWeek === 0
  );
});

function formatDeadline(d) {
  try {
    return new Date(d).toLocaleString(isEn.value ? "en-US" : "vi-VN");
  } catch {
    return "";
  }
}

onMounted(() => {
  store.loadOverview();
  store.loadCoach();
});
</script>
