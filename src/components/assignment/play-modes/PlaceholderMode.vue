<template>
  <div>
    <!-- Banner kiểu chơi đang phát triển -->
    <v-card
      class="pa-5 mb-4 placeholder-banner"
      :class="`level-${level}-banner`"
      rounded="xl"
      variant="tonal"
    >
      <div class="d-flex align-center ga-3">
        <v-avatar :color="modeColor" size="52" variant="tonal">
          <v-icon :icon="modeIcon" size="28" />
        </v-avatar>
        <div class="flex-grow-1">
          <div class="text-overline font-weight-bold" :style="{ color: modeColor }">
            {{ t("playModes.comingSoon") }}
          </div>
          <div class="text-h6 font-weight-black">{{ modeName }}</div>
          <div class="text-body-2 text-secondary">{{ modeDescription }}</div>
        </div>
        <v-chip color="orange" variant="tonal" size="small" prepend-icon="mdi-wrench">
          {{ t("playModes.inDevelopment") }}
        </v-chip>
      </div>
      <v-divider class="my-3" />
      <div class="text-body-2 text-secondary d-flex align-center ga-1">
        <v-icon icon="mdi-information-outline" size="16" />
        {{ t("playModes.usingClassicFallback", { mode: modeName }) }}
      </div>
    </v-card>

    <!-- Render ClassicMode bên dưới -->
    <ClassicMode
      :assignment="assignment"
      :questions="questions"
      :answers="answers"
      :attempt-id="attemptId"
      :loading="loading"
      :submitting="submitting"
      :level="level"
      @submit="$emit('submit')"
      @answer-change="(e) => $emit('answer-change', e)"
    />
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import ClassicMode from "./ClassicMode.vue";

const { t } = useI18n();

const props = defineProps({
  assignment: { type: Object, required: true },
  questions: { type: Array, required: true },
  answers: { type: Object, required: true },
  attemptId: { type: [String, Number], default: null },
  loading: { type: Boolean, default: false },
  submitting: { type: Boolean, default: false },
  level: { type: Number, default: 3 },
  selectedPlayMode: { type: String, default: "classic" },
});

defineEmits(["submit", "answer-change"]);

// Map mỗi kiểu -> icon + màu
const MODE_META = {
  fruit:    { icon: "mdi-fruit-cherries",    color: "#e53935" },
  race:     { icon: "mdi-racing-helmet",     color: "#fb8c00" },
  treasure: { icon: "mdi-treasure-chest",    color: "#f9a825" },
  space:    { icon: "mdi-rocket-launch",     color: "#5c6bc0" },
  streak:   { icon: "mdi-fire",              color: "#ef6c00" },
  boss:     { icon: "mdi-sword-cross",       color: "#c62828" },
  map:      { icon: "mdi-map-legend",        color: "#2e7d32" },
  speed:    { icon: "mdi-speedometer",       color: "#00838f" },
  mock:     { icon: "mdi-clipboard-text",    color: "#37474f" },
};

const meta = computed(() => MODE_META[props.selectedPlayMode] || { icon: "mdi-gamepad-variant", color: "#546e7a" });
const modeIcon = computed(() => meta.value.icon);
const modeColor = computed(() => meta.value.color);

// Lấy tên & mô tả từ i18n
const modeName = computed(() =>
  t(`playModes.modes.${props.selectedPlayMode}.name`, props.selectedPlayMode)
);
const modeDescription = computed(() =>
  t(`playModes.modes.${props.selectedPlayMode}.description`, "")
);
</script>

<style scoped>
.placeholder-banner {
  border: 2px dashed rgba(0, 0, 0, 0.12);
}
</style>
