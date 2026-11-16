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
                v-if="!opt.implemented"
                size="x-small"
                color="warning"
                variant="tonal"
                class="ml-auto font-weight-medium"
              >
                {{ t("playModes.comingSoon") || "Sắp có (tạm dùng classic)" }}
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
    title: t("assignmentHub.level1Group") || "Cấp 1: Tiểu học (Lớp 1 - 5)",
    color: "success",
    items: [
      {
        value: "tower",
        title: t("playModes.modes.tower.name") || "Leo tháp",
        desc: t("playModes.modes.tower.description") || "Mỗi lần 1 câu; đúng leo 1 tầng, sai đứng yên.",
        icon: "mdi-castle",
        color: "emerald-darken-1",
        implemented: true,
      },
      {
        value: "fruit",
        title: t("playModes.modes.fruit.name") || "Hái quả",
        desc: t("playModes.modes.fruit.description") || "Đúng thì hái 1 quả bỏ vào giỏ, sai quả vẫn treo.",
        icon: "mdi-fruit-cherries",
        color: "green",
        implemented: true,
      },
      {
        value: "race",
        title: t("playModes.modes.race.name") || "Đua xe",
        desc: t("playModes.modes.race.description") || "Đúng thì xe tiến 1 đoạn, về đích khi hết bài.",
        icon: "mdi-racing-helmet",
        color: "amber-darken-3",
        implemented: true,
      },
      {
        value: "treasure",
        title: t("playModes.modes.treasure.name") || "Săn kho báu",
        desc: t("playModes.modes.treasure.description") || "Đúng mở 1 mảnh bản đồ, đủ mảnh mở rương.",
        icon: "mdi-treasure-chest",
        color: "orange",
        implemented: true,
      },
      {
        value: "space",
        title: t("playModes.modes.space.name") || "Du hành vũ trụ",
        desc: t("playModes.modes.space.description") || "Tên lửa bay qua các hành tinh, mỗi hành tinh 5 câu.",
        icon: "mdi-rocket-launch",
        color: "cyan",
        implemented: true,
      },
    ],
  },
  {
    title: t("assignmentHub.level2Group") || "Cấp 2: THCS (Lớp 6 - 9)",
    color: "indigo",
    items: [
      {
        value: "streak",
        title: t("playModes.modes.streak.name") || "Chuỗi lửa",
        desc: t("playModes.modes.streak.description") || "Đúng liên tiếp tăng combo, sai thì reset; huy hiệu mốc 5, 10, 20.",
        icon: "mdi-fire",
        color: "deep-orange",
        implemented: true,
      },
      {
        value: "boss",
        title: t("playModes.modes.boss.name") || "Đánh trùm",
        desc: t("playModes.modes.boss.description") || "Mỗi câu đúng giảm thanh máu boss.",
        icon: "mdi-sword-cross",
        color: "red-darken-2",
        implemented: true,
      },
      {
        value: "map",
        title: t("playModes.modes.map.name") || "Chinh phục bản đồ",
        desc: t("playModes.modes.map.description") || "Chia chặng (~5 câu/chặng), xong chặng mở vùng mới.",
        icon: "mdi-map-legend",
        color: "indigo",
        implemented: true,
      },
      {
        value: "speed",
        title: t("playModes.modes.speed.name") || "Vượt tốc",
        desc: t("playModes.modes.speed.description") || "Mỗi câu đếm ngược ngắn, hết giờ tự qua câu và tính là bỏ trống.",
        icon: "mdi-timer-fast-outline",
        color: "purple",
        implemented: true,
      },
    ],
  },
  {
    title: t("assignmentHub.level3Group") || "Cấp 3: THPT (Lớp 10 - 12)",
    color: "blue-darken-2",
    items: [
      {
        value: "practice",
        title: t("playModes.modes.practice.name") || "Luyện tập",
        desc: t("playModes.modes.practice.description") || "Mỗi lần 1 câu, trả lời xong hiện đúng/sai + lời giải ngay.",
        icon: "mdi-book-open-page-variant",
        color: "blue-darken-2",
        implemented: true,
      },
      {
        value: "exam",
        title: t("playModes.modes.exam.name") || "Phòng thi",
        desc: t("playModes.modes.exam.description") || "Đồng hồ, bảng số câu, nút xem lại, không hiện đúng/sai.",
        icon: "mdi-file-document-edit-outline",
        color: "blue-grey-darken-3",
        implemented: true,
      },
      {
        value: "mock",
        title: t("playModes.modes.mock.name") || "Thi thử THPT",
        desc: t("playModes.modes.mock.description") || "Chia phần, đồng hồ tổng, nộp một lần, chỉ hiện kết quả sau khi nộp.",
        icon: "mdi-school-outline",
        color: "teal-darken-2",
        implemented: true,
      },
    ],
  },
  {
    title: t("assignmentHub.classicGroup") || "Kiểu dự phòng",
    color: "blue-grey",
    items: [
      {
        value: "classic",
        title: t("playModes.modes.classic.name") || "Cơ bản (Classic)",
        desc: t("playModes.modes.classic.description") || "Giao diện truyền thống, thanh tiến độ, bảng số câu 1..N.",
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
