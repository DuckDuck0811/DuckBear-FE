<template>
  <div class="fun-mode-decorator mb-5">
    <v-card class="pa-4 pa-md-5 rounded-xl border fun-mascot-box" elevation="0">
      <div class="d-flex align-center justify-space-between flex-wrap ga-3">
        <!-- Mascot + Cheer speech -->
        <div class="d-flex align-center ga-3">
          <div class="mascot-avatar text-h3 animate-bounce">
            🐥
          </div>
          <div>
            <div class="font-weight-black text-amber-darken-4 text-subtitle-1">
              {{ cheerMessage }}
            </div>
            <div class="text-caption text-secondary font-weight-bold">
              Bạn đã hoàn thành {{ answeredCount }}/{{ totalQuestions }} câu hỏi!
            </div>
          </div>
        </div>

        <!-- Star Counter -->
        <div class="d-flex align-center ga-2 bg-white px-4 py-2 rounded-pill border">
          <span class="text-h5 animate-spin">⭐</span>
          <div>
            <span class="text-h6 font-weight-black text-amber-darken-3">{{ stars }}</span>
            <span class="text-caption font-weight-bold text-secondary ml-1">Sao</span>
          </div>
        </div>
      </div>

      <!-- Fun Progress Bar with duck tracker -->
      <div class="mt-4">
        <div class="d-flex justify-space-between text-caption font-weight-bold text-amber-darken-4 mb-1">
          <span>Tiến độ khám phá</span>
          <span>{{ Math.round(progressPercent) }}%</span>
        </div>
        <v-progress-linear
          :model-value="progressPercent"
          height="12"
          rounded="pill"
          color="amber-darken-2"
          bg-color="amber-lighten-4"
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
  stars: { type: Number, default: 0 },
});

const progressPercent = computed(() => {
  if (!props.totalQuestions) return 0;
  return Math.min(100, (props.answeredCount / props.totalQuestions) * 100);
});

const cheerMessage = computed(() => {
  if (props.answeredCount === 0) return "Chào bạn nhỏ! Cùng bắt đầu thử thách nào! 🚀";
  if (props.answeredCount === props.totalQuestions) return "Xuất sắc! Bạn đã trả lời hết câu hỏi rồi! 🎉";
  if (progressPercent.value >= 75) return "Sắp về đích rồi, cố thêm xíu nữa nhé! 🌟";
  if (progressPercent.value >= 50) return "Tuyệt vời! Đã đi được nửa chặng đường rồi! 💪";
  return "Đúng rồi, cố gắng lên bạn nhé! ✨";
});
</script>

<style scoped>
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.animate-bounce {
  animation: bounce 2s infinite ease-in-out;
}
</style>
