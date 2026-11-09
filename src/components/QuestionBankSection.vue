<template>
  <div
    class="question-bank-action"
    :class="{ 'question-bank-action--inline': inline }"
    @click.stop
  >
    <v-btn
      v-if="!inline"
      size="x-small"
      variant="tonal"
      color="primary"
      prepend-icon="mdi-comment-question-outline"
      class="text-none"
      @click="openDialog"
    >
      {{ t("questionBank.button") }}
    </v-btn>

    <component
      :is="inline ? 'div' : 'v-dialog'"
      v-bind="
        inline
          ? {}
          : { modelValue: showDialog, maxWidth: 900, scrollable: true }
      "
      @update:model-value="showDialog = $event"
    >
      <v-card
        :class="[
          'question-bank-dialog rounded-xl',
          { 'question-bank-inline-card': inline },
        ]"
      >
        <v-card-title
          class="question-bank-heading d-flex flex-wrap align-center justify-space-between ga-3 pa-5"
        >
          <div class="question-bank-heading-copy">
            <div
              v-if="!inline"
              class="text-overline text-primary font-weight-bold"
            >
              {{ t("questionBank.eyebrow") }}
            </div>
            <h2 class="question-bank-heading-title text-h6 font-weight-black">
              {{ lessonTitle }}
            </h2>
          </div>
          <div
            v-if="inline && canManage"
            class="d-flex flex-wrap ga-2 question-bank-heading-actions"
          >
            <v-btn
              class="question-bank-action-button question-bank-action-button--secondary"
              size="small"
              color="primary"
              variant="tonal"
              prepend-icon="mdi-file-word-outline"
              :loading="isImportingWord"
              @click="wordFileInput?.click()"
              >{{ t("questionBank.importWord") }}</v-btn
            >
            <v-btn
              class="question-bank-action-button question-bank-action-button--secondary"
              size="small"
              color="deep-purple"
              variant="tonal"
              prepend-icon="mdi-auto-fix"
              @click="showGenerator = !showGenerator"
              >{{ t("questionBank.generateWithAi") }}</v-btn
            >
            <v-btn
              class="question-bank-action-button"
              size="small"
              color="primary"
              prepend-icon="mdi-plus"
              @click="openCreate"
              >{{ t("questionBank.createQuestion") }}</v-btn
            >
            <input
              ref="wordFileInput"
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              class="d-none"
              @change="importWordFile"
            />
          </div>
          <v-btn
            v-if="!inline"
            icon="mdi-close"
            variant="text"
            :aria-label="t('questionBank.close')"
            @click="showDialog = false"
          />
        </v-card-title>
        <v-divider />

        <v-card-text class="pa-5">
          <v-alert
            v-if="errorMessage || importMessage"
            :type="
              errorMessage ? 'error' : importFailed ? 'warning' : 'success'
            "
            variant="tonal"
            class="mb-4"
          >
            {{ errorMessage || importMessage }}
          </v-alert>

          <div v-if="showEditor">
            <div class="d-flex align-center justify-space-between mb-4">
              <h3 class="text-subtitle-1 font-weight-black">
                {{
                  editingQuestion
                    ? t("questionBank.editTitle")
                    : t("questionBank.createTitle")
                }}
              </h3>
              <v-btn
                variant="text"
                prepend-icon="mdi-arrow-left"
                @click="showEditor = false"
              >
                {{ t("questionBank.backToList") }}
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

              <div
                v-if="
                  [
                    'MCQ',
                    'MULTI_MCQ',
                    'TRUE_FALSE',
                    'MATCHING',
                    'DRAG_DROP',
                  ].includes(form.type)
                "
                class="options-editor mb-4"
              >
                <div class="d-flex align-center justify-space-between mb-2">
                  <div>
                    <h4 class="text-body-1 font-weight-bold">
                      {{ t("questionBank.options") }}
                    </h4>
                    <p class="text-caption text-secondary mb-0">
                      {{
                        form.type === "MULTI_MCQ"
                          ? t("questionBank.chooseCorrectMany")
                          : form.type === "MATCHING"
                            ? t("questionBank.matchPairs")
                            : form.type === "DRAG_DROP"
                              ? t("questionBank.dragDropPairs")
                              : t("questionBank.chooseCorrect")
                      }}
                    </p>
                  </div>
                  <v-btn
                    v-if="
                      form.type !== 'TRUE_FALSE' && form.type !== 'DRAG_DROP'
                    "
                    size="small"
                    variant="tonal"
                    prepend-icon="mdi-plus"
                    @click="addOption"
                  >
                    {{ t("questionBank.addOption") }}
                  </v-btn>
                </div>

                <v-radio-group
                  v-model="correctOptionIndex"
                  hide-details
                  class="question-options-editor"
                >
                  <div
                    v-for="(option, index) in form.options"
                    :key="index"
                    class="option-row"
                  >
                    <v-radio
                      v-if="
                        ['MCQ', 'TRUE_FALSE', 'DRAG_DROP'].includes(form.type)
                      "
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
                    <v-text-field
                      v-if="form.type === 'MATCHING'"
                      v-model="option.matchContent"
                      :label="
                        t('questionBank.matchWith', { number: index + 1 })
                      "
                      :rules="requiredRules"
                      variant="outlined"
                      density="compact"
                      hide-details="auto"
                    />
                    <v-checkbox
                      v-else-if="form.type === 'MULTI_MCQ'"
                      v-model="option.isCorrect"
                      :aria-label="
                        t('questionBank.correctOption', { number: index + 1 })
                      "
                      hide-details
                      density="compact"
                    />
                    <v-btn
                      icon="mdi-close"
                      size="small"
                      variant="text"
                      color="error"
                      :disabled="
                        form.options.length <=
                          (form.type === 'DRAG_DROP' ? 4 : 2) ||
                        form.type === 'TRUE_FALSE'
                      "
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
                  t("questionBank.cancel")
                }}</v-btn>
                <v-btn color="primary" type="submit" :loading="isSaving">
                  {{
                    editingQuestion
                      ? t("questionBank.save")
                      : t("questionBank.createQuestion")
                  }}
                </v-btn>
              </div>
            </v-form>
          </div>

          <template v-else>
            <div class="question-list-heading mb-3">
              <div>
                <h3 class="text-subtitle-1 font-weight-black mb-0">
                  {{ t("questionBank.listTitle") }}
                </h3>
              </div>
              <span class="text-body-2 text-secondary">{{
                t("questionBank.count", { count: questionBankCount })
              }}</span>
            </div>

            <div v-if="questionBankCount" class="question-filters mb-4">
              <v-text-field
                class="question-filter-search"
                v-model="questionSearch"
                :label="t('questionBank.searchQuestionPlaceholder')"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                hide-details
                clearable
              />
              <v-select
                class="question-filter-select"
                v-model="typeFilter"
                :items="typeFilterOptions"
                item-title="title"
                item-value="value"
                :label="t('questionBank.filterType')"
                hide-details
                density="compact"
              />
              <v-select
                class="question-filter-select"
                v-model="statusFilter"
                :items="statusFilterOptions"
                item-title="title"
                item-value="value"
                :label="t('questionBank.filterStatus')"
                hide-details
                density="compact"
              />
              <v-btn-toggle
                v-model="compactMode"
                mandatory
                color="primary"
                density="compact"
                class="question-display-toggle"
                :aria-label="t('questionBank.displayMode')"
              >
                <v-btn size="small" :value="true">{{
                  t("questionBank.compactMode")
                }}</v-btn>
                <v-btn size="small" :value="false">{{
                  t("questionBank.fullMode")
                }}</v-btn>
              </v-btn-toggle>
            </div>

            <v-alert
              v-if="!canManage && questionBankCount"
              type="info"
              variant="tonal"
              density="comfortable"
              class="mb-4"
            >
              {{ t("questionBank.readOnlySharedBook") }}
            </v-alert>

            <v-expand-transition>
              <v-card
                v-if="showGenerator"
                class="ai-generator pa-4 pa-md-5 mb-5"
                rounded="xl"
                variant="tonal"
              >
                <div class="d-flex align-start ga-3 mb-4">
                  <v-avatar color="deep-purple" variant="flat" size="38"
                    ><v-icon icon="mdi-auto-fix" color="white"
                  /></v-avatar>
                  <div>
                    <h4 class="text-subtitle-1 font-weight-black">
                      {{ t("questionBank.aiTitle") }}
                    </h4>
                    <p class="text-caption text-medium-emphasis mb-0">
                      {{ t("questionBank.aiSubtitle") }}
                    </p>
                  </div>
                </div>
                <v-row dense>
                  <v-col cols="12" sm="4">
                    <v-select
                      v-model="aiOptions.count"
                      :items="[3, 5, 8, 10]"
                      :label="t('questionBank.aiCount')"
                      variant="outlined"
                      density="comfortable"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="12" sm="4">
                    <v-select
                      v-model="aiOptions.type"
                      :items="aiTypeOptions"
                      item-title="title"
                      item-value="value"
                      :label="t('questionBank.type')"
                      variant="outlined"
                      density="comfortable"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="12" sm="4">
                    <v-select
                      v-model="aiOptions.difficulty"
                      :items="aiDifficultyOptions"
                      item-title="title"
                      item-value="value"
                      :label="t('questionBank.difficulty')"
                      variant="outlined"
                      density="comfortable"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                      v-model="aiOptions.instructions"
                      :label="t('questionBank.aiInstructions')"
                      :placeholder="t('questionBank.aiInstructionsHint')"
                      variant="outlined"
                      density="comfortable"
                      hide-details
                    />
                  </v-col>
                </v-row>
                <div v-if="isGenerating" class="mt-4" aria-live="polite">
                  <div class="d-flex align-center justify-space-between mb-2">
                    <span class="text-body-2 font-weight-medium">{{
                      t("questionBank.aiProgress", {
                        completed: generationProgress.completed,
                        total: generationProgress.total,
                      })
                    }}</span>
                    <span class="text-caption text-medium-emphasis"
                      >{{
                        Math.round(
                          (generationProgress.completed * 100) /
                            Math.max(generationProgress.total, 1),
                        )
                      }}%</span
                    >
                  </div>
                  <v-progress-linear
                    :model-value="
                      (generationProgress.completed * 100) /
                      Math.max(generationProgress.total, 1)
                    "
                    color="deep-purple"
                    rounded
                    height="7"
                  />
                  <div
                    v-if="
                      generationProgress.total > generationProgress.completed
                    "
                    class="mt-3 d-flex flex-column ga-2"
                    aria-hidden="true"
                  >
                    <v-skeleton-loader
                      v-for="slot in Math.min(
                        generationProgress.total - generationProgress.completed,
                        3,
                      )"
                      :key="`generation-skeleton-${slot}`"
                      type="list-item-two-line"
                      class="generation-skeleton"
                    />
                  </div>
                </div>
                <v-alert
                  v-if="!isGenerating && generatedQuestions.length"
                  type="info"
                  variant="tonal"
                  density="comfortable"
                  class="mt-4 mb-0"
                >
                  {{ t("questionBank.aiReviewNote") }}
                </v-alert>
                <div
                  class="d-flex flex-wrap align-center justify-space-between ga-2 mt-4"
                >
                  <span class="text-caption text-medium-emphasis">{{
                    t("questionBank.aiPrivacyNote")
                  }}</span>
                  <div class="d-flex flex-wrap ga-2">
                    <v-btn
                      v-if="generatedQuestions.length"
                      variant="outlined"
                      color="primary"
                      prepend-icon="mdi-printer-outline"
                      @click="printDrafts"
                      >{{ t("questionBank.printDrafts") }}</v-btn
                    >
                    <v-btn
                      v-if="generatedQuestions.length"
                      variant="tonal"
                      color="success"
                      prepend-icon="mdi-content-save-all-outline"
                      :loading="isSavingAllDrafts"
                      :disabled="isSavingAllDrafts"
                      @click="saveAllDrafts"
                      >{{ t("questionBank.saveAllDrafts") }}</v-btn
                    >
                    <v-btn
                      color="deep-purple"
                      prepend-icon="mdi-auto-fix"
                      :loading="isGenerating"
                      @click="generateQuestions"
                      >{{ t("questionBank.generateNow") }}</v-btn
                    >
                  </div>
                </div>
              </v-card>
            </v-expand-transition>

            <div v-if="filteredDrafts.length" class="ai-drafts mb-5">
              <div class="d-flex align-center justify-space-between mb-3">
                <h4 class="text-subtitle-1 font-weight-black">
                  {{
                    t("questionBank.aiDraftsTitle", {
                      count: filteredDrafts.length,
                    })
                  }}
                </h4>
                <v-btn
                  size="small"
                  variant="text"
                  color="error"
                  prepend-icon="mdi-close"
                  @click="clearDrafts"
                  >{{ t("questionBank.clearDrafts") }}</v-btn
                >
              </div>
              <v-card
                v-for="draft in filteredDrafts"
                :key="`draft-${draft.draftIndex}`"
                class="ai-draft-card pa-4 mb-3"
                rounded="lg"
              >
                <div
                  class="d-flex flex-column flex-sm-row align-start justify-space-between ga-3"
                >
                  <div class="min-width-0 flex-grow-1">
                    <div class="d-flex flex-wrap ga-2 mb-2">
                      <v-chip
                        size="x-small"
                        color="deep-purple"
                        variant="tonal"
                        >{{ t(`questionBank.types.${draft.type}`) }}</v-chip
                      >
                      <v-chip size="x-small" color="warning" variant="tonal">{{
                        t("questionBank.draftStatus")
                      }}</v-chip>
                      <v-chip
                        size="x-small"
                        color="secondary"
                        variant="tonal"
                        >{{
                          t(`questionBank.difficulties.${draft.difficulty}`)
                        }}</v-chip
                      >
                    </div>
                    <p class="text-body-1 font-weight-bold mb-2">
                      {{ draft.content }}
                    </p>
                    <ul v-if="draft.options?.length" class="question-options">
                      <li
                        v-for="(option, optionIndex) in draft.options"
                        :key="optionIndex"
                      >
                        <v-icon
                          :icon="
                            option.isCorrect
                              ? 'mdi-check-circle'
                              : 'mdi-circle-outline'
                          "
                          :color="option.isCorrect ? 'success' : 'secondary'"
                          size="16"
                        />
                        <span
                          >{{ displayOptionContent(draft.type, option.content)
                          }}<template
                            v-if="
                              ['MATCHING', 'DRAG_DROP'].includes(draft.type)
                            "
                          >
                            ↔ {{ option.matchContent }}</template
                          ></span
                        >
                      </li>
                    </ul>
                    <p
                      v-if="draft.answerText"
                      class="text-body-2 text-secondary mt-2 mb-0"
                    >
                      <strong>{{ t("questionBank.answerText") }}:</strong>
                      {{ draft.answerText }}
                    </p>
                    <p
                      v-if="draft.explanation"
                      class="text-body-2 text-secondary mt-1 mb-0"
                    >
                      <strong>{{ t("questionBank.explanation") }}:</strong>
                      {{ draft.explanation }}
                    </p>
                  </div>
                  <div class="d-flex flex-wrap ga-1">
                    <v-btn
                      v-if="canManage"
                      size="small"
                      variant="text"
                      prepend-icon="mdi-pencil-outline"
                      @click="editDraft(draft.draftIndex)"
                      >{{ t("questionBank.editDraft") }}</v-btn
                    >
                    <v-btn
                      v-if="canManage"
                      size="small"
                      color="success"
                      variant="tonal"
                      prepend-icon="mdi-plus-circle-outline"
                      :loading="savingDraftIndex === draft.draftIndex"
                      :disabled="isSavingAllDrafts"
                      @click="saveDraft(draft.draftIndex)"
                      >{{ t("questionBank.addDraft") }}</v-btn
                    >
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
            <div
              v-if="!isLoading && filteredQuestions.length"
              class="question-list"
            >
              <v-card
                v-for="question in pagedQuestions"
                :key="question.id"
                class="question-item pa-3"
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
                    <p
                      :ref="
                        (element) => setQuestionContentRef(question.id, element)
                      "
                      :class="[
                        'question-content',
                        'text-body-1',
                        'font-weight-bold',
                        'mb-1',
                        {
                          'question-content--clamped':
                            compactMode && !expandedQuestions.has(question.id),
                        },
                      ]"
                    >
                      {{ question.content }}
                    </p>
                    <v-btn
                      v-if="
                        compactMode &&
                        (truncatedQuestionIds.has(question.id) ||
                          question.options?.length ||
                          question.answerText ||
                          question.explanation)
                      "
                      size="small"
                      variant="text"
                      class="question-expand-button mb-1"
                      @click="toggleQuestionExpanded(question.id)"
                      >{{
                        expandedQuestions.has(question.id)
                          ? t("questionBank.collapseQuestion")
                          : t("questionBank.expandQuestion")
                      }}</v-btn
                    >
                    <ul
                      v-if="
                        question.options?.length &&
                        (!compactMode || expandedQuestions.has(question.id))
                      "
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
                        <span
                          >{{
                            displayOptionContent(question.type, option.content)
                          }}<template
                            v-if="
                              ['MATCHING', 'DRAG_DROP'].includes(question.type)
                            "
                          >
                            ↔ {{ option.matchContent }}</template
                          ></span
                        >
                      </li>
                    </ul>
                    <p
                      v-if="
                        question.answerText &&
                        (!compactMode || expandedQuestions.has(question.id))
                      "
                      class="text-body-2 text-secondary mt-2 mb-0"
                    >
                      <strong>{{ t("questionBank.answerText") }}:</strong>
                      {{ question.answerText }}
                    </p>
                    <p
                      v-if="
                        question.explanation &&
                        (!compactMode || expandedQuestions.has(question.id))
                      "
                      class="text-body-2 text-secondary mt-1 mb-0"
                    >
                      <strong>{{ t("questionBank.explanation") }}:</strong>
                      {{ question.explanation }}
                    </p>
                  </div>
                  <div class="d-flex ga-2 question-actions">
                    <v-btn
                      v-if="canManage"
                      icon="mdi-pencil-outline"
                      size="small"
                      variant="text"
                      :aria-label="t('questionBank.edit')"
                      @click="openEdit(question)"
                    />
                    <v-btn
                      v-if="canManage"
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
              <div class="question-list-footer">
                <span class="text-caption text-medium-emphasis">{{
                  t("questionBank.showingQuestions", {
                    shown: pagedQuestions.length,
                    total: filteredQuestions.length,
                  })
                }}</span>
                <v-btn
                  v-if="pagedQuestions.length < filteredQuestions.length"
                  size="small"
                  variant="tonal"
                  color="primary"
                  @click="showMoreQuestions"
                  >{{
                    t("questionBank.showMoreQuestions", {
                      count: Math.min(
                        pageSize,
                        filteredQuestions.length - pagedQuestions.length,
                      ),
                    })
                  }}</v-btn
                >
              </div>
            </div>
            <v-card
              v-else-if="!isLoading && !filteredDrafts.length"
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
                {{
                  questions.length || generatedQuestions.length
                    ? t("questionBank.noFilteredQuestions")
                    : t("questionBank.empty")
                }}
              </p>
              <v-chip
                v-if="!canManage && !questionBankCount"
                class="mt-3"
                color="secondary"
                variant="tonal"
                size="small"
              >
                {{ t("questionBank.readOnlyLabel") }}
              </v-chip>
            </v-card>
          </template>
        </v-card-text>
      </v-card>
    </component>

    <ConfirmDialog
      v-model="showDeleteConfirm"
      :title="t('questionBank.deleteTitle')"
      :message="t('questionBank.deleteMessage')"
      :loading="isDeleting"
      @confirm="deleteQuestion"
    />
    <v-snackbar
      v-model="deleteToast.show"
      color="error"
      timeout="6000"
      location="bottom"
      >{{ deleteToast.message }}</v-snackbar
    >
  </div>
</template>

<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import { useI18n } from "vue-i18n";
import { API_BASE_URL, api } from "../services/api";
import { filterQuestionLists } from "../services/questionBankState.js";
import { useAuthStore } from "../stores/auth";
import { useQuestionBankStore } from "../stores/questionBank";
import { parseWordQuestionFile } from "../services/wordQuestionImport.js";
import ConfirmDialog from "./shared/ConfirmDialog.vue";

const props = defineProps({
  lessonId: { type: [Number, String], required: true },
  lessonTitle: { type: String, required: true },
  inline: { type: Boolean, default: false },
  canManage: { type: Boolean, default: true },
  startWithAi: { type: Boolean, default: false },
});

const { t } = useI18n();
const authStore = useAuthStore();
const questionBankStore = useQuestionBankStore();

function displayOptionContent(type, content) {
  if (type !== "TRUE_FALSE") return content;
  if (/^(true|đúng)$/i.test(String(content || "").trim()))
    return t("questionBank.true");
  if (/^(false|sai)$/i.test(String(content || "").trim()))
    return t("questionBank.false");
  return content;
}
const showDialog = ref(false);
const showEditor = ref(false);
const showGenerator = ref(false);
const generationProgress = ref({ completed: 0, total: 0 });
watch(
  () => props.startWithAi,
  (open) => {
    if (open && props.canManage) showGenerator.value = true;
  },
  { immediate: true },
);
const showDeleteConfirm = ref(false);
const questions = ref([]);
const visibleQuestionCount = ref(10);
const questionSearch = ref("");
const expandedQuestions = ref(new Set());
const truncatedQuestionIds = ref(new Set());
const questionContentElements = new Map();
const deleteToast = ref({ show: false, message: "" });
const compactMode = ref(true);
try {
  compactMode.value =
    localStorage.getItem("questionBank.compactMode") !== "false";
} catch {}
watch(compactMode, (value) => {
  try {
    localStorage.setItem("questionBank.compactMode", String(value));
  } catch {}
});
const typeFilter = ref("ALL");
const statusFilter = ref("ALL");
const pageSize = 10;
const generatedQuestions = computed(() =>
  questionBankStore.draftsFor(authStore.user?.id, props.lessonId),
);
const questionFilters = computed(() =>
  filterQuestionLists(questions.value, generatedQuestions.value, {
    type: typeFilter.value,
    status: statusFilter.value,
  }),
);
function normalizeSearch(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("vi")
    .trim();
}
const normalizedQuestionSearch = computed(() =>
  normalizeSearch(questionSearch.value),
);
const filteredQuestions = computed(() =>
  questionFilters.value.saved.filter(
    (question) =>
      !normalizedQuestionSearch.value ||
      normalizeSearch(question.content).includes(
        normalizedQuestionSearch.value,
      ),
  ),
);
const filteredDrafts = computed(() =>
  questionFilters.value.drafts
    .map((draft) => ({
      ...draft,
      draftIndex: generatedQuestions.value.indexOf(draft),
    }))
    .filter(
      (draft) =>
        !normalizedQuestionSearch.value ||
        normalizeSearch(draft.content).includes(normalizedQuestionSearch.value),
    ),
);
const pagedQuestions = computed(() =>
  filteredQuestions.value.slice(0, visibleQuestionCount.value),
);
function setQuestionContentRef(id, element) {
  if (element) questionContentElements.set(id, element.$el || element);
  else questionContentElements.delete(id);
}
async function refreshTruncatedQuestions() {
  await nextTick();
  const truncated = new Set();
  for (const question of pagedQuestions.value) {
    const element = questionContentElements.get(question.id);
    if (element && element.scrollHeight > element.clientHeight + 1)
      truncated.add(question.id);
  }
  truncatedQuestionIds.value = truncated;
}
const questionBankCount = computed(
  () => questions.value.length + generatedQuestions.value.length,
);
const typeFilterOptions = computed(() => [
  { title: t("questionBank.allTypes"), value: "ALL" },
  ...questionTypes.value,
]);
const statusFilterOptions = computed(() => [
  { title: t("questionBank.allStatuses"), value: "ALL" },
  { title: t("questionBank.draftStatus"), value: "DRAFT" },
  { title: t("questionBank.savedStatus"), value: "SAVED" },
]);
watch([questionSearch, typeFilter, statusFilter], () => {
  visibleQuestionCount.value = pageSize;
  expandedQuestions.value = new Set();
});
watch([pagedQuestions, compactMode], refreshTruncatedQuestions, {
  flush: "post",
  immediate: true,
});
function showMoreQuestions() {
  visibleQuestionCount.value = Math.min(
    visibleQuestionCount.value + pageSize,
    filteredQuestions.value.length,
  );
}
function toggleQuestionExpanded(id) {
  const next = new Set(expandedQuestions.value);
  next.has(id) ? next.delete(id) : next.add(id);
  expandedQuestions.value = next;
}
const questionToDelete = ref(null);
const editingQuestion = ref(null);
const formRef = ref(null);
const isLoading = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);
const isGenerating = ref(false);
const isImportingWord = ref(false);
const wordFileInput = ref(null);
const isSavingAllDrafts = ref(false);
const savingDraftIndex = ref(null);
const draftEditingIndex = ref(null);
const errorMessage = ref("");
const importMessage = ref("");
const importFailed = ref(false);
const aiOptions = reactive({
  count: 5,
  type: "MIXED",
  difficulty: "MIXED",
  instructions: "",
});
const requiredRules = [
  (value) => !!String(value || "").trim() || t("questionBank.required"),
];

const emptyForm = () => ({
  type: "MCQ",
  difficulty: "MEDIUM",
  content: "",
  answerText: "",
  explanation: "",
  options: [
    { content: "", isCorrect: true, matchContent: "" },
    { content: "", isCorrect: false, matchContent: "" },
    { content: "", isCorrect: false, matchContent: "" },
    { content: "", isCorrect: false, matchContent: "" },
  ],
});

const form = reactive(emptyForm());
const questionTypes = computed(() =>
  [
    "MCQ",
    "MULTI_MCQ",
    "TRUE_FALSE",
    "MATCHING",
    "FILL",
    "ESSAY",
    "DRAG_DROP",
  ].map((value) => ({
    title: t(`questionBank.types.${value}`),
    value,
  })),
);
const difficultyLevels = computed(() =>
  ["EASY", "MEDIUM", "HARD"].map((value) => ({
    title: t(`questionBank.difficulties.${value}`),
    value,
  })),
);
const aiTypeOptions = computed(() => [
  { title: t("questionBank.aiMixed"), value: "MIXED" },
  ...questionTypes.value,
]);
const aiDifficultyOptions = computed(() => [
  { title: t("questionBank.aiMixed"), value: "MIXED" },
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
  errorMessage.value = "";
  try {
    questions.value = await api(`/lessons/${props.lessonId}/questions`);
  } catch (error) {
    errorMessage.value = error.message || t("questionBank.loadError");
  } finally {
    isLoading.value = false;
  }
}

watch(
  () => props.lessonId,
  () => {
    visibleQuestionCount.value = pageSize;
    expandedQuestions.value = new Set();
    questionSearch.value = "";
    showEditor.value = false;
    editingQuestion.value = null;
    if (props.inline) void loadQuestions();
  },
);

onMounted(() => {
  if (props.inline) void loadQuestions();
  window.addEventListener("resize", refreshTruncatedQuestions);
});
onBeforeUnmount(() =>
  window.removeEventListener("resize", refreshTruncatedQuestions),
);

async function openDialog() {
  showDialog.value = true;
  showEditor.value = false;
  await loadQuestions();
}

function resetForm(values = emptyForm()) {
  Object.assign(form, values);
  editingQuestion.value = null;
  draftEditingIndex.value = null;
  errorMessage.value = "";
}

function openCreate() {
  resetForm();
  showEditor.value = true;
}

function openEdit(question) {
  const options = (question.options || []).map(
    ({ content, isCorrect, matchContent }) => ({
      content: displayOptionContent(question.type, content),
      isCorrect,
      matchContent: matchContent || "",
    }),
  );
  if (question.type === "DRAG_DROP") {
    while (options.length < 4)
      options.push({ content: "", isCorrect: false, matchContent: "" });
    options.splice(4);
    if (!options.some((option) => option.isCorrect))
      options[0].isCorrect = true;
  }
  resetForm({
    type: question.type,
    difficulty: question.difficulty,
    content: question.content,
    answerText: question.answerText || "",
    explanation: question.explanation || "",
    options,
  });
  editingQuestion.value = question;
  showEditor.value = true;
}

function editDraft(index) {
  const draft = generatedQuestions.value[index];
  if (!draft) return;
  const options = (draft.options || []).map(
    ({ content, isCorrect, matchContent }) => ({
      content: displayOptionContent(draft.type, content),
      isCorrect,
      matchContent: matchContent || "",
    }),
  );
  if (["MCQ", "MULTI_MCQ"].includes(draft.type)) {
    while (options.length < 4)
      options.push({ content: "", isCorrect: false, matchContent: "" });
    options.splice(4);
    if (draft.type === "MCQ" && !options.some((option) => option.isCorrect))
      options[0].isCorrect = true;
  }
  resetForm({
    type: draft.type,
    difficulty: draft.difficulty,
    content: draft.content,
    answerText: draft.answerText || "",
    explanation: draft.explanation || "",
    options,
  });
  draftEditingIndex.value = index;
  showEditor.value = true;
}

function handleTypeChange(type) {
  if (type === "TRUE_FALSE") {
    form.options = [
      { content: t("questionBank.true"), isCorrect: true },
      { content: t("questionBank.false"), isCorrect: false },
    ];
  } else if (type === "MCQ" || type === "MULTI_MCQ") {
    form.options = Array.from({ length: 4 }, (_, index) => ({
      content: "",
      isCorrect: type === "MCQ" && index === 0,
      matchContent: "",
    }));
  } else if (type === "DRAG_DROP") {
    form.options = Array.from({ length: 4 }, (_, index) => ({
      content: "",
      isCorrect: index === 0,
    }));
  } else if (
    ["MCQ", "MULTI_MCQ", "MATCHING", "DRAG_DROP"].includes(type) &&
    !form.options.length
  ) {
    form.options = [
      { content: "", isCorrect: true, matchContent: "" },
      { content: "", isCorrect: false, matchContent: "" },
    ];
  }
}

function addOption() {
  if (form.type === "DRAG_DROP" && form.options.length >= 4) return;
  form.options.push({ content: "", isCorrect: false, matchContent: "" });
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

  if (
    !editingQuestion.value ||
    ["MCQ", "MULTI_MCQ", "TRUE_FALSE", "MATCHING", "DRAG_DROP"].includes(
      form.type,
    )
  ) {
    payload.options = [
      "MCQ",
      "MULTI_MCQ",
      "TRUE_FALSE",
      "MATCHING",
      "DRAG_DROP",
    ].includes(form.type)
      ? form.options.map((option) => ({
          ...option,
          content: option.content.trim(),
          matchContent: option.matchContent?.trim() || null,
        }))
      : undefined;
  }

  return payload;
}

async function saveQuestion() {
  const { valid } = await formRef.value.validate();
  if (!valid) return;
  if (form.type === "DRAG_DROP" && form.options.length !== 4) {
    errorMessage.value = t("questionBank.dragFourChoices");
    return;
  }
  if (
    ((form.type === "MCQ" || form.type === "TRUE_FALSE") &&
      form.options.filter((option) => option.isCorrect).length !== 1) ||
    (form.type === "MULTI_MCQ" &&
      !form.options.some((option) => option.isCorrect)) ||
    (form.type === "DRAG_DROP" &&
      (form.options.length !== 4 ||
        form.options.filter((option) => option.isCorrect).length !== 1))
  ) {
    errorMessage.value = t("questionBank.oneCorrectRequired");
    return;
  }

  isSaving.value = true;
  errorMessage.value = "";
  try {
    const payload = buildPayload();
    if (draftEditingIndex.value !== null) {
      questionBankStore.updateDraft(
        authStore.user?.id,
        props.lessonId,
        draftEditingIndex.value,
        {
          ...payload,
          options: payload.options || [],
          answerText: payload.answerText || "",
          explanation: payload.explanation || "",
        },
      );
      draftEditingIndex.value = null;
      showEditor.value = false;
      return;
    } else if (editingQuestion.value) {
      await api(`/questions/${editingQuestion.value.id}`, {
        method: "PATCH",
        body: payload,
      });
    } else {
      await api(`/lessons/${props.lessonId}/questions`, {
        method: "POST",
        body: payload,
      });
    }
    showEditor.value = false;
    await loadQuestions();
  } catch (error) {
    errorMessage.value = error.message || t("questionBank.saveError");
  } finally {
    isSaving.value = false;
  }
}

async function generateQuestions() {
  isGenerating.value = true;
  errorMessage.value = "";
  generationProgress.value = { completed: 0, total: Number(aiOptions.count) };
  try {
    const path = `/lessons/${props.lessonId}/questions/generate/stream`;
    const token = localStorage.getItem("accessToken");
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        count: Number(aiOptions.count),
        type: aiOptions.type === "MIXED" ? undefined : aiOptions.type,
        difficulty:
          aiOptions.difficulty === "MIXED" ? undefined : aiOptions.difficulty,
        instructions: aiOptions.instructions.trim() || undefined,
      }),
    });
    if (response.status === 401) {
      window.dispatchEvent(new Event("auth:session-expired"));
      throw new Error(t("questionBank.aiError"));
    }
    if (!response.ok) {
      let message = t("questionBank.aiError");
      try {
        message = (await response.json()).message || message;
      } catch {}
      throw new Error(Array.isArray(message) ? message.join(", ") : message);
    }
    if (!response.body) throw new Error(t("questionBank.aiError"));
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let received = 0;
    const consume = (block) => {
      const lines = block.split(/\r?\n/);
      const event = lines
        .find((line) => line.startsWith("event:"))
        ?.slice(6)
        .trim();
      const data = lines
        .find((line) => line.startsWith("data:"))
        ?.slice(5)
        .trim();
      if (!event || !data) return;
      const payload = JSON.parse(data);
      if (event === "question") {
        const draft = {
          ...payload,
          draftKey: `${Date.now()}-${received++}-${Math.random().toString(36).slice(2, 8)}`,
        };
        questionBankStore.setDrafts(authStore.user?.id, props.lessonId, [
          ...generatedQuestions.value,
          draft,
        ]);
      } else if (event === "progress") {
        generationProgress.value = payload;
      } else if (event === "generation-error") {
        throw new Error(payload.message || t("questionBank.aiError"));
      }
    };
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() || "";
      blocks.forEach(consume);
      if (done) break;
    }
    if (buffer.trim()) consume(buffer);
  } catch (error) {
    errorMessage.value = error.message || t("questionBank.aiError");
  } finally {
    isGenerating.value = false;
  }
}

async function importWordFile(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  isImportingWord.value = true;
  errorMessage.value = "";
  importMessage.value = "";
  importFailed.value = false;
  try {
    if (!file.name.toLowerCase().endsWith(".docx"))
      throw new Error(t("questionBank.wordFormatError"));
    if (file.size > 10 * 1024 * 1024)
      throw new Error(t("questionBank.wordTooLarge"));
    const importedQuestions = await parseWordQuestionFile(file);
    if (!importedQuestions.length)
      throw new Error(t("questionBank.wordNoQuestions"));
    if (importedQuestions.length > 100)
      throw new Error(t("questionBank.wordTooManyQuestions"));
    let saved = 0;
    let relabeled = 0;
    const failedQuestions = [];
    for (const [index, question] of importedQuestions.entries()) {
      try {
        const legacyMatch = findUnlabeledImportedQuestion(question);
        if (legacyMatch) {
          await api(`/questions/${legacyMatch.id}`, {
            method: "PATCH",
            body: { content: question.content },
          });
          legacyMatch.content = question.content;
          relabeled += 1;
        } else {
          await api(`/lessons/${props.lessonId}/questions`, {
            method: "POST",
            body: question,
          });
          saved += 1;
        }
      } catch (error) {
        failedQuestions.push({
          number: index + 1,
          status: error.status,
          message: error.message,
        });
      }
    }
    await loadQuestions();
    const duplicates = failedQuestions.filter(
      (failure) => failure.status === 409,
    );
    const otherFailures = failedQuestions.filter(
      (failure) => failure.status !== 409,
    );
    importFailed.value = failedQuestions.length > 0;
    if (failedQuestions.length) {
      const details = [
        t("questionBank.wordImportPartial", {
          saved,
          updated: relabeled,
          duplicates: duplicates.length,
          failed: otherFailures.length,
        }),
        ...(duplicates.length
          ? [
              t("questionBank.wordImportDuplicateDetails", {
                numbers: duplicates.map(({ number }) => number).join(", "),
              }),
            ]
          : []),
        ...otherFailures
          .slice(0, 3)
          .map(({ number, message }) =>
            t("questionBank.wordImportFailureDetails", {
              number,
              reason: message,
            }),
          ),
      ];
      importMessage.value = details.join(" ");
    } else {
      importMessage.value = t("questionBank.wordImportSuccess", {
        count: saved + relabeled,
      });
    }
  } catch (error) {
    errorMessage.value = error.message || t("questionBank.wordImportError");
  } finally {
    isImportingWord.value = false;
  }
}

function findUnlabeledImportedQuestion(importedQuestion) {
  const label = importedQuestion.content.match(/^Question \d+\.\n\n/);
  if (!label) return null;
  const previousContent = importedQuestion.content
    .slice(label[0].length)
    .trim();
  const normalizeContent = (value) =>
    String(value || "")
      .replace(/\s+/g, " ")
      .trim();
  const optionSignature = (options) =>
    (options || [])
      .map(
        ({ content, isCorrect, matchContent }) =>
          `${String(content || "").trim()}|${Boolean(isCorrect)}|${String(matchContent || "").trim()}`,
      )
      .sort()
      .join("::");
  return (
    questions.value.find(
      (existing) =>
        existing.type === importedQuestion.type &&
        normalizeContent(existing.content) ===
          normalizeContent(previousContent) &&
        optionSignature(existing.options) ===
          optionSignature(importedQuestion.options),
    ) || null
  );
}

function draftPayload(draft) {
  return {
    type: draft.type,
    difficulty: draft.difficulty,
    content: draft.content.trim(),
    answerText: draft.answerText?.trim() || undefined,
    explanation: draft.explanation?.trim() || undefined,
    ...(["MCQ", "MULTI_MCQ", "TRUE_FALSE", "MATCHING", "DRAG_DROP"].includes(
      draft.type,
    )
      ? { options: draft.options }
      : {}),
  };
}

async function saveDraft(index) {
  const draft = generatedQuestions.value[index];
  if (!draft) return;
  savingDraftIndex.value = index;
  errorMessage.value = "";
  try {
    await api(`/lessons/${props.lessonId}/questions`, {
      method: "POST",
      body: draftPayload(draft),
    });
    questionBankStore.removeDraft(authStore.user?.id, props.lessonId, index);
    await loadQuestions();
  } catch (error) {
    errorMessage.value = error.message || t("questionBank.saveError");
  } finally {
    savingDraftIndex.value = null;
  }
}

async function saveAllDrafts() {
  isSavingAllDrafts.value = true;
  errorMessage.value = "";
  try {
    while (generatedQuestions.value.length) {
      const draft = generatedQuestions.value[0];
      await api(`/lessons/${props.lessonId}/questions`, {
        method: "POST",
        body: draftPayload(draft),
      });
      questionBankStore.removeDraft(authStore.user?.id, props.lessonId, 0);
    }
    await loadQuestions();
  } catch (error) {
    errorMessage.value = error.message || t("questionBank.saveError");
  } finally {
    isSavingAllDrafts.value = false;
  }
}

function clearDrafts() {
  questionBankStore.clearLesson(authStore.user?.id, props.lessonId);
}

function escapeHtml(value) {
  return String(value || "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
}

function printDrafts() {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    errorMessage.value = t("questionBank.printPopupBlocked");
    return;
  }
  const rows = generatedQuestions.value
    .map((draft, index) => {
      const options = (draft.options || [])
        .map(
          (option, optionIndex) =>
            `<li>${String.fromCharCode(65 + optionIndex)}. ${escapeHtml(option.content)}</li>`,
        )
        .join("");
      const answer = ["MCQ", "MULTI_MCQ", "TRUE_FALSE"].includes(draft.type)
        ? (draft.options || [])
            .map((option, optionIndex) =>
              option.isCorrect ? String.fromCharCode(65 + optionIndex) : "",
            )
            .filter(Boolean)
            .join(", ")
        : ["MATCHING", "DRAG_DROP"].includes(draft.type)
          ? (draft.options || [])
              .map(
                (option) =>
                  `${escapeHtml(option.content)} ↔ ${escapeHtml(option.matchContent)}`,
              )
              .join("; ")
          : escapeHtml(draft.answerText);
      return `<article><h2>Câu ${index + 1}. ${escapeHtml(draft.content)}</h2><ul>${options}</ul></article><p class="answer">Đáp án ${index + 1}: ${answer || "—"}${draft.explanation ? ` · ${escapeHtml(draft.explanation)}` : ""}</p>`;
    })
    .join("");
  printWindow.document.write(
    `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${escapeHtml(props.lessonTitle)} - ${t("questionBank.printTitle")}</title><style>body{font:15px/1.65 Arial,sans-serif;color:#182b49;max-width:820px;margin:40px auto;padding:0 24px}h1{font-size:24px;margin-bottom:4px}header{border-bottom:2px solid #347af0;padding-bottom:16px;margin-bottom:24px;color:#667085}article{break-inside:avoid;margin:0 0 14px}article h2{font-size:16px;font-weight:600}ul{list-style:none;padding-left:22px;margin:6px 0}.answer{font-size:12px;color:#667085;margin:0 0 22px 22px;border-bottom:1px dashed #d7dfeb;padding-bottom:12px}@media print{body{margin:0 auto;padding:0 10px}}</style></head><body><header><h1>${escapeHtml(t("questionBank.printTitle"))}</h1>${escapeHtml(props.lessonTitle)}<br>${t("questionBank.printDate")} ${new Date().toLocaleDateString()}</header>${rows}<script>window.onload=()=>window.print()<\/script></body></html>`,
  );
  printWindow.document.close();
}

function confirmDelete(question) {
  questionToDelete.value = question;
  showDeleteConfirm.value = true;
}

async function deleteQuestion() {
  if (!questionToDelete.value) return;
  isDeleting.value = true;
  errorMessage.value = "";
  try {
    await api(`/questions/${questionToDelete.value.id}`, { method: "DELETE" });
    showDeleteConfirm.value = false;
    questionToDelete.value = null;
    await loadQuestions();
  } catch (error) {
    showDeleteConfirm.value = false;
    deleteToast.value = {
      show: true,
      message: error.message || t("questionBank.deleteError"),
    };
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

.question-bank-action--inline {
  display: block;
  width: 100%;
  min-width: 0;
}

.question-bank-dialog {
  width: 100%;
  max-width: none;
  border: 1px solid #dce7f7;
  box-shadow: 0 16px 40px rgba(30, 64, 120, 0.16);
}

.question-bank-inline-card {
  background: rgb(var(--v-theme-surface));
}

.question-bank-heading-copy {
  flex: 1;
  min-width: 0;
}

.question-bank-heading-title {
  max-width: 100%;
  margin: 0;
  font-size: 22px !important;
  line-height: 1.25;
  overflow-wrap: anywhere;
  white-space: normal;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.question-list-heading {
  display: flex;
  min-height: 28px;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.question-filters {
  display: flex;
  align-items: center;
  gap: 8px;
}
.question-filter-search {
  min-width: 180px;
  flex: 1 1 auto;
}
.question-filter-select {
  min-width: 140px;
  flex: 0 1 160px;
}
.question-filters :deep(.v-field) {
  min-height: 36px;
  font-size: 14px;
}
.question-filters :deep(.v-field__input),
.question-filters :deep(.v-label) {
  font-size: 14px;
}
.question-display-toggle {
  flex: 0 0 auto;
  white-space: nowrap;
}
.question-display-toggle :deep(.v-btn) {
  min-height: 36px;
  padding-inline: 8px;
  font-size: 13px;
}
.question-list-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 2px;
}
.question-bank-action-button {
  min-height: 36px;
  max-height: 36px;
  font-size: 14px;
}
.question-bank-action-button--secondary {
  opacity: 0.86;
}

.question-item {
  border: 1px solid #e4ecf7;
  background: rgb(var(--v-theme-surface));
}
.question-content--clamped {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}
.question-actions {
  flex: 0 0 auto;
}
.question-bank-heading-actions {
  flex: 0 0 auto;
}
@media (max-width: 1023.98px) {
  .question-filters {
    flex-wrap: wrap;
  }
  .question-filter-search {
    flex: 1 1 100%;
  }
  .question-filter-select {
    flex: 1 1 140px;
  }
  .question-display-toggle {
    margin-left: auto;
  }
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
  border: 1px dashed rgba(var(--v-theme-primary), 0.32);
  background: rgba(var(--v-theme-primary), 0.035) !important;
}
</style>
