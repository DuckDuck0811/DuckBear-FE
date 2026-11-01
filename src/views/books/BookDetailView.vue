<template>
  <v-layout class="min-vh-100" style="background-color: #F4F8FF;">
    <AppHeader />
    <TeacherSidebar />
    <StudentSidebar />

    <v-main class="pb-16" style="background-color: #F4F8FF;">
      <v-progress-linear
        v-if="isLoading"
        indeterminate
        color="primary"
        height="3"
      />

      <v-container class="py-6 px-4 px-md-8" style="max-width: 1100px;">
        <!-- Nút Quay lại Thư viện -->
        <v-btn
          variant="text"
          rounded="pill"
          prepend-icon="mdi-arrow-left"
          class="mb-4 text-none font-weight-bold"
          color="primary"
          @click="goBack"
        >
          {{ t('bookDetail.backToLibrary') }}
        </v-btn>

        <!-- Hero Showcase Banner Sách Phong Cách SHub Classroom -->
        <v-card
          v-if="book"
          class="rounded-xl pa-6 pa-md-8 mb-8 hero-book-card"
          elevation="0"
        >
          <div class="d-flex flex-column flex-md-row align-start align-md-center justify-space-between ga-6">
            <div class="d-flex align-start ga-4">
              <v-avatar color="primary" size="64" class="rounded-xl text-white shadow-primary">
                <v-icon icon="mdi-book-open-page-variant" size="34" />
              </v-avatar>

              <div>
                <div class="d-flex align-center ga-2 mb-2 flex-wrap">
                  <v-chip color="primary" size="small" variant="flat" class="font-weight-black">
                    {{ t('bookDetail.grade', { grade: book.gradeLevel }) }}
                  </v-chip>
                  <v-chip color="secondary" size="small" variant="tonal" class="font-weight-bold">
                    {{ subjectLabel }}
                  </v-chip>
                  <span class="text-caption text-secondary font-weight-medium">
                    {{ t('bookDetail.chapterCount', { count: book.chapters?.length || 0 }) }}
                  </span>
                </div>

                <h1 class="text-h4 font-weight-black text-primary mb-0">
                  {{ book.title }}
                </h1>
              </div>
            </div>

            <!-- Nút Thêm Chương Mới cho Teacher -->
            <v-btn
              v-if="authStore.isTeacher"
              color="primary"
              size="large"
              rounded="pill"
              class="btn-shub-primary px-6 font-weight-black"
              prepend-icon="mdi-folder-plus-outline"
              @click="openAddChapterDialog"
            >
              {{ t('bookDetail.addChapter') }}
            </v-btn>
          </div>
        </v-card>

        <!-- Danh sách Cây Chương Mục & Bài Học -->
        <div v-if="book">
          <div class="d-flex justify-space-between align-center mb-4">
            <div>
              <h2 class="text-h5 font-weight-black text-primary mb-0">
                {{ t('bookDetail.contentsTitle') }}
              </h2>
              <span class="text-caption text-secondary">
                {{ t('bookDetail.contentsSubtitle') }}
              </span>
            </div>
          </div>

          <!-- EmptyState khi chưa có chương nào -->
          <EmptyState
            v-if="!book.chapters || book.chapters.length === 0"
            :title="t('bookDetail.noChapters')"
            :description="t('bookDetail.noChaptersHint')"
            :action-text="authStore.isTeacher ? t('bookDetail.addFirstChapter') : ''"
            action-icon="mdi-folder-plus-outline"
            @action="openAddChapterDialog"
          />

          <!-- Cây Chương Mục Dạng Expansion Panels Bo Góc Lớn -->
          <v-expansion-panels
            v-else
            v-model="openedPanels"
            multiple
            class="ga-3"
          >
            <v-expansion-panel
              v-for="(chapter, cIndex) in book.chapters"
              :key="chapter.id"
              class="rounded-xl overflow-hidden shub-panel"
            >
              <!-- Tiêu đề Panel Chương -->
              <v-expansion-panel-title class="py-4 px-5">
                <div class="d-flex flex-grow-1 align-center justify-space-between mr-2">
                  <div class="d-flex align-center">
                    <v-avatar
                      :color="getChapterColor(cIndex)"
                      size="36"
                      class="mr-3 font-weight-black text-white"
                    >
                      {{ cIndex + 1 }}
                    </v-avatar>

                    <div>
                      <div class="text-subtitle-1 font-weight-bold text-primary">
                        {{ chapter.title }}
                      </div>
                      <span class="text-caption text-secondary">
                        {{ t('bookDetail.lessonCount', { count: chapter.lessons?.length || 0 }) }}
                      </span>
                    </div>
                  </div>

                  <!-- Thao tác trên chương (Teacher) -->
                  <div v-if="authStore.isTeacher" class="d-flex align-center ga-2" @click.stop>
                    <v-btn
                      size="small"
                      color="primary"
                      variant="tonal"
                      rounded="pill"
                      prepend-icon="mdi-plus"
                      class="text-none font-weight-bold"
                      @click="openAddLessonDialog(chapter.id, $event)"
                    >
                      {{ t('bookDetail.addLesson') }}
                    </v-btn>

                    <v-btn
                      icon="mdi-pencil-outline"
                      size="small"
                      variant="text"
                      color="primary"
                      :title="t('bookDetail.editChapter')"
                      @click="openEditChapterDialog(chapter, $event)"
                    />

                    <v-btn
                      icon="mdi-trash-can-outline"
                      size="small"
                      variant="text"
                      color="error"
                      :title="t('bookDetail.deleteChapter')"
                      @click="confirmDeleteChapter(chapter, $event)"
                    />
                  </div>
                </div>
              </v-expansion-panel-title>

              <!-- Nội dung bài học bên trong chương -->
              <v-expansion-panel-text class="pt-2 pb-4 px-5 bg-shub-inner">
                <div
                  v-if="!chapter.lessons || chapter.lessons.length === 0"
                  class="py-4 text-center text-caption text-secondary"
                >
                  {{ t('bookDetail.noLessons') }}
                  <span v-if="authStore.isTeacher">{{ t('bookDetail.noLessonsTeacherHint') }}</span>
                </div>

                <!-- Danh sách các bài học -->
                <div v-else class="d-flex flex-column ga-2">
                  <div
                    v-for="(lesson, lIndex) in chapter.lessons"
                    :key="lesson.id"
                    class="lesson-item-shub d-flex align-center justify-space-between pa-3 rounded-lg bg-white"
                    role="button"
                    tabindex="0"
                    @click="goToLesson(lesson.id)"
                    @keydown.enter="goToLesson(lesson.id)"
                  >
                    <div class="d-flex align-center">
                      <v-avatar color="primary" variant="tonal" size="28" class="mr-3 font-weight-bold text-caption">
                        {{ lIndex + 1 }}
                      </v-avatar>
                      <div class="text-body-2 font-weight-bold text-primary">
                        {{ lesson.title }}
                      </div>
                    </div>

                    <div class="d-flex align-center ga-3">
                      <v-chip size="x-small" color="primary" variant="text" append-icon="mdi-arrow-right" class="font-weight-bold d-none d-sm-inline-flex">
                        {{ t('bookDetail.startLearning') }}
                      </v-chip>

                      <!-- Nút Sửa / Xóa Bài học cho Teacher -->
                      <QuestionBankSection
                        v-if="authStore.isTeacher"
                        :lesson-id="lesson.id"
                        :lesson-title="lesson.title"
                      />
                      <div v-if="authStore.isTeacher" class="d-flex align-center ga-1" @click.stop>
                        <v-btn
                          icon="mdi-pencil-outline"
                          size="x-small"
                          variant="text"
                          color="primary"
                          :title="t('bookDetail.editLesson')"
                          @click="openEditLessonDialog(lesson, $event)"
                        />
                        <v-btn
                          icon="mdi-trash-can-outline"
                          size="x-small"
                          variant="text"
                          color="error"
                          :title="t('bookDetail.deleteLesson')"
                          @click="confirmDeleteLesson(lesson, $event)"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>
      </v-container>

      <!-- Dialog Thêm / Sửa Chương (Vuetify rounded="xl") -->
      <v-dialog v-model="showChapterDialog" max-width="500" persistent>
        <v-card class="rounded-xl pa-6">
          <div class="d-flex align-center mb-5">
            <v-avatar color="primary" variant="tonal" size="46" class="mr-3">
              <v-icon icon="mdi-folder-outline" size="24" color="primary" />
            </v-avatar>
            <div>
              <h2 class="text-h6 font-weight-black text-primary">
                {{ t(isEditingChapter ? 'bookDetail.editChapterTitle' : 'bookDetail.addChapterTitle') }}
              </h2>
              <span class="text-caption text-secondary">{{ t('bookDetail.curriculumStructure') }}</span>
            </div>
          </div>

          <v-form ref="chapterFormRef" @submit.prevent="handleSaveChapter">
            <div class="mb-4">
              <label class="text-caption font-weight-bold text-secondary mb-1 d-block">{{ t('bookDetail.chapterTitleLabel') }}</label>
              <v-text-field
                v-model="chapterForm.title"
                :placeholder="t('bookDetail.chapterTitlePlaceholder')"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                color="primary"
                :rules="requiredRule"
                hide-details="auto"
              />
            </div>

            <div class="mb-6">
              <label class="text-caption font-weight-bold text-secondary mb-1 d-block">{{ t('bookDetail.orderLabel') }}</label>
              <v-text-field
                v-model="chapterForm.orderIndex"
                type="number"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                min="0"
                color="primary"
                hide-details="auto"
              />
            </div>

            <div class="d-flex justify-end ga-3 pt-4 border-t">
              <v-btn
                variant="text"
                rounded="pill"
                class="font-weight-bold px-4"
                :disabled="isSubmittingChapter"
                @click="showChapterDialog = false"
              >
                {{ t('bookDetail.cancel') }}
              </v-btn>
              <v-btn
                color="primary"
                rounded="pill"
                class="btn-shub-primary px-6 font-weight-bold"
                :loading="isSubmittingChapter"
                @click="handleSaveChapter"
              >
                {{ t(isEditingChapter ? 'bookDetail.saveChanges' : 'bookDetail.addChapter') }}
              </v-btn>
            </div>
          </v-form>
        </v-card>
      </v-dialog>

      <!-- Dialog Xác nhận xóa Chương -->
      <ConfirmDialog
        v-model="showDeleteChapterConfirm"
        :title="t('bookDetail.deleteChapter')"
        :message="t('bookDetail.confirmDeleteChapter', { title: chapterToDelete?.title })"
        :loading="isDeletingChapter"
        @confirm="handleDeleteChapter"
      />

      <!-- Dialog Thêm / Sửa Bài Học (Vuetify rounded="xl") -->
      <v-dialog v-model="showLessonDialog" max-width="640" persistent>
        <v-card class="rounded-xl pa-6">
          <div class="d-flex align-center mb-5">
            <v-avatar color="primary" variant="tonal" size="46" class="mr-3">
              <v-icon icon="mdi-file-document-edit-outline" size="24" color="primary" />
            </v-avatar>
            <div>
              <h2 class="text-h6 font-weight-black text-primary">
                {{ t(isEditingLesson ? 'bookDetail.editLessonTitle' : 'bookDetail.addLessonTitle') }}
              </h2>
              <span class="text-caption text-secondary">{{ t('bookDetail.lessonContent') }}</span>
            </div>
          </div>

          <v-form ref="lessonFormRef" @submit.prevent="handleSaveLesson">
            <div class="mb-4">
              <label class="text-caption font-weight-bold text-secondary mb-1 d-block">{{ t('bookDetail.lessonTitleLabel') }}</label>
              <v-text-field
                v-model="lessonForm.title"
                :placeholder="t('bookDetail.lessonTitlePlaceholder')"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                color="primary"
                :rules="requiredRule"
                hide-details="auto"
              />
            </div>

            <div class="mb-4">
              <label class="text-caption font-weight-bold text-secondary mb-1 d-block">{{ t('bookDetail.orderLabel') }}</label>
              <v-text-field
                v-model="lessonForm.orderIndex"
                type="number"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                min="0"
                color="primary"
                hide-details="auto"
              />
            </div>

            <div class="mb-6">
              <label class="text-caption font-weight-bold text-secondary mb-1 d-block">{{ t('bookDetail.optionalLessonContent') }}</label>
              <v-textarea
                v-model="lessonForm.content"
                :placeholder="t('bookDetail.lessonContentPlaceholder')"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                rows="6"
                color="primary"
                hide-details="auto"
              />
            </div>

            <div class="d-flex justify-end ga-3 pt-4 border-t">
              <v-btn
                variant="text"
                rounded="pill"
                class="font-weight-bold px-4"
                :disabled="isSubmittingLesson"
                @click="showLessonDialog = false"
              >
                {{ t('bookDetail.cancel') }}
              </v-btn>
              <v-btn
                color="primary"
                rounded="pill"
                class="btn-shub-primary px-6 font-weight-bold"
                :loading="isSubmittingLesson"
                @click="handleSaveLesson"
              >
                {{ t(isEditingLesson ? 'bookDetail.saveChanges' : 'bookDetail.addLesson') }}
              </v-btn>
            </div>
          </v-form>
        </v-card>
      </v-dialog>

      <!-- Dialog Xác nhận xóa Bài Học -->
      <ConfirmDialog
        v-model="showDeleteLessonConfirm"
        :title="t('bookDetail.deleteLesson')"
        :message="t('bookDetail.confirmDeleteLesson', { title: lessonToDelete?.title })"
        :loading="isDeletingLesson"
        @confirm="handleDeleteLesson"
      />

      <!-- Snackbar Thông Báo -->
      <v-snackbar
        v-model="snackbar.show"
        :color="snackbar.color"
        rounded="pill"
        timeout="3500"
        location="top right"
      >
        <div class="d-flex align-center">
          <v-icon
            :icon="snackbar.color === 'error' ? 'mdi-alert-circle' : 'mdi-check-circle'"
            class="mr-2"
          />
          <span class="font-weight-bold">{{ snackbar.message }}</span>
        </div>
        <template #actions>
          <v-btn variant="text" size="small" @click="snackbar.show = false">{{ t('bookDetail.close') }}</v-btn>
        </template>
      </v-snackbar>
    </v-main>
  </v-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import AppHeader from '../../components/shared/AppHeader.vue'
import TeacherSidebar from '../../components/shared/TeacherSidebar.vue'
import StudentSidebar from '../../components/shared/StudentSidebar.vue'
import EmptyState from '../../components/shared/EmptyState.vue'
import ConfirmDialog from '../../components/shared/ConfirmDialog.vue'
import QuestionBankSection from '../../components/QuestionBankSection.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

const subjectTranslationKeys = {
  'Toán': 'math', 'Tiếng Việt': 'vietnamese', 'Ngữ Văn': 'literature', 'Ngữ văn': 'literature',
  'Tiếng Anh': 'english', 'Đạo đức': 'ethics', 'Tự nhiên và Xã hội': 'natureSociety', 'Khoa học': 'science',
  'Lịch sử': 'history', 'Địa lí': 'geography', 'Lịch sử và Địa lí': 'historyGeography', 'Vật lí': 'physics',
  'Hóa học': 'chemistry', 'Sinh học': 'biology', 'Tin học': 'informatics', 'Công nghệ': 'technology',
  'Giáo dục công dân': 'civicEducation', 'Giáo dục kinh tế và pháp luật': 'economicsLaw', 'Âm nhạc': 'music',
  'Mĩ thuật': 'arts', 'Giáo dục thể chất': 'physicalEducation', 'Hoạt động trải nghiệm': 'experientialActivities',
}

const bookId = route.params.id
const book = ref(null)
const subjectLabel = computed(() => {
  const key = subjectTranslationKeys[book.value?.subject]
  return key ? t(`booksPage.subjects.${key}`) : book.value?.subject
})
const isLoading = ref(false)
const openedPanels = ref([])

// Snackbar thông báo
const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
})

function showNotice(message, color = 'success') {
  snackbar.value = {
    show: true,
    message,
    color,
  }
}

// ---- Quản lý Chương ----
const showChapterDialog = ref(false)
const isEditingChapter = ref(false)
const chapterFormRef = ref(null)
const isSubmittingChapter = ref(false)
const chapterForm = ref({
  id: null,
  title: '',
  orderIndex: 0,
})

const showDeleteChapterConfirm = ref(false)
const chapterToDelete = ref(null)
const isDeletingChapter = ref(false)

// ---- Quản lý Bài học ----
const showLessonDialog = ref(false)
const isEditingLesson = ref(false)
const lessonFormRef = ref(null)
const isSubmittingLesson = ref(false)
const targetChapterId = ref(null)
const lessonForm = ref({
  id: null,
  title: '',
  content: '',
  orderIndex: 0,
})

const showDeleteLessonConfirm = ref(false)
const lessonToDelete = ref(null)
const isDeletingLesson = ref(false)

const requiredRule = [(v) => !!v || t('bookDetail.required')]

// Lấy chi tiết sách
async function fetchBookDetail() {
  isLoading.value = true
  try {
    const data = await api(`/books/${bookId}`)
    book.value = data
    if (data?.chapters) {
      openedPanels.value = data.chapters.map((_, i) => i)
    }
  } catch (err) {
    showNotice(err.message, 'error')
  } finally {
    isLoading.value = false
  }
}

// ==== THAO TÁC VỚI CHƯƠNG ====
function openAddChapterDialog() {
  isEditingChapter.value = false
  chapterForm.value = {
    id: null,
    title: '',
    orderIndex: (book.value?.chapters?.length || 0) + 1,
  }
  showChapterDialog.value = true
}

function openEditChapterDialog(chapter, event) {
  event?.stopPropagation()
  isEditingChapter.value = true
  chapterForm.value = {
    id: chapter.id,
    title: chapter.title,
    orderIndex: chapter.orderIndex ?? 0,
  }
  showChapterDialog.value = true
}

async function handleSaveChapter() {
  const { valid } = await chapterFormRef.value.validate()
  if (!valid) return

  isSubmittingChapter.value = true
  try {
    const payload = {
      title: chapterForm.value.title.trim(),
      orderIndex: Number(chapterForm.value.orderIndex) || 0,
    }

    if (isEditingChapter.value) {
      await api(`/chapters/${chapterForm.value.id}`, {
        method: 'PATCH',
        body: payload,
      })
      showNotice(t('bookDetail.chapterUpdated'))
    } else {
      await api(`/books/${bookId}/chapters`, {
        method: 'POST',
        body: payload,
      })
      showNotice(t('bookDetail.chapterAdded'))
    }
    showChapterDialog.value = false
    await fetchBookDetail()
  } catch (err) {
    showNotice(err.message, 'error')
  } finally {
    isSubmittingChapter.value = false
  }
}

function confirmDeleteChapter(chapter, event) {
  event?.stopPropagation()
  chapterToDelete.value = chapter
  showDeleteChapterConfirm.value = true
}

async function handleDeleteChapter() {
  if (!chapterToDelete.value) return
  isDeletingChapter.value = true
  try {
    await api(`/chapters/${chapterToDelete.value.id}`, {
      method: 'DELETE',
    })
    showNotice(t('bookDetail.chapterDeleted'))
    showDeleteChapterConfirm.value = false
    chapterToDelete.value = null
    await fetchBookDetail()
  } catch (err) {
    showNotice(err.message, 'error')
  } finally {
    isDeletingChapter.value = false
  }
}

// ==== THAO TÁC VỚI BÀI HỌC ====
function openAddLessonDialog(chapterId, event) {
  event?.stopPropagation()
  isEditingLesson.value = false
  targetChapterId.value = chapterId
  const chapter = book.value?.chapters?.find((c) => c.id === chapterId)
  lessonForm.value = {
    id: null,
    title: '',
    content: '',
    orderIndex: (chapter?.lessons?.length || 0) + 1,
  }
  showLessonDialog.value = true
}

function openEditLessonDialog(lesson, event) {
  event?.stopPropagation()
  isEditingLesson.value = true
  lessonForm.value = {
    id: lesson.id,
    title: lesson.title,
    content: lesson.content || '',
    orderIndex: lesson.orderIndex ?? 0,
  }
  showLessonDialog.value = true
}

async function handleSaveLesson() {
  const { valid } = await lessonFormRef.value.validate()
  if (!valid) return

  isSubmittingLesson.value = true
  try {
    const payload = {
      title: lessonForm.value.title.trim(),
      content: lessonForm.value.content || '',
      orderIndex: Number(lessonForm.value.orderIndex) || 0,
    }

    if (isEditingLesson.value) {
      await api(`/lessons/${lessonForm.value.id}`, {
        method: 'PATCH',
        body: payload,
      })
      showNotice(t('bookDetail.lessonUpdated'))
    } else {
      await api(`/chapters/${targetChapterId.value}/lessons`, {
        method: 'POST',
        body: payload,
      })
      showNotice(t('bookDetail.lessonAdded'))
    }
    showLessonDialog.value = false
    await fetchBookDetail()
  } catch (err) {
    showNotice(err.message, 'error')
  } finally {
    isSubmittingLesson.value = false
  }
}

function confirmDeleteLesson(lesson, event) {
  event?.stopPropagation()
  lessonToDelete.value = lesson
  showDeleteLessonConfirm.value = true
}

async function handleDeleteLesson() {
  if (!lessonToDelete.value) return
  isDeletingLesson.value = true
  try {
    await api(`/lessons/${lessonToDelete.value.id}`, {
      method: 'DELETE',
    })
    showNotice(t('bookDetail.lessonDeleted'))
    showDeleteLessonConfirm.value = false
    lessonToDelete.value = null
    await fetchBookDetail()
  } catch (err) {
    showNotice(err.message, 'error')
  } finally {
    isDeletingLesson.value = false
  }
}

function goToLesson(lessonId) {
  router.push(`/lessons/${lessonId}`)
}

function goBack() {
  router.push('/')
}

// Bảng màu cho badge số thứ tự chương
const chapterColorPalette = ['primary', 'orange', 'success', 'purple', 'warning', 'info']
function getChapterColor(index) {
  return chapterColorPalette[index % chapterColorPalette.length]
}

onMounted(() => {
  fetchBookDetail()
})
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}

.hero-book-card {
  background: linear-gradient(135deg, #FFFFFF 0%, #F5F9FF 100%) !important;
  border: 1px solid #DCE7F7 !important;
  box-shadow: 0 6px 20px rgba(47, 124, 246, 0.06) !important;
}

.shadow-primary {
  box-shadow: 0 4px 14px rgba(47, 124, 246, 0.3);
}

.shub-panel {
  background: #FFFFFF !important;
  border: 1px solid #E4ECF7 !important;
  box-shadow: 0 4px 14px rgba(47, 124, 246, 0.05) !important;
}

.bg-shub-inner {
  background: #F8FAFD !important;
  border-top: 1px solid #EDF3FA;
}

.lesson-item-shub {
  border: 1px solid #E4ECF7;
  cursor: pointer;
  transition: all 0.2s ease;
}

.lesson-item-shub:hover {
  background: #EBF3FF !important;
  border-color: #2F7CF6;
  transform: translateX(4px);
}
</style>
