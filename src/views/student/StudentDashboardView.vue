<template>
  <StudentDashboardLayout :grade-style="gradeStyle">
    <v-container class="py-8 px-4 px-md-8" style="max-width: 1240px">
      <StudentWelcomeCard
        :name="firstName"
        :grade-style="gradeStyle"
        :grade-style-label="gradeStyleLabel"
      />
      <StudentDashboardPanels
        :classes="dashboard.classes"
        :pending-requests="dashboard.pendingRequests"
        :is-loading="dashboard.isLoading"
        :error-message="displayError"
        @retry="dashboard.load"
      />
    </v-container>
  </StudentDashboardLayout>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../../stores/auth'
import { useStudentDashboardStore } from '../../stores/studentDashboard'
import StudentDashboardLayout from '../../layouts/StudentDashboardLayout.vue'
import StudentWelcomeCard from '../../components/student/StudentWelcomeCard.vue'
import StudentDashboardPanels from '../../components/student/StudentDashboardPanels.vue'

const { t } = useI18n()
const authStore = useAuthStore()
const dashboard = useStudentDashboardStore()

const firstName = computed(() => {
  const name = authStore.user?.fullName?.trim()
  return name?.split(/\s+/).at(-1) || t('studentDashboard.studentFallback')
})

const gradeStyle = computed(() => {
  const bands = new Set(dashboard.classes.map(({ gradeLevel }) => {
    if (gradeLevel >= 1 && gradeLevel <= 5) return 'primary'
    if (gradeLevel >= 6 && gradeLevel <= 9) return 'middle'
    if (gradeLevel >= 10 && gradeLevel <= 12) return 'high'
    return 'neutral'
  }))
  return bands.size === 1 ? [...bands][0] : 'neutral'
})

const gradeStyleLabel = computed(() => t(`studentDashboard.gradeStyles.${gradeStyle.value}`))
const displayError = computed(() => dashboard.hasError
  ? dashboard.errorMessage || t('studentDashboard.loadError')
  : '')

onMounted(dashboard.load)
</script>
