<template>
  <div class="treasure-mode-scene">
    <!-- THANH TIẾN TRÌNH SĂN KHO BÁU -->
    <div class="treasure-top-bar">
      <div class="treasure-title-badge">
        <span class="compass-icon">🧭</span>
        <div>
          <div class="text-subtitle-1 font-weight-black text-amber-900">
            Hành Trình Tìm Rương Vàng
          </div>
          <div class="text-caption font-weight-bold text-amber-800">
            Câu {{ currentNum }} / {{ totalQuestions }}
          </div>
        </div>
      </div>

      <!-- MẢNH BẢN ĐỒ ĐÃ TÌM THẤY & RƯƠNG -->
      <div class="map-progress-box">
        <span class="chest-icon">{{ mapUnlocked ? '🎁' : '🗝️' }}</span>
        <div class="progress-details">
          <div class="progress-text">
            <span>{{ foundPiecesCount }} / {{ totalQuestions }} Mảnh bản đồ</span>
            <span class="gold-count">💰 {{ foundPiecesCount * 100 }} Vàng</span>
          </div>
          <v-progress-linear
            :model-value="(foundPiecesCount / totalQuestions) * 100"
            color="amber-darken-3"
            bg-color="amber-lighten-4"
            height="10"
            rounded
          />
        </div>
      </div>
    </div>

    <!-- BẢN ĐỒ KHO BÁU VÀ CÂU HỎI -->
    <div class="treasure-viewport">
      <!-- CÁC MẢNH GHÉP BẢN ĐỒ THU NHỎ TRÊN GÓC -->
      <div class="map-grid-preview">
        <div
          v-for="idx in totalQuestions"
          :key="idx"
          class="map-tile"
          :class="{
            'tile--unlocked': isPieceUnlocked(idx - 1),
            'tile--current': idx - 1 === session.currentIndex.value,
          }"
        >
          <span v-if="isPieceUnlocked(idx - 1)">🗺️</span>
          <span v-else class="tile-number">{{ idx }}</span>
        </div>
      </div>

      <!-- CUỘN GIẤY DA CÂU ĐỐ CỔ -->
      <div v-if="currentQuestionItem" class="parchment-scroll-box">
        <div class="scroll-header">
          <span class="scroll-seal">📜</span>
          <span class="scroll-label">MẬT THƯ SỐ {{ currentNum }}</span>
        </div>
        <div class="scroll-question-text">
          {{ currentQuestionItem.question.content }}
        </div>
      </div>

      <!-- CÁC ĐIỂM KHAI QUẬT ĐÁP ÁN -->
      <div v-if="currentQuestionItem" class="dig-sites-container mt-6">
        <div v-if="isMcqType">
          <TreasureAnswerInput
            :question="currentQuestionItem.question"
            :model-value="session.answers[currentQuestionItem.question.id]"
            :disabled="isChecking || isChecked"
            :feedback="checkFeedback"
            @update:model-value="onAnswerChange"
            @confirm="onConfirmDig"
          />
        </div>

        <div v-else class="non-mcq-card pa-4 bg-white rounded-xl border">
          <QuestionItem
            :item="currentQuestionItem"
            :index="session.currentIndex.value"
            :answer="session.answers[currentQuestionItem.question.id]"
            :level="1"
            mode="treasure"
            @answered="onLegacyAnswered"
          />
        </div>
      </div>

      <!-- THÔNG BÁO HIỆU ỨNG TÌM THẤY MẢNH BẢN ĐỒ -->
      <v-slide-y-transition>
        <div v-if="checkFeedback" class="feedback-banner mt-6" :class="`banner--${checkFeedback}`">
          <div v-if="checkFeedback === 'correct'" class="d-flex align-center justify-center ga-3">
            <span class="text-h4">💎✨</span>
            <div>
              <div class="text-h6 font-weight-black">TUYỆT VỜI! MẢNH BẢN ĐỒ ĐƯỢC GIẢI MÃ!</div>
              <div class="text-caption">+100 Đồng Vàng vào túi kho báu</div>
            </div>
          </div>
          <div v-else class="d-flex align-center justify-center ga-3">
            <span class="text-h4">💨⏳</span>
            <div>
              <div class="text-h6 font-weight-black">CHƯA TÌM THẤY! HÃY ĐI TIẾP VỀ PHÍA TRƯỚC!</div>
              <div class="text-caption">Đừng nản lòng, kho báu vẫn đang chờ phía trước</div>
            </div>
          </div>
        </div>
      </v-slide-y-transition>

      <!-- ĐIỀU HƯỚNG BƯỚC ĐI VÀ NỘP BÀI -->
      <div class="treasure-nav-row mt-8">
        <v-btn
          variant="tonal"
          color="amber-darken-4"
          size="large"
          prepend-icon="mdi-chevron-left"
          :disabled="session.currentIndex.value === 0 || isChecking"
          rounded="pill"
          @click="session.prev()"
        >
          Chặng trước
        </v-btn>

        <div class="d-flex ga-3">
          <v-btn
            v-if="!isChecked"
            color="amber-darken-3"
            size="large"
            prepend-icon="mdi-shovel"
            :loading="isChecking"
            :disabled="!hasAnswer"
            rounded="pill"
            class="px-8 font-weight-black elevation-3"
            @click="onConfirmDig"
          >
            Khai Quật Điểm Này
          </v-btn>

          <v-btn
            v-if="!session.isLastQuestion.value"
            color="amber-darken-4"
            size="large"
            append-icon="mdi-chevron-right"
            :disabled="isChecking"
            rounded="pill"
            class="px-6 font-weight-bold"
            @click="session.next()"
          >
            Chặng tiếp theo
          </v-btn>

          <v-btn
            v-if="session.isLastQuestion.value"
            color="success"
            size="large"
            prepend-icon="mdi-treasure-chest"
            :loading="session.submitting.value"
            rounded="pill"
            class="px-8 font-weight-black elevation-4"
            @click="session.submit()"
          >
            Mở Rương Kho Báu & Nộp
          </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import TreasureAnswerInput from "./TreasureAnswerInput.vue";
import QuestionItem from "../../QuestionItem.vue";

const props = defineProps({
  session: { type: Object, required: true },
});

const { t } = useI18n();

const unlockedPieces = ref(new Set());
const isChecking = ref(false);
const checkFeedback = ref(null);
const checkedQuestions = ref({});

const totalQuestions = computed(() => props.session.totalQuestions.value || 1);
const currentNum = computed(() => props.session.currentIndex.value + 1);
const currentQuestionItem = computed(() => props.session.currentQuestionItem.value);

const isMcqType = computed(() => {
  const type = currentQuestionItem.value?.question?.type;
  return type === "MCQ" || type === "MULTI_MCQ" || type === "TRUE_FALSE";
});

const isChecked = computed(() => {
  const qId = currentQuestionItem.value?.question?.id;
  return Boolean(checkedQuestions.value[qId]);
});

const hasAnswer = computed(() => {
  const qId = currentQuestionItem.value?.question?.id;
  if (!qId) return false;
  const ans = props.session.answers[qId];
  if (!ans) return false;
  if (typeof ans === "object") {
    return ans.selectedOptionId != null || (Array.isArray(ans.selectedOptionIds) && ans.selectedOptionIds.length > 0);
  }
  return true;
});

const foundPiecesCount = computed(() => unlockedPieces.value.size);
const mapUnlocked = computed(() => foundPiecesCount.value >= totalQuestions.value);

function isPieceUnlocked(index) {
  return unlockedPieces.value.has(index);
}

function onAnswerChange(payload) {
  const qId = currentQuestionItem.value?.question?.id;
  if (qId) {
    props.session.setAnswer(qId, payload);
  }
}

function onLegacyAnswered(questionId) {
  // synced
}

async function onConfirmDig() {
  const q = currentQuestionItem.value?.question;
  if (!q || isChecking.value || isChecked.value) return;

  isChecking.value = true;
  checkFeedback.value = null;

  try {
    const res = await props.session.checkQuestion(q.id);
    checkedQuestions.value[q.id] = res;

    if (res?.isCorrect === true) {
      checkFeedback.value = "correct";
      unlockedPieces.value.add(props.session.currentIndex.value);
    } else {
      checkFeedback.value = "wrong";
    }

    setTimeout(() => {
      checkFeedback.value = null;
      if (!props.session.isLastQuestion.value) {
        props.session.next();
      }
    }, 1500);
  } catch (err) {
    // handled
  } finally {
    isChecking.value = false;
  }
}
</script>

<style scoped>
.treasure-mode-scene {
  min-height: 700px;
  background: radial-gradient(ellipse at top, #fffbeb 0%, #fef3c7 50%, #fde68a 100%);
  border-radius: 28px;
  padding: 24px;
  box-shadow: 0 10px 40px rgba(180, 83, 9, 0.15);
  border: 4px solid #f59e0b;
}

/* TOP STATS */
.treasure-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  background: #ffffff;
  padding: 16px 24px;
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  border: 2px solid #fcd34d;
}

.treasure-title-badge {
  display: flex;
  align-items: center;
  gap: 12px;
}

.compass-icon {
  font-size: 2.2rem;
  animation: spinSlow 12s linear infinite;
}

@keyframes spinSlow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.map-progress-box {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 280px;
}

.chest-icon {
  font-size: 2.2rem;
}

.progress-details {
  flex: 1;
}

.progress-text {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  font-weight: 800;
  color: #78350f;
  margin-bottom: 4px;
}

.gold-count {
  color: #b45309;
}

/* GRID MẢNH BẢN ĐỒ NHỎ */
.map-grid-preview {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  margin: 18px 0;
}

.map-tile {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 2px dashed #d97706;
  background: #fffbeb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 800;
  color: #92400e;
}

.tile--unlocked {
  border-style: solid;
  border-color: #10b981;
  background: #d1fae5;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
}

.tile--current {
  border-color: #f59e0b;
  border-style: solid;
  transform: scale(1.1);
}

/* CUỘN GIẤY DA */
.parchment-scroll-box {
  background: #fffdf5;
  border: 3px solid #b45309;
  border-radius: 20px;
  padding: 24px 30px;
  box-shadow: 0 8px 24px rgba(146, 64, 14, 0.12);
  position: relative;
  max-width: 760px;
  margin: 0 auto;
}

.scroll-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #92400e;
  font-weight: 900;
  font-size: 0.9rem;
  letter-spacing: 1px;
  margin-bottom: 12px;
}

.scroll-question-text {
  font-size: 1.4rem;
  font-weight: 900;
  color: #451a03;
  line-height: 1.5;
  text-align: center;
}

/* FEEDBACK BANNER */
.feedback-banner {
  max-width: 600px;
  margin: 0 auto;
  padding: 16px 24px;
  border-radius: 16px;
  text-align: center;
}

.banner--correct {
  background: #ecfdf5;
  border: 2px solid #10b981;
  color: #065f46;
}

.banner--wrong {
  background: #fef2f2;
  border: 2px solid #ef4444;
  color: #991b1b;
}

/* NAVIGATION */
.treasure-nav-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 760px;
  margin: 0 auto;
  flex-wrap: wrap;
  gap: 12px;
}

@media (max-width: 600px) {
  .treasure-mode-scene {
    padding: 14px;
  }
  .scroll-question-text {
    font-size: 1.15rem;
  }
  .map-progress-box {
    width: 100%;
  }
  .treasure-nav-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
