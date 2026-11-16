<template>
  <div class="map-mode-scene">
    <!-- HEADER: Chặng hiện tại + badge hoàn thành -->
    <div class="map-header">
      <div class="d-flex align-center ga-3">
        <span class="text-h4">🗺️</span>
        <div>
          <div class="text-subtitle-1 font-weight-black text-green-darken-4">
            Chinh Phục Bản Đồ
          </div>
          <div class="text-caption font-weight-bold text-green-darken-2">
            Chặng {{ currentSegment }} · Câu {{ currentIndexInSegment + 1 }}/{{ questionsPerSegment }}
          </div>
        </div>
      </div>

      <!-- Badge các chặng -->
      <div class="segment-badges d-flex align-center ga-2 flex-wrap">
        <v-chip
          v-for="seg in totalSegments"
          :key="seg"
          :color="seg < currentSegment ? 'green-darken-3' : seg === currentSegment ? 'green' : 'grey-lighten-1'"
          :variant="seg === currentSegment ? 'flat' : 'outlined'"
          size="small"
          class="font-weight-black"
        >
          {{ seg < currentSegment ? '✅' : seg === currentSegment ? '🧭' : '🔒' }}
          Vùng {{ seg }}
        </v-chip>
      </div>
    </div>

    <!-- Thanh tiến trình chặng -->
    <div class="segment-progress-bar mb-4">
      <div
        class="segment-progress-fill"
        :style="{ width: segmentProgressPercent + '%' }"
      />
    </div>

    <!-- MAIN: Nhật ký thám hiểm -->
    <div class="expedition-journal" v-if="currentQuestionItem">
      <div class="journal-header">
        <span class="text-caption font-weight-black text-green-lighten-3">
          📖 NHẬT KÝ THÁM HIỂM · VÙNG {{ currentSegment }} · CÂU {{ currentNum }}
        </span>
      </div>
      <div class="journal-question-text">
        {{ currentQuestionItem.question.content }}
      </div>
    </div>

    <!-- MapAnswerInput -->
    <div v-if="currentQuestionItem" class="answer-area mt-4">
      <!-- Trắc nghiệm: Ngã rẽ bản đồ -->
      <div v-if="isMcqType">
        <MapAnswerInput
          :question="currentQuestionItem.question"
          :model-value="session.answers[currentQuestionItem.question.id]"
          :disabled="isChecking"
          :feedback="checkFeedback"
          @update:model-value="onAnswerChange"
          @confirm="onDirectionConfirm"
        />
      </div>

      <!-- Dạng điền khuyết (FILL), tự luận (ESSAY)... -->
      <div v-else class="non-mcq-fallback-card pa-4 pa-md-5 bg-white rounded-xl elevation-2 text-slate-800">
        <QuestionItem
          :item="currentQuestionItem"
          :index="session.currentIndex.value"
          :answer="session.answers[currentQuestionItem.question.id] || {}"
          :level="2"
          mode="map"
          :disabled="isChecking"
          @answered="onAnswerChange"
        />
        <div class="mt-4 d-flex justify-center">
          <v-btn
            color="green-darken-3"
            size="large"
            rounded="pill"
            class="font-weight-black px-8 elevation-3"
            :disabled="isChecking || !hasAnswer"
            @click="onDirectionConfirm"
          >
            🗺️ Khám Phá Hướng Này!
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Nút nộp bài cuối -->
    <div v-if="session.isLastQuestion.value && isComplete" class="submit-area mt-6 text-center">
      <div class="text-h5 mb-3">🎉 Bạn đã chinh phục toàn bộ bản đồ!</div>
      <v-btn
        color="green-darken-3"
        size="x-large"
        rounded="pill"
        prepend-icon="mdi-flag-checkered"
        :loading="session.submitting.value"
        class="font-weight-black px-10 elevation-6"
        @click="session.submit()"
      >
        Nộp Bài & Khải Hoàn 🏅
      </v-btn>
    </div>

    <!-- POPUP: Tóm tắt chặng -->
    <v-dialog v-model="showSegmentSummary" max-width="420" persistent>
      <v-card class="segment-summary-card pa-6 text-center" rounded="xl">
        <div class="text-h2 mb-3">🎉</div>
        <div class="text-h5 font-weight-black text-green-darken-4 mb-2">
          Vùng {{ completedSegment }} đã chinh phục! ✅
        </div>
        <div class="text-body-1 text-green-darken-2 font-weight-bold mb-1">
          {{ segmentCorrectCount }}/{{ questionsPerSegment }} câu đúng trong chặng này
        </div>
        <div class="text-body-2 text-grey-darken-1 mb-5">
          {{ segmentEncouragement }}
        </div>
        <v-btn
          color="green-darken-3"
          size="large"
          rounded="pill"
          class="font-weight-black"
          @click="onContinueExpedition"
        >
          🧭 Tiến Vào Vùng {{ completedSegment + 1 }}
        </v-btn>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import MapAnswerInput from "./MapAnswerInput.vue";
import QuestionItem from "../../QuestionItem.vue";

const props = defineProps({
  session: { type: Object, required: true },
});

const QUESTIONS_PER_SEGMENT = 5;
const questionsPerSegment = QUESTIONS_PER_SEGMENT;

const isChecking = ref(false);
const checkFeedback = ref(null);
const isComplete = ref(false);

// Segment summary popup
const showSegmentSummary = ref(false);
const completedSegment = ref(0);
const segmentCorrectCount = ref(0);

// Track per-segment correct answers
const segmentCorrects = ref([]);
let currentSegmentCorrects = 0;

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

const currentSegment = computed(() =>
  Math.floor(props.session.currentIndex.value / QUESTIONS_PER_SEGMENT) + 1
);

const currentIndexInSegment = computed(() =>
  props.session.currentIndex.value % QUESTIONS_PER_SEGMENT
);

const totalSegments = computed(() =>
  Math.ceil(totalQuestions.value / QUESTIONS_PER_SEGMENT)
);

const segmentProgressPercent = computed(() => {
  const inSeg = currentIndexInSegment.value + 1;
  return Math.round((inSeg / QUESTIONS_PER_SEGMENT) * 100);
});

const segmentEncouragement = computed(() => {
  const count = segmentCorrectCount.value;
  if (count === questionsPerSegment) return "Hoàn hảo! Vùng đất hoàn toàn thuộc về bạn! 🌟";
  if (count >= 3) return "Xuất sắc! Bạn đã làm chủ vùng đất này!";
  if (count >= 1) return "Cố gắng thêm! Vùng đất tiếp theo đang chờ bạn!";
  return "Đừng nản lòng! Tiếp tục chinh phục nhé!";
});

// Reset per-segment counter when entering a new segment
watch(currentSegment, () => {
  currentSegmentCorrects = 0;
});

function onAnswerChange(payload) {
  const qId = currentQuestionItem.value?.question?.id;
  if (qId) props.session.setAnswer(qId, payload);
}

async function onDirectionConfirm() {
  const q = currentQuestionItem.value?.question;
  if (!q || isChecking.value) return;

  isChecking.value = true;
  checkFeedback.value = null;

  try {
    const res = await props.session.checkQuestion(q.id);
    if (res?.isCorrect === true) {
      checkFeedback.value = "correct";
      currentSegmentCorrects++;
    } else {
      checkFeedback.value = "wrong";
    }

    setTimeout(() => {
      checkFeedback.value = null;
      const isLast = props.session.isLastQuestion.value;
      const justFinishedSegment =
        currentIndexInSegment.value === QUESTIONS_PER_SEGMENT - 1 || isLast;

      if (isLast) {
        isComplete.value = true;
        // Show segment summary for final segment
        completedSegment.value = currentSegment.value;
        segmentCorrectCount.value = currentSegmentCorrects;
        showSegmentSummary.value = true;
      } else if (justFinishedSegment) {
        // Completed a segment — show summary before moving on
        completedSegment.value = currentSegment.value;
        segmentCorrectCount.value = currentSegmentCorrects;
        showSegmentSummary.value = true;
        // Don't call next() here — wait for user to dismiss
      } else {
        props.session.next();
      }
    }, 1200);
  } catch (err) {
    if (!props.session.isLastQuestion.value) {
      props.session.next();
    } else {
      isComplete.value = true;
    }
  } finally {
    isChecking.value = false;
  }
}

function onContinueExpedition() {
  showSegmentSummary.value = false;
  if (!isComplete.value) {
    props.session.next();
  }
}
</script>

<style scoped>
.map-mode-scene {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
  background: #f1f8e9;
  padding: 14px 18px;
  border-radius: 20px;
  border: 2px solid #a5d6a7;
  margin-bottom: 14px;
}

.segment-badges {
  flex-shrink: 0;
}

.segment-progress-bar {
  width: 100%;
  height: 10px;
  background: #c8e6c9;
  border-radius: 999px;
  overflow: hidden;
}

.segment-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #2e7d32, #66bb6a);
  border-radius: 999px;
  transition: width 0.5s ease;
}

.expedition-journal {
  background: #ffffff;
  border: 3.5px solid #16a34a;
  border-radius: 24px;
  padding: 24px 28px;
  position: relative;
  box-shadow: 0 8px 30px rgba(22, 163, 74, 0.18);
}

.journal-header {
  margin-bottom: 14px;
}

.journal-header span {
  color: #15803d !important;
  font-size: 0.95rem !important;
  font-weight: 900 !important;
}

.journal-question-text {
  font-size: 1.45rem;
  font-weight: 900;
  color: #0f172a;
  line-height: 1.55;
}

.answer-area {
  width: 100%;
}

.submit-area {
  padding: 20px;
  background: #f1f8e9;
  border-radius: 20px;
  border: 2px solid #a5d6a7;
}

.segment-summary-card {
  background: linear-gradient(135deg, #e8f5e9, #f1f8e9) !important;
  border: 3px solid #2e7d32 !important;
}

@media (max-width: 375px) {
  .expedition-journal {
    padding: 18px 16px;
  }
  .journal-question-text {
    font-size: 1.1rem;
  }
  .map-header {
    flex-direction: column;
  }
}
</style>
