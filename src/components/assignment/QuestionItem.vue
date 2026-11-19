<template>
  <v-card
    class="pa-5 pa-md-6 mb-4 quiz-card"
    :class="`quiz-card--${mode}`"
    rounded="xl"
    elevation="1"
  >
    <template v-if="!hideStem">
      <!-- Hàng badge tiêu đề câu hỏi -->
      <div class="d-flex flex-wrap align-center justify-space-between ga-2 mb-3">
        <div class="d-flex flex-wrap align-center ga-2">
          <!-- Số thứ tự câu -->
          <v-chip
            size="default"
            color="primary"
            variant="flat"
            class="font-weight-black text-body-2 px-3"
          >
            {{ t("questionBank.questionNumber", { number: index + 1 }) }}
          </v-chip>

          <!-- Loại câu hỏi (kích thước tối thiểu 13px) -->
          <v-chip
            size="default"
            variant="tonal"
            color="primary"
            class="font-weight-bold px-3"
            style="font-size: 13.5px !important; min-height: 28px;"
          >
            {{ t(`questionBank.types.${item.question.type}`) }}
          </v-chip>
        </div>

        <!-- Điểm số câu hỏi -->
        <v-chip
          size="small"
          variant="tonal"
          color="secondary"
          class="font-weight-bold"
        >
          {{ item.points || 1 }} {{ t("assignmentHub.pointsShort") || "điểm" }}
        </v-chip>
      </div>

      <!-- Nội dung câu hỏi (chữ to thoáng, dễ đọc) -->
      <div
        class="font-weight-bold mb-4 text-grey-darken-4 question-content"
        style="font-size: 1.15rem; line-height: 1.65; word-break: break-word;"
      >
        {{ item.question.content }}
      </div>
    </template>

    <!-- 1. Trắc nghiệm 1 đáp án (MCQ) & Đúng / Sai (TRUE_FALSE) -->
    <div
      v-if="['MCQ', 'TRUE_FALSE'].includes(item.question.type)"
      class="options-list d-flex flex-column ga-2"
      role="radiogroup"
      :aria-label="`Lựa chọn cho câu ${index + 1}`"
    >
      <div
        v-for="(option, optIdx) in item.question.options"
        :key="option.id"
        class="option-row d-flex align-center pa-3 px-4 rounded-xl border transition-swing cursor-pointer"
        :class="{
          'option-row--selected': answer.selectedOptionId === option.id,
          'option-row--disabled': disabled,
        }"
        role="radio"
        :aria-checked="answer.selectedOptionId === option.id"
        :tabindex="disabled ? -1 : 0"
        @click="!disabled && selectOption(option.id)"
        @keydown.space.prevent="!disabled && selectOption(option.id)"
        @keydown.enter.prevent="!disabled && selectOption(option.id)"
      >
        <!-- Chỉ báo hình tròn radio -->
        <div class="option-indicator mr-3 d-flex align-center justify-center">
          <div
            class="radio-circle"
            :class="{ 'radio-circle--checked': answer.selectedOptionId === option.id }"
          >
            <div v-if="answer.selectedOptionId === option.id" class="radio-dot"></div>
          </div>
        </div>

        <!-- Ký hiệu đáp án A, B, C, D -->
        <div
          v-if="item.question.type === 'MCQ'"
          class="option-badge mr-3 font-weight-bold"
          :class="answer.selectedOptionId === option.id ? 'option-badge--checked' : ''"
        >
          {{ letters[optIdx] || '' }}
        </div>

        <!-- Nội dung văn bản đáp án -->
        <div class="option-text text-body-1 flex-grow-1 font-weight-medium">
          {{ displayOptionContent(item.question.type, option.content) }}
        </div>
      </div>
    </div>

    <!-- 2. Trắc nghiệm nhiều đáp án (MULTI_MCQ) -->
    <div
      v-else-if="item.question.type === 'MULTI_MCQ'"
      class="options-list d-flex flex-column ga-2"
      role="group"
      :aria-label="`Lựa chọn cho câu ${index + 1}`"
    >
      <div
        v-for="(option, optIdx) in item.question.options"
        :key="option.id"
        class="option-row d-flex align-center pa-3 px-4 rounded-xl border transition-swing cursor-pointer"
        :class="{
          'option-row--selected': (answer.selectedOptionIds || []).includes(option.id),
          'option-row--disabled': disabled,
        }"
        role="checkbox"
        :aria-checked="(answer.selectedOptionIds || []).includes(option.id)"
        :tabindex="disabled ? -1 : 0"
        @click="!disabled && toggleOption(option.id, !(answer.selectedOptionIds || []).includes(option.id))"
        @keydown.space.prevent="!disabled && toggleOption(option.id, !(answer.selectedOptionIds || []).includes(option.id))"
        @keydown.enter.prevent="!disabled && toggleOption(option.id, !(answer.selectedOptionIds || []).includes(option.id))"
      >
        <!-- Chỉ báo hình vuông checkbox -->
        <div class="option-indicator mr-3 d-flex align-center justify-center">
          <div
            class="checkbox-square"
            :class="{ 'checkbox-square--checked': (answer.selectedOptionIds || []).includes(option.id) }"
          >
            <v-icon
              v-if="(answer.selectedOptionIds || []).includes(option.id)"
              icon="mdi-check"
              size="14"
              color="white"
            />
          </div>
        </div>

        <div
          class="option-badge mr-3 font-weight-bold"
          :class="(answer.selectedOptionIds || []).includes(option.id) ? 'option-badge--checked' : ''"
        >
          {{ letters[optIdx] || '' }}
        </div>

        <div class="option-text text-body-1 flex-grow-1 font-weight-medium">
          {{ option.content }}
        </div>
      </div>
    </div>

    <!-- 3. Nối cột (MATCHING) -->
    <div
      v-else-if="item.question.type === 'MATCHING'"
      class="d-flex flex-column ga-2"
    >
      <div
        v-for="option in item.question.options"
        :key="option.id"
        class="d-flex flex-column flex-sm-row align-sm-center ga-3 pa-3 rounded-xl border bg-grey-lighten-5"
      >
        <div class="flex-grow-1 font-weight-medium text-body-1">{{ option.content }}</div>
        <v-select
          v-model="answer.matchAnswers[option.id]"
          :items="item.question.matchTargets"
          :label="t('assignmentHub.chooseMatch')"
          :disabled="disabled"
          variant="outlined"
          density="comfortable"
          hide-details
          rounded="lg"
          color="primary"
          style="max-width: 280px"
          @update:model-value="onAnswerChange"
        />
      </div>
    </div>

    <!-- 4. Kéo thả (DRAG_DROP) -->
    <div
      v-else-if="item.question.type === 'DRAG_DROP' && item.question.options.length === 4"
      class="drag-drop-activity"
    >
      <p class="text-caption text-secondary mb-2">{{ t("assignmentHub.dragTip") }}</p>
      <div class="d-flex flex-wrap ga-2 mb-3">
        <v-btn
          v-for="option in item.question.options"
          :key="option.id"
          variant="tonal"
          color="primary"
          rounded="pill"
          size="small"
          prepend-icon="mdi-drag"
          :disabled="disabled || isDragItemPlaced(option.id)"
          @click="selectDragItem(option.id)"
        >
          {{ option.content }}
        </v-btn>
      </div>
      <div
        class="drop-target pa-3 rounded-lg border-dashed d-flex align-center justify-space-between cursor-pointer"
        :style="{
          border: '2px dashed ' + (answer.selectedOptionId ? '#22c55e' : '#94a3b8'),
          background: answer.selectedOptionId ? '#f0fdf4' : '#f8fafc',
          minHeight: '48px',
        }"
        @click="clearDropTarget"
      >
        <span class="text-body-2 font-weight-bold">
          {{
            answer.selectedOptionId
              ? item.question.options.find((o) => o.id === Number(answer.selectedOptionId))?.content
              : t("assignmentHub.dropHere")
          }}
        </span>
        <v-icon
          v-if="answer.selectedOptionId && !disabled"
          icon="mdi-close"
          size="16"
          color="secondary"
        />
      </div>
    </div>

    <!-- 5. Điền khuyết (FILL) & Tự luận (ESSAY) -->
    <div v-else>
      <v-textarea
        v-model="answer.answerText"
        :label="
          item.question.type === 'FILL'
            ? t('assignmentHub.yourAnswer')
            : t('assignmentHub.writeAnswer')
        "
        :disabled="disabled"
        variant="outlined"
        rows="3"
        auto-grow
        hide-details
        rounded="lg"
        @update:model-value="onAnswerChange"
      />
    </div>

    <!-- Nút điều hướng chuyển câu trước / câu sau ở cuối mỗi câu -->
    <div v-if="!hideStem" class="question-nav-row d-flex align-center justify-space-between pt-4 mt-4 border-t">
      <v-btn
        variant="text"
        density="comfortable"
        prepend-icon="mdi-arrow-left"
        :disabled="isFirst"
        class="font-weight-bold text-caption text-sm-body-2"
        @click="emit('prev', index)"
      >
        {{ t("assignmentHub.prevQuestion") }}
      </v-btn>

      <v-chip
        size="x-small"
        :color="isAnswered ? 'success' : 'grey-darken-1'"
        variant="tonal"
        class="font-weight-bold px-2"
      >
        {{ isAnswered ? t("assignmentHub.answeredStatus") : t("assignmentHub.unansweredStatus") }}
      </v-chip>

      <v-btn
        variant="text"
        density="comfortable"
        :append-icon="isLast ? 'mdi-send' : 'mdi-arrow-right'"
        :color="isLast ? 'primary' : undefined"
        class="font-weight-bold text-caption text-sm-body-2"
        @click="emit('next', index)"
      >
        {{ isLast ? t("assignmentHub.finishAndReview") : t("assignmentHub.nextQuestion") }}
      </v-btn>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps({
  item: { type: Object, required: true },
  index: { type: Number, required: true },
  answer: { type: Object, required: true },
  mode: { type: String, default: "classic" },
  level: { type: Number, default: 3 },
  disabled: { type: Boolean, default: false },
  hideStem: { type: Boolean, default: false },
  isFirst: { type: Boolean, default: false },
  isLast: { type: Boolean, default: false },
});

const emit = defineEmits(["answered", "prev", "next"]);
const { t } = useI18n();

const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];

const isAnswered = computed(() => {
  const a = props.answer;
  if (!a) return false;
  const hasSingle =
    a.selectedOptionId !== null && a.selectedOptionId !== undefined;
  const hasMulti =
    Array.isArray(a.selectedOptionIds) && a.selectedOptionIds.length > 0;
  const hasText =
    typeof a.answerText === "string" && a.answerText.trim().length > 0;
  const hasMatch = a.matchAnswers && Object.keys(a.matchAnswers).length > 0;
  return hasSingle || hasMulti || hasText || hasMatch;
});

function onAnswerChange() {
  emit("answered", props.item.question.id);
}

function selectOption(optionId) {
  props.answer.selectedOptionId = optionId;
  onAnswerChange();
}

function displayOptionContent(type, content) {
  if (type === "TRUE_FALSE") {
    if (content === "TRUE") return t("questionBank.trueText") || "Đúng";
    if (content === "FALSE") return t("questionBank.falseText") || "Sai";
  }
  return content;
}

function toggleOption(optionId, isChecked) {
  if (!props.answer.selectedOptionIds) props.answer.selectedOptionIds = [];
  if (isChecked) {
    if (!props.answer.selectedOptionIds.includes(optionId)) {
      props.answer.selectedOptionIds.push(optionId);
    }
  } else {
    props.answer.selectedOptionIds = props.answer.selectedOptionIds.filter(
      (id) => id !== optionId,
    );
  }
  onAnswerChange();
}

function selectDragItem(optionId) {
  props.answer.selectedOptionId = optionId;
  onAnswerChange();
}

function isDragItemPlaced(optionId) {
  return Number(props.answer.selectedOptionId) === Number(optionId);
}

function clearDropTarget() {
  if (props.disabled) return;
  props.answer.selectedOptionId = null;
  onAnswerChange();
}
</script>

<style scoped>
.quiz-card {
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.option-row {
  min-height: 48px;
  background-color: #ffffff;
  border-color: #e2e8f0 !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}

.option-row:hover:not(.option-row--disabled) {
  background-color: #f8fafc;
  border-color: #cbd5e1 !important;
}

.option-row--selected {
  background-color: #eff6ff !important;
  border-color: #2563eb !important;
  border-width: 2px !important;
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.1);
}

.option-row:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.radio-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.radio-circle--checked {
  border-color: #2563eb;
}

.radio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #2563eb;
}

.checkbox-square {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 2px solid #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.checkbox-square--checked {
  border-color: #2563eb;
  background-color: #2563eb;
}

.option-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background-color: #f1f5f9;
  color: #475569;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.option-badge--checked {
  background-color: #2563eb;
  color: #ffffff;
}
</style>
