<template>
  <div class="practice-mode">
    <!-- Header điều hướng & danh sách câu hỏi -->
    <v-card class="pa-4 mb-4 practice-header-card" elevation="1">
      <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-3">
        <div class="d-flex align-center ga-2">
          <v-chip color="primary" variant="flat" size="small" class="font-weight-bold">
            {{ t("assignmentHub.modePractice") || "Chế độ luyện tập" }}
          </v-chip>
          <span class="text-body-2 text-secondary">
            Câu {{ currentIndex + 1 }} / {{ questions.length }}
          </span>
        </div>

        <v-btn
          color="primary"
          variant="outlined"
          size="small"
          prepend-icon="mdi-send"
          :loading="submitting"
          class="font-weight-bold"
          @click="$emit('submit')"
        >
          {{ t("assignmentHub.submit") }}
        </v-btn>
      </div>

      <!-- Thanh chọn nhanh câu hỏi -->
      <div class="d-flex flex-wrap ga-1">
        <v-btn
          v-for="(item, index) in questions"
          :key="item.question.id"
          size="x-small"
          :variant="currentIndex === index ? 'flat' : isQuestionChecked(item.question.id) ? 'tonal' : 'outlined'"
          :color="currentIndex === index ? 'primary' : getQuestionStatusColor(item.question.id)"
          class="font-weight-bold"
          style="min-width: 32px; height: 32px"
          @click="jumpToQuestion(index)"
        >
          {{ index + 1 }}
        </v-btn>
      </div>
    </v-card>

    <!-- Câu hỏi hiện tại -->
    <div v-if="currentQuestionItem" class="current-question-card">
      <QuestionItem
        :item="currentQuestionItem"
        :index="currentIndex"
        :answer="answers[currentQuestionItem.question.id]"
        :level="3"
        mode="practice"
        :disabled="isCurrentChecked"
        @answered="onAnswered"
      />

      <!-- Khối hiển thị đáp án và lời giải chi tiết -->
      <v-slide-y-transition>
        <div v-if="checkResult" class="explanation-box mt-4 mb-4 pa-4 rounded-lg">
          <div class="d-flex align-center ga-2 mb-2 font-weight-bold">
            <v-icon
              :icon="checkResult.isCorrect ? 'mdi-check-circle' : checkResult.status === 'PENDING_TEACHER_GRADE' ? 'mdi-clock-outline' : 'mdi-close-circle'"
              :color="checkResult.isCorrect ? 'success' : checkResult.status === 'PENDING_TEACHER_GRADE' ? 'info' : 'error'"
              size="24"
            />
            <span
              :class="checkResult.isCorrect ? 'text-success' : checkResult.status === 'PENDING_TEACHER_GRADE' ? 'text-info' : 'text-error'"
              class="text-subtitle-1"
            >
              {{ checkResult.isCorrect ? 'Chính xác!' : checkResult.status === 'PENDING_TEACHER_GRADE' ? 'Câu hỏi tự luận đã nộp - chờ giáo viên chấm' : 'Chưa chính xác!' }}
            </span>
          </div>

          <div v-if="checkResult.explanation" class="text-body-2 mt-2 pt-2 border-t">
            <div class="font-weight-bold text-secondary mb-1">💡 Lời giải / Hướng dẫn:</div>
            <div class="text-slate-800" style="white-space: pre-wrap; line-height: 1.6">{{ checkResult.explanation }}</div>
          </div>
        </div>
      </v-slide-y-transition>

      <!-- Nút điều hướng & kiểm tra -->
      <div class="d-flex justify-space-between align-center mt-5">
        <v-btn
          variant="outlined"
          color="secondary"
          prepend-icon="mdi-chevron-left"
          :disabled="currentIndex === 0 || checking"
          @click="prevQuestion"
        >
          Câu trước
        </v-btn>

        <div class="d-flex ga-3">
          <v-btn
            v-if="!isCurrentChecked"
            color="primary"
            variant="flat"
            prepend-icon="mdi-check-decagram-outline"
            :loading="checking"
            :disabled="!hasAnswer(currentQuestionItem.question.id)"
            class="px-6 font-weight-bold"
            @click="handleCheckAnswer"
          >
            Kiểm tra câu này
          </v-btn>

          <v-btn
            v-if="!isLastQuestion"
            color="primary"
            variant="tonal"
            append-icon="mdi-chevron-right"
            class="px-6 font-weight-bold"
            @click="nextQuestion"
          >
            Câu kế tiếp
          </v-btn>

          <v-btn
            v-if="isLastQuestion"
            color="primary"
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
  level: { type: Number, default: 3 },
});

const emit = defineEmits(["submit", "answer-change"]);
const { t } = useI18n();

const currentIndex = ref(0);
const checking = ref(false);
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

function isQuestionChecked(questionId) {
  return Boolean(checkedQuestions[questionId]);
}

function getQuestionStatusColor(questionId) {
  const r = checkedQuestions[questionId];
  if (!r) return "grey";
  if (r.isCorrect === true) return "success";
  if (r.status === "PENDING_TEACHER_GRADE") return "info";
  return "error";
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
  } catch (err) {
    if (err?.response?.status === 409) {
      checkedQuestions[q.id] = { isCorrect: false, status: "ALREADY_CHECKED" };
    }
  } finally {
    checking.value = false;
  }
}

function jumpToQuestion(index) {
  currentIndex.value = index;
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
.explanation-box {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
}
</style>
