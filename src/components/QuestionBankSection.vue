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
              <div class="d-flex flex-wrap ga-2">
                <v-btn color="deep-purple" variant="tonal" prepend-icon="mdi-auto-fix" @click="showGenerator = !showGenerator">
                  {{ t('questionBank.generateWithAi') }}
                </v-btn>
                <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">
                  {{ t('questionBank.createQuestion') }}
                </v-btn>
              </div>
            </div>

            <v-expand-transition>
              <v-card v-if="showGenerator" class="ai-generator pa-4 pa-md-5 mb-5" rounded="xl" variant="tonal">
                <div class="d-flex align-start ga-3 mb-4">
                  <v-avatar color="deep-purple" variant="flat" size="38"><v-icon icon="mdi-auto-fix" color="white" /></v-avatar>
                  <div>
                    <h4 class="text-subtitle-1 font-weight-black">{{ t('questionBank.aiTitle') }}</h4>
                    <p class="text-caption text-medium-emphasis mb-0">{{ t('questionBank.aiSubtitle') }}</p>
                  </div>
                </div>
                <v-row dense>
                  <v-col cols="12" sm="4">
                    <v-select v-model="aiOptions.count" :items="[3, 5, 8, 10]" :label="t('questionBank.aiCount')" variant="outlined" density="comfortable" hide-details />
                  </v-col>
                  <v-col cols="12" sm="4">
                    <v-select v-model="aiOptions.type" :items="aiTypeOptions" item-title="title" item-value="value" :label="t('questionBank.type')" variant="outlined" density="comfortable" hide-details />
                  </v-col>
                  <v-col cols="12" sm="4">
                    <v-select v-model="aiOptions.difficulty" :items="aiDifficultyOptions" item-title="title" item-value="value" :label="t('questionBank.difficulty')" variant="outlined" density="comfortable" hide-details />
                  </v-col>
                  <v-col cols="12">
                    <v-text-field v-model="aiOptions.instructions" :label="t('questionBank.aiInstructions')" :placeholder="t('questionBank.aiInstructionsHint')" variant="outlined" density="comfortable" hide-details />
                  </v-col>
                </v-row>
                <v-alert v-if="!isGenerating && generatedQuestions.length" type="info" variant="tonal" density="comfortable" class="mt-4 mb-0">
                  {{ t('questionBank.aiReviewNote') }}
                </v-alert>
                <div class="d-flex flex-wrap align-center justify-space-between ga-2 mt-4">
                  <span class="text-caption text-medium-emphasis">{{ t('questionBank.aiPrivacyNote') }}</span>
                  <div class="d-flex flex-wrap ga-2">
                    <v-btn v-if="generatedQuestions.length" variant="outlined" color="primary" prepend-icon="mdi-printer-outline" @click="printDrafts">{{ t('questionBank.printDrafts') }}</v-btn>
                    <v-btn v-if="generatedQuestions.length" variant="tonal" color="success" prepend-icon="mdi-content-save-all-outline" :loading="isSavingAllDrafts" :disabled="isSavingAllDrafts" @click="saveAllDrafts">{{ t('questionBank.saveAllDrafts') }}</v-btn>
                    <v-btn color="deep-purple" prepend-icon="mdi-auto-fix" :loading="isGenerating" @click="generateQuestions">{{ t('questionBank.generateNow') }}</v-btn>
                  </div>
                </div>
              </v-card>
            </v-expand-transition>

            <div v-if="generatedQuestions.length" class="ai-drafts mb-5">
              <div class="d-flex align-center justify-space-between mb-3">
                <h4 class="text-subtitle-1 font-weight-black">{{ t('questionBank.aiDraftsTitle', { count: generatedQuestions.length }) }}</h4>
                <v-btn size="small" variant="text" color="error" prepend-icon="mdi-close" @click="generatedQuestions = []">{{ t('questionBank.clearDrafts') }}</v-btn>
              </div>
              <v-card v-for="(draft, index) in generatedQuestions" :key="`draft-${index}`" class="ai-draft-card pa-4 mb-3" rounded="lg">
                <div class="d-flex flex-column flex-sm-row align-start justify-space-between ga-3">
                  <div class="min-width-0 flex-grow-1">
                    <div class="d-flex flex-wrap ga-2 mb-2">
                      <v-chip size="x-small" color="deep-purple" variant="tonal">{{ t(`questionBank.types.${draft.type}`) }}</v-chip>
                      <v-chip size="x-small" color="secondary" variant="tonal">{{ t(`questionBank.difficulties.${draft.difficulty}`) }}</v-chip>
                    </div>
                    <p class="text-body-1 font-weight-bold mb-2">{{ draft.content }}</p>
                    <ul v-if="draft.options?.length" class="question-options">
                      <li v-for="(option, optionIndex) in draft.options" :key="optionIndex">
                        <v-icon :icon="option.isCorrect ? 'mdi-check-circle' : 'mdi-circle-outline'" :color="option.isCorrect ? 'success' : 'secondary'" size="16" />
                        <span>{{ option.content }}</span>
                      </li>
                    </ul>
                    <p v-if="draft.answerText" class="text-body-2 text-secondary mt-2 mb-0"><strong>{{ t('questionBank.answerText') }}:</strong> {{ draft.answerText }}</p>
                    <p v-if="draft.explanation" class="text-body-2 text-secondary mt-1 mb-0"><strong>{{ t('questionBank.explanation') }}:</strong> {{ draft.explanation }}</p>
                  </div>
                  <div class="d-flex flex-wrap ga-1">
                    <v-btn size="small" variant="text" prepend-icon="mdi-pencil-outline" @click="editDraft(index)">{{ t('questionBank.editDraft') }}</v-btn>
                    <v-btn size="small" color="success" variant="tonal" prepend-icon="mdi-plus-circle-outline" :loading="savingDraftIndex === index" :disabled="isSavingAllDrafts" @click="saveDraft(index)">{{ t('questionBank.addDraft') }}</v-btn>
                  </div>
                </div>
              </v-card>
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
const showGenerator = ref(false);
const showDeleteConfirm = ref(false);
const questions = ref([]);
const generatedQuestions = ref([]);
const questionToDelete = ref(null);
const editingQuestion = ref(null);
const formRef = ref(null);
const isLoading = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);
const isGenerating = ref(false);
const isSavingAllDrafts = ref(false);
const savingDraftIndex = ref(null);
const draftEditingIndex = ref(null);
const errorMessage = ref('');
const aiOptions = reactive({ count: 5, type: 'MIXED', difficulty: 'MIXED', instructions: '' });
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
const aiTypeOptions = computed(() => [
  { title: t('questionBank.aiMixed'), value: 'MIXED' },
  ...questionTypes.value,
]);
const aiDifficultyOptions = computed(() => [
  { title: t('questionBank.aiMixed'), value: 'MIXED' },
  ...difficultyLevels.value,
]);
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
  draftEditingIndex.value = null;
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

function editDraft(index) {
  const draft = generatedQuestions.value[index];
  if (!draft) return;
  resetForm({
    type: draft.type,
    difficulty: draft.difficulty,
    content: draft.content,
    answerText: draft.answerText || '',
    explanation: draft.explanation || '',
    options: (draft.options || []).map(({ content, isCorrect }) => ({ content, isCorrect })),
  });
  draftEditingIndex.value = index;
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
    if (draftEditingIndex.value !== null) {
      generatedQuestions.value[draftEditingIndex.value] = {
        ...payload,
        options: payload.options || [],
        answerText: payload.answerText || '',
        explanation: payload.explanation || '',
      };
      draftEditingIndex.value = null;
      showEditor.value = false;
      return;
    } else if (editingQuestion.value) {
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

async function generateQuestions() {
  isGenerating.value = true;
  errorMessage.value = '';
  try {
    const drafts = await api(`/lessons/${props.lessonId}/questions/generate`, {
      method: 'POST',
      body: {
        count: Number(aiOptions.count),
        type: aiOptions.type === 'MIXED' ? undefined : aiOptions.type,
        difficulty: aiOptions.difficulty === 'MIXED' ? undefined : aiOptions.difficulty,
        instructions: aiOptions.instructions.trim() || undefined,
      },
    });
    generatedQuestions.value = drafts;
  } catch (error) {
    errorMessage.value = error.message || t('questionBank.aiError');
  } finally {
    isGenerating.value = false;
  }
}

function draftPayload(draft) {
  return {
    type: draft.type,
    difficulty: draft.difficulty,
    content: draft.content.trim(),
    answerText: draft.answerText?.trim() || undefined,
    explanation: draft.explanation?.trim() || undefined,
    ...(draft.type === 'MCQ' ? { options: draft.options } : {}),
  };
}

async function saveDraft(index) {
  const draft = generatedQuestions.value[index];
  if (!draft) return;
  savingDraftIndex.value = index;
  errorMessage.value = '';
  try {
    await api(`/lessons/${props.lessonId}/questions`, { method: 'POST', body: draftPayload(draft) });
    generatedQuestions.value.splice(index, 1);
    await loadQuestions();
  } catch (error) {
    errorMessage.value = error.message || t('questionBank.saveError');
  } finally {
    savingDraftIndex.value = null;
  }
}

async function saveAllDrafts() {
  isSavingAllDrafts.value = true;
  errorMessage.value = '';
  try {
    while (generatedQuestions.value.length) {
      const draft = generatedQuestions.value[0];
      await api(`/lessons/${props.lessonId}/questions`, { method: 'POST', body: draftPayload(draft) });
      generatedQuestions.value.shift();
    }
    await loadQuestions();
  } catch (error) {
    errorMessage.value = error.message || t('questionBank.saveError');
  } finally {
    isSavingAllDrafts.value = false;
  }
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function printDrafts() {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    errorMessage.value = t('questionBank.printPopupBlocked');
    return;
  }
  const rows = generatedQuestions.value.map((draft, index) => {
    const options = (draft.options || []).map((option, optionIndex) => `<li>${String.fromCharCode(65 + optionIndex)}. ${escapeHtml(option.content)}</li>`).join('');
    const answer = draft.type === 'MCQ'
      ? (draft.options || []).map((option, optionIndex) => option.isCorrect ? String.fromCharCode(65 + optionIndex) : '').filter(Boolean).join(', ')
      : escapeHtml(draft.answerText);
    return `<article><h2>Câu ${index + 1}. ${escapeHtml(draft.content)}</h2><ul>${options}</ul></article><p class="answer">Đáp án ${index + 1}: ${answer || '—'}${draft.explanation ? ` · ${escapeHtml(draft.explanation)}` : ''}</p>`;
  }).join('');
  printWindow.document.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${escapeHtml(props.lessonTitle)} - ${t('questionBank.printTitle')}</title><style>body{font:15px/1.65 Arial,sans-serif;color:#182b49;max-width:820px;margin:40px auto;padding:0 24px}h1{font-size:24px;margin-bottom:4px}header{border-bottom:2px solid #347af0;padding-bottom:16px;margin-bottom:24px;color:#667085}article{break-inside:avoid;margin:0 0 14px}article h2{font-size:16px;font-weight:600}ul{list-style:none;padding-left:22px;margin:6px 0}.answer{font-size:12px;color:#667085;margin:0 0 22px 22px;border-bottom:1px dashed #d7dfeb;padding-bottom:12px}@media print{body{margin:0 auto;padding:0 10px}}</style></head><body><header><h1>${escapeHtml(t('questionBank.printTitle'))}</h1>${escapeHtml(props.lessonTitle)}<br>${t('questionBank.printDate')} ${new Date().toLocaleDateString()}</header>${rows}<script>window.onload=()=>window.print()<\/script></body></html>`);
  printWindow.document.close();
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

.ai-generator {
  border: 1px solid #e2d8ff;
  background: linear-gradient(135deg, #faf8ff, #f3efff) !important;
}

.ai-draft-card {
  border: 1px solid #e8e1fb;
  background: linear-gradient(120deg, #fff, #fcfaff);
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
