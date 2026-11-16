<template>
  <div class="race-mode">
    <!-- KHUNG ĐƯỜNG ĐUA HOẠT HÌNH & CHỈ SỐ -->
    <v-card class="pa-4 pa-md-5 mb-5 race-header-card" elevation="3" rounded="xl">
      <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-3">
        <div class="d-flex align-center ga-3">
          <div class="race-avatar-badge">
            <span class="text-h4">🏎️</span>
          </div>
          <div>
            <div class="text-h6 font-weight-black text-orange-darken-3">
              Đường đua tốc độ DuckBear
            </div>
            <div class="text-body-2 font-weight-bold text-slate-600">
              Chặng hiện tại: <span class="text-orange-darken-4 font-weight-black">Câu {{ currentIndex + 1 }} / {{ questions.length }}</span>
            </div>
          </div>
        </div>

        <div class="d-flex align-center ga-3">
          <!-- Tốc độ xe -->
          <v-chip color="deep-orange" variant="flat" class="font-weight-black px-3" size="large">
            <v-icon icon="mdi-speedometer" start size="20" />
            {{ speed }} km/h
          </v-chip>

          <!-- Sao thưởng -->
          <div class="d-flex align-center ga-1 text-h6 font-weight-black text-amber-darken-2 bg-amber-lighten-5 px-3 py-1 rounded-pill border">
            <v-icon icon="mdi-star" color="amber-darken-2" size="24" />
            <span>{{ stars }}</span>
          </div>
        </div>
      </div>

      <!-- ĐƯỜNG ĐUA TRỰC QUAN -->
      <div class="race-track-wrapper mt-3">
        <div class="race-track">
          <!-- Vạch xuất phát -->
          <div class="race-start-line">START</div>

          <!-- Làn đường và vạch đứt nét -->
          <div class="race-lane-divider"></div>

          <!-- Các mốc câu hỏi trên đường đua -->
          <div class="race-checkpoints">
            <div
              v-for="(item, idx) in questions"
              :key="item.question.id"
              class="race-checkpoint-node"
              :style="{ left: `${(idx / Math.max(1, questions.length - 1)) * 92 + 3}%` }"
              :class="{
                'checkpoint--passed': idx < currentProgress,
                'checkpoint--current': idx === currentIndex,
              }"
            >
              <span class="checkpoint-number">{{ idx + 1 }}</span>
            </div>
          </div>

          <!-- Chiếc xe đua chạy dọc theo tiến độ -->
          <div
            class="race-car-container"
            :style="{ left: `${carPositionPercent}%` }"
            :class="{ 'race-car--boosting': isBoosting }"
          >
            <div class="race-car-flame" v-if="isBoosting">🔥</div>
            <div class="race-car-sprite">🏎️</div>
            <div class="race-car-exhaust"></div>
          </div>

          <!-- Cột mốc đích -->
          <div class="race-finish-line">
            <span class="finish-flag">🏁</span>
            <span class="finish-text">ĐÍCH</span>
          </div>
        </div>
      </div>

      <!-- Thanh tiến độ hoàn thành -->
      <div class="d-flex justify-space-between align-center mt-3 text-caption font-weight-bold text-slate-500">
        <span>Tiến độ về đích: {{ completedAnswersCount }} / {{ questions.length }} câu</span>
        <span>Xe đã tiến: {{ Math.round(carPositionPercent) }}%</span>
      </div>
    </v-card>

    <!-- CÂU HỎI HIỆN TẠI (Mỗi lần 1 câu) -->
    <div v-if="currentQuestionItem" class="current-question-container">
      <QuestionItem
        :item="currentQuestionItem"
        :index="currentIndex"
        :answer="answers[currentQuestionItem.question.id]"
        :level="1"
        mode="race"
        :disabled="isCurrentChecked"
        @answered="onAnswered"
      />

      <!-- Khu vực hiển thị kết quả kiểm tra tức thì -->
      <v-fade-transition>
        <v-alert
          v-if="checkResult"
          :type="checkResult.isCorrect ? 'success' : checkResult.status === 'PENDING_TEACHER_GRADE' ? 'info' : 'warning'"
          variant="tonal"
          class="mt-4 mb-4 font-weight-medium rounded-xl"
        >
          <div class="d-flex align-center ga-2 text-subtitle-1 font-weight-bold">
            <span v-if="checkResult.isCorrect">🚀 VROOOM! Trả lời chính xác! Xe đua tăng tốc vọt lên phía trước!</span>
            <span v-else-if="checkResult.status === 'PENDING_TEACHER_GRADE'">📝 Câu tự luận đã được ghi nhận, xe tiếp tục tiến vào chặng tiếp!</span>
            <span v-else>⚠️ Chưa chính xác! Xe trượt nhẹ nhưng không hề tụt lại, nhấn ga câu tiếp theo nào!</span>
          </div>
          <div v-if="checkResult.explanation" class="text-body-2 mt-2">
            <strong>Lời giải thích:</strong> {{ checkResult.explanation }}
          </div>
        </v-alert>
      </v-fade-transition>

      <!-- BẢNG NÚT ĐIỀU HƯỚNG & HÀNH ĐỘNG -->
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
          <!-- Nút kiểm tra / tăng tốc -->
          <v-btn
            v-if="!isCurrentChecked"
            color="deep-orange-darken-1"
            size="large"
            variant="flat"
            prepend-icon="mdi-car-turbocharger"
            :loading="checking"
            :disabled="!hasAnswer(currentQuestionItem.question.id)"
            class="px-6 font-weight-bold"
            @click="handleCheckAnswer"
          >
            Nhấn ga kiểm tra
          </v-btn>

          <!-- Nút sang câu tiếp theo -->
          <v-btn
            v-if="isCurrentChecked && !isLastQuestion"
            color="success"
            size="large"
            variant="flat"
            append-icon="mdi-arrow-right"
            class="px-6 font-weight-bold"
            @click="nextQuestion"
          >
            Chặng tiếp theo
          </v-btn>

          <!-- Nút về đích & nộp bài -->
          <v-btn
            v-if="isLastQuestion"
            color="primary"
            size="large"
            variant="flat"
            prepend-icon="mdi-flag-checkered"
            :loading="submitting"
            class="px-8 font-weight-bold"
            @click="$emit('submit')"
          >
            Cán đích & Nộp bài
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
  level: { type: Number, default: 1 },
});

const emit = defineEmits(["submit", "answer-change"]);
const { t } = useI18n();

const currentIndex = ref(0);
const currentProgress = ref(0); // Số chặng đúng đã tiến
const speed = ref(40);
const stars = ref(0);
const checking = ref(false);
const isBoosting = ref(false);
const checkedQuestions = reactive({}); // questionId -> checkResult

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

const completedAnswersCount = computed(() => {
  return Object.keys(checkedQuestions).length;
});

// Tính vị trí % của xe trên đường đua: từ 3% đến 90%
const carPositionPercent = computed(() => {
  const total = props.questions.length;
  if (total <= 1) return currentProgress.value > 0 ? 88 : 5;
  const progressRatio = currentProgress.value / total;
  return Math.min(88, Math.max(3, progressRatio * 85 + 3));
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
      currentProgress.value += 1;
      stars.value += 5;
      speed.value = Math.min(220, speed.value + 30);
      isBoosting.value = true;
      setTimeout(() => {
        isBoosting.value = false;
      }, 1200);
    } else {
      speed.value = Math.max(30, speed.value - 10);
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
.race-header-card {
  background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
  border: 2px solid #fed7aa !important;
}

.race-avatar-badge {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* ĐƯỜNG ĐUA */
.race-track-wrapper {
  position: relative;
  width: 100%;
  overflow-x: auto;
  padding: 6px 0;
}

.race-track {
  position: relative;
  height: 90px;
  background: #334155;
  border-radius: 16px;
  display: flex;
  align-items: center;
  border: 4px solid #1e293b;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.4);
  min-width: 500px;
}

.race-start-line {
  position: absolute;
  left: 12px;
  font-size: 10px;
  font-weight: 900;
  color: #94a3b8;
  letter-spacing: 1px;
}

.race-lane-divider {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 2px;
  border-top: 2px dashed rgba(255, 255, 255, 0.35);
}

.race-finish-line {
  position: absolute;
  right: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.finish-flag {
  font-size: 24px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.finish-text {
  font-size: 9px;
  font-weight: 900;
  color: #fbbf24;
}

/* Mốc chặng */
.race-checkpoints {
  position: absolute;
  left: 0;
  right: 0;
  top: 14px;
  height: 20px;
  pointer-events: none;
}

.race-checkpoint-node {
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #475569;
  color: #cbd5e1;
  font-size: 10px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateX(-50%);
  border: 2px solid #64748b;
  transition: all 0.3s ease;
}

.checkpoint--passed {
  background: #10b981;
  border-color: #34d399;
  color: #ffffff;
}

.checkpoint--current {
  background: #f97316;
  border-color: #fdba74;
  color: #ffffff;
  transform: translateX(-50%) scale(1.25);
  box-shadow: 0 0 8px rgba(249, 115, 22, 0.8);
}

/* CHIẾC XE ĐUA */
.race-car-container {
  position: absolute;
  bottom: 12px;
  display: flex;
  align-items: center;
  transform: translateX(-50%);
  transition: left 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 5;
}

.race-car-sprite {
  font-size: 34px;
  filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.5));
  transition: transform 0.3s ease;
}

.race-car--boosting .race-car-sprite {
  transform: scale(1.25) skewX(-10deg);
  animation: carVibrate 0.1s infinite alternate;
}

.race-car-flame {
  font-size: 20px;
  margin-right: -4px;
  animation: flameFlicker 0.15s infinite alternate;
}

@keyframes carVibrate {
  0% { transform: translateY(0) scale(1.25) skewX(-10deg); }
  100% { transform: translateY(-2px) scale(1.25) skewX(-10deg); }
}

@keyframes flameFlicker {
  0% { opacity: 0.7; transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1.2); }
}
</style>
