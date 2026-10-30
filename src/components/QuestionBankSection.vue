<template>
  <div class="question-bank-action" @click.stop>
    <v-btn
      size="x-small"
      variant="tonal"
      color="primary"
      prepend-icon="mdi-comment-question-outline"
      class="text-none"
      @click="openDialog"
    >
      {{ t('questionBank.button') }}
    </v-btn>

    <v-dialog v-model="showDialog" max-width="900" scrollable>
      <v-card class="question-bank-dialog rounded-xl">
        <v-card-title
          class="d-flex align-center justify-space-between ga-3 pa-5"
        >
          <div>
            <div class="text-overline text-primary font-weight-bold">
              {{ t('questionBank.eyebrow') }}
            </div>
            <h2 class="text-h6 font-weight-black">{{ lessonTitle }}</h2>
          </div>
          <v-btn
            icon="mdi-close"
            variant="text"
            :aria-label="t('questionBank.close')"
            @click="showDialog = false"
          />
        </v-card-title>
        <v-divider />

        <v-card-text class="pa-5">
          <v-alert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            class="mb-4"
          >
            {{ errorMessage }}
          </v-alert>

          <template v-if="showEditor">
            <div class="d-flex align-center justify-space-between mb-4">
              <h3 class="text-subtitle-1 font-weight-black">
                {{
                  editingQuestion
                    ? t('questionBank.editTitle')
                    : t('questionBank.createTitle')
                }}
              </h3>
              <v-btn
                variant="text"
                prepend-icon="mdi-arrow-left"
                @click="showEditor = false"
              >
                {{ t('questionBank.backToList') }}
              </v-btn>
            </div>

            <v-form ref="formRef" @submit.prevent="saveQuestion">
              <v-row>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="form.type"
                    :items="questionTypes"
                    item-title="title"
                    item-value="value"
                    :label="t('questionBank.type')"
                    variant="outlined"
                    density="comfortable"
                    @update:model-value="handleTypeChange"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="form.difficulty"
                    :items="difficultyLevels"
                    item-title="title"
                    item-value="value"
                    :label="t('questionBank.difficulty')"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="form.content"
                    :label="t('questionBank.content')"
                    :rules="requiredRules"
                    variant="outlined"
                    rows="3"
                    auto-grow
                  />
                </v-col>
              </v-row>

              <div v-if="form.type === 'MCQ'" class="options-editor mb-4">
                <div class="d-flex align-center justify-space-between mb-2">
                  <div>
                    <h4 class="text-body-1 font-weight-bold">
                      {{ t('questionBank.options') }}
                    </h4>
                    <p class="text-caption text-secondary mb-0">
                      {{ t('questionBank.chooseCorrect') }}
                    </p>
                  </div>
                  <v-btn
                    size="small"
                    variant="tonal"
                    prepend-icon="mdi-plus"
                    @click="addOption"
                  >
                    {{ t('questionBank.addOption') }}
                  </v-btn>
                </div>

                <v-radio-group v-model="correctOptionIndex" hide-details>
                  <div
                    v-for="(option, index) in form.options"
                    :key="index"
                    class="option-row"
                  >
                    <v-radio
                      :value="index"
                      :aria-label="
                        t('questionBank.correctOption', { number: index + 1 })
                      "
                    />
                    <v-text-field
                      v-model="option.content"
                      :label="
                        t('questionBank.optionLabel', { number: index + 1 })
                      "
                      :rules="requiredRules"
                      variant="outlined"
                      density="compact"
                      hide-details="auto"
                    />
                    <v-btn
                      icon="mdi-close"
                      size="small"
                      variant="text"
                      color="error"
                      :disabled="form.options.length <= 2"
                      :aria-label="
                        t('questionBank.removeOption', { number: index + 1 })
                      "
                      @click="removeOption(index)"
                    />
                  </div>
                </v-radio-group>
              </div>

              <v-textarea
                v-model="form.answerText"
                :label="t('questionBank.answerText')"
                variant="outlined"
                rows="2"
                auto-grow
              />
              <v-textarea
                v-model="form.explanation"
                :label="t('questionBank.explanation')"
                variant="outlined"
                rows="2"
                auto-grow
              />

              <div class="d-flex justify-end ga-2 mt-2">
                <v-btn variant="text" @click="showEditor = false">{{
                  t('questionBank.cancel')
                }}</v-btn>
                <v-btn color="primary" type="submit" :loading="isSaving">
                  {{
                    editingQuestion
                      ? t('questionBank.save')
                      : t('questionBank.createQuestion')
                  }}
                </v-btn>
              </div>
            </v-form>
          </template>

          <template v-else>
            <div
              class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-3 mb-4"
            >
              <div>
                <h3 class="text-subtitle-1 font-weight-black">
                  {{ t('questionBank.listTitle') }}
                </h3>
                <p class="text-body-2 text-secondary mb-0">
                  {{ t('questionBank.count', { count: questions.length }) }}
                </p>
              </div>
              <v-btn
                color="primary"
                prepend-icon="mdi-plus"
                @click="openCreate"
              >
                {{ t('questionBank.createQuestion') }}
              </v-btn>
            </div>

            <v-progress-linear
              v-if="isLoading"
              indeterminate
              color="primary"
              rounded
              class="mb-4"
            />
            <div v-if="!isLoading && questions.length" class="question-list">
              <v-card
                v-for="question in questions"
                :key="question.id"
                class="question-item pa-4"
                rounded="lg"
              >
                <div
                  class="d-flex flex-column flex-sm-row align-start justify-space-between ga-3"
                >
                  <div class="min-width-0 flex-grow-1">
                    <div class="d-flex flex-wrap ga-2 mb-2">
                      <v-chip size="x-small" color="primary" variant="tonal">{{
                        t(`questionBank.types.${question.type}`)
                      }}</v-chip>
                      <v-chip
                        size="x-small"
                        color="secondary"
                        variant="tonal"
                        >{{
                          t(`questionBank.difficulties.${question.difficulty}`)
                        }}</v-chip
                      >
                    </div>
                    <p class="text-body-1 font-weight-bold mb-2">
                      {{ question.content }}
                    </p>
                    <ul
                      v-if="question.options?.length"
                      class="question-options"
                    >
                      <li v-for="option in question.options" :key="option.id">
                        <v-icon
                          :icon="
                            option.isCorrect
                              ? 'mdi-check-circle'
                              : 'mdi-circle-outline'
                          "
                          :color="option.isCorrect ? 'success' : 'secondary'"
                          size="16"
                        />
                        <span>{{ option.content }}</span>
                      </li>
                    </ul>
                    <p
                      v-if="question.answerText"
                      class="text-body-2 text-secondary mt-2 mb-0"
                    >
                      <strong>{{ t('questionBank.answerText') }}:</strong>
                      {{ question.answerText }}
                    </p>
                    <p
                      v-if="question.explanation"
                      class="text-body-2 text-secondary mt-1 mb-0"
                    >
                      <strong>{{ t('questionBank.explanation') }}:</strong>
                      {{ question.explanation }}
                    </p>
                  </div>
                  <div class="d-flex ga-1">
                    <v-btn
                      icon="mdi-pencil-outline"
                      size="small"
                      variant="text"
                      :aria-label="t('questionBank.edit')"
                      @click="openEdit(question)"
                    />
                    <v-btn
                      icon="mdi-trash-can-outline"
                      size="small"
                      variant="text"
                      color="error"
                      :aria-label="t('questionBank.delete')"
                      @click="confirmDelete(question)"
                    />
                  </div>
                </div>
              </v-card>
            </div>
            <v-card
              v-else-if="!isLoading"
              class="empty-bank pa-7 text-center"
              rounded="lg"
              variant="tonal"
            >
              <v-icon
                icon="mdi-comment-question-outline"
                size="38"
                color="primary"
                class="mb-2"
              />
              <p class="text-body-2 text-secondary mb-0">
                {{ t('questionBank.empty') }}
              </p>
            </v-card>
          </template>
        </v-card-text>
      </v-card>
    </v-dialog>

    <ConfirmDialog
      v-model="showDeleteConfirm"
      :title="t('questionBank.deleteTitle')"
      :message="t('questionBank.deleteMessage')"
      :loading="isDeleting"
      @confirm="deleteQuestion"
    />
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { api } from '../services/api';
import ConfirmDialog from './shared/ConfirmDialog.vue';

const props = defineProps({
  lessonId: { type: [Number, String], required: true },
  lessonTitle: { type: String, required: true },
});

const { t } = useI18n();
const showDialog = ref(false);
const showEditor = ref(false);
const showDeleteConfirm = ref(false);
const questions = ref([]);
const questionToDelete = ref(null);
const editingQuestion = ref(null);
const formRef = ref(null);
const isLoading = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);
const errorMessage = ref('');
const requiredRules = [
  (value) => !!String(value || '').trim() || t('questionBank.required'),
];

const emptyForm = () => ({
  type: 'MCQ',
  difficulty: 'MEDIUM',
  content: '',
  answerText: '',
  explanation: '',
  options: [
    { content: '', isCorrect: true },
    { content: '', isCorrect: false },
    { content: '', isCorrect: false },
    { content: '', isCorrect: false },
  ],
});

const form = reactive(emptyForm());
const questionTypes = computed(() =>
  ['MCQ', 'FILL', 'ESSAY', 'DRAG_DROP'].map((value) => ({
    title: t(`questionBank.types.${value}`),
    value,
  })),
);
const difficultyLevels = computed(() =>
  ['EASY', 'MEDIUM', 'HARD'].map((value) => ({
    title: t(`questionBank.difficulties.${value}`),
    value,
  })),
);
const correctOptionIndex = computed({
  get: () => form.options.findIndex((option) => option.isCorrect),
  set: (selectedIndex) => {
    form.options.forEach((option, index) => {
      option.isCorrect = index === selectedIndex;
    });
  },
});

async function loadQuestions() {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    questions.value = await api(`/lessons/${props.lessonId}/questions`);
  } catch (error) {
    errorMessage.value = error.message || t('questionBank.loadError');
  } finally {
    isLoading.value = false;
  }
}

async function openDialog() {
  showDialog.value = true;
  showEditor.value = false;
  await loadQuestions();
}

function resetForm(values = emptyForm()) {
  Object.assign(form, values);
  editingQuestion.value = null;
  errorMessage.value = '';
}

function openCreate() {
  resetForm();
  showEditor.value = true;
}

function openEdit(question) {
  resetForm({
    type: question.type,
    difficulty: question.difficulty,
    content: question.content,
    answerText: question.answerText || '',
    explanation: question.explanation || '',
    options: (question.options || []).map(({ content, isCorrect }) => ({
      content,
      isCorrect,
    })),
  });
  editingQuestion.value = question;
  showEditor.value = true;
}

function handleTypeChange(type) {
  if (type === 'MCQ' && !form.options.length) {
    form.options = [
      { content: '', isCorrect: true },
      { content: '', isCorrect: false },
    ];
  }
}

function addOption() {
  form.options.push({ content: '', isCorrect: false });
}

function removeOption(index) {
  const wasCorrect = form.options[index].isCorrect;
  form.options.splice(index, 1);
  if (wasCorrect && form.options.length) form.options[0].isCorrect = true;
}

function buildPayload() {
  const payload = {
    type: form.type,
    difficulty: form.difficulty,
    content: form.content.trim(),
    answerText: form.answerText.trim() || null,
    explanation: form.explanation.trim() || null,
  };

  if (!editingQuestion.value || form.type === 'MCQ') {
    payload.options =
      form.type === 'MCQ'
        ? form.options.map((option) => ({
            ...option,
            content: option.content.trim(),
          }))
        : undefined;
  }

  return payload;
}

async function saveQuestion() {
  const { valid } = await formRef.value.validate();
  if (!valid) return;
  if (
    form.type === 'MCQ' &&
    form.options.filter((option) => option.isCorrect).length !== 1
  ) {
    errorMessage.value = t('questionBank.oneCorrectRequired');
    return;
  }

  isSaving.value = true;
  errorMessage.value = '';
  try {
    const payload = buildPayload();
    if (editingQuestion.value) {
      await api(`/questions/${editingQuestion.value.id}`, {
        method: 'PATCH',
        body: payload,
      });
    } else {
      await api(`/lessons/${props.lessonId}/questions`, {
        method: 'POST',
        body: payload,
      });
    }
    showEditor.value = false;
    await loadQuestions();
  } catch (error) {
    errorMessage.value = error.message || t('questionBank.saveError');
  } finally {
    isSaving.value = false;
  }
}

function confirmDelete(question) {
  questionToDelete.value = question;
  showDeleteConfirm.value = true;
}

async function deleteQuestion() {
  if (!questionToDelete.value) return;
  isDeleting.value = true;
  errorMessage.value = '';
  showDeleteConfirm.value = false;
  try {
    await api(`/questions/${questionToDelete.value.id}`, { method: 'DELETE' });
    showDeleteConfirm.value = false;
    questionToDelete.value = null;
    await loadQuestions();
  } catch (error) {
    errorMessage.value = error.message || t('questionBank.deleteError');
  } finally {
    isDeleting.value = false;
  }
}
</script>

<style scoped>
.question-bank-action {
  display: flex;
  align-items: center;
}

.question-bank-dialog {
  border: 1px solid #dce7f7;
  box-shadow: 0 16px 40px rgba(30, 64, 120, 0.16);
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-item {
  border: 1px solid #e4ecf7;
  background: #fff;
}

.question-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.question-options li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #475467;
  font-size: 0.9rem;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.min-width-0 {
  min-width: 0;
}

.empty-bank {
  border: 1px dashed #c5d8ef;
  background: #f8fbff;
}
</style>
