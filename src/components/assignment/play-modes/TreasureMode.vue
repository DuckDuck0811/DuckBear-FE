<template>
  <div class="treasure-mode">
    <!-- KHUNG BẢN ĐỒ SĂN KHO BÁU -->
    <v-card class="pa-4 pa-md-5 mb-5 treasure-header-card" elevation="2" rounded="xl">
      <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-3">
        <div class="d-flex align-center ga-3">
          <div class="treasure-avatar-badge">
            <span class="text-h4">🏴‍☠️</span>
          </div>
          <div>
            <div class="text-h6 font-weight-black text-amber-darken-4">
              Săn kho báu hải tặc
            </div>
            <div class="text-body-2 font-weight-bold text-slate-600">
              Mảnh bản đồ: <span class="text-amber-darken-3 font-weight-black">Mảnh {{ currentIndex + 1 }} / {{ questions.length }}</span>
            </div>
          </div>
        </div>

        <div class="d-flex align-center ga-3">
          <!-- Rương kho báu -->
          <div class="chest-badge d-flex align-center ga-2 px-3 py-1 rounded-pill bg-white border">
            <span class="text-h5">{{ unlockedPiecesCount === questions.length ? '👑' : '💎' }}</span>
            <div class="text-subtitle-2 font-weight-black text-amber-darken-3">
              {{ unlockedPiecesCount }} / {{ questions.length }} mảnh
            </div>
          </div>

          <!-- Kim cương / Vàng -->
          <div class="d-flex align-center ga-1 text-h6 font-weight-black text-amber-darken-2 bg-amber-lighten-5 px-3 py-1 rounded-pill border">
            <span>🪙</span>
            <span>{{ coins }}</span>
          </div>
        </div>
      </div>

      <!-- BẢN ĐỒ KHO BÁU CỔ XƯA -->
      <div class="map-board mt-2">
        <div class="map-grid">
          <div
            v-for="(item, idx) in questions"
            :key="item.question.id"
            class="map-tile"
            :class="{
              'map-tile--unlocked': isTileUnlocked(item.question.id),
              'map-tile--current': idx === currentIndex,
            }"
            @click="jumpToQuestion(idx)"
          >
            <span v-if="isTileUnlocked(item.question.id)" class="tile-icon">🗺️</span>
            <span v-else class="tile-number">?</span>
            <span class="tile-index">{{ idx + 1 }}</span>
          </div>
        </div>

        <!-- Rương báu ở góc bản đồ -->
        <div class="treasure-chest-box" :class="{ 'chest--open': unlockedPiecesCount > 0 }">
          <span class="chest-icon">{{ unlockedPiecesCount === questions.length ? '🏆' : '📦' }}</span>
          <span class="chest-label font-weight-bold">Rương báu</span>
        </div>
      </div>
    </v-card>

    <!-- CÂU HỎI HIỆN TẠI -->
    <div v-if="currentQuestionItem" class="current-question-container">
      <QuestionItem
        :item="currentQuestionItem"
        :index="currentIndex"
        :answer="answers[currentQuestionItem.question.id]"
        :level="1"
        mode="treasure"
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
            <span v-if="checkResult.isCorrect">✨ Chính xác! Mảnh bản đồ số {{ currentIndex + 1 }} đã được giải mã!</span>
            <span v-else-if="checkResult.status === 'PENDING_TEACHER_GRADE'">📝 Câu tự luận đã được ghi nhận, chờ thuyền trưởng chấm nhé!</span>
            <span v-else>🔒 Chưa đúng mật mã! Mảnh bản đồ chưa mở được, hãy tìm ở câu tiếp theo!</span>
          </div>
          <div v-if="checkResult.explanation" class="text-body-2 mt-2">
            <strong>Lời giải thích:</strong> {{ checkResult.explanation }}
          </div>
        </v-alert>
      </v-fade-transition>

      <!-- Nút điều hướng & Mở mảnh bản đồ -->
      <div class="d-flex justify-space-between align-center mt-6">
        <v-btn
          variant="outlined"
          color="secondary"
          size="large"
          prepend-icon="mdi-arrow-left"
          :disabled="currentIndex === 0 || checking"
          @click="prevQuestion"
        >
          Mảnh trước
        </v-btn>

        <div class="d-flex ga-3">
          <v-btn
            v-if="!isCurrentChecked"
            color="amber-darken-3"
            size="large"
            variant="flat"
            prepend-icon="mdi-key"
            :loading="checking"
            :disabled="!hasAnswer(currentQuestionItem.question.id)"
            class="px-6 font-weight-bold text-white"
            @click="handleCheckAnswer"
          >
            Giải mã mảnh bản đồ
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
            Mảnh tiếp theo
          </v-btn>

          <v-btn
            v-if="isLastQuestion"
            color="primary"
            size="large"
            variant="flat"
            prepend-icon="mdi-treasure-chest"
            :loading="submitting"
            class="px-8 font-weight-bold"
            @click="$emit('submit')"
          >
            Mở rương báu & Nộp bài
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
const unlockedPiecesCount = ref(0);
const coins = ref(0);
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

function isTileUnlocked(qId) {
  return checkedQuestions[qId]?.isCorrect === true;
}

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
      unlockedPiecesCount.value += 1;
      coins.value += 10;
    }
  } catch (err) {
    if (err?.status === 409 || err?.response?.status === 409) {
      checkedQuestions[q.id] = { isCorrect: false, status: "ALREADY_CHECKED" };
    }
  } finally {
    checking.value = false;
  }
}

function jumpToQuestion(idx) {
  currentIndex.value = idx;
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
.treasure-header-card {
  background: linear-gradient(135deg, #fefce8 0%, #fef08a 100%);
  border: 2px solid #fde047 !important;
}

.treasure-avatar-badge {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.map-board {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fef3c7;
  border: 2px dashed #d97706;
  border-radius: 16px;
  padding: 14px;
  gap: 12px;
}

.map-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex-grow: 1;
}

.map-tile {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #fde68a;
  border: 2px solid #d97706;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.map-tile:hover {
  transform: scale(1.1);
}

.map-tile--current {
  border-color: #b45309;
  background: #f59e0b;
  color: white;
  transform: scale(1.15);
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.6);
}

.map-tile--unlocked {
  background: #fef08a;
  border-color: #10b981;
}

.tile-icon {
  font-size: 16px;
}

.tile-number {
  font-size: 14px;
  font-weight: 900;
  color: #92400e;
}

.tile-index {
  font-size: 9px;
  position: absolute;
  bottom: 1px;
  right: 3px;
  font-weight: bold;
  opacity: 0.7;
}

.treasure-chest-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 14px;
  border-radius: 12px;
  background: white;
  border: 2px solid #f59e0b;
}

.chest-icon {
  font-size: 32px;
}

.chest-label {
  font-size: 11px;
  color: #b45309;
}
</style>
