<template>
  <StudentDashboardLayout :grade-style="gradeStyle">
    <v-container class="py-8 px-4 px-md-8" style="max-width: 1240px">
      <StudentWelcomeCard
        :name="firstName"
        :grade-style="gradeStyle"
        :grade-style-label="gradeStyleLabel"
      />
      <v-card
        v-if="gamificationStore.me"
        rounded="xl"
        border
        elevation="0"
        class="pa-4 mb-4"
      >
        <div class="d-flex flex-wrap align-center justify-space-between ga-3">
          <div class="d-flex align-center ga-3">
            <v-avatar color="amber-darken-1" variant="tonal" size="44">
              <v-icon>mdi-duck</v-icon>
            </v-avatar>
            <div>
              <div class="text-subtitle-1 font-weight-bold">
                {{ t("gamification.level", { level: gamificationStore.me.level }) }} ·
                {{ isEn ? gamificationStore.me.nameEn : gamificationStore.me.name }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ gamificationStore.me.xpInLevel }} / {{ gamificationStore.me.xpToNext }} XP
                · {{ t("gamification.xpToday") }}: +{{ gamificationStore.me.xpToday }}
              </div>
            </div>
          </div>

          <div class="d-flex align-center flex-wrap ga-2">
            <v-chip color="deep-orange" variant="tonal" size="small" prepend-icon="mdi-fire">
              {{ t("gamification.streak", { days: gamificationStore.me.streak }) }}
            </v-chip>
            <v-chip
              v-for="b in gamificationStore.me.recentBadges"
              :key="b.code"
              color="amber-darken-2"
              variant="tonal"
              size="small"
              :prepend-icon="b.icon || 'mdi-medal-outline'"
            >
              {{ isEn ? b.nameEn : b.nameVi }}
            </v-chip>
            <v-btn
              size="small"
              variant="text"
              color="primary"
              @click="badgesOpen = true"
            >
              {{ t("gamification.viewAllBadges") }}
            </v-btn>
          </div>
        </div>
        <v-progress-linear
          class="mt-3"
          :model-value="xpPercent"
          color="amber-darken-1"
          height="8"
          rounded
        />
      </v-card>
      <BadgesDialog
        v-model="badgesOpen"
        :all-badges="gamificationStore.me?.allBadges || []"
        :earned-badges="gamificationStore.me?.badges || []"
      />
      <v-card
        rounded="xl"
        border
        elevation="0"
        class="pa-4 mb-6 d-flex align-center justify-space-between flex-wrap ga-3"
        :to="notebookStore.summary.dueToday > 0 ? '/student/notebook/review' : '/student/notebook'"
      >
        <div class="d-flex align-center ga-3">
          <v-avatar
            :color="notebookStore.summary.dueToday > 0 ? 'warning' : 'success'"
            variant="tonal"
            size="44"
          >
            <v-icon
              :icon="notebookStore.summary.dueToday > 0 ? 'mdi-notebook-edit-outline' : 'mdi-check-decagram-outline'"
            />
          </v-avatar>
          <div>
            <div class="text-subtitle-1 font-weight-bold">
              {{
                notebookStore.summary.dueToday > 0
                  ? t("notebook.dashboardDueTitle", { count: notebookStore.summary.dueToday })
                  : t("notebook.dashboardDoneTitle")
              }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{
                notebookStore.summary.dueToday > 0
                  ? t("notebook.dashboardDueSubtitle")
                  : t("notebook.dashboardDoneSubtitle")
              }}
            </div>
          </div>
        </div>
        <v-btn
          :color="notebookStore.summary.dueToday > 0 ? 'primary' : 'default'"
          variant="tonal"
          rounded="lg"
          append-icon="mdi-arrow-right"
        >
          {{
            notebookStore.summary.dueToday > 0
              ? t("notebook.dashboardStartAction")
              : t("notebook.dashboardOpenAction")
          }}
        </v-btn>
      </v-card>
      <StudentDashboardPanels
        :classes="dashboard.classes"
        :pending-requests="dashboard.pendingRequests"
        :is-loading="dashboard.isLoading"
        :error-message="displayError"
        @retry="dashboard.load"
      />
    </v-container>
  </StudentDashboardLayout>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "../../stores/auth";
import { useStudentDashboardStore } from "../../stores/studentDashboard";
import { useNotebookStore } from "../../stores/notebook";
import { useGamificationStore } from "../../stores/gamification";
import StudentDashboardLayout from "../../layouts/StudentDashboardLayout.vue";
import StudentWelcomeCard from "../../components/student/StudentWelcomeCard.vue";
import StudentDashboardPanels from "../../components/student/StudentDashboardPanels.vue";
import BadgesDialog from "../../components/gamification/BadgesDialog.vue";

const { t, locale } = useI18n();
const authStore = useAuthStore();
const dashboard = useStudentDashboardStore();
const notebookStore = useNotebookStore();
const gamificationStore = useGamificationStore();
const badgesOpen = ref(false);
const isEn = computed(() => String(locale.value).startsWith("en"));
const xpPercent = computed(() => {
  const me = gamificationStore.me;
  if (!me || !me.xpToNext) return 0;
  return Math.min(100, Math.round((me.xpInLevel / me.xpToNext) * 100));
});

const firstName = computed(() => {
  const name = authStore.user?.fullName?.trim();
  return name?.split(/\s+/).at(-1) || t("studentDashboard.studentFallback");
});

const gradeStyle = computed(() => {
  const bands = new Set(
    dashboard.classes.map(({ gradeLevel }) => {
      if (gradeLevel >= 1 && gradeLevel <= 5) return "primary";
      if (gradeLevel >= 6 && gradeLevel <= 9) return "middle";
      if (gradeLevel >= 10 && gradeLevel <= 12) return "high";
      return "neutral";
    }),
  );
  return bands.size === 1 ? [...bands][0] : "neutral";
});

const gradeStyleLabel = computed(() =>
  t(`studentDashboard.gradeStyles.${gradeStyle.value}`),
);
const displayError = computed(() =>
  dashboard.hasError
    ? dashboard.errorMessage || t("studentDashboard.loadError")
    : "",
);

onMounted(() => {
  dashboard.load();
  notebookStore.loadSummary();
  gamificationStore.loadMe();
});
</script>
