<template>
  <div class="competitive-mode-decorator mb-5">
    <v-card class="pa-4 pa-md-5 rounded-xl border leaderboard-card" elevation="0">
      <div class="d-flex align-center justify-space-between flex-wrap ga-3">
        <!-- Streak Counter -->
        <div class="d-flex align-center ga-3">
          <div class="streak-badge px-3 py-2 rounded-lg d-flex align-center ga-2">
            <v-icon icon="mdi-fire" size="24" color="white" />
            <div>
              <div class="text-caption font-weight-black text-uppercase" style="letter-spacing: 1px">
                Streak
              </div>
              <div class="text-h6 font-weight-black line-height-1">
                {{ streak }}
              </div>
            </div>
          </div>

          <div>
            <div class="font-weight-black text-indigo-darken-3 text-subtitle-2 d-flex align-center ga-1">
              <span>{{ rankLabel }}</span>
              <v-chip size="x-small" color="indigo" variant="flat" class="font-weight-bold">
                {{ tierName }}
              </v-chip>
            </div>
            <div class="text-caption text-secondary">
              Đã hoàn thành: {{ answeredCount }}/{{ totalQuestions }} câu hỏi
            </div>
          </div>
        </div>

        <!-- Pace / Milestone Badge -->
        <div class="d-flex align-center ga-2">
          <v-chip
            v-if="streak >= 3"
            color="red"
            variant="flat"
            prepend-icon="mdi-lightning-bolt"
            class="font-weight-black animate-pulse"
          >
            COMBO X{{ Math.min(5, Math.floor(streak / 2) + 1) }}!
          </v-chip>
          <div class="text-right text-caption font-weight-bold text-secondary">
            <div>Tiến độ bài thi</div>
            <span class="text-body-2 font-weight-black text-indigo">{{ Math.round(progressPercent) }}%</span>
          </div>
        </div>
      </div>

      <!-- Linear progress bar with electric indigo style -->
      <div class="mt-3">
        <v-progress-linear
          :model-value="progressPercent"
          height="8"
          rounded="pill"
          color="indigo-darken-1"
          bg-color="indigo-lighten-4"
        />
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  totalQuestions: { type: Number, default: 0 },
  answeredCount: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
});

const progressPercent = computed(() => {
  if (!props.totalQuestions) return 0;
  return Math.min(100, (props.answeredCount / props.totalQuestions) * 100);
});

const tierName = computed(() => {
  if (props.streak >= 10) return "Kim Cương 💎";
  if (props.streak >= 6) return "Vàng 🥇";
  if (props.streak >= 3) return "Bạc 🥈";
  return "Đồng 🥉";
});

const rankLabel = computed(() => {
  if (props.streak >= 10) return "Bất khả chiến bại!";
  if (props.streak >= 6) return "Phong độ đỉnh cao!";
  if (props.streak >= 3) return "Tăng tốc thi đua!";
  return "Sẵn sàng bứt phá!";
});
</script>

<style scoped>
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.75; }
}
.animate-pulse {
  animation: pulse 1.5s infinite ease-in-out;
}
</style>
