<template>
  <v-layout class="min-vh-100 assignment-take-page">
    <AppHeader />
    <StudentSidebar />
    <v-main class="pb-16">
      <v-container class="py-7 px-4 px-md-8" style="max-width: 960px">
        <v-btn to="/assignments" variant="text" prepend-icon="mdi-arrow-left" class="mb-4">{{ t('assignmentHub.backToAssignments') }}</v-btn>
        <v-progress-linear v-if="loading" indeterminate color="primary" rounded />
        <v-alert v-else-if="errorMessage" type="error" variant="tonal">{{ errorMessage }}</v-alert>

        <template v-else-if="result">
          <v-card class="pa-6 mb-5" rounded="xl">
            <v-avatar color="success" variant="tonal" size="60" class="mb-3"><v-icon icon="mdi-check-bold" size="30" /></v-avatar>
            <h1 class="text-h4 font-weight-black">{{ t('assignmentHub.submitted') }}</h1>
            <p class="text-body-1">{{ result.needsManualGrading ? t('assignmentHub.waitForGrading') : t('assignmentHub.score', { score: result.score ?? 0 }) }}</p>
            <p v-if="result.totalPoints" class="text-body-2 text-secondary">{{ t('assignmentHub.points', { earned: result.earnedPoints, total: result.totalPoints }) }}</p>
          </v-card>
          <v-card v-for="(answer, index) in result.answers" :key="answer.id" class="pa-5 mb-3" rounded="xl">
            <div class="d-flex align-center ga-2 mb-2"><v-chip size="small" color="primary" variant="tonal">{{ t('questionBank.questionNumber', { number: index + 1 }) }}</v-chip><v-chip v-if="answer.isCorrect !== null" size="small" :color="answer.isCorrect ? 'success' : 'error'" variant="tonal">{{ answer.isCorrect ? t('assignmentHub.correct') : t('assignmentHub.incorrect') }}</v-chip></div>
            <div class="font-weight-bold mb-2">{{ answer.question.content }}</div>
            <div v-if="answer.question.answerText" class="text-body-2 mb-1"><strong>{{ t('questionBank.answerText') }}:</strong> {{ answer.question.answerText }}</div>
            <div v-if="answer.question.explanation" class="text-body-2 text-secondary"><strong>{{ t('questionBank.explanation') }}:</strong> {{ answer.question.explanation }}</div>
          </v-card>
        </template>

        <template v-else-if="assignment">
          <v-card class="pa-5 pa-md-7 mb-5" rounded="xl">
            <div class="d-flex flex-wrap align-center justify-space-between ga-3">
              <div><div class="text-overline text-primary">{{ assignment.class.name }} · {{ assignment.lesson.title }}</div><h1 class="text-h4 font-weight-black">{{ assignment.title }}</h1></div>
              <v-chip v-if="remainingSeconds !== null" color="warning" variant="tonal" prepend-icon="mdi-timer-outline">{{ timeLabel }}</v-chip>
            </div>
            <div class="text-body-2 text-secondary mt-2">{{ t('assignmentHub.attemptLabel', { number: attemptNo, max: assignment.maxAttempts ? assignment.maxAttempts : t('assignmentHub.unlimited') }) }}</div>
          </v-card>

          <v-card v-for="(item, index) in assignment.questions" :key="item.question.id" class="pa-5 pa-md-6 mb-4" rounded="xl">
            <div class="d-flex align-center ga-2 mb-3"><v-chip size="small" color="primary" variant="tonal">{{ t('questionBank.questionNumber', { number: index + 1 }) }}</v-chip><v-chip size="x-small" variant="tonal">{{ t(`questionBank.types.${item.question.type}`) }}</v-chip></div>
            <div class="text-body-1 font-weight-bold mb-4">{{ item.question.content }}</div>

            <v-radio-group v-if="['MCQ', 'TRUE_FALSE'].includes(item.question.type)" v-model="answers[item.question.id].selectedOptionId" hide-details>
              <v-radio v-for="option in item.question.options" :key="option.id" :label="displayOptionContent(item.question.type, option.content)" :value="option.id" />
            </v-radio-group>
            <div v-else-if="item.question.type === 'MULTI_MCQ'">
              <v-checkbox v-for="option in item.question.options" :key="option.id" :model-value="answers[item.question.id].selectedOptionIds.includes(option.id)" :label="option.content" hide-details density="compact" @update:model-value="toggleOption(item.question.id, option.id, $event)" />
            </div>
            <div v-else-if="item.question.type === 'MATCHING'" class="d-flex flex-column ga-2">
              <div v-for="option in item.question.options" :key="option.id" class="d-flex flex-column flex-sm-row align-sm-center ga-3">
                <div class="flex-grow-1">{{ option.content }}</div>
                <v-select v-model="answers[item.question.id].matchAnswers[option.id]" :items="item.question.matchTargets" :label="t('assignmentHub.chooseMatch')" variant="outlined" density="compact" hide-details class="match-select" />
              </div>
            </div>
            <div v-else-if="item.question.type === 'DRAG_DROP' && item.question.options.length === 4" class="drag-drop-activity">
              <p class="drag-instruction">{{ t('assignmentHub.dragTip') }}</p>
              <div class="drag-token-bank">
                <span class="drag-bank-label">{{ t('assignmentHub.draggableItems') }}</span>
                <button
                  v-for="option in item.question.options"
                  :key="option.id"
                  type="button"
                  class="drag-token"
                  :class="{ 'drag-token--selected': selectedDrag?.questionId === item.question.id && selectedDrag?.optionId === option.id, 'drag-token--placed': isDragItemPlaced(item.question.id, option.id) }"
                  draggable="true"
                  @dragstart="beginDrag(item.question.id, option.id, $event)"
                  @dragend="selectedDrag = null"
                  @click="selectDragItem(item.question.id, option.id)"
                >
                  <v-icon icon="mdi-drag" size="16" />{{ option.content }}
                </button>
              </div>
              <div
                class="drop-target"
                :class="{ 'drop-target--filled': answers[item.question.id].selectedOptionId }"
                @dragover.prevent
                @drop.prevent="dropOnTarget(item.question.id, $event)"
                @click="dropSelectedItem(item.question.id)"
              >
                <span class="drop-target-label">{{ t('assignmentHub.answerSlot') }}</span>
                <span v-if="answers[item.question.id].selectedOptionId" class="drop-target-content">{{ item.question.options.find((option) => option.id === Number(answers[item.question.id].selectedOptionId))?.content }}</span>
                <span v-else class="drop-target-placeholder">{{ t('assignmentHub.dropHere') }}</span>
              </div>
            </div>
            <v-alert v-else-if="item.question.type === 'DRAG_DROP'" type="warning" variant="tonal" density="comfortable">{{ t('questionBank.noDragData') }}</v-alert>
            <v-textarea v-else v-model="answers[item.question.id].answerText" :label="item.question.type === 'FILL' ? t('assignmentHub.yourAnswer') : t('assignmentHub.writeAnswer')" variant="outlined" rows="2" auto-grow hide-details />
          </v-card>

          <div class="d-flex justify-end"><v-btn color="primary" size="large" prepend-icon="mdi-send" :loading="submitting" @click="submitAttempt">{{ t('assignmentHub.submit') }}</v-btn></div>
        </template>
      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../../services/api'
import AppHeader from '../../components/shared/AppHeader.vue'
import StudentSidebar from '../../components/shared/StudentSidebar.vue'

const { t } = useI18n()
const route = useRoute()
const loading = ref(true)
const submitting = ref(false)
const errorMessage = ref('')
const assignment = ref(null)
const attemptId = ref(null)
const attemptNo = ref(1)
const startedAt = ref(null)
const result = ref(null)
const answers = reactive({})
const selectedDrag = ref(null)
const now = ref(Date.now())
let timer = null

watch(answers, () => {
  if (attemptId.value) localStorage.setItem(`assignment-attempt-${attemptId.value}`, JSON.stringify(answers))
}, { deep: true })

const endTime = computed(() => {
  const times = []
  if (assignment.value?.deadline) times.push(new Date(assignment.value.deadline).getTime())
  if (assignment.value?.durationMinutes && startedAt.value) times.push(new Date(startedAt.value).getTime() + assignment.value.durationMinutes * 60000)
  return times.length ? Math.min(...times) : null
})
const remainingSeconds = computed(() => endTime.value === null ? null : Math.max(0, Math.floor((endTime.value - now.value) / 1000)))
const timeLabel = computed(() => `${String(Math.floor(remainingSeconds.value / 60)).padStart(2, '0')}:${String(remainingSeconds.value % 60).padStart(2, '0')}`)

onMounted(async () => {
  timer = window.setInterval(() => { now.value = Date.now() }, 1000)
  await startAttempt()
})
onBeforeUnmount(() => window.clearInterval(timer))

async function startAttempt() {
  loading.value = true
  errorMessage.value = ''
  try {
    const started = await api(`/assignments/${route.params.id}/start`, { method: 'POST' })
    attemptId.value = started.attemptId
    attemptNo.value = started.attemptNo
    startedAt.value = started.startedAt
    assignment.value = started.assignment
    for (const { question } of assignment.value.questions) {
      answers[question.id] = { selectedOptionId: null, selectedOptionIds: [], answerText: '', matchAnswers: {}, dropTargets: {} }
    }
    try {
      const saved = JSON.parse(localStorage.getItem(`assignment-attempt-${attemptId.value}`) || '{}')
      for (const questionId of Object.keys(answers)) {
        if (saved[questionId]) answers[questionId] = { ...answers[questionId], ...saved[questionId] }
      }
    } catch { /* Ignore an invalid local draft and start with blank answers. */ }
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}

function toggleOption(questionId, optionId, checked) {
  const selected = new Set(answers[questionId].selectedOptionIds)
  checked ? selected.add(optionId) : selected.delete(optionId)
  answers[questionId].selectedOptionIds = [...selected]
}

function displayOptionContent(type, content) {
  if (type !== 'TRUE_FALSE') return content
  if (/^(true|đúng)$/i.test(String(content || '').trim())) return t('questionBank.true')
  if (/^(false|sai)$/i.test(String(content || '').trim())) return t('questionBank.false')
  return content
}

function beginDrag(questionId, optionId, event) {
  selectedDrag.value = { questionId, optionId }
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', `${questionId}:${optionId}`)
}

function selectDragItem(questionId, optionId) {
  selectedDrag.value = selectedDrag.value?.questionId === questionId && selectedDrag.value?.optionId === optionId
    ? null
    : { questionId, optionId }
}

function dropSelectedItem(questionId) {
  if (selectedDrag.value?.questionId !== questionId) return
  placeDragItem(questionId, selectedDrag.value.optionId)
  selectedDrag.value = null
}

function dropOnTarget(questionId, event) {
  const [dragQuestionId, optionId] = (event.dataTransfer.getData('text/plain') || '').split(':').map(Number)
  const drag = dragQuestionId === questionId && optionId ? optionId : selectedDrag.value?.questionId === questionId ? selectedDrag.value.optionId : null
  if (drag) placeDragItem(questionId, drag)
  selectedDrag.value = null
}

function placeDragItem(questionId, optionId) {
  answers[questionId].selectedOptionId = Number(optionId)
}

function isDragItemPlaced(questionId, optionId) {
  return Number(answers[questionId]?.selectedOptionId) === Number(optionId)
}

async function submitAttempt() {
  if (!attemptId.value || submitting.value) return
  submitting.value = true
  errorMessage.value = ''
  try {
    result.value = await api(`/assignments/attempts/${attemptId.value}/submit`, {
      method: 'POST',
      body: {
        answers: assignment.value.questions.map(({ question }) => ({
          questionId: question.id,
          selectedOptionIds: question.type === 'MULTI_MCQ'
            ? answers[question.id].selectedOptionIds
            : answers[question.id].selectedOptionId
              ? [answers[question.id].selectedOptionId]
              : [],
          answerText: answers[question.id].answerText || undefined,
          matchAnswers: question.type === 'MATCHING' ? answers[question.id].matchAnswers : undefined,
        })),
      },
    })
    localStorage.removeItem(`assignment-attempt-${attemptId.value}`)
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    submitting.value = false
  }
}

watchTimer()
function watchTimer() {
  let autoSubmitted = false
  const monitor = window.setInterval(() => {
    if (remainingSeconds.value === 0 && !autoSubmitted && attemptId.value && !result.value) {
      autoSubmitted = true
      submitAttempt()
    }
  }, 1000)
  onBeforeUnmount(() => window.clearInterval(monitor))
}
</script>

<style scoped>
.assignment-take-page { background: #f4f8ff; }
.match-select { max-width: 300px; }
.drag-drop-activity { display: grid; gap: 14px; }
.drag-instruction { margin: 0; color: #64748b; font-size: .88rem; }
.drag-token-bank { display: flex; flex-wrap: wrap; align-items: center; gap: 9px; padding: 14px; border: 1px dashed #c7d7ed; border-radius: 14px; background: #f8fbff; }
.drag-bank-label { flex-basis: 100%; color: #52647e; font-size: .78rem; font-weight: 800; }
.drag-token { display: inline-flex; min-height: 38px; align-items: center; gap: 6px; padding: 0 13px; border: 1px solid #cfe0fa; border-radius: 999px; background: #fff; color: #2e5f9e; cursor: grab; font: inherit; font-size: .9rem; font-weight: 700; touch-action: manipulation; }
.drag-token:active { cursor: grabbing; }
.drag-token--selected { border-color: #347af0; background: #eaf2ff; box-shadow: 0 0 0 3px rgba(52,122,240,.12); }
.drag-token--placed { opacity: .55; }
.drop-target-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px; }
.drop-target { display: grid; min-height: 76px; gap: 5px; padding: 11px 13px; border: 1px dashed #aebed3; border-radius: 13px; background: #fff; cursor: copy; }
.drop-target--filled { border-style: solid; border-color: #83b0f6; background: #f3f8ff; }
.drop-target-label { color: #52647e; font-size: .82rem; font-weight: 800; }
.drop-target-content { color: #1f5fb8; font-weight: 800; }
.drop-target-placeholder { color: #9aa6b6; font-size: .84rem; }
</style>
