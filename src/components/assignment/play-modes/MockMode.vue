<template>
  <div class="mock-mode">
    <!-- KHUNG ĐIỀU HÀNH THI THỬ THPT -->
    <v-card class="pa-4 pa-md-5 mb-5 mock-header-card" elevation="1" rounded="xl">
      <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-3">
        <div class="d-flex align-center ga-3">
          <div class="mock-avatar-badge">
            <v-icon icon="mdi-school" size="30" color="blue-grey-darken-3" />
          </div>
          <div>
            <div class="text-h6 font-weight-black text-slate-800">
              Kỳ Thi Thử Tốt Nghiệp THPT Quốc Gia
            </div>
            <div class="text-body-2 font-weight-bold text-slate-600">
              Phần thi: <span class="text-primary font-weight-black">{{ currentSectionName }}</span>
            </div>
          </div>
        </div>

        <div class="d-flex align-center ga-3">
          <!-- Tiến độ làm bài -->
          <v-chip color="primary" variant="tonal" class="font-weight-bold" size="large">
            Đã làm: {{ answeredCount }} / {{ questions.length }} câu
          </v-chip>

          <!-- Nút nộp bài -->
          <v-btn
            color="primary"
            size="large"
            variant="flat"
            prepend-icon="mdi-send-check"
            :loading="submitting"
            class="font-weight-bold px-6"
            @click="confirmSubmitDialog = true"
          >
            Nộp bài thi
          </v-btn>
        </div>
      </div>

      <!-- PHIẾU TRẢ LỜI TRẮC NGHIỆM CHUẨN THI THỬ -->
      <div class="mock-grid-box mt-3 pa-3 rounded-lg bg-slate-50 border">
        <div class="text-caption font-weight-bold text-slate-500 mb-2">
          PHIẾU TRẢ LỜI CÂU HỎI (BẤM SỐ CÂU ĐỂ ĐIỀU HƯỚNG NHANH):
        </div>
        <div class="mock-grid">
          <v-btn
            v-for="(item, idx) in questions"
            :key="item.question.id"
            size="small"
            :variant="currentIndex === idx ? 'flat' : hasAnswer(item.question.id) ? 'tonal' : 'outlined'"
            :color="currentIndex === idx ? 'primary' : hasAnswer(item.question.id) ? 'success' : 'grey'"
            class="mock-grid-btn font-weight-bold"
            @click="jumpToQuestion(idx)"
          >
            {{ idx + 1 }}
          </v-btn>
        </div>
      </div>
    </v-card>

    <!-- CÂU HỎI HIỆN TẠI -->
    <div v-if="currentQuestionItem" class="current-question-container">
      <QuestionItem
        :item="currentQuestionItem"
        :index="currentIndex"
        :answer="answers[currentQuestionItem.question.id]"
        :level="3"
        mode="mock"
        @answered="onAnswered"
      />

      <!-- Nút điều hướng -->
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
            color="primary"
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
            prepend-icon="mdi-send-check"
            :loading="submitting"
            class="px-8 font-weight-bold"
            @click="confirmSubmitDialog = true"
          >
            Hoàn thành & Nộp bài
          </v-btn>
        </div>
      </div>
    </div>

    <!-- DIALOG XÁC NHẬN NỘP BÀI -->
    <v-dialog v-model="confirmSubmitDialog" max-width="500">
      <v-card class="pa-5" rounded="xl">
        <div class="text-h6 font-weight-bold mb-2">
          Xác nhận nộp bài thi
        </div>
        <div class="text-body-1 text-slate-700 mb-3">
          Bạn đã hoàn thành <strong>{{ answeredCount }} / {{ questions.length }}</strong> câu hỏi.
          <span v-if="answeredCount < questions.length" class="text-warning font-weight-bold d-block mt-1">
            ⚠️ Còn {{ questions.length - answeredCount }} câu chưa được trả lời!
          </span>
        </div>
        <div class="text-body-2 text-secondary mb-4">
          Kết quả điểm số chi tiết và đáp án sẽ chỉ được hiển thị sau khi bạn bấm xác nhận nộp bài.
        </div>
        <div class="d-flex justify-end ga-3">
          <v-btn variant="outlined" color="secondary" @click="confirmSubmitDialog = false">
            Làm tiếp
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="submitting"
            @click="handleSubmit"
          >
            Xác nhận nộp bài
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import QuestionItem from "../QuestionItem.vue";

const props = defineProps({
  assignment: { type: Object, required: true },
  questions: { type: Array, required: true },
  answers: { type: Object, required: true },
  attemptId: { type: [Number, String], required: true },
  loading: { type: Boolean, default: false },
  submitting: { type: Boolean, default: false },
  level: { type: Number, default: 3 },
});

const emit = defineEmits(["submit", "answer-change"]);
const { t } = useI18n();

const currentIndex = ref(0);
const confirmSubmitDialog = ref(false);

const currentQuestionItem = computed(() => props.questions[currentIndex.value]);
const isLastQuestion = computed(() => currentIndex.value >= props.questions.length - 1);

const currentSectionName = computed(() => {
  const type = currentQuestionItem.value?.question?.type;
  if (type === "MCQ") return "Phần I: Câu hỏi trắc nghiệm nhiều phương án lựa chọn";
  if (type === "MATCHING" || type === "MULTI_MCQ") return "Phần II: Câu hỏi lựa chọn phức hợp / Ghép nối";
  return "Phần III: Câu hỏi trả lời ngắn & Tự luận";
});

const answeredCount = computed(() => {
  let count = 0;
  for (const item of props.questions) {
    if (hasAnswer(item.question.id)) count += 1;
  }
  return count;
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

function handleSubmit() {
  confirmSubmitDialog.value = false;
  emit("submit");
}
</script>

<style scoped>
.mock-header-card {
  background: #ffffff;
  border: 1px solid #cbd5e1 !important;
}

.mock-avatar-badge {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #cbd5e1;
}

.mock-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.mock-grid-btn {
  min-width: 36px;
  height: 36px;
  padding: 0 4px;
}
</style>
