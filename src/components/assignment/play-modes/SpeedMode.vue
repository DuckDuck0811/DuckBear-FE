<template>
  <div class="speed-mode">
    <!-- KHUNG ĐỒNG HỒ VƯỢT TỐC ĐẾM NGƯỢC -->
    <v-card class="pa-4 pa-md-5 mb-5 speed-header-card" elevation="3" rounded="xl">
      <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-3">
        <div class="d-flex align-center ga-3">
          <div class="speed-avatar-badge" :class="{ 'timer-urgent': questionTimeLeft <= 10 }">
            <span class="text-h4">⚡</span>
          </div>
          <div>
            <div class="text-h6 font-weight-black text-cyan-lighten-4">
              Thử thách Vượt Tốc
            </div>
            <div class="text-body-2 font-weight-bold text-slate-300">
              Chặng chạy: <span class="text-cyan-lighten-2 font-weight-black">Câu {{ currentIndex + 1 }} / {{ questions.length }}</span>
            </div>
          </div>
        </div>

        <div class="d-flex align-center ga-3">
          <!-- Đồng hồ đếm ngược câu hỏi -->
          <div
            class="question-timer-box d-flex align-center ga-2 px-4 py-2 rounded-pill"
            :class="questionTimeLeft <= 10 ? 'bg-red-darken-4 border-red animate-pulse' : 'bg-slate-900 border-cyan'"
          >
            <v-icon
              :icon="questionTimeLeft <= 10 ? 'mdi-timer-alert' : 'mdi-timer-sand'"
              :color="questionTimeLeft <= 10 ? 'red-lighten-2' : 'cyan-lighten-2'"
              size="22"
            />
            <div
              class="text-h6 font-weight-black"
              :class="questionTimeLeft <= 10 ? 'text-red-lighten-3' : 'text-cyan-accent-2'"
            >
              {{ questionTimeLeft }}s
            </div>
          </div>
        </div>
      </div>

      <!-- THANH THỜI GIAN CÂU HỎI -->
      <div class="speed-progress-bar mt-2">
        <v-progress-linear
          :model-value="(questionTimeLeft / QUESTION_TIMEOUT) * 100"
          :color="questionTimeLeft <= 10 ? 'red-accent-3' : 'cyan-accent-3'"
          height="10"
          rounded
        />
      </div>
    </v-card>

    <!-- CÂU HỎI HIỆN TẠI -->
    <div v-if="currentQuestionItem" class="current-question-container">
      <QuestionItem
        :item="currentQuestionItem"
        :index="currentIndex"
        :answer="answers[currentQuestionItem.question.id]"
        :level="2"
        mode="speed"
        @answered="onAnswered"
      />

      <!-- Nút điều hướng & Bứt tốc -->
      <div class="d-flex justify-space-between align-center mt-6">
        <v-btn
          variant="outlined"
          color="secondary"
          size="large"
          prepend-icon="mdi-arrow-left"
          :disabled="currentIndex === 0"
          @click="prevQuestion"
        >
          Câu trước
        </v-btn>

        <div class="d-flex ga-3">
          <v-btn
            v-if="!isLastQuestion"
            color="cyan-darken-3"
            size="large"
            variant="flat"
            append-icon="mdi-fast-forward"
            class="px-6 font-weight-bold text-white bg-cyan-600"
            @click="nextQuestion"
          >
            Xác nhận & Bứt tốc sang câu tiếp
          </v-btn>

          <v-btn
            v-if="isLastQuestion"
            color="primary"
            size="large"
            variant="flat"
            prepend-icon="mdi-send"
            :loading="submitting"
            class="px-8 font-weight-bold"
            @click="$emit('submit')"
          >
            Về đích & Nộp bài
          </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import QuestionItem from "../QuestionItem.vue";

const props = defineProps({
  assignment: { type: Object, required: true },
  questions: { type: Array, required: true },
  answers: { type: Object, required: true },
  attemptId: { type: [Number, String], required: true },
  loading: { type: Boolean, default: false },
  submitting: { type: Boolean, default: false },
  level: { type: Number, default: 2 },
});

const emit = defineEmits(["submit", "answer-change"]);
const { t } = useI18n();

const QUESTION_TIMEOUT = 45; // 45 giây mỗi câu
const currentIndex = ref(0);
const questionTimeLeft = ref(QUESTION_TIMEOUT);
let timerInterval = null;

const currentQuestionItem = computed(() => props.questions[currentIndex.value]);
const isLastQuestion = computed(() => currentIndex.value >= props.questions.length - 1);

function startQuestionTimer() {
  stopQuestionTimer();
  questionTimeLeft.value = QUESTION_TIMEOUT;
  timerInterval = window.setInterval(() => {
    if (questionTimeLeft.value > 0) {
      questionTimeLeft.value -= 1;
    } else {
      // Hết giờ câu hỏi: tự động chuyển câu tiếp theo hoặc nộp bài
      stopQuestionTimer();
      if (!isLastQuestion.value) {
        nextQuestion();
      } else {
        emit("submit");
      }
    }
  }, 1000);
}

function stopQuestionTimer() {
  if (timerInterval) {
    window.clearInterval(timerInterval);
    timerInterval = null;
  }
}

watch(currentIndex, () => {
  startQuestionTimer();
});

onMounted(() => {
  startQuestionTimer();
});

onBeforeUnmount(() => {
  stopQuestionTimer();
});

function onAnswered(questionId) {
  emit("answer-change", { questionId, index: currentIndex.value });
}

function nextQuestion() {
  if (currentIndex.value < props.questions.length - 1) {
    currentIndex.value += 1;
  }
}

function prevQuestion() {
  if (currentIndex.value > 0) {
    currentIndex.value -= 1;
  }
}
</script>

<style scoped>
.speed-header-card {
  background: linear-gradient(135deg, #083344 0%, #164e63 100%);
  border: 2px solid #06b6d4 !important;
  color: white;
}

.speed-avatar-badge {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #0e7490;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
  border: 1px solid #22d3ee;
}

.timer-urgent {
  animation: urgentPulse 0.5s infinite alternate;
}

@keyframes urgentPulse {
  0% { transform: scale(1); background: #b91c1c; }
  100% { transform: scale(1.15); background: #ef4444; }
}

.border-cyan {
  border: 1px solid #0891b2;
}

.border-red {
  border: 1px solid #ef4444;
}

.bg-cyan-600 {
  background-color: #0891b2 !important;
}
</style>
