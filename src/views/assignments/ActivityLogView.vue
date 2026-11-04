<template>
  <v-layout class="activity-page min-vh-100">
    <AppHeader />
    <TeacherSidebar />
    <v-main>
      <v-container class="activity-container py-7 px-4 px-md-8">
        <header class="activity-hero mb-6">
          <div class="activity-hero-icon"><v-icon icon="mdi-history" size="28" /></div>
          <div>
            <div class="activity-eyebrow">{{ t('activityLogPage.eyebrow') }}</div>
            <h1>{{ t('activityLogPage.title') }}</h1>
            <p>{{ t('activityLogPage.subtitle') }}</p>
          </div>
        </header>

        <v-card class="activity-filter-card mb-5" rounded="xl" variant="flat">
          <div class="class-filter">
            <v-autocomplete
              v-model="selectedClassId"
              :items="classes"
              item-title="name"
              item-value="id"
              :label="t('activityLogPage.classLabel')"
              :placeholder="t('activityLogPage.classPlaceholder')"
              :loading="classesLoading"
              :disabled="classesLoading || !classes.length"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
            >
              <template #item="{ props, item }">
                <v-list-item v-bind="props" :subtitle="item?.raw ? t('activityLogPage.classMeta', { grade: item.raw.gradeLevel, year: item.raw.schoolYear }) : undefined" />
              </template>
            </v-autocomplete>
          </div>
          <v-alert v-if="errorMessage" type="error" variant="tonal" class="ma-4 mb-0">{{ errorMessage }}</v-alert>
        </v-card>

        <v-card v-if="selectedClassId && !selectedAssignmentId" class="activity-records" rounded="xl" variant="flat">
          <div class="section-heading">
            <div>
              <h2>{{ t('activityLogPage.assignmentsTitle') }}</h2>
              <p>{{ selectedClass?.name }} · {{ filteredAssignments.length }} {{ t('activityLogPage.assignmentsCount') }}</p>
            </div>
            <v-text-field
              v-model="assignmentSearch"
              :placeholder="t('activityLogPage.assignmentSearch')"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              class="activity-search"
            />
          </div>
          <div v-if="assignmentsLoading" class="activity-state"><v-progress-circular indeterminate color="primary" /></div>
          <div v-else-if="!filteredAssignments.length" class="activity-state text-secondary">
            <v-icon icon="mdi-clipboard-search-outline" size="40" />
            <span>{{ t('activityLogPage.noAssignments') }}</span>
          </div>
          <div v-else class="assignment-list">
            <button v-for="assignment in pagedAssignments" :key="assignment.id" class="assignment-row" @click="openAssignment(assignment)">
              <span class="assignment-icon"><v-icon icon="mdi-file-document-outline" /></span>
              <span class="assignment-copy">
                <strong>{{ assignment.title }}</strong>
                <small>{{ assignment.class?.name }} · {{ assignment._count?.questions || 0 }} {{ t('activityLogPage.questions') }}</small>
              </span>
              <span class="assignment-submissions">
                <strong>{{ assignment._count?.attempts || 0 }}</strong>
                <small>{{ t('activityLogPage.attempts') }}</small>
              </span>
              <v-icon icon="mdi-chevron-right" color="primary" />
            </button>
          </div>
          <ListPagination v-model="assignmentPage" :total="filteredAssignments.length" />
        </v-card>

        <v-card v-else-if="selectedClassId && selectedAssignmentId" class="activity-records" rounded="xl" variant="flat">
          <div class="section-heading student-heading">
            <div class="heading-title">
              <v-btn icon="mdi-arrow-left" variant="tonal" color="primary" size="small" :aria-label="t('activityLogPage.backToAssignments')" @click="selectedAssignmentId = null" />
              <div>
                <h2>{{ selectedAssignment?.title || assignmentActivity?.assignment?.title }}</h2>
                <p>{{ selectedClass?.name }} · {{ t('activityLogPage.studentCount', { count: studentsWhoAttempted }) }}</p>
              </div>
            </div>
            <v-text-field
              v-model="studentSearch"
              :placeholder="t('activityLogPage.studentSearch')"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              class="activity-search"
            />
          </div>
          <div v-if="activityLoading" class="activity-state"><v-progress-circular indeterminate color="primary" /></div>
          <div v-else-if="!filteredStudents.length" class="activity-state text-secondary">
            <v-icon icon="mdi-account-search-outline" size="40" />
            <span>{{ t('activityLogPage.noStudents') }}</span>
          </div>
          <div v-else class="student-list">
            <article v-for="student in pagedStudents" :key="student.id" class="student-row">
              <div class="student-row-main">
                <div class="student-avatar"><v-icon icon="mdi-account-outline" /></div>
                <div class="student-copy">
                  <strong>{{ student.fullName }}</strong>
                  <small>{{ student.email }}</small>
                </div>
                <v-chip v-if="student.attempts.length" color="success" variant="tonal" size="small">
                  {{ t('activityLogPage.attemptCount', { count: student.attempts.length }) }}
                </v-chip>
                <v-chip v-else color="grey" variant="tonal" size="small">{{ t('activityLogPage.notAttempted') }}</v-chip>
                <v-btn
                  v-if="student.attempts.length"
                  size="small"
                  variant="text"
                  color="primary"
                  :append-icon="isStudentExpanded(student.id) ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                  @click="toggleStudent(student.id)"
                >{{ isStudentExpanded(student.id) ? t('activityLogPage.hideDetails') : t('activityLogPage.viewDetails') }}</v-btn>
              </div>

              <div v-if="isStudentExpanded(student.id)" class="student-attempts">
                <section v-for="attempt in student.attempts" :key="attempt.id" class="student-attempt">
                  <div class="attempt-heading">
                    <strong>{{ t('activityLogPage.attemptNumber', { number: attempt.attemptNo }) }}</strong>
                    <span>{{ t('activityLogPage.started') }} {{ formatDate(attempt.startedAt) }}</span>
                    <v-chip v-if="attempt.score !== null" color="primary" variant="tonal" size="x-small">{{ attempt.score }}%</v-chip>
                    <v-chip v-else-if="attempt.submittedAt" color="grey" variant="tonal" size="x-small">{{ t('activityLogPage.notGraded') }}</v-chip>
                    <v-chip v-else color="warning" variant="tonal" size="x-small">{{ t('activityLogPage.inProgress') }}</v-chip>
                    <v-chip v-if="screenExitCount(attempt)" color="warning" variant="tonal" size="x-small" prepend-icon="mdi-eye-off-outline">
                      {{ t('activityLogPage.screenExitCount', { count: screenExitCount(attempt) }) }}
                    </v-chip>
                    <span v-else class="text-caption text-success">{{ t('activityLogPage.noScreenExit') }}</span>
                  </div>
                  <div v-if="attempt.activityLogs.length" class="activity-timeline">
                    <div v-for="activity in attempt.activityLogs" :key="activity.id" class="activity-timeline-item">
                      <span class="activity-dot" :class="activityDotClass(activity.action)" />
                      <span>{{ activityLabel(activity.action) }}</span>
                      <time>{{ formatDate(activity.createdAt, true) }}</time>
                    </div>
                  </div>
                  <div v-else class="text-caption text-secondary mt-2">{{ t('activityLogPage.noEvents') }}</div>
                </section>
              </div>
            </article>
          </div>
          <ListPagination v-model="studentPage" :total="filteredStudents.length" />
        </v-card>

        <v-card v-else-if="!classesLoading && !classes.length" class="activity-state activity-records text-secondary" rounded="xl" variant="flat">
          <v-icon icon="mdi-google-classroom" size="40" />
          <span>{{ t('activityLogPage.noClasses') }}</span>
        </v-card>
        <v-card v-else class="activity-state activity-records text-secondary" rounded="xl" variant="flat">
          <v-icon icon="mdi-account-search-outline" size="40" />
          <span>{{ t('activityLogPage.chooseClass') }}</span>
        </v-card>
      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../../services/api'
import AppHeader from '../../components/shared/AppHeader.vue'
import TeacherSidebar from '../../components/shared/TeacherSidebar.vue'
import ListPagination from '../../components/shared/ListPagination.vue'

const { t, locale } = useI18n()
const classes = ref([])
const assignments = ref([])
const assignmentActivity = ref(null)
const selectedClassId = ref(null)
const selectedAssignmentId = ref(null)
const classesLoading = ref(false)
const assignmentsLoading = ref(false)
const activityLoading = ref(false)
const errorMessage = ref('')
const assignmentSearch = ref('')
const studentSearch = ref('')
const assignmentPage = ref(1)
const studentPage = ref(1)
const expandedStudents = ref({})
const pageSize = 20
let activityRefreshTimer = null
let activityRequestVersion = 0

const selectedClass = computed(() => classes.value.find(item => Number(item.id) === Number(selectedClassId.value)))
const selectedAssignment = computed(() => assignments.value.find(item => item.id === selectedAssignmentId.value))
const students = computed(() => assignmentActivity.value?.students || [])
const studentsWhoAttempted = computed(() => students.value.filter(student => student.attempts.length).length)
const filteredAssignments = computed(() => {
  const list = assignments.value.filter(item => Number(item.classId) === Number(selectedClassId.value))
  const query = assignmentSearch.value?.trim().toLocaleLowerCase()
  return query ? list.filter(item => item.title.toLocaleLowerCase().includes(query)) : list
})
const filteredStudents = computed(() => {
  const query = studentSearch.value?.trim().toLocaleLowerCase()
  const list = students.value.filter(student => student.attempts.length)
  return query ? list.filter(student => `${student.fullName} ${student.email}`.toLocaleLowerCase().includes(query)) : list
})
const pagedAssignments = computed(() => filteredAssignments.value.slice((assignmentPage.value - 1) * pageSize, assignmentPage.value * pageSize))
const pagedStudents = computed(() => filteredStudents.value.slice((studentPage.value - 1) * pageSize, studentPage.value * pageSize))

watch(selectedClassId, classId => {
  selectedAssignmentId.value = null
  assignmentActivity.value = null
  activityLoading.value = false
  assignments.value = []
  assignmentsLoading.value = Boolean(classId)
  assignmentSearch.value = ''
  assignmentPage.value = 1
  studentPage.value = 1
  expandedStudents.value = {}
  errorMessage.value = ''
  if (classId) void loadClassAssignments(classId)
})
watch(selectedAssignmentId, assignmentId => {
  studentSearch.value = ''
  studentPage.value = 1
  expandedStudents.value = {}
  assignmentActivity.value = null
  if (assignmentId && selectedClassId.value) void loadAssignmentActivity(selectedClassId.value, assignmentId)
})
watch(assignmentSearch, () => { assignmentPage.value = 1 })
watch(studentSearch, () => { studentPage.value = 1 })
watch(() => Math.ceil(filteredAssignments.value.length / pageSize), count => {
  if (assignmentPage.value > count) assignmentPage.value = Math.max(1, count)
})
watch(() => Math.ceil(filteredStudents.value.length / pageSize), count => {
  if (studentPage.value > count) studentPage.value = Math.max(1, count)
})

async function loadClasses() {
  classesLoading.value = true
  errorMessage.value = ''
  try {
    const classResult = await api('/classes/mine')
    classes.value = classResult.classes || []
  } catch (error) {
    errorMessage.value = error.message || t('activityLogPage.loadError')
  } finally {
    classesLoading.value = false
  }
}

async function loadClassAssignments(classId) {
  assignmentsLoading.value = true
  try {
    const result = await api(`/classes/${classId}/assignments`)
    if (selectedClassId.value === classId) assignments.value = result || []
  } catch (error) {
    if (selectedClassId.value === classId) errorMessage.value = error.message || t('activityLogPage.loadError')
  } finally {
    if (selectedClassId.value === classId) assignmentsLoading.value = false
  }
}

async function openAssignment(assignment) {
  selectedAssignmentId.value = assignment.id
}

async function loadAssignmentActivity(classId, assignmentId) {
  const requestVersion = ++activityRequestVersion
  activityLoading.value = !assignmentActivity.value
  errorMessage.value = ''
  try {
    const result = await api(`/classes/${classId}/assignments/${assignmentId}/activity`)
    if (requestVersion === activityRequestVersion && Number(selectedClassId.value) === Number(classId) && Number(selectedAssignmentId.value) === Number(assignmentId)) {
      assignmentActivity.value = result
    }
  } catch (error) {
    if (requestVersion === activityRequestVersion && Number(selectedClassId.value) === Number(classId) && Number(selectedAssignmentId.value) === Number(assignmentId)) {
      errorMessage.value = error.message || t('activityLogPage.loadError')
    }
  } finally {
    if (requestVersion === activityRequestVersion) activityLoading.value = false
  }
}

function isStudentExpanded(studentId) { return Boolean(expandedStudents.value[studentId]) }
function toggleStudent(studentId) { expandedStudents.value[studentId] = !expandedStudents.value[studentId] }
function screenExitCount(attempt) {
  return attempt.activityLogs.filter(log => ['ATTEMPT_SCREEN_HIDDEN', 'ATTEMPT_SCREEN_LEFT'].includes(log.action)).length
}
function activityLabel(action) {
  const labels = {
    ATTEMPT_STARTED: 'started',
    ATTEMPT_SUBMITTED: 'submitted',
    ATTEMPT_SCREEN_HIDDEN: 'screenHidden',
    ATTEMPT_SCREEN_RETURNED: 'screenReturned',
    ATTEMPT_SCREEN_LEFT: 'screenLeft',
  }
  return t(`activityLogPage.events.${labels[action] || 'unknown'}`)
}
function activityDotClass(action) {
  if (action === 'ATTEMPT_SCREEN_HIDDEN' || action === 'ATTEMPT_SCREEN_LEFT') return 'activity-dot--warning'
  if (action === 'ATTEMPT_SUBMITTED' || action === 'ATTEMPT_SCREEN_RETURNED') return 'activity-dot--success'
  return 'activity-dot--primary'
}
function formatDate(value, withSeconds = false) {
  return new Intl.DateTimeFormat(locale.value === 'vi' ? 'vi-VN' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: withSeconds ? 'medium' : 'short',
  }).format(new Date(value))
}

function handleLiveActivity(event) {
  const activity = event.detail
  if (Number(activity?.classId) !== Number(selectedClassId.value) || Number(activity?.assignmentId) !== Number(selectedAssignmentId.value)) return
  scheduleActivityRefresh()
}

function handleSocketReconnect() {
  if (selectedClassId.value && selectedAssignmentId.value) scheduleActivityRefresh()
}

function scheduleActivityRefresh() {
  window.clearTimeout(activityRefreshTimer)
  activityRefreshTimer = window.setTimeout(() => {
    if (selectedClassId.value && selectedAssignmentId.value) {
      void loadAssignmentActivity(selectedClassId.value, selectedAssignmentId.value)
    }
  }, 120)
}

onMounted(() => {
  loadClasses()
  window.addEventListener('activity-log:assignment-event', handleLiveActivity)
  window.addEventListener('activity-log:reconnected', handleSocketReconnect)
})
onBeforeUnmount(() => {
  window.clearTimeout(activityRefreshTimer)
  window.removeEventListener('activity-log:assignment-event', handleLiveActivity)
  window.removeEventListener('activity-log:reconnected', handleSocketReconnect)
})
</script>

<style scoped>
.activity-page { background: #f4f8ff; }
.activity-container { max-width: 1160px; }
.activity-hero { display: flex; align-items: center; gap: 16px; padding: 22px 24px; border: 1px solid #e2ebf8; border-radius: 20px; background: linear-gradient(120deg, #fff, #eff6ff); }
.activity-hero-icon { display: grid; width: 52px; height: 52px; flex: none; place-items: center; border-radius: 15px; background: #e5efff; color: #347cf5; }
.activity-eyebrow { color: #347cf5; font-size: .72rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.activity-hero h1 { margin: 2px 0; color: #1e2c43; font-size: clamp(1.4rem, 3vw, 1.8rem); }
.activity-hero p { margin: 0; color: #75839a; }
.activity-filter-card, .activity-records { border: 1px solid #e3ebf7; background: #fff; }
.class-filter { padding: 18px; }
.section-heading { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 20px 22px; border-bottom: 1px solid #edf2f8; }
.section-heading h2 { margin: 0; color: #25354d; font-size: 1.1rem; }
.section-heading p { margin: 4px 0 0; color: #75839a; font-size: .85rem; }
.student-heading { align-items: flex-start; }
.heading-title { display: flex; align-items: center; gap: 12px; min-width: 0; }
.activity-search { max-width: 320px; }
.assignment-list, .student-list { padding: 0 22px; }
.assignment-row { display: flex; width: 100%; align-items: center; gap: 14px; padding: 15px 4px; border: 0; border-bottom: 1px solid #edf2f8; background: #fff; color: inherit; text-align: left; cursor: pointer; }
.assignment-row:last-child { border-bottom: 0; }
.assignment-row:hover { background: #f8fbff; }
.assignment-icon, .student-avatar { display: grid; width: 40px; height: 40px; flex: none; place-items: center; border-radius: 12px; background: #edf4ff; color: #347cf5; }
.assignment-copy, .student-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 4px; }
.assignment-copy strong, .student-copy strong { overflow: hidden; color: #26364e; text-overflow: ellipsis; white-space: nowrap; }
.assignment-copy small, .student-copy small { overflow: hidden; color: #7b899e; font-size: .78rem; text-overflow: ellipsis; white-space: nowrap; }
.assignment-submissions { display: flex; min-width: 60px; flex-direction: column; align-items: center; color: #347cf5; }
.assignment-submissions small { color: #7b899e; font-size: .72rem; }
.student-row { padding: 14px 4px; border-bottom: 1px solid #edf2f8; }
.student-row:last-child { border-bottom: 0; }
.student-row-main { display: flex; align-items: center; gap: 12px; min-width: 0; }
.student-copy { margin-right: auto; }
.student-attempts { display: grid; gap: 12px; margin: 14px 0 0 52px; }
.student-attempt { padding: 12px 14px; border: 1px solid #e8eef7; border-radius: 12px; background: #f9fbfe; }
.attempt-heading { display: flex; align-items: center; flex-wrap: wrap; gap: 9px; color: #53637a; font-size: .8rem; }
.attempt-heading strong { color: #2c3d55; }
.activity-timeline { display: grid; gap: 8px; margin-top: 12px; padding-top: 10px; border-top: 1px solid #e8eef7; }
.activity-timeline-item { display: grid; grid-template-columns: 8px minmax(0, 1fr) auto; align-items: center; gap: 9px; color: #53637a; font-size: .78rem; }
.activity-timeline-item time { color: #8995a6; font-variant-numeric: tabular-nums; white-space: nowrap; }
.activity-dot { width: 8px; height: 8px; border-radius: 50%; background: #347cf5; }
.activity-dot--warning { background: #e3a12b; }
.activity-dot--success { background: #25a773; }
.activity-state { display: flex; min-height: 220px; flex-direction: column; align-items: center; justify-content: center; gap: 8px; text-align: center; }
@media (max-width: 700px) {
  .section-heading { align-items: stretch; flex-direction: column; }
  .activity-search { max-width: none; }
  .student-row-main { align-items: flex-start; flex-wrap: wrap; }
  .student-copy { min-width: calc(100% - 55px); }
  .student-attempts { margin-left: 0; }
  .activity-timeline-item { grid-template-columns: 8px minmax(0, 1fr); }
  .activity-timeline-item time { grid-column: 2; }
}
</style>
