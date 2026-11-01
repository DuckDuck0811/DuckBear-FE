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

      <v-container class="py-6 px-4 px-md-8" style="max-width: 960px;">
        <!-- Top Breadcrumbs & Điều hướng trên cùng -->
        <div class="lesson-navigation d-flex flex-column flex-sm-row justify-space-between align-start align-sm-center ga-3 mb-4">
          <v-breadcrumbs :items="breadcrumbItems" class="lesson-breadcrumbs pa-0 text-caption font-weight-bold">
            <template #divider>
              <v-icon icon="mdi-chevron-right" size="14" color="secondary" />
            </template>
            <template #title="{ item }">
              <span
                class="lesson-crumb-label"
                :class="[
                  item.kind ? `lesson-crumb-${item.kind}` : '',
                  { 'text-primary font-weight-black': item.disabled, 'text-secondary hover-link': !item.disabled },
                ]"
                :title="item.title"
              >
                {{ item.title }}
              </span>
            </template>
          </v-breadcrumbs>

          <!-- Menu Danh sách bài học trong chương (Quick Chapter Switcher) -->
          <v-menu v-if="chapterLessons.length > 1" location="bottom end">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                variant="tonal"
                color="primary"
                rounded="pill"
                size="small"
                prepend-icon="mdi-format-list-bulleted"
                append-icon="mdi-chevron-down"
                class="font-weight-bold text-none"
              >
                {{ t('lesson.chapterContents', { current: currentLessonIndex + 1, total: chapterLessons.length }) }}
              </v-btn>
            </template>
            <v-card class="rounded-xl pa-2" min-width="280" max-width="360" elevation="4">
              <div class="text-caption font-weight-black text-secondary px-3 py-2 border-b">
                {{ t('lesson.chapterLessonList') }}
              </div>
              <v-list density="compact" class="pa-1">
                <v-list-item
                  v-for="(item, idx) in chapterLessons"
                  :key="item.id"
                  rounded="lg"
                  :active="item.id === Number(lessonId)"
                  color="primary"
                  class="mb-1"
                  @click="goToLesson(item.id)"
                >
                  <template #prepend>
                    <v-avatar size="24" :color="item.id === Number(lessonId) ? 'primary' : 'grey-lighten-3'" class="mr-2 text-caption font-weight-bold">
                      {{ idx + 1 }}
                    </v-avatar>
                  </template>
                  <v-list-item-title class="text-body-2 font-weight-medium">
                    {{ item.title }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card>
          </v-menu>
        </div>

        <!-- Trạng thái không tìm thấy bài học -->
        <v-card
          v-if="!isLoading && !lesson"
          class="rounded-xl pa-10 text-center bg-white"
          elevation="0"
          style="border: 1px solid #E4ECF7;"
        >
          <DuckBearMascot :size="90" mood="empty" class="mb-4" />
          <h2 class="text-h5 font-weight-black text-primary mb-2">{{ t('lesson.notFoundTitle') }}</h2>
          <p class="text-body-2 text-secondary mb-6">
            {{ t('lesson.notFoundBody') }}
          </p>
          <v-btn
            color="primary"
            rounded="pill"
            class="btn-shub-primary px-6 font-weight-bold"
            @click="goBack"
          >
            {{ t('lesson.back') }}
          </v-btn>
        </v-card>

        <!-- Thẻ Bài Học SHub Classroom Cao Cấp -->
        <div v-else-if="lesson" class="fade-in-up">
          <!-- Main Hero Card: Tiêu đề + Toolbar hỗ trợ học tập -->
          <v-card class="rounded-xl pa-6 pa-md-8 bg-white lesson-hero-card mb-6" elevation="0">
            <!-- Header bài giảng -->
            <div class="d-flex flex-column flex-sm-row justify-space-between align-start align-sm-center ga-4 mb-4">
              <div>
                <div class="d-flex align-center ga-2 mb-2">
                  <v-chip color="primary" size="small" variant="flat" class="font-weight-black">
                    {{ t('lesson.number', { number: lesson.orderIndex ?? (currentLessonIndex + 1) }) }}
                  </v-chip>
                  <span class="text-caption text-secondary font-weight-bold">
                    {{ bookTitle ? `${bookTitle.toUpperCase()} · ` : '' }}DUCKBEAR CLASSROOM
                  </span>
                </div>
                <h1 class="text-h4 font-weight-black text-primary mb-1">
                  {{ lesson.title }}
                </h1>
                <p v-if="chapterTitle" class="text-body-2 text-secondary mb-0">
                  <v-icon icon="mdi-bookmark-outline" size="16" class="mr-1" />
                  {{ chapterTitle }}
                </p>
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

            <v-divider class="my-4" />

            <!-- THANH CÔNG CỤ HỌC TẬP THÔNG MINH (Smart Learning Toolbar) -->
            <div class="d-flex flex-wrap align-center justify-space-between ga-3 pt-1">
              <!-- Nhóm công cụ bên trái: Giọng đọc & Ước tính thời gian -->
              <div class="d-flex flex-wrap align-center ga-2">
                <!-- Nút Nghe đọc bài giảng Web Speech API -->
                <v-btn
                  :color="isPlayingSpeech ? 'error' : 'primary'"
                  :variant="isPlayingSpeech ? 'flat' : 'tonal'"
                  rounded="pill"
                  size="small"
                  class="font-weight-bold text-none px-3"
                  @click="toggleSpeech"
                >
                  <v-icon :icon="isPlayingSpeech ? 'mdi-stop-circle' : 'mdi-volume-high'" class="mr-1" />
                  {{ isPlayingSpeech ? 'Dừng đọc' : 'Nghe bài học' }}
                </v-btn>

                <!-- Thời gian đọc ước tính -->
                <v-chip variant="outlined" color="secondary" size="small" class="font-weight-medium">
                  <v-icon start icon="mdi-clock-outline" size="14" />
                  ~{{ estimatedMinutes }} phút đọc
                </v-chip>

                <!-- Số lượng câu hỏi luyện tập nếu có -->
                <v-chip
                  v-if="questionCount > 0"
                  color="purple"
                  variant="tonal"
                  size="small"
                  class="font-weight-bold"
                >
                  <v-icon start icon="mdi-help-circle-outline" size="14" />
                  {{ questionCount }} câu hỏi luyện tập
                </v-chip>
              </div>

              <!-- Nhóm công cụ bên phải: Cỡ chữ & Đánh dấu hoàn thành -->
              <div class="d-flex align-center ga-2">
                <!-- Bộ chỉnh cỡ chữ linh hoạt -->
                <div class="font-size-control d-inline-flex align-center rounded-pill pa-1">
                  <span class="text-caption font-weight-bold px-2 text-secondary">{{ t('lesson.fontSize') }}</span>
                  <button
                    type="button"
                    class="font-size-btn"
                    :class="{ active: fontSize === 'sm' }"
                    title="Cỡ chữ nhỏ (15px)"
                    @click="fontSize = 'sm'"
                  >
                    A-
                  </button>
                  <button
                    type="button"
                    class="font-size-btn"
                    :class="{ active: fontSize === 'md' }"
                    title="Cỡ chữ vừa (17px)"
                    @click="fontSize = 'md'"
                  >
                    A
                  </button>
                  <button
                    type="button"
                    class="font-size-btn"
                    :class="{ active: fontSize === 'lg' }"
                    title="Cỡ chữ lớn (19px)"
                    @click="fontSize = 'lg'"
                  >
                    A+
                  </button>
                </div>

                <!-- Đánh dấu hoàn thành bài học -->
                <v-btn
                  :color="isCompleted ? 'success' : 'grey-lighten-2'"
                  :variant="isCompleted ? 'flat' : 'outlined'"
                  rounded="pill"
                  size="small"
                  class="font-weight-bold text-none px-3"
                  @click="toggleCompleted"
                >
                  <v-icon :icon="isCompleted ? 'mdi-check-circle' : 'mdi-check-circle-outline'" class="mr-1" />
                  {{ isCompleted ? 'Đã hoàn thành' : 'Đánh dấu đã học' }}
                </v-btn>
              </div>
            </div>
          </v-card>

          <!-- KHU VỰC HIỂN THỊ NỘI DUNG BÀI HỌC THEO THẺ SƯ PHẠM (Cardified Pedagogical Content) -->
          <div v-if="lesson.content" class="lesson-cards-container" :class="`font-size-${fontSize}`">
            <!-- Render từng khối nội dung sư phạm đã phân tích -->
            <div
              v-for="(section, sIdx) in parsedSections"
              :key="sIdx"
              class="pedagogical-card mb-5"
              :class="`section-${section.type}`"
            >
              <!-- Tiêu đề khối sư phạm kèm icon màu sắc -->
              <div class="section-card-header d-flex align-center justify-space-between mb-3">
                <div class="d-flex align-center ga-2">
                  <v-avatar :color="section.badgeColor" size="32" class="section-avatar">
                    <v-icon :icon="section.icon" size="18" color="white" />
                  </v-avatar>
                  <span class="section-title text-subtitle-1 font-weight-black">
                    {{ section.title }}
                  </span>
                </div>
                <v-chip
                  v-if="section.tag"
                  :color="section.badgeColor"
                  variant="tonal"
                  size="x-small"
                  class="font-weight-black"
                >
                  {{ section.tag }}
                </v-chip>
              </div>

              <!-- Nội dung khối -->
              <div class="section-card-body text-body-1">
                <template v-for="(block, pIdx) in section.paragraphs" :key="pIdx">
                  <p v-if="block.type === 'text'" class="section-paragraph mb-2">
                    {{ block.content }}
                  </p>
                  <h3 v-else-if="block.type === 'subheading'" class="lesson-subheading">
                    {{ block.content }}
                  </h3>
                  <ul v-else-if="block.type === 'bullet-list'" class="lesson-list lesson-bullet-list">
                    <li v-for="(item, itemIdx) in block.items" :key="itemIdx">{{ item }}</li>
                  </ul>
                  <div v-else-if="block.type === 'steps'" class="lesson-steps">
                    <div v-for="(item, itemIdx) in block.items" :key="itemIdx" class="lesson-step">
                      <span class="lesson-step-number">{{ itemIdx + 1 }}</span>
                      <span class="lesson-step-text">{{ item }}</span>
                    </div>
                  </div>
                  <aside v-else-if="block.type === 'callout'" class="lesson-callout">
                    <span class="lesson-callout-label">{{ block.label }}</span>
                    <span>{{ block.content }}</span>
                  </aside>
                  <figure v-else class="lesson-image-block my-4">
                    <img :src="block.src" :alt="block.alt" loading="lazy" referrerpolicy="no-referrer" />
                    <figcaption v-if="block.alt">{{ block.alt }}</figcaption>
                  </figure>
                </template>

                <!-- Checkbox tương tác đặc biệt cho phần TỰ THỬ / THỬ THÁCH -->
                <div
                  v-if="section.type === 'practice'"
                  class="challenge-action mt-4 pa-3 rounded-lg d-flex align-center justify-space-between"
                  :class="{ 'challenge-done': challengeCompleted }"
                >
                  <div class="d-flex align-center ga-2">
                    <v-checkbox-btn
                      v-model="challengeCompleted"
                      color="purple"
                      density="compact"
                      hide-details
                    />
                    <span class="font-weight-bold text-body-2">
                      {{ challengeCompleted ? 'Tuyệt vời! Em đã hoàn thành thử thách này 🎉' : 'Em đã tự thử và làm được bài tập này chưa?' }}
                    </span>
                  </div>
                  <v-chip v-if="challengeCompleted" color="purple" variant="flat" size="small" class="font-weight-bold">
                    +10 Điểm tích cực
                  </v-chip>
                </div>
              </div>
            </div>
          </div>

          <!-- Trạng thái chưa có nội dung -->
          <div v-else class="text-center py-10 my-4 pa-6 rounded-xl bg-shub-empty bg-white">
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

          <!-- THANH CHUYỂN BÀI HỌC CUỐI TRANG (Bottom Lesson Pager) -->
          <v-card class="rounded-xl pa-4 bg-white mt-8 bottom-pager-card border" elevation="0">
            <div class="d-flex flex-column flex-sm-row justify-space-between align-center ga-4">
              <!-- Nút Bài trước -->
              <div class="w-100 w-sm-50 text-left">
                <v-btn
                  v-if="prevLesson"
                  variant="outlined"
                  color="secondary"
                  rounded="pill"
                  block
                  class="font-weight-bold text-none justify-start px-4 text-truncate"
                  @click="goToLesson(prevLesson.id)"
                >
                  <v-icon start icon="mdi-arrow-left" />
                  <span class="text-truncate">{{ t('lesson.previous', { title: prevLesson.title }) }}</span>
                </v-btn>
                <div v-else class="text-caption text-disabled px-4 py-2">
                  <v-icon icon="mdi-flag-outline" size="14" class="mr-1" />
                  {{ t('lesson.firstInChapter') }}
                </div>
              </div>

              <!-- Nút Bài tiếp theo -->
              <div class="lesson-next-wrap w-100 w-sm-50">
                <v-btn
                  v-if="nextLesson"
                  color="primary"
                  rounded="pill"
                  block
                  class="btn-shub-primary lesson-next-btn font-weight-bold text-none px-5"
                  @click="goToLesson(nextLesson.id)"
                >
                  <span class="lesson-next-copy">
                    <span class="lesson-next-label">{{ t('lesson.next') }}</span>
                    <span class="lesson-next-title">{{ nextLesson.title }}</span>
                  </span>
                  <v-icon class="lesson-next-icon" icon="mdi-arrow-right" />
                </v-btn>
                <div v-else class="text-caption text-success font-weight-bold px-4 py-2">
                  <v-icon icon="mdi-check-decagram" size="16" class="mr-1" />
                  {{ t('lesson.chapterComplete') }}
                </div>
              </div>
            </div>
          </v-card>

        </div>
      </v-container>

      <!-- Dialog Chỉnh Sửa Bài Học Cho Giáo Viên -->
      <v-dialog v-model="showEditDialog" max-width="720" persistent>
        <v-card class="rounded-xl pa-6">
          <div class="d-flex align-center mb-5">
            <v-avatar color="primary" variant="tonal" size="46" class="mr-3">
              <v-icon icon="mdi-file-document-edit-outline" size="24" color="primary" />
            </v-avatar>
            <div>
              <h2 class="text-h6 font-weight-black text-primary">{{ t('lesson.editTitle') }}</h2>
              <span class="text-caption text-secondary">{{ t('lesson.editSubtitle') }}</span>
            </div>
          </div>

          <v-form ref="formRef" @submit.prevent="handleUpdateLesson">
            <div class="mb-4">
              <label class="text-caption font-weight-bold text-secondary mb-1 d-block">{{ t('lesson.titleLabel') }}</label>
              <v-text-field
                v-model="editForm.title"
                :placeholder="t('lesson.titlePlaceholder')"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                color="primary"
                :rules="requiredRule"
                hide-details="auto"
              />
            </div>

            <div class="mb-4">
              <label class="text-caption font-weight-bold text-secondary mb-1 d-block">{{ t('lesson.orderLabel') }}</label>
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

            <!-- Thanh chèn mẫu sư phạm nhanh 1-Click -->
            <div class="mb-2">
              <div class="d-flex justify-space-between align-center mb-1">
                <label class="text-caption font-weight-bold text-secondary">{{ t('lesson.contentLabel') }}</label>
                <span class="text-caption text-secondary">{{ t('lesson.insertTemplateHint') }}</span>
              </div>
              <div class="d-flex flex-wrap ga-2 mb-2">
                <v-btn
                  size="x-small"
                  variant="tonal"
                  color="info"
                  rounded="pill"
                  class="font-weight-bold text-none"
                  @click="insertTemplate('MỤC TIÊU\nEm nói được mục tiêu bài học...')"
                >
                  + {{ t('lesson.templateObjective') }}
                </v-btn>
                <v-btn
                  size="x-small"
                  variant="tonal"
                  color="primary"
                  rounded="pill"
                  class="font-weight-bold text-none"
                  @click="insertTemplate('CÙNG HỌC\nKiến thức trọng tâm bài học...')"
                >
                  + {{ t('lesson.templateLearn') }}
                </v-btn>
                <v-btn
                  size="x-small"
                  variant="tonal"
                  color="success"
                  rounded="pill"
                  class="font-weight-bold text-none"
                  @click="insertTemplate('VÍ DỤ\nVí dụ minh họa cụ thể...')"
                >
                  + {{ t('lesson.templateExample') }}
                </v-btn>
                <v-btn
                  size="x-small"
                  variant="tonal"
                  color="warning"
                  rounded="pill"
                  class="font-weight-bold text-none"
                  @click="insertTemplate('EM GHI NHỚ\nĐiều quan trọng cần ghi nhớ...')"
                >
                  + {{ t('lesson.templateRemember') }}
                </v-btn>
                <v-btn
                  size="x-small"
                  variant="tonal"
                  color="purple"
                  rounded="pill"
                  class="font-weight-bold text-none"
                  @click="insertTemplate('TỰ THỬ\nThực hành bài tập tự thử...')"
                >
                  + {{ t('lesson.templatePractice') }}
                </v-btn>
              </div>
              <div class="d-flex align-center ga-2 mb-2">
                <v-btn size="small" variant="tonal" color="teal" prepend-icon="mdi-image-plus" @click="insertImage">
                  {{ t('lesson.insertImage') }}
                </v-btn>
                <span class="text-caption text-secondary">{{ t('lesson.imageUrlHint') }}</span>
              </div>
              <v-textarea
                v-model="editForm.content"
                :placeholder="t('lesson.contentPlaceholder')"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                rows="10"
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
                {{ t('lesson.cancel') }}
              </v-btn>
              <v-btn
                color="primary"
                rounded="pill"
                class="btn-shub-primary px-6 font-weight-bold"
                :loading="isSubmitting"
                @click="handleUpdateLesson"
              >
                {{ t('lesson.save') }}
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
          <v-btn variant="text" size="small" @click="snackbar.show = false">{{ t('lesson.close') }}</v-btn>
        </template>
      </v-snackbar>
    </v-main>
  </v-layout>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import AppHeader from '../../components/shared/AppHeader.vue'
import TeacherSidebar from '../../components/shared/TeacherSidebar.vue'
import StudentSidebar from '../../components/shared/StudentSidebar.vue'
import DuckBearMascot from '../../components/shared/DuckBearMascot.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

const lessonId = computed(() => route.params.id)
const lesson = ref(null)
const isLoading = ref(false)

// Kích thước chữ đọc ('sm' | 'md' | 'lg')
const fontSize = ref('md')

// Trạng thái đã hoàn thành bài học
const isCompleted = ref(false)

// Trạng thái thử thách tự thử
const challengeCompleted = ref(false)

// Trạng thái phát âm thanh Web Speech API
const isPlayingSpeech = ref(false)

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

// Thuộc tính tính toán về chương & sách
const chapter = computed(() => lesson.value?.chapter)
const book = computed(() => chapter.value?.book)
const bookTitle = computed(() => book.value?.title || '')
const chapterTitle = computed(() => chapter.value?.title || '')
const chapterLessons = computed(() => chapter.value?.lessons || [])

const currentLessonIndex = computed(() => {
  if (!chapterLessons.value.length) return 0
  const curId = Number(lessonId.value)
  const idx = chapterLessons.value.findIndex((l) => l.id === curId)
  return idx >= 0 ? idx : 0
})

const prevLesson = computed(() => {
  const idx = currentLessonIndex.value
  return idx > 0 ? chapterLessons.value[idx - 1] : null
})

const nextLesson = computed(() => {
  const idx = currentLessonIndex.value
  return idx < chapterLessons.value.length - 1 ? chapterLessons.value[idx + 1] : null
})

const questionCount = computed(() => lesson.value?.questions?.length || 0)

// Ước tính thời gian đọc bài học (~180 từ/phút)
const estimatedMinutes = computed(() => {
  if (!lesson.value?.content) return 1
  const wordCount = lesson.value.content.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(wordCount / 160))
})

// Breadcrumbs items
const breadcrumbItems = computed(() => {
  const items = [
    { title: t('lesson.library'), kind: 'library', disabled: false, href: '/' },
  ]
  if (book.value) {
    items.push({
      title: book.value.title,
      kind: 'book',
      disabled: false,
      href: `/books/${book.value.id}`,
    })
  }
  items.push({
    title: lesson.value?.title || t('lesson.fallbackTitle'),
    kind: 'lesson',
    disabled: true,
  })
  return items
})

// PHÂN TÍCH NỘI DUNG BÀI HỌC THÀNH CÁC THẺ SƯ PHẠM (Pedagogical Parser)
const parsedSections = computed(() => {
  const text = lesson.value?.content
  if (!text) return []

  const headerRegex = /(?:^|\n+)(YÊU CẦU CẦN ĐẠT|NỘI DUNG BÀI HỌC|MỤC TIÊU(?: BÀI HỌC)?|CÙNG HỌC|KHÁM PHÁ|LÝ THUYẾT|KIẾN THỨC MỚI|VÍ DỤ(?: MINH HỌA)?|EM GHI NHỚ|GHI NHỚ|TRỌNG TÂM|TỰ THỬ|LUYỆN TẬP|THỰC HÀNH|BÀI TẬP|VẬN DỤNG)(?:\n+|$)/gi

  const matches = [...text.matchAll(headerRegex)]

  if (!matches.length) {
    // Không có tiêu đề khối chuẩn -> hiển thị đoạn văn bài báo
    return [{
      type: 'theory',
      title: 'Nội dung bài học',
      icon: 'mdi-book-open-page-variant-outline',
      badgeColor: 'primary',
      tag: 'BÀI HỌC',
      paragraphs: parseContentBlocks(text),
    }]
  }

  const sections = []

  // Đoạn văn mở đầu trước tiêu đề đầu tiên (nếu có)
  const firstIndex = matches[0].index
  if (firstIndex > 0) {
    const intro = text.substring(0, firstIndex).trim()
    if (intro) {
      sections.push({
        type: 'theory',
        title: 'Giới thiệu bài học',
        icon: 'mdi-information-outline',
        badgeColor: 'primary',
        tag: 'MỞ ĐẦU',
        paragraphs: parseContentBlocks(intro),
      })
    }
  }

  for (let i = 0; i < matches.length; i++) {
    const currentMatch = matches[i]
    const rawHeader = currentMatch[1].trim().toUpperCase()
    const startIndex = currentMatch.index + currentMatch[0].length
    const endIndex = (i + 1 < matches.length) ? matches[i + 1].index : text.length
    const body = text.substring(startIndex, endIndex).trim()

    let type = 'theory'
    let title = 'Cùng học & Khám phá'
    let icon = 'mdi-book-open-page-variant-outline'
    let badgeColor = 'primary'
    let tag = 'LÝ THUYẾT'

    if (rawHeader.includes('MỤC TIÊU') || rawHeader.includes('YÊU CẦU CẦN ĐẠT')) {
      type = 'target'
      title = rawHeader.includes('YÊU CẦU CẦN ĐẠT') ? 'Yêu cầu cần đạt' : 'Mục tiêu bài học'
      icon = 'mdi-target'
      badgeColor = 'info'
      tag = 'MỤC TIÊU'
    } else if (rawHeader.includes('VÍ DỤ')) {
      type = 'example'
      title = 'Ví dụ minh họa'
      icon = 'mdi-lightbulb-on-outline'
      badgeColor = 'success'
      tag = 'VÍ DỤ'
    } else if (rawHeader.includes('GHI NHỚ') || rawHeader.includes('TRỌNG TÂM')) {
      type = 'remember'
      title = 'Em ghi nhớ'
      icon = 'mdi-pin-outline'
      badgeColor = 'warning'
      tag = 'TRỌNG TÂM'
    } else if (rawHeader.includes('TỰ THỬ') || rawHeader.includes('LUYỆN TẬP') || rawHeader.includes('THỰC HÀNH') || rawHeader.includes('BÀI TẬP')) {
      type = 'practice'
      title = 'Thử thách & Tự thử'
      icon = 'mdi-rocket-launch-outline'
      badgeColor = 'purple'
      tag = 'THỰC HÀNH'
    }

    sections.push({
      type,
      title,
      icon,
      badgeColor,
      tag,
      paragraphs: body ? parseContentBlocks(body) : [],
    })
  }

  return sections
})

function parseContentBlocks(text) {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  const blocks = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    const image = line.match(/^!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)$/i)
    if (image) {
      blocks.push({ type: 'image', alt: image[1], src: image[2] })
      index++
      continue
    }

    const step = line.match(/^Bước\s+\d+\s*[:.)-]\s*(.+)$/i)
    if (step) {
      const items = []
      while (index < lines.length) {
        const match = lines[index].match(/^Bước\s+\d+\s*[:.)-]\s*(.+)$/i)
        if (!match) break
        items.push(match[1])
        index++
      }
      blocks.push({ type: 'steps', items })
      continue
    }

    if (/^(?:[-*•▪]|–)\s+/.test(line)) {
      const items = []
      while (index < lines.length && /^(?:[-*•▪]|–)\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^(?:[-*•▪]|–)\s+/, ''))
        index++
      }
      blocks.push({ type: 'bullet-list', items })
      continue
    }

    const callout = line.match(/^(Ví dụ(?:\s*\d+)?|Lưu ý|Ghi nhớ|Kết luận|Đáp số(?: gợi ý)?|Nhận xét|Chú ý|Mẹo làm bài|Cách làm)\s*[:：]\s*(.*)$/i)
    if (callout) {
      blocks.push({ type: 'callout', label: callout[1], content: callout[2] })
      index++
      continue
    }

    if (isLessonSubheading(line)) {
      blocks.push({ type: 'subheading', content: line.replace(/^#{1,3}\s*/, '') })
      index++
      continue
    }

    if (/^\d+[.)]\s+/.test(line)) {
      const items = []
      while (index < lines.length && /^\d+[.)]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\d+[.)]\s+/, ''))
        index++
      }
      blocks.push({ type: 'steps', items })
      continue
    }

    blocks.push({ type: 'text', content: line.replace(/^\s*[-*•▪]\s+/, '') })
    index++
  }

  return blocks
}

function isLessonSubheading(line) {
  if (/^#{1,3}\s+\S/.test(line)) return true
  if (/^(?:[IVX]+\.|[A-Z]\.)\s+/.test(line)) return true
  if (line.length > 90 || /[.!?。]$/.test(line)) return false
  const letters = line.replace(/[^\p{L}]/gu, '')
  return letters.length >= 4 && line === line.toLocaleUpperCase('vi-VN')
}

// Lấy thông tin bài học
async function fetchLesson() {
  stopSpeech()
  isLoading.value = true
  try {
    const data = await api(`/lessons/${lessonId.value}`)
    lesson.value = data
    // Kiểm tra trạng thái hoàn thành từ localStorage
    const saved = localStorage.getItem(`duckbear_completed_lesson_${lessonId.value}`)
    isCompleted.value = saved === 'true'
    challengeCompleted.value = false
  } catch (err) {
    showNotice(err.message, 'error')
  } finally {
    isLoading.value = false
  }
}

// Chuyển bài học
function goToLesson(id) {
  if (id === Number(lessonId.value)) return
  router.push(`/lessons/${id}`)
}

// Bật/tắt trạng thái hoàn thành
function toggleCompleted() {
  isCompleted.value = !isCompleted.value
  localStorage.setItem(`duckbear_completed_lesson_${lessonId.value}`, String(isCompleted.value))
  if (isCompleted.value) {
    showNotice('Chúc mừng! Bạn đã hoàn thành bài học này 🎉')
  }
}

// Bật/tắt phát âm thanh bài giảng (Web Speech API)
function toggleSpeech() {
  if (isPlayingSpeech.value) {
    stopSpeech()
    return
  }

  if (!('speechSynthesis' in window)) {
    showNotice('Trình duyệt của bạn không hỗ trợ tính năng đọc văn bản', 'error')
    return
  }

  stopSpeech()

  // Thu thập nội dung bài giảng để đọc
  const speechText = `${lesson.value.title}. ${lesson.value.content || ''}`
  const utterance = new SpeechSynthesisUtterance(speechText)
  utterance.lang = 'vi-VN'
  utterance.rate = 0.95

  // Tìm giọng tiếng Việt nếu có
  const voices = window.speechSynthesis.getVoices()
  const viVoice = voices.find(v => v.lang.includes('vi') || v.lang.includes('VN'))
  if (viVoice) {
    utterance.voice = viVoice
  }

  utterance.onend = () => {
    isPlayingSpeech.value = false
  }

  utterance.onerror = () => {
    isPlayingSpeech.value = false
  }

  window.speechSynthesis.speak(utterance)
  isPlayingSpeech.value = true
  showNotice('Đang đọc bài giảng bằng giọng nói...')
}

function stopSpeech() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
  isPlayingSpeech.value = false
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

// Chèn mẫu cấu trúc sư phạm nhanh
function insertTemplate(template) {
  if (editForm.value.content && !editForm.value.content.endsWith('\n\n')) {
    editForm.value.content += '\n\n'
  }
  editForm.value.content += template
}

function insertImage() {
  const url = window.prompt('Dán đường dẫn ảnh công khai (https://):')?.trim()
  if (!url) return
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error('Invalid URL')
    const alt = window.prompt('Mô tả ngắn cho ảnh (tùy chọn):')?.trim() || 'Ảnh minh họa'
    insertTemplate(`![${alt.replace(/[\]\n]/g, '')}](${parsed.href})`)
  } catch {
    showNotice('Đường dẫn ảnh không hợp lệ. Hãy dùng URL bắt đầu bằng http:// hoặc https://.', 'error')
  }
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

    const updated = await api(`/lessons/${lessonId.value}`, {
      method: 'PATCH',
      body: payload,
    })

    // Cập nhật lại nội dung
    lesson.value = {
      ...lesson.value,
      ...updated,
    }
    showNotice('Cập nhật bài học thành công!')
    showEditDialog.value = false
  } catch (err) {
    showNotice(err.message, 'error')
  } finally {
    isSubmitting.value = false
  }
}

function goBack() {
  if (book.value) {
    router.push(`/books/${book.value.id}`)
  } else {
    router.back()
  }
}

// Watch id thay đổi khi bấm bài trước / bài tiếp theo
watch(
  () => route.params.id,
  (newId) => {
    if (newId) fetchLesson()
  }
)

onMounted(() => {
  fetchLesson()
})

onBeforeUnmount(() => {
  stopSpeech()
})
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}

.hover-link:hover {
  text-decoration: underline;
  cursor: pointer;
}

.lesson-navigation {
  width: 100%;
  min-width: 0;
}

.lesson-breadcrumbs {
  flex: 1 1 auto;
  min-width: 0;
  max-width: calc(100% - 285px);
}

.lesson-breadcrumbs :deep(.v-breadcrumbs-item) {
  min-width: 0;
}

.lesson-crumb-label {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lesson-crumb-library {
  max-width: 145px;
}

.lesson-crumb-book {
  max-width: 150px;
}

.lesson-crumb-lesson {
  display: -webkit-box;
  max-width: 250px;
  white-space: normal;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

@media (min-width: 601px) and (max-width: 900px) {
  .lesson-navigation {
    flex-direction: column !important;
    align-items: stretch !important;
  }

  .lesson-breadcrumbs {
    max-width: 100%;
  }
}

/* Hero card bài giảng */
.lesson-hero-card {
  border: 1px solid #E2EDFA !important;
  box-shadow: 0 8px 24px rgba(47, 124, 246, 0.05) !important;
}

/* Bộ điều chỉnh cỡ chữ */
.font-size-control {
  background: #F0F4FA;
}

.font-size-btn {
  border: none;
  background: transparent;
  color: #475467;
  font-weight: 700;
  font-size: 0.8rem;
  padding: 3px 8px;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.font-size-btn.active {
  background: #FFFFFF;
  color: #2F7CF6;
  box-shadow: 0 2px 6px rgba(47, 124, 246, 0.15);
}

/* Cỡ chữ bài học */
.font-size-sm .section-paragraph {
  font-size: 0.95rem;
  line-height: 1.75;
}

.font-size-sm :is(.lesson-bullet-list li, .lesson-step-text, .lesson-callout > span:last-child) {
  font-size: 0.95rem;
  line-height: 1.75;
}

.font-size-md .section-paragraph {
  font-size: 1.05rem;
  line-height: 1.85;
}

.font-size-md :is(.lesson-bullet-list li, .lesson-step-text, .lesson-callout > span:last-child) {
  font-size: 1.05rem;
  line-height: 1.85;
}

.font-size-lg .section-paragraph {
  font-size: 1.18rem;
  line-height: 1.95;
}

.font-size-lg :is(.lesson-bullet-list li, .lesson-step-text, .lesson-callout > span:last-child) {
  font-size: 1.18rem;
  line-height: 1.95;
}

.lesson-subheading {
  margin: 1.4rem 0 0.65rem;
  padding-left: 0.8rem;
  border-left: 4px solid #2F7CF6;
  color: #173B70;
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.5;
}

.lesson-list {
  display: grid;
  gap: 0.55rem;
  margin: 0.8rem 0 1rem;
  padding: 0;
  list-style: none;
}

.lesson-bullet-list li {
  position: relative;
  padding: 0.7rem 0.9rem 0.7rem 2.25rem;
  border: 1px solid #E2EDFA;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.76);
  color: #344054;
  line-height: 1.65;
}

.lesson-bullet-list li::before {
  position: absolute;
  top: 1.12rem;
  left: 0.95rem;
  width: 0.48rem;
  height: 0.48rem;
  border-radius: 50%;
  background: #2F7CF6;
  content: '';
}

.lesson-steps {
  display: grid;
  gap: 0.55rem;
  margin: 0.9rem 0 1.1rem;
}

.lesson-step {
  position: relative;
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr);
  gap: 0.75rem;
  align-items: start;
}

.lesson-step:not(:last-child)::after {
  position: absolute;
  top: 2rem;
  bottom: -0.65rem;
  left: 0.94rem;
  width: 2px;
  background: #CFE0FF;
  content: '';
}

.lesson-step-number {
  z-index: 1;
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border: 1px solid #CFE0FF;
  border-radius: 50%;
  background: #EAF2FF;
  color: #175CD3;
  font-size: 0.85rem;
  font-weight: 800;
}

.lesson-step-text {
  padding: 0.2rem 0 0.65rem;
  color: #344054;
  line-height: 1.7;
}

.lesson-callout {
  display: grid;
  gap: 0.25rem;
  margin: 0.85rem 0 1rem;
  padding: 0.85rem 1rem;
  border: 1px solid #B9E6D2;
  border-left: 4px solid #2BC48A;
  border-radius: 12px;
  background: #F2FBF7;
  color: #175C43;
  line-height: 1.7;
}

.lesson-callout-label {
  color: #087443;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

/* CÁC THẺ HỌC TẬP SƯ PHẠM (Pedagogical Cards) */
.pedagogical-card {
  border-radius: 20px;
  padding: 24px 28px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.pedagogical-card:hover {
  transform: translateY(-2px);
}

/* 1. Thẻ Mục Tiêu */
.section-target {
  background: #F0F7FF;
  border: 1.5px solid #D4E8FC;
  box-shadow: 0 4px 16px rgba(47, 124, 246, 0.04);
}
.section-target .section-title {
  color: #175CD3;
}
.section-target .section-paragraph {
  color: #1E3A5F;
  font-weight: 500;
}

/* 2. Thẻ Cùng Học & Khám Phá */
.section-theory {
  background: #FFFFFF;
  border: 1.5px solid #E2EDFA;
  box-shadow: 0 6px 20px rgba(47, 124, 246, 0.05);
}
.section-theory .section-title {
  color: #2F7CF6;
}
.section-theory .section-paragraph {
  color: #1D2939;
}

/* 3. Thẻ Ví Dụ Minh Họa */
.section-example {
  background: #F0FDF4;
  border: 1.5px solid #BBF7D0;
  box-shadow: 0 4px 16px rgba(43, 196, 138, 0.04);
}
.section-example .section-title {
  color: #027A48;
}
.section-example .section-paragraph {
  color: #054F31;
}

/* 4. Thẻ Em Ghi Nhớ */
.section-remember {
  background: #FFFDF5;
  border: 2px solid #FDE68A;
  box-shadow: 0 6px 24px rgba(255, 176, 32, 0.1);
}
.section-remember .section-title {
  color: #B54708;
}
.section-remember .section-paragraph {
  color: #712B08;
  font-weight: 600;
}

/* 5. Thẻ Thử Thách & Tự Thử */
.section-practice {
  background: #FAF5FF;
  border: 1.5px solid #E9D5FF;
  box-shadow: 0 4px 16px rgba(124, 92, 252, 0.05);
}
.section-practice .section-title {
  color: #6941C6;
}
.section-practice .section-paragraph {
  color: #381A78;
}

.lesson-image-block {
  margin-inline: auto;
  max-width: 720px;
  text-align: center;
}

.lesson-image-block img {
  display: block;
  max-width: 100%;
  max-height: 440px;
  height: auto;
  margin-inline: auto;
  border-radius: 14px;
  object-fit: contain;
  box-shadow: 0 8px 24px rgba(30, 64, 120, 0.12);
}

.lesson-image-block figcaption {
  margin-top: 8px;
  color: #667085;
  font-size: 0.875rem;
}

.challenge-action {
  background: #F3E8FF;
  border: 1px solid #D8B4FE;
  transition: all 0.25s ease;
}

.challenge-done {
  background: #E9D5FF;
  border-color: #C084FC;
}

/* Bottom Pager */
.bottom-pager-card {
  border: 1px solid #E2EDFA !important;
  box-shadow: 0 6px 20px rgba(47, 124, 246, 0.05) !important;
}

.btn-shub-primary {
  background: linear-gradient(135deg, #2F7CF6 0%, #1F5FD0 100%) !important;
  color: #FFFFFF !important;
  box-shadow: 0 6px 16px rgba(47, 124, 246, 0.25) !important;
}

.btn-shub-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 22px rgba(47, 124, 246, 0.35) !important;
}

.lesson-next-wrap {
  display: flex;
  justify-content: flex-end;
}

.lesson-next-btn {
  min-height: 68px !important;
  max-width: 540px;
  border-radius: 18px !important;
  text-align: left;
  white-space: normal;
}

.lesson-next-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.3;
}

.lesson-next-label {
  font-size: 0.72rem;
  font-weight: 600;
  opacity: 0.82;
}

.lesson-next-title {
  display: -webkit-box;
  overflow: hidden;
  width: 100%;
  font-size: 0.95rem;
  font-weight: 700;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.lesson-next-icon {
  flex: 0 0 auto;
  margin-inline-start: 12px;
}

.bg-shub-empty {
  border: 1.5px dashed #D4E5FA;
}

/* Animation */
.fade-in-up {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 600px) {
  .lesson-breadcrumbs {
    max-width: 100%;
  }

  .lesson-crumb-lesson {
    max-width: min(250px, calc(100vw - 72px));
  }

  .lesson-next-wrap {
    justify-content: stretch;
  }

  .lesson-next-btn {
    max-width: none;
  }

  .pedagogical-card {
    padding: 18px 16px;
    border-radius: 16px;
  }

  .lesson-bullet-list li {
    padding: 0.65rem 0.75rem 0.65rem 1.9rem;
  }

  .lesson-bullet-list li::before {
    left: 0.75rem;
  }

  .lesson-step {
    grid-template-columns: 1.8rem minmax(0, 1fr);
    gap: 0.6rem;
  }

  .lesson-step-number {
    width: 1.8rem;
    height: 1.8rem;
  }

  .lesson-step:not(:last-child)::after {
    top: 1.8rem;
    left: 0.85rem;
  }

  .lesson-callout {
    padding: 0.75rem 0.85rem;
  }
}
</style>
