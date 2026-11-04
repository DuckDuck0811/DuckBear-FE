<template>
  <v-layout class="submission-detail-page min-vh-100">
    <AppHeader />
    <TeacherSidebar />
    <v-main>
      <v-container class="submission-detail-container py-7 px-4 px-md-8">
        <v-btn to="/submissions" variant="text" color="primary" prepend-icon="mdi-arrow-left" class="mb-4">
          {{ t('assignmentHub.backToSubmissions') }}
        </v-btn>

        <header v-if="assignment" class="detail-hero mb-5">
          <div class="detail-hero-icon"><v-icon icon="mdi-file-document-check-outline" size="28" /></div>
          <div class="min-w-0">
            <div class="detail-eyebrow">{{ assignment.class?.name }}</div>
            <h1>{{ assignment.title }}</h1>
            <p>{{ t('assignmentHub.submissionCount', { count: allSubmittedAttempts.length }) }}</p>
          </div>
        </header>

        <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>
        <v-card v-if="loading" class="detail-state" rounded="xl" variant="flat"><v-progress-circular indeterminate color="primary" /></v-card>
        <v-card v-else-if="!allSubmittedAttempts.length" class="detail-state text-secondary" rounded="xl" variant="flat">
          <v-icon icon="mdi-inbox-outline" size="42" />
          <strong>{{ t('assignmentHub.noSubmissions') }}</strong>
        </v-card>
        <template v-else>
          <section class="attempt-stats mb-4">
            <v-card class="attempt-stat" rounded="xl" variant="flat"><span>{{ t('assignmentHub.totalSubmittedAttempts') }}</span><strong>{{ allSubmittedAttempts.length }}</strong></v-card>
            <v-card class="attempt-stat" rounded="xl" variant="flat"><span>{{ t('assignmentHub.awaitingReviewCount') }}</span><strong>{{ awaitingReviewCount }}</strong></v-card>
            <v-card class="attempt-stat" rounded="xl" variant="flat"><span>{{ t('assignmentHub.gradedCount') }}</span><strong>{{ allSubmittedAttempts.length - awaitingReviewCount }}</strong></v-card>
          </section>

          <v-card class="attempt-list-card" rounded="xl" variant="flat">
            <div class="attempt-list-toolbar">
              <div>
                <h2>{{ t('assignmentHub.submittedAttemptsTitle') }}</h2>
                <p>{{ assignment?.class?.name }}</p>
              </div>
              <v-text-field v-model="search" :placeholder="t('assignmentHub.studentSearch')" prepend-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details clearable class="attempt-search" />
            </div>

            <div v-if="!filteredAttempts.length" class="detail-state text-secondary">
              <v-icon icon="mdi-account-search-outline" size="38" />
              {{ t('assignmentHub.noMatchingSubmissions') }}
            </div>
            <v-expansion-panels v-else variant="accordion" class="attempt-panels">
              <v-expansion-panel v-for="attempt in pagedAttempts" :key="attempt.id">
                <v-expansion-panel-title>
                  <div class="attempt-summary">
                    <div class="attempt-student">
                      <span class="student-avatar"><v-icon icon="mdi-account-outline" /></span>
                      <strong>{{ attempt.student.fullName }}</strong>
                    </div>
                    <span>{{ t('assignmentHub.attemptLabel', { number: attempt.attemptNo, max: assignment.maxAttempts || t('assignmentHub.unlimited') }) }}</span>
                    <span>{{ t('assignmentHub.submittedAt') }} {{ formatDate(attempt.submittedAt) }}</span>
                    <v-chip v-if="attempt.score !== null" color="success" variant="tonal" size="x-small">{{ attempt.score }}%</v-chip>
                    <v-chip v-else-if="hasEssayAnswers(attempt)" color="warning" variant="tonal" size="x-small">{{ t('assignmentHub.awaitingGrade') }}</v-chip>
                    <v-chip v-else color="grey" variant="tonal" size="x-small">{{ t('assignmentHub.needsReview') }}</v-chip>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <article v-for="(answer, index) in attempt.answers" :key="answer.id" class="submission-answer">
                    <div class="answer-question">{{ index + 1 }}. {{ answer.question.content }}</div>
                    <p class="answer-text">{{ t('assignmentHub.studentAnswer') }}: {{ answer.selectedOption?.content || answer.displayAnswer || t('assignmentHub.noAnswer') }}</p>
                    <v-img v-if="answer.imageUrl" :src="answer.imageUrl" :alt="t('assignmentHub.attachedWork')" max-height="420" max-width="760" width="100%" contain rounded="lg" class="mb-3" />
                    <v-chip v-if="answer.isCorrect !== null" size="x-small" :color="answer.isCorrect ? 'success' : 'error'" variant="tonal" class="mb-2">
                      {{ answer.isCorrect ? t('assignmentHub.correct') : t('assignmentHub.incorrect') }}
                    </v-chip>
                    <div v-if="answer.question.type === 'ESSAY'" class="essay-grade-fields">
                      <v-text-field v-model.number="answer.score" type="number" min="0" :max="answer.points" step="0.1" :label="t('assignmentHub.gradePoints', { points: answer.points })" variant="outlined" density="compact" hide-details />
                      <v-textarea v-model="answer.teacherFeedback" :label="t('assignmentHub.teacherFeedback')" variant="outlined" density="compact" rows="2" auto-grow hide-details />
                    </div>
                    <p v-else-if="answer.teacherFeedback" class="answer-feedback"><strong>{{ t('assignmentHub.teacherFeedback') }}:</strong> {{ answer.teacherFeedback }}</p>
                  </article>
                  <v-alert v-if="gradeErrors[attempt.id]" type="error" variant="tonal" density="compact" class="mt-3">{{ gradeErrors[attempt.id] }}</v-alert>
                  <div v-if="hasEssayAnswers(attempt)" class="d-flex justify-end mt-4">
                    <v-btn color="primary" rounded="pill" prepend-icon="mdi-check-decagram-outline" :loading="gradingAttemptId === attempt.id" :disabled="!canSaveGrade(attempt)" @click="saveGrade(attempt)">
                      {{ t('assignmentHub.returnGrade') }}
                    </v-btn>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
            <ListPagination v-model="page" :total="filteredAttempts.length" />
          </v-card>
        </template>
      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../../services/api'
import AppHeader from '../../components/shared/AppHeader.vue'
import TeacherSidebar from '../../components/shared/TeacherSidebar.vue'
import ListPagination from '../../components/shared/ListPagination.vue'

const route = useRoute()
const { t, locale } = useI18n()
const assignment = ref(null)
const loading = ref(true)
const error = ref('')
const search = ref('')
const page = ref(1)
const pageSize = 20
const gradingAttemptId = ref(null)
const gradeErrors = ref({})
const allSubmittedAttempts = computed(() => (assignment.value?.attempts || []).filter((attempt) => attempt.submittedAt))
const awaitingReviewCount = computed(() => allSubmittedAttempts.value.filter((attempt) => hasEssayAnswers(attempt) && attempt.score === null).length)
const filteredAttempts = computed(() => {
  const query = search.value.trim().toLocaleLowerCase()
  if (!query) return allSubmittedAttempts.value
  return allSubmittedAttempts.value.filter((attempt) => `${attempt.student?.fullName || ''} ${attempt.student?.email || ''}`.toLocaleLowerCase().includes(query))
})
const pagedAttempts = computed(() => filteredAttempts.value.slice((page.value - 1) * pageSize, page.value * pageSize))

watch(search, () => { page.value = 1 })
watch(() => Math.ceil(filteredAttempts.value.length / pageSize), (count) => {
  if (page.value > count) page.value = Math.max(1, count)
})
onMounted(loadAssignment)

async function loadAssignment() {
  loading.value = true
  error.value = ''
  try {
    assignment.value = await api(`/assignments/${route.params.assignmentId}`)
  } catch (cause) {
    error.value = cause?.message || t('assignmentHub.submissionsLoadError')
  } finally {
    loading.value = false
  }
}

function hasEssayAnswers(attempt) {
  return attempt.answers?.some((answer) => answer.question?.type === 'ESSAY') || false
}

function canSaveGrade(attempt) {
  return attempt.answers.filter((answer) => answer.question?.type === 'ESSAY').every((answer) =>
    answer.score !== null && answer.score !== '' && Number.isFinite(Number(answer.score)) && Number(answer.score) >= 0 && Number(answer.score) <= Number(answer.points))
}

async function saveGrade(attempt) {
  if (!canSaveGrade(attempt) || gradingAttemptId.value !== null) return
  gradingAttemptId.value = attempt.id
  gradeErrors.value[attempt.id] = ''
  try {
    const result = await api(`/assignments/attempts/${attempt.id}/grade`, {
      method: 'POST',
      body: {
        answers: attempt.answers.filter((answer) => answer.question?.type === 'ESSAY').map((answer) => ({
          answerId: answer.id,
          score: Number(answer.score),
          feedback: answer.teacherFeedback || '',
        })),
      },
    })
    attempt.score = result.score
  } catch (cause) {
    gradeErrors.value[attempt.id] = cause?.message || t('assignmentHub.gradeError')
  } finally {
    gradingAttemptId.value = null
  }
}

function formatDate(value) {
  return new Intl.DateTimeFormat(locale.value === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}
</script>

<style scoped>
.submission-detail-page { background: #f4f8ff; }
.submission-detail-container { max-width: 1160px; }
.detail-hero { display: flex; align-items: center; gap: 16px; padding: 22px 24px; border: 1px solid #e2ebf8; border-radius: 20px; background: linear-gradient(120deg, #fff, #eff6ff); }
.detail-hero-icon { display: grid; width: 52px; height: 52px; flex: none; place-items: center; border-radius: 15px; background: #e5efff; color: #347cf5; }
.detail-eyebrow { color: #347cf5; font-size: .75rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
.detail-hero h1 { overflow: hidden; margin: 2px 0; color: #1e2c43; font-size: clamp(1.4rem, 3vw, 1.8rem); text-overflow: ellipsis; }
.detail-hero p { margin: 0; color: #75839a; }
.detail-state { display: flex; min-height: 220px; flex-direction: column; align-items: center; justify-content: center; gap: 10px; border: 1px solid #e3ebf7; background: #fff; text-align: center; }
.attempt-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.attempt-stat { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border: 1px solid #e3ebf7; background: #fff; color: #75839a; }
.attempt-stat strong { color: #347cf5; font-size: 1.25rem; }
.attempt-list-card { overflow: hidden; border: 1px solid #e3ebf7; background: #fff; }
.attempt-list-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 20px 22px; border-bottom: 1px solid #edf2f8; }
.attempt-list-toolbar h2 { margin: 0; color: #25354d; font-size: 1.08rem; }
.attempt-list-toolbar p { margin: 4px 0 0; color: #75839a; font-size: .85rem; }
.attempt-search { max-width: 320px; }
.attempt-panels { padding: 0 12px; }
.attempt-summary { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.attempt-summary > span { color: #75839a; font-size: .82rem; }
.attempt-student { display: flex; align-items: center; gap: 9px; min-width: 180px; }
.attempt-student strong { color: #26364e; }
.student-avatar { display: grid; width: 34px; height: 34px; flex: none; place-items: center; border-radius: 50%; background: #edf4ff; color: #347cf5; }
.submission-answer { padding: 14px 0; border-bottom: 1px solid #edf2f8; }
.submission-answer:last-of-type { border-bottom: 0; }
.answer-question { color: #26364e; font-weight: 750; }
.answer-text { margin: 6px 0 10px; color: #596a82; white-space: pre-wrap; }
.essay-grade-fields { display: grid; grid-template-columns: minmax(140px, 190px) minmax(220px, 1fr); gap: 12px; align-items: start; margin-top: 12px; }
.answer-feedback { margin: 8px 0 0; color: #2874ee; }
@media (max-width: 700px) {
  .attempt-stats { gap: 8px; }
  .attempt-stat { align-items: flex-start; flex-direction: column; gap: 4px; padding: 12px; font-size: .78rem; }
  .attempt-list-toolbar { align-items: stretch; flex-direction: column; }
  .attempt-search { max-width: none; }
  .essay-grade-fields { grid-template-columns: 1fr; }
}
</style>
