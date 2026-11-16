<template>
  <v-layout
    class="min-vh-100 assignment-take-page play-mode-container"
    :class="`level-${session.level.value}`"
  >
    <AppHeader />
    <StudentSidebar />
    <v-main class="pb-16" :class="{ 'game-mode-main': isGameMode }">
      <v-container
        :fluid="isGameMode"
        :class="isGameMode ? 'pa-2 pa-md-4' : 'py-7 px-4 px-md-8'"
        :style="isGameMode ? 'max-width: 100%' : 'max-width: 960px'"
      >
        <v-btn
          to="/assignments"
          variant="text"
          prepend-icon="mdi-arrow-left"
          class="mb-3"
          :density="isGameMode ? 'compact' : 'default'"
        >
          {{ t("assignmentHub.backToAssignments") }}
        </v-btn>

        <v-progress-linear
          v-if="session.loading.value"
          indeterminate
          color="primary"
          rounded
        />

        <v-alert v-else-if="session.errorMessage.value" type="error" variant="tonal">
          {{ session.errorMessage.value }}
        </v-alert>

        <!-- KẾT QUẢ SAU KHI NỘP BÀI -->
        <template v-else-if="session.result.value">
          <v-card class="pa-6 mb-5" rounded="xl">
            <v-avatar color="success" variant="tonal" size="60" class="mb-3">
              <v-icon icon="mdi-check-bold" size="30" />
            </v-avatar>
            <h1 class="text-h4 font-weight-black">
              {{ t("assignmentHub.submitted") }}
            </h1>
            <p class="text-body-1">
              {{
                session.result.value.needsManualGrading
                  ? t("assignmentHub.waitForGrading")
                  : t("assignmentHub.score", { score: session.result.value.score ?? 0 })
              }}
            </p>
            <p v-if="session.result.value.totalPoints" class="text-body-2 text-secondary">
              {{
                t("assignmentHub.points", {
                  earned: session.result.value.earnedPoints,
                  total: session.result.value.totalPoints,
                })
              }}
            </p>
          </v-card>
          <v-card
            v-for="(answer, index) in session.result.value.answers"
            :key="answer.id"
            class="pa-5 mb-3"
            rounded="xl"
          >
            <div class="d-flex align-center ga-2 mb-2">
              <v-chip size="small" color="primary" variant="tonal">
                {{ t("questionBank.questionNumber", { number: index + 1 }) }}
              </v-chip>
              <v-chip
                v-if="answer.isCorrect !== null"
                size="small"
                :color="answer.isCorrect ? 'success' : 'error'"
                variant="tonal"
              >
                {{
                  answer.isCorrect
                    ? t("assignmentHub.correct")
                    : t("assignmentHub.incorrect")
                }}
              </v-chip>
            </div>
            <div class="font-weight-bold mb-2">
              {{ answer.question.content }}
            </div>
            <div v-if="answer.question.answerText" class="text-body-2 mb-1">
              <strong>{{ t("questionBank.answerText") }}:</strong>
              {{ answer.question.answerText }}
            </div>
            <div
              v-if="answer.question.explanation"
              class="text-body-2 text-secondary"
            >
              <strong>{{ t("questionBank.explanation") }}:</strong>
              {{ answer.question.explanation }}
            </div>
          </v-card>
        </template>

        <!-- VỎ MỎNG: RENDER TOÀN BỘ THEO TRANG RIÊNG CỦA TỪNG KIỂU CHƠI -->
        <template v-else-if="session.assignment.value">
          <component
            :is="activeModeComponent"
            :session="session"
          />
        </template>
      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup>
import { computed, defineAsyncComponent } from "vue";
import { useI18n } from "vue-i18n";
import { useAssignmentSession } from "../../composables/useAssignmentSession";
import AppHeader from "../../components/shared/AppHeader.vue";
import StudentSidebar from "../../components/shared/StudentSidebar.vue";
import ClassicMode from "../../components/assignment/play-modes/ClassicMode.vue";

const TowerMode = defineAsyncComponent(() => import("../../components/assignment/play-modes/tower/TowerMode.vue"));
const FruitMode = defineAsyncComponent(() => import("../../components/assignment/play-modes/fruit/FruitMode.vue"));
const RaceMode = defineAsyncComponent(() => import("../../components/assignment/play-modes/race/RaceMode.vue"));
const TreasureMode = defineAsyncComponent(() => import("../../components/assignment/play-modes/treasure/TreasureMode.vue"));
const SpaceMode = defineAsyncComponent(() => import("../../components/assignment/play-modes/space/SpaceMode.vue"));
const StreakMode = defineAsyncComponent(() => import("../../components/assignment/play-modes/streak/StreakMode.vue"));
const BossMode = defineAsyncComponent(() => import("../../components/assignment/play-modes/boss/BossMode.vue"));
const MapMode = defineAsyncComponent(() => import("../../components/assignment/play-modes/map/MapMode.vue"));
const SpeedMode = defineAsyncComponent(() => import("../../components/assignment/play-modes/speed/SpeedMode.vue"));
const PracticeMode = defineAsyncComponent(() => import("../../components/assignment/play-modes/practice/PracticeMode.vue"));
const ExamMode = defineAsyncComponent(() => import("../../components/assignment/play-modes/exam/ExamMode.vue"));
const MockMode = defineAsyncComponent(() => import("../../components/assignment/play-modes/mock/MockMode.vue"));
import "../../styles/play-modes-theme.css";

const { t } = useI18n();
const session = useAssignmentSession();

const modeComponents = {
  classic: ClassicMode,
  tower: TowerMode,
  fruit: FruitMode,
  race: RaceMode,
  treasure: TreasureMode,
  space: SpaceMode,
  streak: StreakMode,
  boss: BossMode,
  map: MapMode,
  speed: SpeedMode,
  practice: PracticeMode,
  exam: ExamMode,
  mock: MockMode,
};

const activeModeComponent = computed(() => {
  return modeComponents[session.resolvedPlayMode.value] || ClassicMode;
});

const isGameMode = computed(() => {
  const m = session.resolvedPlayMode.value;
  return m && m !== 'classic';
});
</script>

<style scoped>
.assignment-take-page {
  background: #f4f8ff;
}

.game-mode-main {
  padding-bottom: 24px !important;
}

.game-mode-main :deep(.v-container) {
  padding-top: 8px !important;
  padding-bottom: 8px !important;
}
</style>
