<template>
  <div class="classic-mode">
    <!-- Header tiến độ & điều hướng nhanh -->
    <v-card class="pa-4 pa-md-5 mb-5" elevation="1">
      <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-3">
        <div>
          <span class="text-subtitle-1 font-weight-bold">
            {{ t("questionBank.questionCount", { count: questions.length }) }}
          </span>
          <span class="text-caption text-secondary ml-2">
            ({{ answeredCount }}/{{ questions.length }} {{ t("assignments.statusDone") || "đã làm" }})
          </span>
        </div>
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-send"
          :loading="submitting"
          class="font-weight-bold"
          @click="$emit('submit')"
        >
          {{ t("assignmentHub.submit") }}
        </v-btn>
      </div>

      <v-progress-linear
        :model-value="(answeredCount / (questions.length || 1)) * 100"
        color="primary"
        height="8"
        rounded
      />

      <!-- Lưới câu hỏi 1..N -->
      <div class="d-flex flex-wrap ga-1 mt-4">
        <v-btn
          v-for="(item, index) in questions"
          :key="item.question.id"
          size="x-small"
          :variant="isQuestionAnswered(item.question.id) ? 'flat' : 'outlined'"
          :color="isQuestionAnswered(item.question.id) ? 'primary' : 'grey'"
          class="font-weight-bold"
          style="min-width: 32px; height: 32px"
          @click="scrollToQuestion(index)"
        >
          {{ index + 1 }}
        </v-btn>
      </div>
    </v-card>

    <!-- Danh sách câu hỏi cuộn dọc -->
    <div class="questions-list">
      <QuestionItem
        v-for="(item, index) in questions"
        :id="'question-card-' + index"
        :key="item.question.id"
        :item="item"
        :index="index"
        :answer="answers[item.question.id]"
        :level="level"
        mode="classic"
        @answered="onAnswered(item.question.id, index)"
      />
    </div>

    <!-- Nút nộp bài cuối trang -->
    <div class="d-flex justify-end mt-6 mb-10">
      <v-btn
        color="primary"
        size="large"
        prepend-icon="mdi-send"
        :loading="submitting"
        class="px-8 font-weight-bold"
        @click="$emit('submit')"
      >
        {{ t("assignmentHub.submit") }}
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
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

function onAnswered(questionId, index) {
  emit("answer-change", { questionId, index });
}

function scrollToQuestion(index) {
  const el = document.getElementById("question-card-" + index);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}
</script>
