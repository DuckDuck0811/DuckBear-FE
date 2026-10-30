<template>
  <v-layout class="min-vh-100" style="background-color: #F4F8FF;">
    <AppHeader />

    <v-main class="pb-16" style="background-color: #F4F8FF;">
      <v-progress-linear
        v-if="isLoading"
        indeterminate
        color="primary"
        height="3"
      />

      <v-container class="py-6 px-4 px-md-8" style="max-width: 920px;">
        <!-- Nút Quay lại -->
        <v-btn
          variant="text"
          rounded="pill"
          prepend-icon="mdi-arrow-left"
          class="mb-4 text-none font-weight-bold"
          color="primary"
          @click="goBack"
        >
          Quay lại cấu trúc giáo trình
        </v-btn>

        <!-- Trạng thái không tìm thấy bài học -->
        <v-card
          v-if="!isLoading && !lesson"
          class="rounded-xl pa-10 text-center bg-white"
          elevation="0"
          style="border: 1px solid #E4ECF7;"
        >
          <DuckBearMascot :size="90" mood="empty" class="mb-4" />
          <h2 class="text-h5 font-weight-black text-primary mb-2">Không tìm thấy bài học</h2>
          <p class="text-body-2 text-secondary mb-6">
            Bài giảng này có thể đã bị gỡ bỏ hoặc bạn không có quyền truy cập.
          </p>
          <v-btn
            color="primary"
            rounded="pill"
            class="btn-shub-primary px-6 font-weight-bold"
            @click="goBack"
          >
            Quay lại
          </v-btn>
        </v-card>

        <!-- Thẻ Bài Học SHub Classroom Style -->
        <v-card
          v-else-if="lesson"
          class="rounded-xl pa-6 pa-md-10 bg-white lesson-card-shub fade-in-up"
          elevation="0"
        >
          <!-- Header bài giảng -->
          <div class="d-flex flex-column flex-sm-row justify-space-between align-start align-sm-center ga-4 mb-6 pb-6 border-b">
            <div>
              <div class="d-flex align-center ga-2 mb-2">
                <v-chip color="primary" size="small" variant="flat" class="font-weight-black">
                  BÀI HỌC {{ lesson.orderIndex ?? 1 }}
                </v-chip>
                <span class="text-caption text-secondary font-weight-bold">DUCKBEAR CLASSROOM</span>
              </div>
              <h1 class="text-h4 font-weight-black text-primary mb-0">
                {{ lesson.title }}
              </h1>
            </div>

            <!-- Nút sửa cho Teacher -->
            <v-btn
              v-if="authStore.isTeacher"
              color="primary"
              variant="tonal"
              rounded="pill"
              prepend-icon="mdi-pencil-outline"
              class="font-weight-bold text-none px-4"
              @click="openEditModal"
            >
              Chỉnh sửa bài học
            </v-btn>
          </div>

          <!-- Nội dung bài giảng (Tối ưu độ rộng dòng 65-75 ký tự) -->
          <div v-if="lesson.content" class="lesson-reading-area">
            <div class="lesson-prose-text text-body-1">
              {{ lesson.content }}
            </div>
          </div>

          <!-- Trạng thái chưa có nội dung -->
          <div v-else class="text-center py-10 my-4 pa-6 rounded-xl bg-shub-empty">
            <DuckBearMascot :size="80" mood="reading" class="mb-3 animate-float" />
            <h3 class="text-h6 font-weight-black text-primary mb-1">
              Bài học đang được chuẩn bị
            </h3>
            <p class="text-body-2 text-secondary mb-5">
              Nội dung chi tiết cho bài giảng này sẽ được cập nhật sớm.
            </p>
            <v-btn
              v-if="authStore.isTeacher"
              color="primary"
              rounded="pill"
              class="btn-shub-primary px-6 font-weight-bold"
              prepend-icon="mdi-pencil"
              @click="openEditModal"
            >
              Soạn nội dung ngay
            </v-btn>
          </div>

          <!-- Footer bài học -->
          <div class="border-t pt-6 mt-8 d-flex justify-space-between align-center text-caption text-secondary">
            <div class="d-flex align-center">
              <v-icon icon="mdi-shield-check" color="success" size="16" class="mr-1" />
              <span>Nội dung đã được kiểm duyệt</span>
            </div>
            <span>DuckBear Education</span>
          </div>
        </v-card>
      </v-container>

      <!-- Dialog Chỉnh Sửa Bài Học (Vuetify rounded="xl") -->
      <v-dialog v-model="showEditDialog" max-width="680" persistent>
        <v-card class="rounded-xl pa-6">
          <div class="d-flex align-center mb-5">
            <v-avatar color="primary" variant="tonal" size="46" class="mr-3">
              <v-icon icon="mdi-file-document-edit-outline" size="24" color="primary" />
            </v-avatar>
            <div>
              <h2 class="text-h6 font-weight-black text-primary">
                Chỉnh sửa bài học
              </h2>
              <span class="text-caption text-secondary">Cập nhật nội dung bài giảng</span>
            </div>
          </div>

          <v-form ref="formRef" @submit.prevent="handleUpdateLesson">
            <div class="mb-4">
              <label class="text-caption font-weight-bold text-secondary mb-1 d-block">TIÊU ĐỀ BÀI HỌC</label>
              <v-text-field
                v-model="editForm.title"
                placeholder="Ví dụ: Bài 1: Đại số và Giải tích"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                color="primary"
                :rules="requiredRule"
                hide-details="auto"
              />
            </div>

            <div class="mb-4">
              <label class="text-caption font-weight-bold text-secondary mb-1 d-block">THỨ TỰ HIỂN THỊ</label>
              <v-text-field
                v-model="editForm.orderIndex"
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
              <label class="text-caption font-weight-bold text-secondary mb-1 d-block">NỘI DUNG BÀI GIẢNG</label>
              <v-textarea
                v-model="editForm.content"
                placeholder="Nhập nội dung bài giảng, lý thuyết, công thức, ví dụ..."
                variant="outlined"
                rounded="lg"
                density="comfortable"
                rows="9"
                color="primary"
                hide-details="auto"
              />
            </div>

            <div class="d-flex justify-end ga-3 pt-4 border-t">
              <v-btn
                variant="text"
                rounded="pill"
                class="font-weight-bold px-4"
                :disabled="isSubmitting"
                @click="showEditDialog = false"
              >
                Hủy bỏ
              </v-btn>
              <v-btn
                color="primary"
                rounded="pill"
                class="btn-shub-primary px-6 font-weight-bold"
                :loading="isSubmitting"
                @click="handleUpdateLesson"
              >
                Lưu bài học
              </v-btn>
            </div>
          </v-form>
        </v-card>
      </v-dialog>

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
          <v-btn variant="text" size="small" @click="snackbar.show = false">Đóng</v-btn>
        </template>
      </v-snackbar>
    </v-main>
  </v-layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import AppHeader from '../../components/shared/AppHeader.vue'
import DuckBearMascot from '../../components/shared/DuckBearMascot.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const lessonId = route.params.id
const lesson = ref(null)
const isLoading = ref(false)

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

// Dialog Chỉnh sửa bài học
const showEditDialog = ref(false)
const isSubmitting = ref(false)
const formRef = ref(null)
const editForm = ref({
  title: '',
  content: '',
  orderIndex: 0,
})

const requiredRule = [(v) => !!v || 'Tiêu đề không được để trống']

// Lấy thông tin bài học
async function fetchLesson() {
  isLoading.value = true
  try {
    const data = await api(`/lessons/${lessonId}`)
    lesson.value = data
  } catch (err) {
    showNotice(err.message, 'error')
  } finally {
    isLoading.value = false
  }
}

// Mở dialog sửa bài học
function openEditModal() {
  if (!lesson.value) return
  editForm.value = {
    title: lesson.value.title || '',
    content: lesson.value.content || '',
    orderIndex: lesson.value.orderIndex ?? 0,
  }
  showEditDialog.value = true
}

// Lưu cập nhật bài học
async function handleUpdateLesson() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  isSubmitting.value = true
  try {
    const payload = {
      title: editForm.value.title.trim(),
      content: editForm.value.content,
      orderIndex: Number(editForm.value.orderIndex) || 0,
    }

    const updated = await api(`/lessons/${lessonId}`, {
      method: 'PATCH',
      body: payload,
    })

    lesson.value = updated
    showNotice('Cập nhật bài học thành công!')
    showEditDialog.value = false
  } catch (err) {
    showNotice(err.message, 'error')
  } finally {
    isSubmitting.value = false
  }
}

function goBack() {
  router.back()
}

onMounted(() => {
  fetchLesson()
})
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}

.lesson-card-shub {
  border: 1px solid #E4ECF7 !important;
  box-shadow: 0 8px 24px rgba(47, 124, 246, 0.06) !important;
}

.lesson-reading-area {
  max-width: 760px;
  margin: 0 auto;
}

.lesson-prose-text {
  white-space: pre-wrap;
  line-height: 1.85;
  color: #1D2939;
  font-size: 1.05rem;
  letter-spacing: 0.01em;
}

.bg-shub-empty {
  background: #F8FAFD;
  border: 1px dashed #DCE7F7;
}
</style>
