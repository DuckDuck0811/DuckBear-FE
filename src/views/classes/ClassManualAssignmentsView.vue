<template>
  <v-layout class="manual-class-page min-vh-100">
    <AppHeader />
    <TeacherSidebar />
    <StudentSidebar />
    <v-main>
      <v-container class="manual-class-container py-7 px-4 px-md-8">
        <template v-if="!route.params.id">
          <header class="manual-class-hero mb-5">
            <div class="manual-class-icon"><v-icon icon="mdi-google-classroom" size="28" /></div>
            <div class="min-width-0 flex-grow-1">
              <div class="manual-class-eyebrow">{{ t('classManualAssignments.eyebrow') }}</div>
              <h1>{{ t('classManualAssignments.title') }}</h1>
              <p>{{ t('classManualAssignments.subtitle') }}</p>
            </div>
          </header>
          <v-alert v-if="pageError" type="error" variant="tonal" class="mb-4">{{ pageError }}</v-alert>
          <v-card class="manual-list-card" rounded="xl" variant="flat">
            <div class="manual-list-toolbar">
              <div>
                <h2>{{ t('classManualAssignments.chooseClass') }}</h2>
                <p>{{ t('classManualAssignments.classCount', { count: availableClasses.length }) }}</p>
              </div>
            </div>
            <div v-if="loading" class="manual-state"><v-progress-circular indeterminate color="primary" /></div>
            <div v-else-if="!availableClasses.length" class="manual-state text-secondary">
              <v-icon icon="mdi-google-classroom" size="42" />
              <strong>{{ t('classManualAssignments.noClasses') }}</strong>
            </div>
            <v-list v-else lines="two" class="py-0">
              <v-list-item v-for="schoolClass in availableClasses" :key="schoolClass.id" :title="schoolClass.name" :subtitle="t('classManualAssignments.classMeta', { grade: schoolClass.gradeLevel, year: schoolClass.schoolYear })" prepend-icon="mdi-account-group-outline" append-icon="mdi-chevron-right" @click="openClass(schoolClass)">
                <template #prepend><span class="manual-assignment-icon mr-3"><v-icon icon="mdi-google-classroom" /></span></template>
              </v-list-item>
            </v-list>
          </v-card>
        </template>
        <template v-else>
        <v-btn to="/classes" variant="text" color="primary" prepend-icon="mdi-arrow-left" class="mb-4">{{ t('classManualAssignments.backToClasses') }}</v-btn>

        <header v-if="classInfo" class="manual-class-hero mb-5">
          <div class="manual-class-icon"><v-icon icon="mdi-google-classroom" size="28" /></div>
          <div class="min-width-0 flex-grow-1">
            <div class="manual-class-eyebrow">{{ t('classManualAssignments.eyebrow') }}</div>
            <h1>{{ classInfo.name }} · {{ t('classManualAssignments.title') }}</h1>
            <p>{{ t('classManualAssignments.subtitle') }}</p>
          </div>
          <v-btn v-if="isTeacher" color="primary" rounded="pill" prepend-icon="mdi-plus" @click="openCreateDialog">{{ t('classManualAssignments.create') }}</v-btn>
        </header>

        <v-alert v-if="pageError" type="error" variant="tonal" class="mb-4">{{ pageError }}</v-alert>
        <v-card class="manual-list-card" rounded="xl" variant="flat">
          <div class="manual-list-toolbar">
            <div>
              <h2>{{ isTeacher ? t('classManualAssignments.teacherListTitle') : t('classManualAssignments.studentListTitle') }}</h2>
              <p>{{ t('classManualAssignments.assignmentCount', { count: filteredAssignments.length }) }}</p>
            </div>
            <v-text-field v-model="search" :placeholder="t('classManualAssignments.search')" prepend-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details clearable class="manual-search" />
          </div>

          <div v-if="loading" class="manual-state"><v-progress-circular indeterminate color="primary" /></div>
          <div v-else-if="!filteredAssignments.length" class="manual-state text-secondary">
            <v-icon icon="mdi-text-box-plus-outline" size="42" />
            <strong>{{ search ? t('classManualAssignments.noMatch') : isTeacher ? t('classManualAssignments.noTeacherAssignments') : t('classManualAssignments.noStudentAssignments') }}</strong>
          </div>
          <v-expansion-panels v-else v-model="expandedAssignmentIds" multiple variant="accordion" class="manual-panels">
            <v-expansion-panel v-for="assignment in pagedAssignments" :key="assignment.id" :value="assignment.id">
              <v-expansion-panel-title @click="loadAssignmentDetail(assignment.id)">
                <div class="manual-assignment-heading">
                  <span class="manual-assignment-icon"><v-icon icon="mdi-clipboard-text-outline" /></span>
                  <span class="manual-assignment-copy">
                    <strong>{{ assignment.title }}</strong>
                    <small>{{ t('classManualAssignments.due') }}: {{ assignment.deadline ? formatDate(assignment.deadline) : t('classManualAssignments.noDeadline') }}</small>
                  </span>
                  <v-chip v-if="isTeacher" color="primary" variant="tonal" size="small">{{ t('classManualAssignments.submissionCount', { count: assignment._count?.submissions || 0 }) }}</v-chip>
                  <v-chip v-else-if="assignment.submissions?.[0]?.score !== null && assignment.submissions?.[0]?.score !== undefined" color="success" variant="tonal" size="small">{{ t('classManualAssignments.score', { score: assignment.submissions[0].score }) }}</v-chip>
                  <v-chip v-else-if="assignment.submissions?.length" color="info" variant="tonal" size="small">{{ t('classManualAssignments.submitted') }}</v-chip>
                  <v-chip v-else color="warning" variant="tonal" size="small">{{ t('classManualAssignments.notSubmitted') }}</v-chip>
                  <v-btn v-if="isTeacher" icon="mdi-pencil-outline" variant="text" color="primary" size="small" :aria-label="t('classManualAssignments.edit')" @click.stop="openEditDialog(assignment)" />
                  <v-btn v-if="isTeacher" icon="mdi-delete-outline" variant="text" color="error" size="small" :aria-label="t('classManualAssignments.delete')" @click.stop="confirmDelete(assignment)" />
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <div v-if="detailLoading[assignment.id]" class="py-5 text-center"><v-progress-circular indeterminate color="primary" size="28" /></div>
                <v-alert v-else-if="detailErrors[assignment.id]" type="error" variant="tonal">{{ detailErrors[assignment.id] }}</v-alert>
                <div v-else-if="assignmentDetails[assignment.id]">
                  <div class="assignment-instructions">
                    <strong>{{ t('classManualAssignments.instructions') }}</strong>
                    <p>{{ assignmentDetails[assignment.id].instructions || t('classManualAssignments.noInstructions') }}</p>
                  </div>
                  <div v-if="assignmentDetails[assignment.id].attachments?.length" class="assignment-attachments mb-4">
                    <strong>{{ t('classManualAssignments.teacherAttachments') }}</strong>
                    <div class="submission-files mt-2">
                      <v-btn v-for="file in assignmentDetails[assignment.id].attachments" :key="file.id" :href="file.fileData" :download="file.fileName" target="_blank" rel="noopener" variant="tonal" color="primary" size="small" prepend-icon="mdi-paperclip">
                        {{ file.fileName }}
                      </v-btn>
                    </div>
                  </div>

                  <template v-if="isTeacher">
                    <div v-if="!assignmentDetails[assignment.id].submissions.length" class="empty-submissions">{{ t('classManualAssignments.noSubmissions') }}</div>
                    <article v-for="submission in assignmentDetails[assignment.id].submissions" :key="submission.id" class="manual-submission-card">
                      <div class="submission-heading">
                        <div>
                          <strong>{{ submission.student.fullName }}</strong>
                          <small>{{ submission.student.email }} · {{ t('classManualAssignments.submittedAt') }} {{ formatDate(submission.submittedAt) }}</small>
                        </div>
                        <v-chip v-if="submission.score !== null" color="success" variant="tonal" size="small">{{ t('classManualAssignments.score', { score: submission.score }) }}</v-chip>
                        <v-chip v-else color="warning" variant="tonal" size="small">{{ t('classManualAssignments.needsGrading') }}</v-chip>
                      </div>
                      <p v-if="submission.content" class="submission-content">{{ submission.content }}</p>
                      <div v-if="submission.attachments.length" class="submission-files">
                        <v-btn v-for="file in submission.attachments" :key="file.id" :href="file.fileData" :download="file.fileName" target="_blank" rel="noopener" variant="tonal" color="primary" size="small" prepend-icon="mdi-paperclip">
                          {{ file.fileName }}
                        </v-btn>
                      </div>
                      <div class="manual-grade-form">
                        <template v-if="!hasGrade(submission)">
                          <v-text-field v-model.number="submission.score" type="number" min="0" max="10" step="0.1" :label="t('classManualAssignments.scoreOutOf10')" variant="outlined" density="compact" hide-details />
                          <v-textarea v-model="submission.teacherFeedback" :label="t('classManualAssignments.feedback')" variant="outlined" density="compact" rows="2" auto-grow hide-details />
                        </template>
                        <v-alert v-else type="success" variant="tonal" density="compact" class="grade-locked">
                          {{ t('classManualAssignments.gradeLocked') }}<span v-if="submission.teacherFeedback"> · {{ submission.teacherFeedback }}</span>
                        </v-alert>
                      </div>
                      <v-alert v-if="gradeErrors[submission.id]" type="error" variant="tonal" density="compact" class="mt-3">{{ gradeErrors[submission.id] }}</v-alert>
                      <div class="d-flex justify-end mt-3">
                        <v-btn v-if="!hasGrade(submission)" color="primary" rounded="pill" size="small" prepend-icon="mdi-check-decagram-outline" :loading="gradingId === submission.id" :disabled="!canGrade(submission)" @click="gradeSubmission(submission)">{{ t('classManualAssignments.returnGrade') }}</v-btn>
                      </div>
                    </article>
                  </template>

                  <template v-else>
                    <v-alert v-if="assignmentDetails[assignment.id].submissions[0]?.score !== null && assignmentDetails[assignment.id].submissions[0]?.score !== undefined" type="success" variant="tonal" class="mb-4">
                      <strong>{{ t('classManualAssignments.score', { score: assignmentDetails[assignment.id].submissions[0].score }) }}</strong>
                      <div v-if="assignmentDetails[assignment.id].submissions[0].teacherFeedback" class="mt-1">{{ assignmentDetails[assignment.id].submissions[0].teacherFeedback }}</div>
                    </v-alert>
                    <div v-if="assignmentDetails[assignment.id].submissions[0]" class="student-previous-submission mb-4">
                      <strong>{{ t('classManualAssignments.yourPreviousSubmission') }}</strong>
                      <p v-if="assignmentDetails[assignment.id].submissions[0].content">{{ assignmentDetails[assignment.id].submissions[0].content }}</p>
                      <div class="submission-files">
                        <v-btn v-for="file in assignmentDetails[assignment.id].submissions[0].attachments" :key="file.id" :href="file.fileData" :download="file.fileName" target="_blank" rel="noopener" variant="tonal" color="primary" size="small" prepend-icon="mdi-paperclip">{{ file.fileName }}</v-btn>
                      </div>
                    </div>
                    <v-alert v-if="assignmentDetails[assignment.id].submissions[0]" type="success" variant="tonal" class="mb-4">
                      {{ t('classManualAssignments.submittedAt') }} {{ formatDate(assignmentDetails[assignment.id].submissions[0].submittedAt) }} · {{ t('classManualAssignments.oneSubmissionOnly') }}
                    </v-alert>
                    <template v-else>
                      <v-textarea v-model="studentDrafts[assignment.id].content" :label="t('classManualAssignments.writeWork')" variant="outlined" rows="4" auto-grow />
                      <v-file-input :label="t('classManualAssignments.attachFiles')" accept="image/png,image/jpeg,image/webp,application/pdf" multiple prepend-icon="mdi-paperclip" variant="outlined" density="compact" hide-details @update:model-value="files => addStudentFiles(assignment.id, files)" />
                      <div v-if="studentDrafts[assignment.id]?.attachments.length" class="submission-files mt-3">
                        <v-chip v-for="(file, index) in studentDrafts[assignment.id].attachments" :key="`${file.fileName}-${index}`" closable size="small" @click:close="removeStudentFile(assignment.id, index)">{{ file.fileName }}</v-chip>
                      </div>
                      <v-alert v-if="submitErrors[assignment.id]" type="error" variant="tonal" density="compact" class="mt-3">{{ submitErrors[assignment.id] }}</v-alert>
                      <div class="d-flex justify-end mt-4">
                        <v-btn color="primary" rounded="pill" prepend-icon="mdi-send" :loading="submittingId === assignment.id" :disabled="isExpired(assignment)" @click="submitWork(assignment)">
                          {{ t('classManualAssignments.submit') }}
                        </v-btn>
                      </div>
                    </template>
                  </template>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
          <ListPagination v-model="page" :total="filteredAssignments.length" />
        </v-card>
        </template>
      </v-container>
    </v-main>

    <v-dialog v-if="route.params.id" v-model="createDialog" max-width="680">
      <v-card rounded="xl">
        <v-card-title class="pa-5 font-weight-black">{{ t(editingAssignment ? 'classManualAssignments.editTitle' : 'classManualAssignments.createTitle') }}</v-card-title>
        <v-card-text class="px-5">
          <v-alert v-if="createError" type="error" variant="tonal" class="mb-4">{{ createError }}</v-alert>
          <v-text-field v-model="createForm.title" :label="t('classManualAssignments.assignmentName')" variant="outlined" maxlength="150" />
          <v-textarea v-model="createForm.instructions" :label="t('classManualAssignments.instructions')" variant="outlined" rows="4" auto-grow maxlength="5000" />
          <v-text-field v-model="createForm.deadline" type="datetime-local" :label="t('classManualAssignments.deadlineOptional')" variant="outlined" />
          <v-file-input
            :label="t('classManualAssignments.teacherAttachments')"
            :hint="t('classManualAssignments.teacherAttachmentHint')"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            multiple
            prepend-icon="mdi-paperclip"
            variant="outlined"
            persistent-hint
            @update:model-value="addAssignmentFiles"
          />
          <div v-if="createForm.attachments.length" class="submission-files mt-2">
            <v-chip
              v-for="(file, index) in createForm.attachments"
              :key="`${file.fileName}-${index}`"
              closable
              size="small"
              @click:close="createForm.attachments.splice(index, 1)"
            >{{ file.fileName }}</v-chip>
          </div>
        </v-card-text>
        <v-card-actions class="px-5 pb-5">
          <v-spacer />
          <v-btn variant="text" @click="createDialog = false">{{ t('classManualAssignments.cancel') }}</v-btn>
          <v-btn color="primary" rounded="pill" :prepend-icon="editingAssignment ? 'mdi-content-save-outline' : 'mdi-plus'" :loading="creating" :disabled="!createForm.title.trim()" @click="saveAssignment">{{ t(editingAssignment ? 'classManualAssignments.save' : 'classManualAssignments.create') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="deleteDialog" max-width="460">
      <v-card rounded="xl">
        <v-card-title class="pa-5 font-weight-black">{{ t('classManualAssignments.deleteTitle') }}</v-card-title>
        <v-card-text>{{ t('classManualAssignments.deleteConfirm', { title: assignmentToDelete?.title || '' }) }}</v-card-text>
        <v-card-actions class="px-5 pb-5">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">{{ t('classManualAssignments.cancel') }}</v-btn>
          <v-btn color="error" rounded="pill" prepend-icon="mdi-delete-outline" :loading="deleting" @click="deleteAssignment">{{ t('classManualAssignments.delete') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar v-model="toast.show" :color="toast.color" timeout="3500" location="top end" class="manual-toast">
      <div class="manual-toast-content">
        <v-icon :icon="toast.color === 'error' ? 'mdi-alert-circle' : 'mdi-check-circle'" size="30" />
        <div class="manual-toast-copy">
          <strong>{{ t('classManualAssignments.successTitle') }}</strong>
          <span>{{ toast.message }}</span>
        </div>
      </div>
      <template #actions>
        <v-btn icon="mdi-close" variant="text" aria-label="Close notification" @click="toast.show = false" />
      </template>
    </v-snackbar>
  </v-layout>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import AppHeader from '../../components/shared/AppHeader.vue'
import TeacherSidebar from '../../components/shared/TeacherSidebar.vue'
import StudentSidebar from '../../components/shared/StudentSidebar.vue'
import ListPagination from '../../components/shared/ListPagination.vue'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const auth = useAuthStore()
const isTeacher = computed(() => ['TEACHER', 'ADMIN'].includes(auth.user?.role))
const classInfo = ref(null)
const availableClasses = ref([])
const assignments = ref([])
const loading = ref(false)
const pageError = ref('')
const toast = reactive({ show: false, message: '', color: 'success' })
const search = ref('')
const page = ref(1)
const pageSize = 20
const expandedAssignmentIds = ref([])
const assignmentDetails = ref({})
const detailLoading = ref({})
const detailErrors = ref({})
const studentDrafts = ref({})
const submitErrors = ref({})
const gradeErrors = ref({})
const submittingId = ref(null)
const gradingId = ref(null)
const createDialog = ref(false)
const creating = ref(false)
const createError = ref('')
const editingAssignment = ref(null)
const originalDeadlineInput = ref('')
const deleteDialog = ref(false)
const deleting = ref(false)
const assignmentToDelete = ref(null)
const maxAttachmentBytes = 5 * 1024 * 1024
const createForm = reactive({ title: '', instructions: '', deadline: '', attachments: [] })

const filteredAssignments = computed(() => {
  const query = search.value.trim().toLocaleLowerCase()
  return query ? assignments.value.filter((item) => item.title.toLocaleLowerCase().includes(query)) : assignments.value
})
const pagedAssignments = computed(() => filteredAssignments.value.slice((page.value - 1) * pageSize, page.value * pageSize))

watch(search, () => { page.value = 1 })
watch(() => Math.ceil(filteredAssignments.value.length / pageSize), (count) => { if (page.value > count) page.value = Math.max(1, count) })
watch(expandedAssignmentIds, (ids) => { ids.forEach((id) => { void loadAssignmentDetail(id) }) })
watch(() => route.params.id, (id) => id ? loadPage() : loadTeacherClasses(), { immediate: true })

async function loadTeacherClasses() {
  loading.value = true
  pageError.value = ''
  try {
    const result = await api('/classes/mine')
    availableClasses.value = result.classes || []
  } catch (error) {
    pageError.value = error.message || t('classManualAssignments.loadError')
  } finally {
    loading.value = false
  }
}

function openClass(schoolClass) {
  return router.push({ name: 'class-manual-assignments', params: { id: schoolClass.id } })
}

async function loadPage() {
  loading.value = true
  pageError.value = ''
  try {
    const result = await api(`/classes/${route.params.id}/manual-assignments`)
    classInfo.value = result.class
    assignments.value = result.assignments || []
    const selectedAssignmentId = Number(route.query.assignment)
    if (selectedAssignmentId && assignments.value.some((assignment) => assignment.id === selectedAssignmentId)) {
      expandedAssignmentIds.value = [selectedAssignmentId]
    }
  } catch (error) {
    pageError.value = error.message || t('classManualAssignments.loadError')
  } finally {
    loading.value = false
  }
}

async function loadAssignmentDetail(assignmentId) {
  if (assignmentDetails.value[assignmentId] || detailLoading.value[assignmentId]) return
  detailLoading.value[assignmentId] = true
  detailErrors.value[assignmentId] = ''
  try {
    const detail = await api(`/classes/manual-assignments/${assignmentId}`)
    assignmentDetails.value[assignmentId] = detail
    if (!isTeacher.value) {
      const existing = detail.submissions?.[0]
      studentDrafts.value[assignmentId] ||= {
        content: existing?.content || '',
        attachments: (existing?.attachments || []).map(({ fileName, mimeType, fileData }) => ({ fileName, mimeType, fileData })),
      }
    }
  } catch (error) {
    detailErrors.value[assignmentId] = error.message || t('classManualAssignments.loadError')
  } finally {
    detailLoading.value[assignmentId] = false
  }
}

function openCreateDialog() {
  editingAssignment.value = null
  originalDeadlineInput.value = ''
  createForm.title = ''
  createForm.instructions = ''
  createForm.deadline = ''
  createForm.attachments = []
  createError.value = ''
  createDialog.value = true
}

async function openEditDialog(assignment) {
  let details = assignmentDetails.value[assignment.id]
  if (!details) {
    try {
      details = await api(`/classes/manual-assignments/${assignment.id}`)
      assignmentDetails.value[assignment.id] = details
    } catch (error) {
      showToast(error.message || t('classManualAssignments.loadError'), 'error')
      return
    }
  }
  editingAssignment.value = assignment
  createForm.title = assignment.title
  createForm.instructions = assignment.instructions || ''
  createForm.deadline = assignment.deadline ? toDatetimeLocal(assignment.deadline) : ''
  createForm.attachments = (details.attachments || []).map(({ fileName, mimeType, fileData }) => ({ fileName, mimeType, fileData }))
  originalDeadlineInput.value = createForm.deadline
  createError.value = ''
  createDialog.value = true
}

async function saveAssignment() {
  if (!createForm.title.trim() || creating.value) return
  creating.value = true
  createError.value = ''
  try {
    const body = {
      title: createForm.title.trim(),
      instructions: createForm.instructions.trim() || null,
      attachments: createForm.attachments,
    }
    if (editingAssignment.value) {
      if (createForm.deadline !== originalDeadlineInput.value) {
        body.deadline = createForm.deadline ? new Date(createForm.deadline).toISOString() : null
      }
      const updated = await api(`/classes/manual-assignments/${editingAssignment.value.id}`, { method: 'PATCH', body })
      const index = assignments.value.findIndex((item) => item.id === updated.id)
      if (index >= 0) assignments.value[index] = { ...assignments.value[index], ...updated }
      if (assignmentDetails.value[updated.id]) Object.assign(assignmentDetails.value[updated.id], updated)
      showToast(t('classManualAssignments.updated'))
    } else {
      const assignment = await api(`/classes/${route.params.id}/manual-assignments`, {
        method: 'POST',
        body: {
          ...body,
          instructions: createForm.instructions.trim() || undefined,
          attachments: createForm.attachments,
          deadline: createForm.deadline ? new Date(createForm.deadline).toISOString() : undefined,
        },
      })
      assignments.value.unshift({ ...assignment, _count: { submissions: 0 } })
      showToast(t('classManualAssignments.created'))
    }
    createForm.title = ''
    createForm.instructions = ''
    createForm.deadline = ''
    createForm.attachments = []
    editingAssignment.value = null
    originalDeadlineInput.value = ''
    createDialog.value = false
  } catch (error) {
    createError.value = error.message || t(editingAssignment.value ? 'classManualAssignments.updateError' : 'classManualAssignments.createError')
  } finally {
    creating.value = false
  }
}

async function addAssignmentFiles(selection) {
  const selectedFiles = (Array.isArray(selection) ? selection : selection ? [selection] : []).filter(Boolean)
  const current = createForm.attachments || []
  if (current.length + selectedFiles.length > 5) {
    createError.value = t('classManualAssignments.fileSizeError')
    return
  }
  let totalBytes = current.reduce((sum, file) => sum + estimatedDataUrlBytes(file.fileData), 0)
  const additions = []
  try {
    for (const file of selectedFiles) {
      if (!['image/png', 'image/jpeg', 'image/webp', 'application/pdf'].includes(file.type)) {
        createError.value = t('classManualAssignments.fileTypeError')
        return
      }
      totalBytes += file.size
      if (totalBytes > maxAttachmentBytes) {
        createError.value = t('classManualAssignments.fileSizeError')
        return
      }
      additions.push(await readFile(file))
    }
    createForm.attachments.push(...additions)
    createError.value = ''
  } catch (error) {
    createError.value = error.message || t('classManualAssignments.fileReadError')
  }
}

function confirmDelete(assignment) {
  assignmentToDelete.value = assignment
  deleteDialog.value = true
}

async function deleteAssignment() {
  if (!assignmentToDelete.value || deleting.value) return
  deleting.value = true
  try {
    await api(`/classes/manual-assignments/${assignmentToDelete.value.id}`, { method: 'DELETE' })
    assignments.value = assignments.value.filter((item) => item.id !== assignmentToDelete.value.id)
    delete assignmentDetails.value[assignmentToDelete.value.id]
    delete detailErrors.value[assignmentToDelete.value.id]
    deleteDialog.value = false
    showToast(t('classManualAssignments.deleteSuccess'))
    assignmentToDelete.value = null
  } catch (error) {
    showToast(error.message || t('classManualAssignments.deleteError'), 'error')
  } finally {
    deleting.value = false
  }
}

async function addStudentFiles(assignmentId, selection) {
  const selectedFiles = (Array.isArray(selection) ? selection : selection ? [selection] : []).filter(Boolean)
  const current = studentDrafts.value[assignmentId]?.attachments || []
  const newFiles = []
  let totalBytes = current.reduce((sum, file) => sum + estimatedDataUrlBytes(file.fileData), 0)
  for (const file of selectedFiles) {
    if (!['image/png', 'image/jpeg', 'image/webp', 'application/pdf'].includes(file.type)) {
      submitErrors.value[assignmentId] = t('classManualAssignments.fileTypeError')
      return
    }
    totalBytes += file.size
    if (totalBytes > maxAttachmentBytes) {
      submitErrors.value[assignmentId] = t('classManualAssignments.fileSizeError')
      return
    }
    newFiles.push(await readFile(file))
  }
  studentDrafts.value[assignmentId].attachments.push(...newFiles)
  submitErrors.value[assignmentId] = ''
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve({ fileName: file.name, mimeType: file.type, fileData: String(reader.result) })
    reader.onerror = () => reject(new Error(t('classManualAssignments.fileReadError')))
    reader.readAsDataURL(file)
  })
}

function estimatedDataUrlBytes(value) {
  const base64 = String(value).split(',')[1] || ''
  return Math.floor(base64.length * 3 / 4) - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0)
}

function removeStudentFile(assignmentId, index) {
  studentDrafts.value[assignmentId].attachments.splice(index, 1)
}

async function submitWork(assignment) {
  if (submittingId.value !== null || assignmentDetails.value[assignment.id]?.submissions?.length) return
  submittingId.value = assignment.id
  submitErrors.value[assignment.id] = ''
  try {
    const submission = await api(`/classes/manual-assignments/${assignment.id}/submission`, {
      method: 'POST',
      body: {
        content: studentDrafts.value[assignment.id].content.trim() || undefined,
        attachments: studentDrafts.value[assignment.id].attachments,
      },
    })
    assignmentDetails.value[assignment.id].submissions = [submission]
    const assignmentRow = assignments.value.find((item) => item.id === assignment.id)
    assignmentRow.submissions = [{ id: submission.id, submittedAt: submission.submittedAt, score: submission.score }]
    showToast(t('classManualAssignments.submittedSuccess'))
  } catch (error) {
    submitErrors.value[assignment.id] = error.message || t('classManualAssignments.submitError')
  } finally {
    submittingId.value = null
  }
}

function canGrade(submission) {
  return submission.score !== null && submission.score !== '' && Number.isFinite(Number(submission.score)) && Number(submission.score) >= 0 && Number(submission.score) <= 10
}

function hasGrade(submission) {
  return submission.score !== null && submission.score !== undefined
}

async function gradeSubmission(submission) {
  if (!canGrade(submission) || gradingId.value !== null) return
  gradingId.value = submission.id
  gradeErrors.value[submission.id] = ''
  try {
    const result = await api(`/classes/manual-submissions/${submission.id}/grade`, {
      method: 'PATCH',
      body: { score: Number(submission.score), feedback: submission.teacherFeedback || '' },
    })
    Object.assign(submission, result)
    showToast(t('classManualAssignments.gradeSuccess'))
  } catch (error) {
    gradeErrors.value[submission.id] = error.message || t('classManualAssignments.gradeError')
  } finally {
    gradingId.value = null
  }
}

function isExpired(assignment) { return Boolean(assignment.deadline && new Date(assignment.deadline).getTime() <= Date.now()) }
function formatDate(value) { return new Intl.DateTimeFormat(locale.value === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) }
function toDatetimeLocal(value) {
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}
function showToast(message, color = 'success') {
  toast.message = message
  toast.color = color
  toast.show = true
}
</script>

<style scoped>
.manual-class-page { background: #f4f8ff; }
.manual-class-container { max-width: 1160px; }
.manual-class-hero { display: flex; align-items: center; gap: 16px; padding: 22px 24px; border: 1px solid #e2ebf8; border-radius: 20px; background: linear-gradient(120deg, #fff, #eff6ff); }
.manual-class-icon { display: grid; width: 52px; height: 52px; flex: none; place-items: center; border-radius: 15px; background: #e5efff; color: #347cf5; }
.manual-class-eyebrow { color: #347cf5; font-size: .72rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.manual-class-hero h1 { overflow: hidden; margin: 2px 0; color: #1e2c43; font-size: clamp(1.35rem, 3vw, 1.8rem); text-overflow: ellipsis; }
.manual-class-hero p { margin: 0; color: #75839a; }
.manual-list-card { overflow: hidden; border: 1px solid #e3ebf7; background: #fff; }
.manual-list-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 20px 22px; border-bottom: 1px solid #edf2f8; }
.manual-list-toolbar h2 { margin: 0; color: #25354d; font-size: 1.08rem; }
.manual-list-toolbar p { margin: 4px 0 0; color: #75839a; font-size: .85rem; }
.manual-search { max-width: 320px; }
.manual-panels { padding: 0 12px; }
.manual-assignment-heading { display: flex; min-width: 0; align-items: center; gap: 12px; width: 100%; }
.manual-assignment-icon { display: grid; width: 40px; height: 40px; flex: none; place-items: center; border-radius: 12px; background: #edf4ff; color: #347cf5; }
.manual-assignment-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 4px; }
.manual-assignment-copy strong, .manual-assignment-copy small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.manual-assignment-copy strong { color: #26364e; }
.manual-assignment-copy small { color: #7b899e; font-size: .78rem; }
.manual-state { display: flex; min-height: 220px; flex-direction: column; align-items: center; justify-content: center; gap: 10px; text-align: center; }
.assignment-instructions { margin-bottom: 18px; padding: 14px 16px; border-radius: 12px; background: #f5f8fd; color: #374860; }
.assignment-instructions p { margin: 7px 0 0; white-space: pre-wrap; }
.manual-submission-card { margin: 14px 0; padding: 16px; border: 1px solid #e6edf7; border-radius: 14px; background: #fff; }
.submission-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.submission-heading > div { display: flex; flex-direction: column; gap: 4px; }
.submission-heading strong { color: #26364e; }
.submission-heading small { color: #7b899e; }
.submission-content, .student-previous-submission p { margin: 14px 0; color: #40516a; white-space: pre-wrap; }
.submission-files { display: flex; flex-wrap: wrap; gap: 8px; }
.manual-grade-form { display: grid; grid-template-columns: minmax(140px, 190px) minmax(220px, 1fr); gap: 12px; margin-top: 14px; }
.grade-locked { grid-column: 1 / -1; width: 100%; }
.student-previous-submission { padding: 14px; border: 1px solid #e2ebf8; border-radius: 12px; background: #f8fbff; }
.empty-submissions { padding: 24px; color: #7b899e; text-align: center; }
.manual-toast :deep(.v-snackbar__wrapper) { min-width: min(440px, calc(100vw - 32px)); max-width: min(520px, calc(100vw - 32px)); border-radius: 8px; color: #fff !important; }
.manual-toast :deep(.v-snackbar__content) { padding: 12px 0 12px 16px; }
.manual-toast :deep(.v-icon), .manual-toast :deep(.v-btn) { color: #fff !important; }
.manual-toast-content { display: flex; align-items: center; gap: 14px; }
.manual-toast-content > .v-icon { flex: none; }
.manual-toast-copy { display: flex; min-width: 0; flex-direction: column; gap: 2px; line-height: 1.35; }
.manual-toast-copy strong { font-size: 1rem; font-weight: 800; }
.manual-toast-copy span { font-size: .9rem; }
@media (max-width: 700px) {
  .manual-class-hero { align-items: flex-start; flex-wrap: wrap; padding: 18px; }
  .manual-list-toolbar { align-items: stretch; flex-direction: column; }
  .manual-search { max-width: none; }
  .manual-assignment-heading { align-items: flex-start; flex-wrap: wrap; }
  .manual-assignment-copy { min-width: calc(100% - 54px); }
  .manual-grade-form { grid-template-columns: 1fr; }
}
</style>
