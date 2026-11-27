<template>
  <v-dialog
    :model-value="modelValue"
    max-width="720"
    scrollable
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center justify-space-between pa-4 border-b">
        <span class="text-subtitle-1 font-weight-bold">{{ t("notebook.detail.title") }}</span>
        <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('update:modelValue', false)" />
      </v-card-title>

      <v-card-text class="pa-5">
        <div v-if="loading" class="d-flex flex-column ga-3">
          <v-skeleton-loader type="article, list-item-three-line" />
        </div>

        <v-alert v-else-if="error" type="error" variant="tonal">
          <div class="d-flex align-center justify-space-between ga-2">
            <span>{{ error }}</span>
            <v-btn size="small" variant="text" color="error" @click="loadDetail">
              {{ t("notebook.retry") }}
            </v-btn>
          </div>
        </v-alert>

        <template v-else-if="detail">
          <div class="d-flex align-center flex-wrap ga-2 mb-3">
            <v-chip size="small" color="primary" variant="tonal">
              {{ t(`notebook.questionTypes.${detail.question?.type}`, detail.question?.type) }}
            </v-chip>
            <span v-if="detail.question?.lesson" class="text-caption text-medium-emphasis">
              {{ detail.question.lesson.chapter?.title }} · {{ detail.question.lesson.title }}
            </span>
          </div>

          <div class="text-body-1 font-weight-bold mb-4">
            {{ detail.question?.content }}
          </div>

          <div class="d-flex flex-column ga-2 mb-4">
            <v-sheet
              v-for="opt in detail.question?.options || []"
              :key="opt.id"
              rounded="lg"
              border
              class="pa-3 d-flex align-center justify-space-between"
              :class="optionClass(opt.id)"
            >
              <span>{{ opt.content }}</span>
              <v-chip
                v-if="!detail.answerLocked && opt.id === detail.correctOptionId"
                size="x-small"
                color="success"
                variant="flat"
              >
                {{ t("notebook.detail.correctAnswer") }}
              </v-chip>
              <v-chip
                v-else-if="detail.lastWrongOption?.id === opt.id"
                size="x-small"
                color="error"
                variant="flat"
              >
                {{ t("notebook.detail.lastWrong") }}
              </v-chip>
            </v-sheet>
          </div>

          <v-alert v-if="detail.answerLocked" type="info" variant="tonal" class="mb-4">
            {{ t("notebook.detail.answerLocked") }}
          </v-alert>
          <v-alert v-else-if="detail.explanation" type="success" variant="tonal" class="mb-4">
            <div class="font-weight-bold mb-1">{{ t("notebook.detail.explanation") }}</div>
            <div>{{ detail.explanation }}</div>
          </v-alert>

          <div v-if="detail.reviewLogs?.length" class="mt-4">
            <div class="text-subtitle-2 font-weight-bold mb-2">
              {{ t("notebook.detail.history") }}
            </div>
            <v-timeline density="compact" side="end" truncate-line="both">
              <v-timeline-item
                v-for="log in detail.reviewLogs"
                :key="log.id"
                :dot-color="log.isCorrect ? 'success' : 'error'"
                size="x-small"
              >
                <div class="text-caption">
                  <strong>{{ log.isCorrect ? t("notebook.review.correctCount") : t("notebook.review.wrongCount") }}</strong>
                  · {{ t("notebook.boxLabel", { box: log.boxBefore }) }} → {{ t("notebook.boxLabel", { box: log.boxAfter }) }}
                  · {{ new Date(log.reviewedAt).toLocaleDateString() }}
                </div>
              </v-timeline-item>
            </v-timeline>
          </div>
        </template>
      </v-card-text>

      <v-card-actions v-if="detail && !loading" class="pa-4 border-t flex-wrap ga-2">
        <!-- Reserved hidden slot for future AI explanation button -->
        <v-btn
          variant="text"
          color="error"
          :loading="dismissing"
          @click="confirmDismiss = true"
        >
          {{ t("notebook.detail.dismiss") }}
        </v-btn>
        <v-spacer />
        <v-btn
          v-if="detail.status === 'ACTIVE'"
          color="primary"
          rounded="lg"
          :to="`/student/notebook/review?mode=free&questionId=${detail.questionId}`"
          @click="$emit('update:modelValue', false)"
        >
          {{ t("notebook.detail.reviewNow") }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <ConfirmDialog
      v-model="confirmDismiss"
      :title="t('notebook.detail.dismissConfirmTitle')"
      :message="t('notebook.detail.dismissConfirmMessage')"
      :confirm-text="t('notebook.detail.dismissConfirmButton')"
      confirm-color="error"
      :loading="dismissing"
      @confirm="handleDismiss"
    />
  </v-dialog>
</template>

<script setup>
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import ConfirmDialog from "../shared/ConfirmDialog.vue";
import { dismissQuestion, getDetail } from "../../services/notebook";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  questionId: { type: Number, default: null },
});

const emit = defineEmits(["update:modelValue", "dismissed"]);
const { t } = useI18n();

const detail = ref(null);
const loading = ref(false);
const error = ref("");
const confirmDismiss = ref(false);
const dismissing = ref(false);

function optionClass(optionId) {
  if (detail.value && !detail.value.answerLocked && optionId === detail.value.correctOptionId) {
    return "border-success bg-success-subtle";
  }
  if (detail.value?.lastWrongOption?.id === optionId) {
    return "border-error";
  }
  return "";
}

async function loadDetail() {
  if (!props.questionId) return;
  loading.value = true;
  error.value = "";
  try {
    detail.value = await getDetail(props.questionId);
  } catch (err) {
    error.value = err?.message || t("notebook.loadError");
  } finally {
    loading.value = false;
  }
}

async function handleDismiss() {
  if (!props.questionId) return;
  dismissing.value = true;
  try {
    await dismissQuestion(props.questionId);
    confirmDismiss.value = false;
    emit("update:modelValue", false);
    emit("dismissed", props.questionId);
  } catch (err) {
    error.value = err?.message || t("notebook.loadError");
  } finally {
    dismissing.value = false;
  }
}

watch(
  () => [props.modelValue, props.questionId],
  ([open, id]) => {
    if (open && id) {
      loadDetail();
    }
  },
);
</script>
