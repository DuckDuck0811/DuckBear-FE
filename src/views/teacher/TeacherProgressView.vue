<template>
  <v-layout class="progress-page min-vh-100">
    <AppHeader />
    <TeacherSidebar />
    <v-main>
      <v-container class="progress-container py-7 px-4 px-md-8">
        <header class="progress-hero mb-6">
          <div class="progress-hero-icon"><v-icon icon="mdi-chart-box-outline" size="28" /></div>
          <div class="flex-grow-1">
            <div class="progress-eyebrow">{{ t('teacherProgress.eyebrow') }}</div>
            <h1>{{ t('teacherProgress.title') }}</h1>
            <p>{{ t('teacherProgress.subtitle') }}</p>
          </div>
          <v-select v-model="selectedClassId" :items="classOptions" item-title="title" item-value="value" :label="t('teacherProgress.selectClass')" variant="outlined" density="compact" hide-details class="class-select" />
        </header>

        <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>
        <div v-if="loading" class="progress-state"><v-progress-circular indeterminate color="primary" /></div>
        <template v-else-if="selectedClass">
          <div class="summary-grid mb-6">
            <v-card v-for="metric in metrics" :key="metric.label" class="summary-card pa-4" rounded="xl" variant="flat">
              <div class="metric-icon"><v-icon :icon="metric.icon" /></div><small>{{ t(metric.label) }}</small><strong>{{ metric.value }}</strong>
            </v-card>
          </div>

          <v-card class="report-card mb-6" rounded="xl" variant="flat">
            <div class="report-heading"><div><h2>{{ t('teacherProgress.students') }}</h2><p>{{ t('teacherProgress.studentsHint') }}</p></div><v-text-field v-model="search" :placeholder="t('teacherProgress.search')" prepend-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details clearable class="search-field" /></div>
            <v-table class="student-table">
              <thead><tr><th>{{ t('teacherProgress.student') }}</th><th>{{ t('teacherProgress.submitted') }}</th><th>{{ t('teacherProgress.graded') }}</th><th>{{ t('teacherProgress.quizAverage') }}</th><th>{{ t('teacherProgress.manualAverage') }}</th></tr></thead>
              <tbody><tr v-for="student in pagedStudents" :key="student.id"><td><strong>{{ student.fullName }}</strong><small>{{ student.email }}</small></td><td>{{ student.submittedCount }} / {{ selectedClass.assignmentCount }}</td><td>{{ student.gradedCount }}</td><td>{{ formatScore(student.quizAverage) }}</td><td>{{ formatScore(student.manualAverage) }}</td></tr>
                <tr v-if="!filteredStudents.length"><td colspan="5" class="empty-row">{{ t('teacherProgress.noStudents') }}</td></tr>
              </tbody>
            </v-table>
            <ListPagination v-model="studentsPage" :total="filteredStudents.length" :page-size="pageSize" />
          </v-card>

          <v-card class="report-card" rounded="xl" variant="flat">
            <div class="report-heading"><div><h2>{{ t('teacherProgress.assignments') }}</h2><p>{{ t('teacherProgress.assignmentsHint') }}</p></div></div>
            <div v-if="selectedClass.assignments.length" class="assignment-list"><div v-for="assignment in pagedAssignments" :key="`${assignment.type}-${assignment.id}`" class="assignment-row"><div class="assignment-symbol"><v-icon :icon="assignment.type === 'quiz' ? 'mdi-clipboard-text-outline' : 'mdi-cloud-upload-outline'" /></div><div class="assignment-copy"><strong>{{ assignment.title }}</strong><small>{{ assignment.type === 'quiz' ? t('teacherProgress.online') : t('teacherProgress.manual') }}<template v-if="assignment.deadline"> · {{ t('teacherProgress.deadline', { date: formatDate(assignment.deadline) }) }}</template></small></div><v-chip size="small" color="primary" variant="tonal">{{ t('teacherProgress.submittedOf', { submitted: assignment.submittedCount, total: selectedClass.studentCount }) }}</v-chip><v-chip size="small" color="success" variant="tonal">{{ t('teacherProgress.gradedOf', { graded: assignment.gradedCount }) }}</v-chip></div></div>
            <div v-else class="empty-row">{{ t('teacherProgress.noAssignments') }}</div>
            <ListPagination v-model="assignmentsPage" :total="selectedClass.assignments.length" :page-size="pageSize" />
          </v-card>
        </template>
        <v-card v-else-if="!error" class="report-card empty-state pa-8" rounded="xl" variant="flat"><v-icon icon="mdi-google-classroom" size="42" /><strong>{{ t('teacherProgress.noClasses') }}</strong><span>{{ t('teacherProgress.noClassesHint') }}</span></v-card>
      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../../services/api'
import AppHeader from '../../components/shared/AppHeader.vue'
import TeacherSidebar from '../../components/shared/TeacherSidebar.vue'
import ListPagination from '../../components/shared/ListPagination.vue'

const { t } = useI18n()
const classes = ref([])
const selectedClassId = ref(null)
const loading = ref(false)
const error = ref('')
const search = ref('')
const studentsPage = ref(1)
const assignmentsPage = ref(1)
const pageSize = 10
const selectedClass = computed(() => classes.value.find((item) => item.id === selectedClassId.value))
const classOptions = computed(() => classes.value.map((item) => ({ title: `${item.name} · ${t('teacherProgress.grade', { grade: item.gradeLevel })}`, value: item.id })))
const filteredStudents = computed(() => {
  const query = search.value.trim().toLocaleLowerCase()
  return (selectedClass.value?.students || []).filter((student) => !query || `${student.fullName} ${student.email}`.toLocaleLowerCase().includes(query))
})
const pagedStudents = computed(() => filteredStudents.value.slice((studentsPage.value - 1) * pageSize, studentsPage.value * pageSize))
const pagedAssignments = computed(() => (selectedClass.value?.assignments || []).slice((assignmentsPage.value - 1) * pageSize, assignmentsPage.value * pageSize))
const metrics = computed(() => {
  const item = selectedClass.value
  return item ? [
    { label: 'teacherProgress.studentCount', icon: 'mdi-account-group-outline', value: item.studentCount },
    { label: 'teacherProgress.assignmentCount', icon: 'mdi-clipboard-text-outline', value: item.assignmentCount },
    { label: 'teacherProgress.completion', icon: 'mdi-check-circle-outline', value: `${item.completionRate}%` },
    { label: 'teacherProgress.gradedTotal', icon: 'mdi-marker-check', value: item.gradedCount },
  ] : []
})
watch(classes, (items) => { if (!items.some((item) => item.id === selectedClassId.value)) selectedClassId.value = items[0]?.id ?? null })
watch(selectedClassId, () => { studentsPage.value = 1; assignmentsPage.value = 1 })
watch(search, () => { studentsPage.value = 1 })
watch(() => filteredStudents.value.length, (count) => { if (studentsPage.value > Math.max(1, Math.ceil(count / pageSize))) studentsPage.value = Math.max(1, Math.ceil(count / pageSize)) })
watch(() => selectedClass.value?.assignments.length, (count = 0) => { if (assignmentsPage.value > Math.max(1, Math.ceil(count / pageSize))) assignmentsPage.value = Math.max(1, Math.ceil(count / pageSize)) })
onMounted(loadProgress)
async function loadProgress() {
  loading.value = true; error.value = ''
  try { classes.value = await api('/teacher/overview/progress') }
  catch (cause) { error.value = cause?.message || t('teacherProgress.loadError') }
  finally { loading.value = false }
}
function formatScore(value) { return value === null || value === undefined ? '—' : Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 }) }
function formatDate(value) { return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)) }
</script>

<style scoped>
.progress-page { background: #f4f8ff; }.progress-container { max-width: 1240px; }.progress-hero { display:flex; align-items:center; gap:16px; padding:22px 24px; border:1px solid #e2ebf8; border-radius:20px; background:linear-gradient(120deg,#fff,#eff6ff); }.progress-hero-icon,.metric-icon,.assignment-symbol { display:grid; flex:none; place-items:center; border-radius:14px; background:#e5efff; color:#347cf5; }.progress-hero-icon { width:52px;height:52px; }.progress-eyebrow { color:#347cf5;font-size:.72rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase; }.progress-hero h1 { margin:2px 0;color:#1e2c43;font-size:clamp(1.4rem,3vw,1.8rem); }.progress-hero p,.report-heading p { margin:0;color:#75839a; }.class-select { max-width:260px; }.summary-grid { display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px; }.summary-card { display:grid;grid-template-columns:42px 1fr;column-gap:12px;align-items:center;border:1px solid #e3ebf7;background:#fff; }.metric-icon { grid-row:span 2;width:42px;height:42px; }.summary-card small { color:#75839a; }.summary-card strong { color:#26364e;font-size:1.35rem; }.report-card { overflow:hidden;border:1px solid #e3ebf7;background:#fff; }.report-heading { display:flex;align-items:center;justify-content:space-between;gap:18px;padding:20px 22px;border-bottom:1px solid #edf2f8; }.report-heading h2 { margin:0;color:#25354d;font-size:1.08rem; }.report-heading p { margin-top:4px;font-size:.85rem; }.search-field { max-width:300px; }.student-table th { color:#75839a!important;font-size:.72rem!important;text-transform:uppercase; }.student-table td:first-child { min-width:220px; }.student-table td strong,.student-table td small { display:block; }.student-table td small { color:#75839a;font-size:.78rem; }.assignment-list { padding:0 22px; }.assignment-row { display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid #edf2f8; }.assignment-row:last-child { border-bottom:0; }.assignment-symbol { width:40px;height:40px; }.assignment-copy { display:flex;flex:1;min-width:120px;flex-direction:column;gap:3px; }.assignment-copy small { color:#75839a;font-size:.78rem; }.empty-row,.empty-state,.progress-state { min-height:160px;text-align:center;color:#75839a; }.empty-row { padding:32px;text-align:center; }.empty-state,.progress-state { display:flex;align-items:center;justify-content:center;gap:10px;flex-direction:column; }.empty-state strong { color:#26364e; }.progress-state { min-height:280px; }
@media(max-width:850px){.summary-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.progress-hero{flex-wrap:wrap;}.class-select{max-width:none;width:100%;}.report-heading{align-items:stretch;flex-direction:column;}.search-field{max-width:none;}.assignment-row{flex-wrap:wrap;}.assignment-copy{min-width:calc(100% - 60px);}.assignment-row .v-chip{margin-left:50px;}}
</style>
