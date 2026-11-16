<template>
  <div class="fruit-mode">
    <!-- KHUNG VƯỜN CÂY HÁI QUẢ -->
    <v-card class="pa-4 pa-md-5 mb-5 fruit-header-card" elevation="2" rounded="xl">
      <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-3">
        <div class="d-flex align-center ga-3">
          <div class="fruit-avatar-badge">
            <span class="text-h4">🍎</span>
          </div>
          <div>
            <div class="text-h6 font-weight-black text-red-darken-3">
              Vườn quả thông thái
            </div>
            <div class="text-body-2 font-weight-bold text-slate-600">
              Quả hiện tại: <span class="text-red-darken-4 font-weight-black">Câu {{ currentIndex + 1 }} / {{ questions.length }}</span>
            </div>
          </div>
        </div>

        <div class="d-flex align-center ga-3">
          <!-- Giỏ đựng quả -->
          <div class="basket-badge d-flex align-center ga-2 px-3 py-1 rounded-pill bg-white border">
            <span class="text-h5">🧺</span>
            <div class="text-subtitle-2 font-weight-black text-amber-darken-4">
              {{ harvestedCount }} / {{ questions.length }} quả
            </div>
          </div>

          <!-- Sao thưởng -->
          <div class="d-flex align-center ga-1 text-h6 font-weight-black text-amber-darken-2 bg-amber-lighten-5 px-3 py-1 rounded-pill border">
            <v-icon icon="mdi-star" color="amber-darken-2" size="24" />
            <span>{{ stars }}</span>
          </div>
        </div>
      </div>

      <!-- CÂY ĂN QUẢ TRỰC QUAN -->
      <div class="orchard-track-wrapper mt-2">
        <div class="orchard-tree">
          <div class="tree-foliage">
            <div
              v-for="(item, idx) in questions"
              :key="item.question.id"
              class="fruit-node"
              :class="{
                'fruit--harvested': isHarvested(item.question.id),
                'fruit--current': idx === currentIndex,
                'fruit--hanging': !isHarvested(item.question.id) && isChecked(item.question.id),
              }"
              @click="jumpToQuestion(idx)"
            >
              <span class="fruit-emoji">{{ isHarvested(item.question.id) ? '🧺' : '🍎' }}</span>
              <span class="fruit-label">{{ idx + 1 }}</span>
            </div>
          </div>
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
        mode="fruit"
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
            <span v-if="checkResult.isCorrect">🍎 Plop! Tuyệt vời, bạn đã hái thành công 1 quả chín mọng vào giỏ!</span>
            <span v-else-if="checkResult.status === 'PENDING_TEACHER_GRADE'">📝 Câu tự luận đã được ghi nhận, chờ giáo viên chấm nhé!</span>
            <span v-else>🌿 Chưa chính xác rồi! Quả táo vẫn còn treo trên cành, thử sức ở quả tiếp theo nhé!</span>
          </div>
          <div v-if="checkResult.explanation" class="text-body-2 mt-2">
            <strong>Lời giải thích:</strong> {{ checkResult.explanation }}
          </div>
        </v-alert>
      </v-fade-transition>

      <!-- Nút điều hướng & Hái quả -->
      <div class="d-flex justify-space-between align-center mt-6">
        <v-btn
          variant="outlined"
          color="secondary"
          size="large"
          prepend-icon="mdi-arrow-left"
          :disabled="currentIndex === 0 || checking"
          @click="prevQuestion"
        >
          Quả trước
        </v-btn>

        <div class="d-flex ga-3">
          <v-btn
            v-if="!isCurrentChecked"
            color="red-darken-1"
            size="large"
            variant="flat"
            prepend-icon="mdi-hand-back-right"
            :loading="checking"
            :disabled="!hasAnswer(currentQuestionItem.question.id)"
            class="px-6 font-weight-bold"
            @click="handleCheckAnswer"
          >
            Hái quả vào giỏ
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
            Hái quả tiếp theo
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
            Nộp giỏ quả & Hoàn thành
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
const harvestedCount = ref(0);
const stars = ref(0);
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

function isHarvested(qId) {
  return checkedQuestions[qId]?.isCorrect === true;
}

function isChecked(qId) {
  return Boolean(checkedQuestions[qId]);
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
      harvestedCount.value += 1;
      stars.value += 3;
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
.fruit-header-card {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 2px solid #fecaca !important;
}

.fruit-avatar-badge {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.orchard-track-wrapper {
  background: linear-gradient(180deg, #ecfdf5 0%, #d1fae5 100%);
  padding: 16px;
  border-radius: 16px;
  border: 2px solid #a7f3d0;
}

.tree-foliage {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.fruit-node {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 4px;
  border-radius: 12px;
  transition: all 0.25s ease;
}

.fruit-node:hover {
  transform: scale(1.15);
}

.fruit-emoji {
  font-size: 26px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
}

.fruit-label {
  font-size: 11px;
  font-weight: 800;
  color: #1f2937;
  margin-top: -2px;
}

.fruit--current {
  transform: scale(1.2);
  background: rgba(239, 68, 68, 0.15);
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.4);
}

.fruit--harvested .fruit-emoji {
  filter: drop-shadow(0 2px 4px rgba(16, 185, 129, 0.5));
}

.fruit--hanging {
  opacity: 0.6;
}
</style>
