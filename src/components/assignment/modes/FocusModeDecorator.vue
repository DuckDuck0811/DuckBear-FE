<template>
  <div class="focus-mode-decorator mb-4">
    <v-card class="pa-3 pa-md-4 rounded-lg border focus-navigator" elevation="0">
      <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-2">
        <div class="text-caption font-weight-bold text-slate-600">
          Tiến độ: {{ answeredCount }}/{{ totalQuestions }} câu đã làm
        </div>
        <div class="text-caption text-secondary">
          Bấm số câu để chuyển nhanh
        </div>
      </div>

      <!-- Quick Question Navigation Buttons (Palette) -->
      <div class="d-flex flex-wrap ga-1">
        <button
          v-for="num in totalQuestions"
          :key="num"
          type="button"
          class="focus-nav-btn text-caption border"
          :style="{
            background: isAnswered(num - 1) ? '#1e293b' : '#ffffff',
            color: isAnswered(num - 1) ? '#ffffff' : '#334155',
            borderColor: isAnswered(num - 1) ? '#1e293b' : '#cbd5e1',
          }"
          @click="scrollToQuestion(num - 1)"
        >
          {{ num }}
        </button>
      </div>
    </v-card>
  </div>
</template>

<script setup>
const props = defineProps({
  totalQuestions: { type: Number, default: 0 },
  answeredCount: { type: Number, default: 0 },
  answeredIndices: { type: Array, default: () => [] },
});

const emit = defineEmits(["jump"]);

function isAnswered(index) {
  return props.answeredIndices.includes(index);
}

function scrollToQuestion(index) {
  emit("jump", index);
}
</script>
