<template>
  <div class="speed-mode-scene" :class="{ 'scene--flash-green': flashGreen, 'scene--flash-red': flashRed }">
    <!-- HEADER: Countdown + Progress -->
    <div class="speed-header">
      <!-- Countdown clock -->
      <div class="countdown-block" :class="{ 'countdown--urgent': isUrgent, 'countdown--zero': countdown === 0 }">
        <div class="countdown-ring">
          <svg viewBox="0 0 60 60" class="countdown-svg">
            <circle cx="30" cy="30" r="26" class="ring-track" />
            <circle
              cx="30" cy="30" r="26"
              class="ring-fill"
              :style="{ strokeDashoffset: ringOffset }"
              :class="{ 'ring-fill--urgent': isUrgent }"
            />
          </svg>
          <div class="countdown-number">{{ countdown }}</div>
        </div>
        <div class="countdown-label">giây</div>
      </div>

      <!-- Center: Mode title + question progress -->
      <div class="header-center">
        <div class="text-subtitle-1 font-weight-black text-slate-800">⚡ Vượt Tốc</div>
        <div class="text-caption font-weight-bold text-slate-500">
          Câu {{ currentNum }} / {{ totalQuestions }}
        </div>
        <!-- Progress bar -->
        <div class="speed-progress-bar mt-1">
          <div class="speed-progress-fill" :style="{ width: overallProgressPercent + '%' }" />
        </div>
      </div>

      <!-- Score / streak -->
      <div class="score-block">
        <div class="score-num">{{ score }}</div>
        <div class="score-label">điểm</div>
        <div v-if="streak >= 2" class="streak-badge">🔥 x{{ streak }}</div>
      </div>
    </div>

    <!-- QUESTION CARD -->
    <div v-if="currentQuestionItem" class="speed-question-card mt-3">
      <div class="question-tag">
        ⚡ CÂU HỎI TỐC ĐỘ · {{ currentNum }}/{{ totalQuestions }}
      </div>
      <div class="question-content">
        {{ currentQuestionItem.question.content }}
      </div>
    </div>

    <!-- ANSWER INPUT -->
    <div v-if="currentQuestionItem && !isComplete" class="answer-area mt-4">
      <!-- Trắc nghiệm: Grid 2x2 nút tốc độ -->
      <div v-if="isMcqType">
        <SpeedAnswerInput
          :question="currentQuestionItem.question"
          :model-value="session.answers[currentQuestionItem.question.id]"
          :disabled="isChecking || countdown === 0"
          :feedback="checkFeedback"
          @update:model-value="onAnswerChange"
          @confirm="onSpeedConfirm"
        />
      </div>

      <!-- Dạng điền khuyết (FILL), tự luận (ESSAY)... -->
      <div v-else class="non-mcq-fallback-card pa-4 pa-md-5 bg-white rounded-xl elevation-2 text-slate-800">
        <QuestionItem
          :item="currentQuestionItem"
          :index="session.currentIndex.value"
          :answer="session.answers[currentQuestionItem.question.id] || {}"
          :level="2"
          mode="speed"
          :disabled="isChecking || countdown === 0"
          @answered="onAnswerChange"
        />
        <div class="mt-4 d-flex justify-center">
          <v-btn
            color="purple-darken-3"
            size="large"
            rounded="pill"
            class="font-weight-black px-8 elevation-3"
            :disabled="isChecking || countdown === 0 || !hasAnswer"
            @click="onSpeedConfirm"
          >
            ⚡ Trả Lời Ngay!
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Submit button (last question done) -->
    <div v-if="isComplete" class="submit-area mt-6 text-center">
      <div class="text-h4 mb-2">⚡ {{ score }} điểm</div>
      <div class="text-body-1 text-slate-600 font-weight-bold mb-4">
        Bạn đã vượt qua toàn bộ thử thách!
      </div>
      <v-btn
        color="indigo-darken-3"
        size="x-large"
        rounded="pill"
        prepend-icon="mdi-flag-checkered"
        :loading="session.submitting.value"
        class="font-weight-black px-10 elevation-6"
        @click="session.submit()"
      >
        Nộp Bài & Về Đích ⚡
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from "vue";
import SpeedAnswerInput from "./SpeedAnswerInput.vue";
import QuestionItem from "../../QuestionItem.vue";

const props = defineProps({
  session: { type: Object, required: true },
});

const COUNTDOWN_SECONDS = 20;
const RING_CIRCUMFERENCE = 2 * Math.PI * 26; // r=26

const isChecking = ref(false);
const checkFeedback = ref(null);
const isComplete = ref(false);
const score = ref(0);
const streak = ref(0);

const countdown = ref(COUNTDOWN_SECONDS);
const flashGreen = ref(false);
const flashRed = ref(false);

let countdownTimer = null;

const currentQuestionItem = computed(() => props.session.currentQuestionItem.value);
const totalQuestions = computed(() => props.session.totalQuestions.value || 1);
const currentNum = computed(() => props.session.currentIndex.value + 1);

const isMcqType = computed(() => {
  const t = currentQuestionItem.value?.question?.type;
  return (
    (t === "MCQ" || t === "MULTI_MCQ" || t === "TRUE_FALSE") &&
    Array.isArray(currentQuestionItem.value?.question?.options) &&
    currentQuestionItem.value?.question?.options.length > 0
  );
});

const hasAnswer = computed(() => {
  const qId = currentQuestionItem.value?.question?.id;
  return qId ? props.session.hasAnswer(qId) : false;
});

const overallProgressPercent = computed(() =>
  Math.round(((currentNum.value - 1) / totalQuestions.value) * 100)
);

const isUrgent = computed(() => countdown.value <= 5 && countdown.value > 0);

const ringOffset = computed(() => {
  const pct = countdown.value / COUNTDOWN_SECONDS;
  return RING_CIRCUMFERENCE * (1 - pct);
});

// --- Countdown logic ---
function startCountdown() {
  clearInterval(countdownTimer);
  countdown.value = COUNTDOWN_SECONDS;
  countdownTimer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--;
      if (countdown.value === 0) {
        onTimeUp();
      }
    }
  }, 1000);
}

function resetCountdown() {
  clearInterval(countdownTimer);
  countdown.value = COUNTDOWN_SECONDS;
  checkFeedback.value = null;
  isChecking.value = false;
  flashGreen.value = false;
  flashRed.value = false;
  if (!isComplete.value) {
    startCountdown();
  }
}

function stopCountdown() {
  clearInterval(countdownTimer);
}

function onTimeUp() {
  stopCountdown();
  checkFeedback.value = "timeout";
  streak.value = 0;

  // Flash red
  flashRed.value = true;
  setTimeout(() => { flashRed.value = false; }, 700);

  setTimeout(() => {
    checkFeedback.value = null;
    if (!props.session.isLastQuestion.value) {
      props.session.next();
    } else {
      isComplete.value = true;
    }
  }, 800);
}

// Watch question index to reset countdown
watch(
  () => props.session.currentIndex.value,
  () => {
    resetCountdown();
  }
);

onMounted(() => {
  startCountdown();
});

onBeforeUnmount(() => {
  stopCountdown();
});

// --- Answer handling ---
function onAnswerChange(payload) {
  const qId = currentQuestionItem.value?.question?.id;
  if (qId) props.session.setAnswer(qId, payload);
}

async function onSpeedConfirm() {
  const q = currentQuestionItem.value?.question;
  if (!q || isChecking.value || countdown.value === 0) return;

  stopCountdown();
  isChecking.value = true;
  checkFeedback.value = null;

  try {
    const res = await props.session.checkQuestion(q.id);
    if (res?.isCorrect === true) {
      checkFeedback.value = "correct";
      streak.value++;
      score.value += streak.value >= 3 ? 15 : 10;
      flashGreen.value = true;
      setTimeout(() => { flashGreen.value = false; }, 700);
    } else {
      checkFeedback.value = "wrong";
      streak.value = 0;
      flashRed.value = true;
      setTimeout(() => { flashRed.value = false; }, 700);
    }

    setTimeout(() => {
      checkFeedback.value = null;
      if (!props.session.isLastQuestion.value) {
        props.session.next();
        // resetCountdown is called by the watch above
      } else {
        isComplete.value = true;
        stopCountdown();
      }
    }, 800);
  } catch (err) {
    checkFeedback.value = null;
    if (!props.session.isLastQuestion.value) {
      props.session.next();
    } else {
      isComplete.value = true;
      stopCountdown();
    }
  } finally {
    isChecking.value = false;
  }
}
</script>

<style scoped>
.speed-mode-scene {
  display: flex;
  flex-direction: column;
  width: 100%;
  transition: background-color 0.15s ease;
}

.scene--flash-green {
  background: rgba(22, 163, 74, 0.08);
  border-radius: 24px;
  animation: flashSceneGreen 0.6s ease;
}

.scene--flash-red {
  background: rgba(220, 38, 38, 0.08);
  border-radius: 24px;
  animation: flashSceneRed 0.6s ease;
}

@keyframes flashSceneGreen {
  0% { background: rgba(22,163,74,0.25); }
  100% { background: transparent; }
}

@keyframes flashSceneRed {
  0% { background: rgba(220,38,38,0.25); }
  100% { background: transparent; }
}

/* HEADER */
.speed-header {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #fff;
  border: 2px solid #e2e8f0;
  border-radius: 24px;
  padding: 14px 18px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
}

/* Countdown ring */
.countdown-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.countdown-ring {
  position: relative;
  width: 64px;
  height: 64px;
}

.countdown-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-track {
  fill: none;
  stroke: #e2e8f0;
  stroke-width: 5;
}

.ring-fill {
  fill: none;
  stroke: #3b82f6;
  stroke-width: 5;
  stroke-linecap: round;
  stroke-dasharray: 163.36; /* 2π*26 */
  stroke-dashoffset: 0;
  transition: stroke-dashoffset 1s linear, stroke 0.3s ease;
}

.ring-fill--urgent {
  stroke: #ef4444;
  animation: urgentPulse 0.5s ease infinite alternate;
}

@keyframes urgentPulse {
  from { stroke: #ef4444; }
  to { stroke: #fca5a5; }
}

.countdown-number {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 900;
  color: #1e293b;
}

.countdown--urgent .countdown-number {
  color: #ef4444;
  animation: numBlink 0.5s ease infinite alternate;
}

.countdown--zero .countdown-number {
  color: #ef4444;
}

@keyframes numBlink {
  from { opacity: 1; }
  to { opacity: 0.5; }
}

.countdown-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #94a3b8;
  letter-spacing: 0.5px;
}

/* Center */
.header-center {
  flex: 1;
  min-width: 0;
}

.speed-progress-bar {
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.speed-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 999px;
  transition: width 0.4s ease;
}

/* Score */
.score-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  gap: 2px;
}

.score-num {
  font-size: 1.8rem;
  font-weight: 900;
  color: #6366f1;
  line-height: 1;
}

.score-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #94a3b8;
}

.streak-badge {
  font-size: 0.75rem;
  font-weight: 900;
  color: #f59e0b;
  background: #fef3c7;
  border-radius: 999px;
  padding: 2px 8px;
}

/* Question card */
.speed-question-card {
  background: #ffffff;
  border: 3.5px solid #6366f1;
  border-radius: 24px;
  padding: 24px 28px;
  box-shadow: 0 10px 25px rgba(99, 102, 241, 0.15);
}

.question-tag {
  font-size: 0.85rem;
  font-weight: 900;
  color: #4f46e5;
  letter-spacing: 1px;
  margin-bottom: 10px;
}

.question-content {
  font-size: 1.45rem;
  font-weight: 900;
  color: #0f172a;
  line-height: 1.55;
}

/* Answer area */
.answer-area {
  width: 100%;
}

/* Submit */
.submit-area {
  background: linear-gradient(135deg, #eef2ff, #f5f3ff);
  border-radius: 24px;
  padding: 28px;
  border: 2px solid #c7d2fe;
}

@media (max-width: 375px) {
  .speed-header { gap: 10px; padding: 12px 14px; }
  .countdown-ring { width: 54px; height: 54px; }
  .countdown-number { font-size: 1.25rem; }
  .speed-question-card { padding: 16px 16px; }
  .question-content { font-size: 1.1rem; }
}
</style>
