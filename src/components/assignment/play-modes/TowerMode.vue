<template>
  <div class="tower-mode">
    <!-- Tháp leo núi & Thông số tiến độ -->
    <v-card class="pa-4 pa-md-5 mb-5 tower-header-card" elevation="2">
      <div class="d-flex flex-wrap align-center justify-space-between ga-3">
        <div class="d-flex align-center ga-3">
          <div class="tower-avatar-badge">
            <v-icon icon="mdi-castle" size="32" color="amber-darken-2" />
          </div>
          <div>
            <div class="text-h6 font-weight-bold text-emerald-800">
              🏰 {{ t("assignmentHub.modeTower") || "Leo tháp phiêu lưu" }}
            </div>
            <div class="text-body-2 text-secondary">
              Tầng hiện tại: <strong class="text-amber-darken-3">{{ currentFloor }} / {{ totalFloors }}</strong>
            </div>
          </div>
        </div>

        <div class="d-flex align-center ga-4">
          <div class="d-flex align-center ga-1 text-h6 font-weight-bold text-amber-darken-2">
            <v-icon icon="mdi-star" color="amber-darken-1" size="28" />
            <span>{{ stars }} sao</span>
          </div>
          <v-chip color="success" variant="flat" class="font-weight-bold">
            Câu {{ currentIndex + 1 }} / {{ questions.length }}
          </v-chip>
        </div>
      </div>

      <!-- Thanh tiến độ leo tháp dạng tầng -->
      <div class="tower-progress-track mt-4">
        <div
          v-for="floor in totalFloors"
          :key="floor"
          class="tower-step"
          :class="{
            'tower-step--climbed': floor <= currentFloor,
            'tower-step--current': floor === currentFloor,
          }"
        >
          <v-icon
            :icon="floor <= currentFloor ? 'mdi-flag-checkered' : 'mdi-circle-small'"
            size="16"
          />
        </div>
      </div>
    </v-card>

    <!-- Câu hỏi hiện tại (Mỗi lần 1 câu) -->
    <div v-if="currentQuestionItem" class="current-question-container">
      <QuestionItem
        :item="currentQuestionItem"
        :index="currentIndex"
        :answer="answers[currentQuestionItem.question.id]"
        :level="1"
        mode="tower"
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
            <span v-if="checkResult.isCorrect">🎉 Tuyệt vời! Bạn đã leo thêm 1 tầng tháp!</span>
            <span v-else-if="checkResult.status === 'PENDING_TEACHER_GRADE'">📝 Câu tự luận đã được ghi nhận, chờ giáo viên chấm nhé!</span>
            <span v-else>💪 Chưa chính xác! Không sao cả, hãy cố gắng ở câu tiếp theo nhé!</span>
          </div>
          <div v-if="checkResult.explanation" class="text-body-2 mt-2">
            <strong>Lời giải thích:</strong> {{ checkResult.explanation }}
          </div>
        </v-alert>
      </v-fade-transition>

      <!-- Nút thao tác: Kiểm tra & Tiếp tục -->
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
            color="amber-darken-2"
            size="large"
            variant="flat"
            prepend-icon="mdi-checkbox-marked-circle-outline"
            :loading="checking"
            :disabled="!hasAnswer(currentQuestionItem.question.id)"
            class="px-6 font-weight-bold"
            @click="handleCheckAnswer"
          >
            Kiểm tra đáp án
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
            Câu tiếp theo
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
            {{ t("assignmentHub.submit") }}
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
  attemptId: { type: Number, required: true },
  loading: { type: Boolean, default: false },
  submitting: { type: Boolean, default: false },
  level: { type: Number, default: 1 },
});

const emit = defineEmits(["submit", "answer-change"]);
const { t } = useI18n();

const currentIndex = ref(0);
const currentFloor = ref(0);
const stars = ref(0);
const checking = ref(false);
const checkedQuestions = reactive({}); // questionId -> checkResult

const totalFloors = computed(() => props.questions.length);
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
      currentFloor.value += 1;
      stars.value += 3;
    }
  } catch (err) {
    // Nếu đã check trước đó
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
.tower-header-card {
  background: linear-gradient(135deg, #ecfdf5 0%, #fef3c7 100%);
  border: 2px solid #a7f3d0 !important;
}

.tower-avatar-badge {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.tower-progress-track {
  display: flex;
  gap: 6px;
  background: rgba(255, 255, 255, 0.7);
  padding: 8px 12px;
  border-radius: 9999px;
  overflow-x: auto;
}

.tower-step {
  flex: 1;
  height: 24px;
  border-radius: 6px;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  transition: all 0.3s ease;
}

.tower-step--climbed {
  background: #10b981;
  color: #ffffff;
}

.tower-step--current {
  background: #f59e0b;
  color: #ffffff;
  transform: scale(1.15);
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
}
</style>
