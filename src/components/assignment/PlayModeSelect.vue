<template>
  <div class="play-mode-select-container">
    <div class="field-label mb-2 text-caption font-weight-bold text-secondary d-flex align-center justify-space-between">
      <div class="d-flex align-center">
        <v-icon icon="mdi-gamepad-variant-outline" size="16" class="mr-1 text-primary" />
        <span>{{ t("assignmentHub.playMode") }}</span>
      </div>
      <span v-if="disabled" class="text-warning text-caption">
        (Đã có lượt làm bài - đã khóa)
      </span>
    </div>

    <!-- 1. Tùy chọn mặc định theo lớp (Auto) -->
    <div
      class="pa-3 mb-3 rounded-xl border d-flex flex-column cursor-pointer mode-card"
      :class="{
        'mode-card--active': modelValue === 'auto',
        'mode-card--disabled': disabled,
      }"
      @click="selectMode('auto')"
    >
      <div class="d-flex align-center ga-2 mb-1">
        <v-icon icon="mdi-auto-fix" size="20" color="primary" />
        <span class="font-weight-bold text-body-2">{{ t("assignmentHub.modeAuto") }}</span>
        <v-chip size="x-small" color="primary" variant="flat" class="ml-auto font-weight-bold">
          Mặc định
        </v-chip>
      </div>
      <span class="text-caption text-secondary" style="line-height: 1.3">
        {{ t("assignmentHub.modeAutoDesc") }}
      </span>
    </div>

    <!-- 2. Nhóm các kiểu theo cấp -->
    <div v-for="group in modeGroups" :key="group.title" class="mb-3">
      <div class="text-caption font-weight-bold text-secondary mb-1 d-flex align-center ga-1">
        <v-icon icon="mdi-circle-medium" size="14" :color="group.color" />
        <span>{{ group.title }}</span>
      </div>
      <v-row dense>
        <v-col
          v-for="opt in group.items"
          :key="opt.value"
          cols="12"
          sm="6"
        >
          <div
            class="pa-3 rounded-xl border d-flex flex-column cursor-pointer mode-card h-100"
            :class="{
              'mode-card--active': modelValue === opt.value,
              'mode-card--disabled': disabled,
            }"
            @click="selectMode(opt.value)"
          >
            <div class="d-flex align-center ga-2 mb-1">
              <v-icon :icon="opt.icon" size="18" :color="opt.color" />
              <span class="font-weight-bold text-body-2">{{ opt.title }}</span>
              <v-chip
                v-if="opt.implemented"
                size="x-small"
                color="success"
                variant="tonal"
                class="ml-auto font-weight-medium"
              >
                GĐ1
              </v-chip>
            </div>
            <span class="text-caption text-secondary" style="line-height: 1.3">
              {{ opt.desc }}
            </span>
          </div>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps({
  modelValue: { type: String, default: "auto" },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue"]);
const { t } = useI18n();

function selectMode(val) {
  if (props.disabled) return;
  emit("update:modelValue", val);
}

const modeGroups = computed(() => [
  {
    title: t("assignmentHub.level1Group"),
    color: "success",
    items: [
      {
        value: "tower",
        title: t("assignmentHub.modeTower"),
        desc: t("assignmentHub.modeTowerDesc"),
        icon: "mdi-castle",
        color: "emerald-darken-1",
        implemented: true,
      },
      {
        value: "fruit",
        title: t("assignmentHub.modeFruit"),
        desc: t("assignmentHub.modeFruitDesc"),
        icon: "mdi-fruit-cherries",
        color: "green",
        implemented: false,
      },
      {
        value: "race",
        title: t("assignmentHub.modeRace"),
        desc: t("assignmentHub.modeRaceDesc"),
        icon: "mdi-racing-helmet",
        color: "amber-darken-3",
        implemented: false,
      },
      {
        value: "treasure",
        title: t("assignmentHub.modeTreasure"),
        desc: t("assignmentHub.modeTreasureDesc"),
        icon: "mdi-treasure-chest",
        color: "orange",
        implemented: false,
      },
      {
        value: "space",
        title: t("assignmentHub.modeSpace"),
        desc: t("assignmentHub.modeSpaceDesc"),
        icon: "mdi-rocket-launch",
        color: "cyan",
        implemented: false,
      },
    ],
  },
  {
    title: t("assignmentHub.level2Group"),
    color: "indigo",
    items: [
      {
        value: "streak",
        title: t("assignmentHub.modeStreak"),
        desc: t("assignmentHub.modeStreakDesc"),
        icon: "mdi-fire",
        color: "deep-orange",
        implemented: false,
      },
      {
        value: "boss",
        title: t("assignmentHub.modeBoss"),
        desc: t("assignmentHub.modeBossDesc"),
        icon: "mdi-sword-cross",
        color: "red-darken-2",
        implemented: false,
      },
      {
        value: "map",
        title: t("assignmentHub.modeMap"),
        desc: t("assignmentHub.modeMapDesc"),
        icon: "mdi-map-legend",
        color: "indigo",
        implemented: false,
      },
      {
        value: "speed",
        title: t("assignmentHub.modeSpeed"),
        desc: t("assignmentHub.modeSpeedDesc"),
        icon: "mdi-timer-fast-outline",
        color: "purple",
        implemented: false,
      },
    ],
  },
  {
    title: t("assignmentHub.level3Group"),
    color: "blue-darken-2",
    items: [
      {
        value: "practice",
        title: t("assignmentHub.modePractice"),
        desc: t("assignmentHub.modePracticeDesc"),
        icon: "mdi-book-open-page-variant",
        color: "blue-darken-2",
        implemented: true,
      },
      {
        value: "exam",
        title: t("assignmentHub.modeExam"),
        desc: t("assignmentHub.modeExamDesc"),
        icon: "mdi-file-document-edit-outline",
        color: "blue-grey-darken-3",
        implemented: true,
      },
      {
        value: "mock",
        title: t("assignmentHub.modeMock"),
        desc: t("assignmentHub.modeMockDesc"),
        icon: "mdi-school-outline",
        color: "teal-darken-2",
        implemented: false,
      },
    ],
  },
  {
    title: t("assignmentHub.classicGroup"),
    color: "blue-grey",
    items: [
      {
        value: "classic",
        title: t("assignmentHub.modeClassic"),
        desc: t("assignmentHub.modeClassicDesc"),
        icon: "mdi-view-headline",
        color: "blue-grey-darken-2",
        implemented: true,
      },
    ],
  },
]);
</script>

<style scoped>
.mode-card {
  transition: all 0.2s ease;
  background-color: #ffffff;
  border-color: #e2e8f0 !important;
}

.mode-card:hover:not(.mode-card--disabled) {
  border-color: #3b82f6 !important;
  background-color: #f8fafc;
  transform: translateY(-1px);
}

.mode-card--active {
  border-color: #2563eb !important;
  border-width: 2px !important;
  background-color: #eff6ff !important;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.12);
}

.mode-card--disabled {
  opacity: 0.6;
  cursor: not-allowed !important;
}
</style>
