<template>
  <v-card
    class="pa-5 pa-md-6 mb-4 quiz-card"
    :class="`quiz-card--${mode}`"
    rounded="xl"
  >
    <div class="d-flex align-center justify-space-between mb-3">
      <div class="d-flex align-center ga-2">
        <v-chip
          :size="mode === 'fun' ? 'default' : 'small'"
          :color="modeColor"
          variant="tonal"
          class="font-weight-bold"
        >
          {{ t("questionBank.questionNumber", { number: index + 1 }) }}
        </v-chip>
        <v-chip size="x-small" variant="tonal" class="text-secondary">
          {{ t(`questionBank.types.${item.question.type}`) }}
        </v-chip>
      </div>

      <!-- Điểm số câu hỏi -->
      <span class="text-caption font-weight-bold text-secondary">
        {{ item.points || 1 }} {{ t("assignmentHub.pointsShort") || "điểm" }}
      </span>
    </div>

    <!-- Nội dung câu hỏi -->
    <div
      class="font-weight-bold mb-4"
      :class="mode === 'fun' ? 'text-h6' : 'text-body-1'"
      style="line-height: 1.6"
    >
      {{ item.question.content }}
    </div>

    <!-- 1. Trắc nghiệm 1 đáp án (MCQ) & Đúng / Sai (TRUE_FALSE) -->
    <v-radio-group
      v-if="['MCQ', 'TRUE_FALSE'].includes(item.question.type)"
      v-model="answer.selectedOptionId"
      :disabled="disabled"
      hide-details
      @update:model-value="onAnswerChange"
    >
      <v-radio
        v-for="option in item.question.options"
        :key="option.id"
        :label="displayOptionContent(item.question.type, option.content)"
        :value="option.id"
        class="my-1"
        :color="modeColor"
      />
    </v-radio-group>

    <!-- 2. Trắc nghiệm nhiều đáp án (MULTI_MCQ) -->
    <div v-else-if="item.question.type === 'MULTI_MCQ'">
      <v-checkbox
        v-for="option in item.question.options"
        :key="option.id"
        :model-value="answer.selectedOptionIds.includes(option.id)"
        :label="option.content"
        :disabled="disabled"
        hide-details
        density="compact"
        class="my-1"
        :color="modeColor"
        @update:model-value="toggleOption(option.id, $event)"
      />
    </div>

    <!-- 3. Nối cột (MATCHING) -->
    <div
      v-else-if="item.question.type === 'MATCHING'"
      class="d-flex flex-column ga-2"
    >
      <div
        v-for="option in item.question.options"
        :key="option.id"
        class="d-flex flex-column flex-sm-row align-sm-center ga-3 pa-2 rounded-lg"
        :style="{ background: mode === 'focus' ? '#f8fafc' : '#f0fdf4' }"
      >
        <div class="flex-grow-1 font-weight-medium">{{ option.content }}</div>
        <v-select
          v-model="answer.matchAnswers[option.id]"
          :items="item.question.matchTargets"
          :label="t('assignmentHub.chooseMatch')"
          :disabled="disabled"
          variant="outlined"
          density="compact"
          hide-details
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
          :color="modeColor"
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
        rows="2"
        auto-grow
        hide-details
        rounded="lg"
        @update:model-value="onAnswerChange"
      />
      <template v-if="item.question.type === 'ESSAY'">
        <v-file-input
          :label="t('assignmentHub.attachWork')"
          accept="image/png,image/jpeg,image/webp"
          prepend-icon="mdi-camera-outline"
          variant="outlined"
          density="compact"
          hide-details
          rounded="lg"
          class="mt-3"
          :disabled="disabled"
          @update:model-value="handleAnswerImage"
        />
        <div v-if="answer.imageUrl" class="mt-3">
          <v-img
            :src="answer.imageUrl"
            max-height="240"
            width="100%"
            cover
            rounded="lg"
          />
          <v-btn
            v-if="!disabled"
            size="small"
            variant="text"
            color="error"
            prepend-icon="mdi-delete-outline"
            class="mt-1"
            @click="answer.imageUrl = null"
          >
            {{ t("assignmentHub.removeAttachment") }}
          </v-btn>
        </div>
      </template>
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
  mode: { type: String, default: "focus" },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(["answered"]);
const { t } = useI18n();

const modeColor = computed(() => {
  if (props.mode === "fun") return "amber-darken-2";
  if (props.mode === "competitive") return "indigo";
  return "primary";
});

function onAnswerChange() {
  emit("answered", props.item.question.id);
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
}

function handleAnswerImage(file) {
  if (!file) {
    props.answer.imageUrl = null;
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    props.answer.imageUrl = e.target.result;
    onAnswerChange();
  };
  reader.readAsDataURL(file);
}
</script>
