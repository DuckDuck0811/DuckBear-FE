<template>
  <div class="streak-mode">
    <!-- KHUNG CHUỖI LỬA COMBO -->
    <v-card class="pa-4 pa-md-5 mb-5 streak-header-card" elevation="3" rounded="xl">
      <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-3">
        <div class="d-flex align-center ga-3">
          <div class="streak-avatar-badge" :class="{ 'flame-pulsing': currentStreak > 0 }">
            <span class="text-h4">🔥</span>
          </div>
          <div>
            <div class="text-h6 font-weight-black text-orange-lighten-4">
              Đấu trường Chuỗi Lửa
            </div>
            <div class="text-body-2 font-weight-bold text-slate-300">
              Câu hiện tại: <span class="text-orange-lighten-2 font-weight-black">Câu {{ currentIndex + 1 }} / {{ questions.length }}</span>
            </div>
          </div>
        </div>

        <div class="d-flex align-center ga-3">
          <!-- Huy hiệu mốc -->
          <v-chip
            v-if="highestStreak >= 5"
            :color="badgeColor"
            variant="flat"
            class="font-weight-black px-3"
            size="large"
          >
            {{ badgeTitle }}
          </v-chip>

          <!-- Combo lửa hiện tại -->
          <div class="streak-counter-box d-flex align-center ga-2 px-4 py-2 rounded-pill bg-slate-900 border-fire">
            <span class="text-h5">🔥</span>
            <div class="text-subtitle-1 font-weight-black text-orange-accent-2">
              COMBO x{{ currentStreak }}
            </div>
          </div>
        </div>
      </div>

      <!-- THANH COMBO & MỐC KỶ LỤC -->
      <div class="streak-progress-bar mt-2">
        <div class="d-flex justify-space-between align-center text-caption font-weight-bold text-slate-300 mb-1">
          <span>Kỷ lục bài làm: {{ highestStreak }} câu liên tiếp</span>
          <span>Mục tiêu tiếp theo: {{ nextMilestone }} liên tiếp</span>
        </div>
        <v-progress-linear
          :model-value="(currentStreak / Math.max(1, nextMilestone)) * 100"
          color="deep-orange"
          height="12"
          rounded
          striped
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
        mode="streak"
        :disabled="isCurrentChecked"
        @answered="onAnswered"
      />

      <!-- Thông báo kết quả kiểm tra -->
      <v-fade-transition>
        <v-alert
          v-if="checkResult"
          :type="checkResult.isCorrect ? 'success' : checkResult.status === 'PENDING_TEACHER_GRADE' ? 'info' : 'warning'"
          variant="tonal"
          class="mt-4 mb-4 font-weight-medium rounded-xl"
        >
          <div class="d-flex align-center ga-2 text-subtitle-1 font-weight-bold">
            <span v-if="checkResult.isCorrect">🔥 RỰC CHÁY! Chính xác liên tiếp, chuỗi combo tăng lên x{{ currentStreak }}!</span>
            <span v-else-if="checkResult.status === 'PENDING_TEACHER_GRADE'">📝 Câu tự luận đã được ghi nhận, bảo lưu chuỗi combo!</span>
            <span v-else>💧 TIẾC QUÁ! Chuỗi lửa bị ngắt quãng, cố gắng xây dựng lại chuỗi ở câu tiếp nhé!</span>
          </div>
          <div v-if="checkResult.explanation" class="text-body-2 mt-2">
            <strong>Lời giải thích:</strong> {{ checkResult.explanation }}
          </div>
        </v-alert>
      </v-fade-transition>

      <!-- Nút điều hướng & Giữ chuỗi -->
      <div class="d-flex justify-space-between align-center mt-6">
        <v-btn
          variant="outlined"
          color="secondary"
          size="large"
          prepend-icon="mdi-arrow-left"
          :disabled="currentIndex === 0 || checking"
          @click="prevQuestion"
        >
          Câu trước
        </v-btn>

        <div class="d-flex ga-3">
          <v-btn
            v-if="!isCurrentChecked"
            color="deep-orange-darken-2"
            size="large"
            variant="flat"
            prepend-icon="mdi-fire"
            :loading="checking"
            :disabled="!hasAnswer(currentQuestionItem.question.id)"
            class="px-6 font-weight-bold text-white"
            @click="handleCheckAnswer"
          >
            Đốt lửa chuỗi
          </v-btn>

          <v-btn
            v-if="isCurrentChecked && !isLastQuestion"
            color="success"
            size="large"
            variant="flat"
            append-icon="mdi-arrow-right"
            class="px-6 font-weight-bold"
            @click="nextQuestion"
          >
            Giữ chuỗi câu tiếp
          </v-btn>

          <v-btn
            v-if="isLastQuestion"
            color="primary"
            size="large"
            variant="flat"
            prepend-icon="mdi-check-all"
            :loading="submitting"
            class="px-8 font-weight-bold"
            @click="$emit('submit')"
          >
            Chốt chuỗi & Nộp bài
          </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { api } from "../../../services/api";
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

const currentIndex = ref(0);
const currentStreak = ref(0);
const highestStreak = ref(0);
const checking = ref(false);
const checkedQuestions = reactive({});

const currentQuestionItem = computed(() => props.questions[currentIndex.value]);
const isLastQuestion = computed(() => currentIndex.value >= props.questions.length - 1);
const isCurrentChecked = computed(() => {
  const qId = currentQuestionItem.value?.question?.id;
  return Boolean(checkedQuestions[qId]);
});
const checkResult = computed(() => {
  const qId = currentQuestionItem.value?.question?.id;
  return checkedQuestions[qId] || null;
});

const nextMilestone = computed(() => {
  if (currentStreak.value < 5) return 5;
  if (currentStreak.value < 10) return 10;
  return 20;
});

const badgeTitle = computed(() => {
  if (highestStreak.value >= 20) return "👑 Phượng Hoàng Lửa (20+)";
  if (highestStreak.value >= 10) return "🥈 Ngọn Lửa Bạc (10+)";
  if (highestStreak.value >= 5) return "🥉 Tia Lửa Đồng (5+)";
  return "";
});

const badgeColor = computed(() => {
  if (highestStreak.value >= 20) return "amber-darken-3";
  if (highestStreak.value >= 10) return "blue-grey-darken-1";
  return "orange-darken-3";
});

function hasAnswer(questionId) {
  const a = props.answers[questionId];
  if (!a) return false;
  const hasSingle = a.selectedOptionId !== null && a.selectedOptionId !== undefined;
  const hasMulti = Array.isArray(a.selectedOptionIds) && a.selectedOptionIds.length > 0;
  const hasText = typeof a.answerText === "string" && a.answerText.trim().length > 0;
  const hasImage = typeof a.imageUrl === "string" && a.imageUrl.length > 0;
  const hasMatch = a.matchAnswers && Object.keys(a.matchAnswers).length > 0;
  return hasSingle || hasMulti || hasText || hasImage || hasMatch;
}

function onAnswered(questionId) {
  emit("answer-change", { questionId, index: currentIndex.value });
}

async function handleCheckAnswer() {
  const q = currentQuestionItem.value?.question;
  if (!q || isCurrentChecked.value) return;

  const a = props.answers[q.id] || {};
  checking.value = true;
  try {
    const payload = {
      questionId: q.id,
      selectedOptionIds: a.selectedOptionId
        ? [a.selectedOptionId]
        : Array.isArray(a.selectedOptionIds)
          ? a.selectedOptionIds
          : [],
      answerText: a.answerText || undefined,
      matchAnswers: a.matchAnswers || undefined,
    };

    const res = await api.post(
      `/assignments/attempts/${props.attemptId}/check-answer`,
      payload,
    );
    checkedQuestions[q.id] = res;

    if (res.isCorrect === true) {
      currentStreak.value += 1;
      if (currentStreak.value > highestStreak.value) {
        highestStreak.value = currentStreak.value;
      }
    } else {
      currentStreak.value = 0;
    }
  } catch (err) {
    if (err?.status === 409 || err?.response?.status === 409) {
      checkedQuestions[q.id] = { isCorrect: false, status: "ALREADY_CHECKED" };
    }
  } finally {
    checking.value = false;
  }
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
.streak-header-card {
  background: linear-gradient(135deg, #18181b 0%, #431407 100%);
  border: 2px solid #ea580c !important;
  color: white;
}

.streak-avatar-badge {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #27272a;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
  border: 1px solid #f97316;
}

.flame-pulsing {
  animation: flamePulse 1s infinite alternate;
}

@keyframes flamePulse {
  0% { transform: scale(1); box-shadow: 0 0 5px #f97316; }
  100% { transform: scale(1.15); box-shadow: 0 0 15px #ea580c; }
}

.border-fire {
  border: 2px solid #f97316;
}

.streak-counter-box {
  box-shadow: 0 0 12px rgba(249, 115, 22, 0.4);
}
</style>
