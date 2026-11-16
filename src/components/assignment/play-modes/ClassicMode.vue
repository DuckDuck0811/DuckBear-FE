<template>
  <div class="classic-mode">
    <!-- Header thông tin bài tập của Classic -->
    <v-card v-if="assignment" class="pa-4 pa-md-5 mb-4" rounded="xl" elevation="1">
      <div class="d-flex flex-wrap align-center justify-space-between ga-3">
        <div>
          <div class="text-overline text-primary">
            {{ assignment.class?.name }} · {{ assignment.lesson?.title || assignment.book?.title }}
          </div>
          <h1 class="text-h5 font-weight-black">{{ assignment.title }}</h1>
        </div>
        <v-chip
          v-if="timeLabel"
          color="warning"
          variant="tonal"
          prepend-icon="mdi-timer-outline"
        >
          {{ timeLabel }}
        </v-chip>
      </div>
      <div v-if="attemptNo" class="text-body-2 text-secondary mt-1">
        {{ t("assignmentHub.attemptLabel", { number: attemptNo, max: assignment.maxAttempts ? assignment.maxAttempts : t("assignmentHub.unlimited") }) }}
      </div>
    </v-card>

    <!-- Header tiến độ & điều hướng nhanh -->
    <v-card class="pa-4 pa-md-5 mb-5" elevation="1" rounded="xl">
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
          @click="handleSubmit"
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
        @click="handleSubmit"
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
  session: { type: Object, default: null },
  // Fallbacks khi truyền rời props
  assignment: { type: Object, default: () => ({}) },
  questions: { type: Array, default: () => [] },
  answers: { type: Object, default: () => ({}) },
  loading: { type: Boolean, default: false },
  submitting: { type: Boolean, default: false },
  level: { type: Number, default: 3 },
});

const emit = defineEmits(["submit", "answer-change"]);
const { t } = useI18n();

const assignment = computed(() => props.session?.assignment?.value || props.assignment);
const questions = computed(() => props.session?.questions?.value || props.questions || []);
const answers = computed(() => props.session?.answers || props.answers || {});
const submitting = computed(() => props.session?.submitting?.value ?? props.submitting);
const level = computed(() => props.session?.level?.value ?? props.level);
const timeLabel = computed(() => props.session?.timeLabel?.value || "");
const attemptNo = computed(() => props.session?.attemptNo?.value || 1);

function isQuestionAnswered(questionId) {
  const a = answers.value[questionId];
  if (!a) return false;
  const hasSingle = a.selectedOptionId !== null && a.selectedOptionId !== undefined;
  const hasMulti = Array.isArray(a.selectedOptionIds) && a.selectedOptionIds.length > 0;
  const hasText = typeof a.answerText === "string" && a.answerText.trim().length > 0;
  const hasImage = typeof a.imageUrl === "string" && a.imageUrl.length > 0;
  const hasMatch = a.matchAnswers && Object.keys(a.matchAnswers).length > 0;
  return hasSingle || hasMulti || hasText || hasImage || hasMatch;
}

const answeredCount = computed(() => {
  return questions.value.filter((q) => isQuestionAnswered(q.question.id)).length;
});

function onAnswered(questionId, index) {
  if (props.session) {
    props.session.setAnswer(questionId, answers.value[questionId]);
  }
  emit("answer-change", { questionId, index });
}

function scrollToQuestion(index) {
  const el = document.getElementById("question-card-" + index);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function handleSubmit() {
  if (props.session) {
    props.session.submit();
  } else {
    emit("submit");
  }
}
</script>
