<template>
  <div class="exam-mode">
    <v-row>
      <!-- Cột chính: Câu hỏi đang làm -->
      <v-col cols="12" md="8" lg="9">
        <v-card v-if="currentQuestionItem" class="pa-4 pa-md-6 mb-4 exam-question-card" elevation="1">
          <div class="d-flex align-center justify-space-between mb-4 pb-2 border-b">
            <div class="d-flex align-center ga-2">
              <v-chip color="primary" variant="flat" class="font-weight-bold">
                Câu {{ currentIndex + 1 }} / {{ questions.length }}
              </v-chip>
              <v-chip size="small" variant="tonal" class="text-secondary">
                {{ t(`questionBank.types.${currentQuestionItem.question.type}`) }}
              </v-chip>
            </div>

            <!-- Nút đánh dấu xem lại -->
            <v-btn
              :variant="isFlagged(currentQuestionItem.question.id) ? 'flat' : 'outlined'"
              :color="isFlagged(currentQuestionItem.question.id) ? 'amber-darken-2' : 'secondary'"
              size="small"
              :prepend-icon="isFlagged(currentQuestionItem.question.id) ? 'mdi-flag' : 'mdi-flag-outline'"
              class="font-weight-medium"
              @click="toggleFlag(currentQuestionItem.question.id)"
            >
              {{ isFlagged(currentQuestionItem.question.id) ? 'Đã đánh dấu xem lại' : 'Đánh dấu xem lại' }}
            </v-btn>
          </div>

          <!-- Nội dung câu hỏi qua QuestionItem -->
          <QuestionItem
            :item="currentQuestionItem"
            :index="currentIndex"
            :answer="answers[currentQuestionItem.question.id]"
            :level="3"
            mode="exam"
            @answered="onAnswered"
          />

          <!-- Nút điều hướng -->
          <div class="d-flex justify-space-between align-center mt-6 pt-4 border-t">
            <v-btn
              variant="outlined"
              color="secondary"
              prepend-icon="mdi-arrow-left"
              :disabled="currentIndex === 0"
              @click="prevQuestion"
            >
              Câu trước
            </v-btn>

            <v-btn
              v-if="!isLastQuestion"
              color="primary"
              variant="flat"
              append-icon="mdi-arrow-right"
              class="px-6 font-weight-bold"
              @click="nextQuestion"
            >
              Câu kế tiếp
            </v-btn>

            <v-btn
              v-else
              color="primary"
              variant="flat"
              prepend-icon="mdi-send"
              :loading="submitting"
              class="px-6 font-weight-bold"
              @click="confirmSubmitDialog = true"
            >
              {{ t("assignmentHub.submit") }}
            </v-btn>
          </div>
        </v-card>
      </v-col>

      <!-- Cột phụ: Bảng số câu hỏi và trạng thái -->
      <v-col cols="12" md="4" lg="3">
        <v-card class="pa-4 exam-sidebar-card position-sticky" style="top: 80px" elevation="1">
          <div class="text-subtitle-1 font-weight-bold mb-3 d-flex align-center justify-space-between">
            <span>Bảng số câu</span>
            <v-chip size="x-small" color="primary" variant="tonal">
              {{ answeredCount }}/{{ questions.length }} đã làm
            </v-chip>
          </div>

          <!-- Chú thích màu sắc -->
          <div class="d-flex flex-wrap ga-2 text-caption text-secondary mb-3 pb-2 border-b">
            <div class="d-flex align-center ga-1">
              <span class="status-dot status-dot--answered" /> Đã làm
            </div>
            <div class="d-flex align-center ga-1">
              <span class="status-dot status-dot--unanswered" /> Chưa làm
            </div>
            <div class="d-flex align-center ga-1">
              <span class="status-dot status-dot--flagged" /> Xem lại
            </div>
          </div>

          <!-- Lưới các câu hỏi -->
          <div class="exam-grid">
            <v-btn
              v-for="(item, idx) in questions"
              :key="item.question.id"
              size="small"
              :variant="currentIndex === idx ? 'flat' : isQuestionAnswered(item.question.id) ? 'tonal' : 'outlined'"
              :color="getQuestionColor(item.question.id, idx)"
              class="font-weight-bold exam-grid-btn"
              @click="jumpToQuestion(idx)"
            >
              <span>{{ idx + 1 }}</span>
              <v-icon
                v-if="isFlagged(item.question.id)"
                icon="mdi-flag"
                size="12"
                color="amber-darken-2"
                class="position-absolute"
                style="top: 2px; right: 2px"
              />
            </v-btn>
          </div>

          <!-- Nút nộp bài phòng thi -->
          <v-btn
            color="primary"
            block
            size="large"
            variant="flat"
            prepend-icon="mdi-send"
            :loading="submitting"
            class="mt-5 font-weight-bold"
            @click="confirmSubmitDialog = true"
          >
            {{ t("assignmentHub.submit") }}
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog xác nhận nộp bài -->
    <v-dialog v-model="confirmSubmitDialog" max-width="480">
      <v-card class="pa-5 rounded-lg">
        <div class="text-h6 font-weight-bold mb-2">Xác nhận nộp bài thi</div>
        <div class="text-body-2 text-secondary mb-4">
          Bạn đã hoàn thành <strong>{{ answeredCount }}/{{ questions.length }}</strong> câu hỏi.
          <span v-if="flaggedCount > 0" class="text-amber-darken-3 font-weight-bold ml-1">
            (Có {{ flaggedCount }} câu đánh dấu xem lại)
          </span>
        </div>
        <div v-if="unansweredCount > 0" class="text-warning text-caption font-weight-bold mb-4">
          ⚠️ Bạn còn {{ unansweredCount }} câu chưa trả lời. Bạn có chắc muốn nộp ngay không?
        </div>
        <div class="d-flex justify-end ga-2">
          <v-btn variant="text" @click="confirmSubmitDialog = false">Tiếp tục làm bài</v-btn>
          <v-btn color="primary" :loading="submitting" @click="doSubmit">Nộp bài ngay</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import QuestionItem from "../QuestionItem.vue";

const props = defineProps({
  assignment: { type: Object, required: true },
  questions: { type: Array, required: true },
  answers: { type: Object, required: true },
  loading: { type: Boolean, default: false },
  submitting: { type: Boolean, default: false },
  level: { type: Number, default: 3 },
});

const emit = defineEmits(["submit", "answer-change"]);
const { t } = useI18n();

const currentIndex = ref(0);
const flaggedMap = reactive({}); // questionId -> boolean
const confirmSubmitDialog = ref(false);

const currentQuestionItem = computed(() => props.questions[currentIndex.value]);
const isLastQuestion = computed(() => currentIndex.value >= props.questions.length - 1);

function isQuestionAnswered(questionId) {
  const a = props.answers[questionId];
  if (!a) return false;
  const hasSingle = a.selectedOptionId !== null && a.selectedOptionId !== undefined;
  const hasMulti = Array.isArray(a.selectedOptionIds) && a.selectedOptionIds.length > 0;
  const hasText = typeof a.answerText === "string" && a.answerText.trim().length > 0;
  const hasImage = typeof a.imageUrl === "string" && a.imageUrl.length > 0;
  const hasMatch = a.matchAnswers && Object.keys(a.matchAnswers).length > 0;
  return hasSingle || hasMulti || hasText || hasImage || hasMatch;
}

const answeredCount = computed(() => {
  return props.questions.filter((q) => isQuestionAnswered(q.question.id)).length;
});
const unansweredCount = computed(() => props.questions.length - answeredCount.value);
const flaggedCount = computed(() => Object.values(flaggedMap).filter(Boolean).length);

function isFlagged(questionId) {
  return Boolean(flaggedMap[questionId]);
}

function toggleFlag(questionId) {
  flaggedMap[questionId] = !flaggedMap[questionId];
}

function getQuestionColor(questionId, idx) {
  if (currentIndex.value === idx) return "primary";
  if (isFlagged(questionId)) return "amber-darken-2";
  if (isQuestionAnswered(questionId)) return "primary";
  return "grey";
}

function onAnswered(questionId) {
  emit("answer-change", { questionId, index: currentIndex.value });
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

function doSubmit() {
  confirmSubmitDialog.value = false;
  emit("submit");
}
</script>

<style scoped>
.exam-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}

.exam-grid-btn {
  min-width: 0 !important;
  padding: 0 !important;
  height: 36px !important;
  position: relative;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.status-dot--answered {
  background-color: #2563eb;
}
.status-dot--unanswered {
  background-color: #94a3b8;
}
.status-dot--flagged {
  background-color: #f59e0b;
}
</style>
