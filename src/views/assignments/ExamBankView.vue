<template>
  <v-layout class="min-vh-100 exam-bank-page">
    <AppHeader />
    <TeacherSidebar />
    <v-main class="pb-16">
      <v-container class="py-6 px-4 px-md-8" style="max-width: 1240px">
        <!-- Hero Banner chuẩn SHub Classroom -->
        <section class="exam-bank-hero mb-6">
          <div class="hero-content">
            <div class="d-flex align-center ga-2 mb-1">
              <v-avatar color="primary" variant="tonal" size="28" rounded="lg">
                <v-icon icon="mdi-folder-star-outline" size="16" />
              </v-avatar>
              <span class="hero-eyebrow font-weight-bold">{{ t('examBank.eyebrow') }}</span>
            </div>
            <h1 class="text-h4 font-weight-black hero-title mb-2">{{ t('examBank.title') }}</h1>
            <p class="text-body-2 text-secondary hero-subtitle mb-0">
              {{ t('examBank.subtitle') }}
            </p>
          </div>
          <div class="hero-action mt-3 mt-sm-0">
            <v-btn
              color="primary"
              rounded="pill"
              elevation="0"
              prepend-icon="mdi-plus"
              class="px-5 font-weight-bold"
              @click="router.push('/assignments')"
            >
              {{ t('examBank.create') }}
            </v-btn>
          </div>
        </section>

        <!-- Thông báo lỗi & Loading -->
        <v-alert v-if="errorMessage" type="error" variant="tonal" rounded="xl" class="mb-4">{{ errorMessage }}</v-alert>
        <v-progress-linear v-if="loading" indeterminate color="primary" rounded class="mb-5" />

        <!-- Thanh KPI Thống kê kho đề -->
        <v-row v-if="!loading && templates.length" class="mb-5 kpi-row" dense>
          <v-col cols="6" sm="3">
            <v-card class="kpi-card pa-3 pa-md-4 rounded-xl border bg-white" elevation="0">
              <div class="d-flex align-center ga-3">
                <v-avatar color="primary" variant="tonal" rounded="lg" size="42">
                  <v-icon icon="mdi-file-document-multiple-outline" size="22" />
                </v-avatar>
                <div>
                  <div class="text-h6 font-weight-black text-primary lh-1">{{ kpiStats.total }}</div>
                  <div class="text-caption text-secondary mt-1">{{ t('examBank.totalExams') }}</div>
                </div>
              </div>
            </v-card>
          </v-col>
          <v-col cols="6" sm="3">
            <v-card class="kpi-card pa-3 pa-md-4 rounded-xl border bg-white" elevation="0">
              <div class="d-flex align-center ga-3">
                <v-avatar color="info" variant="tonal" rounded="lg" size="42">
                  <v-icon icon="mdi-book-education-outline" size="22" />
                </v-avatar>
                <div>
                  <div class="text-h6 font-weight-black text-info lh-1">{{ kpiStats.subjects }}</div>
                  <div class="text-caption text-secondary mt-1">{{ t('examBank.totalSubjects') }}</div>
                </div>
              </div>
            </v-card>
          </v-col>
          <v-col cols="6" sm="3">
            <v-card class="kpi-card pa-3 pa-md-4 rounded-xl border bg-white" elevation="0">
              <div class="d-flex align-center ga-3">
                <v-avatar color="purple" variant="tonal" rounded="lg" size="42">
                  <v-icon icon="mdi-school-outline" size="22" />
                </v-avatar>
                <div>
                  <div class="text-h6 font-weight-black text-purple lh-1">{{ kpiStats.grades }}</div>
                  <div class="text-caption text-secondary mt-1">{{ t('examBank.totalGrades') }}</div>
                </div>
              </div>
            </v-card>
          </v-col>
          <v-col cols="6" sm="3">
            <v-card class="kpi-card pa-3 pa-md-4 rounded-xl border bg-white" elevation="0">
              <div class="d-flex align-center ga-3">
                <v-avatar color="success" variant="tonal" rounded="lg" size="42">
                  <v-icon icon="mdi-help-box-multiple-outline" size="22" />
                </v-avatar>
                <div>
                  <div class="text-h6 font-weight-black text-success lh-1">{{ kpiStats.questions }}</div>
                  <div class="text-caption text-secondary mt-1">{{ t('examBank.totalQuestions') }}</div>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Thanh Tìm kiếm, Bộ lọc & Nút chuyển đổi giao diện -->
        <v-card v-if="!loading && templates.length" class="pa-3 mb-5 rounded-xl border bg-white filter-toolbar" elevation="0">
          <v-row align="center" dense>
            <!-- Ô tìm kiếm từ khóa -->
            <v-col cols="12" md="5">
              <v-text-field
                v-model="searchQuery"
                :placeholder="t('examBank.searchPlaceholder')"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                rounded="lg"
                hide-details
                clearable
                color="primary"
                class="bg-grey-lighten-5"
              />
            </v-col>

            <!-- Lọc theo Môn học -->
            <v-col v-if="subjectOptions.length > 2" cols="6" sm="4" md="2">
              <v-select
                v-model="selectedSubject"
                :items="subjectOptions"
                item-title="title"
                item-value="value"
                prepend-inner-icon="mdi-book-outline"
                variant="outlined"
                density="compact"
                rounded="lg"
                hide-details
                color="primary"
                class="bg-grey-lighten-5"
              />
            </v-col>

            <!-- Lọc theo Khối lớp -->
            <v-col v-if="gradeOptions.length > 2" cols="6" sm="4" md="2">
              <v-select
                v-model="selectedGrade"
                :items="gradeOptions"
                item-title="title"
                item-value="value"
                prepend-inner-icon="mdi-school-outline"
                variant="outlined"
                density="compact"
                rounded="lg"
                hide-details
                color="primary"
                class="bg-grey-lighten-5"
              />
            </v-col>

            <!-- Nút chế độ hiển thị Lưới ☷ / Bảng ☰ -->
            <v-col cols="12" sm="4" :md="subjectOptions.length <= 2 && gradeOptions.length <= 2 ? 7 : (subjectOptions.length <= 2 || gradeOptions.length <= 2 ? 5 : 3)" class="d-flex justify-end align-center ga-2 mt-2 mt-sm-0">
              <span class="text-caption text-secondary d-none d-lg-inline">
                {{ filteredTemplates.length }} / {{ templates.length }} {{ t('examBank.totalExams').toLowerCase() }}
              </span>
              <v-btn-toggle v-model="viewMode" mandatory rounded="lg" density="compact" color="primary" variant="outlined">
                <v-btn value="grid" :title="t('examBank.viewGrid')" class="px-3">
                  <v-icon icon="mdi-view-grid-outline" size="18" />
                </v-btn>
                <v-btn value="table" :title="t('examBank.viewTable')" class="px-3">
                  <v-icon icon="mdi-format-list-bulleted" size="18" />
                </v-btn>
              </v-btn-toggle>
            </v-col>
          </v-row>
        </v-card>

        <!-- TRƯỜNG HỢP 1: CHẾ ĐỘ LƯỚI (GRID VIEW) -->
        <v-row v-if="!loading && filteredTemplates.length && viewMode === 'grid'">
          <v-col v-for="template in filteredTemplates" :key="template.id" cols="12" md="6" lg="4">
            <v-card class="template-card rounded-2xl h-100" elevation="0">
              <!-- Dải màu môn học & Header thẻ -->
              <div class="template-card-header d-flex align-start justify-space-between mb-3">
                <div class="d-flex align-center ga-3 min-w-0">
                  <v-avatar
                    :style="{ background: getSubjectMeta(template.lesson.chapter.book.subject).bg, color: getSubjectMeta(template.lesson.chapter.book.subject).color }"
                    rounded="xl"
                    size="44"
                    class="subject-avatar"
                  >
                    <v-icon :icon="getSubjectMeta(template.lesson.chapter.book.subject).icon" size="22" />
                  </v-avatar>
                  <div class="min-w-0">
                    <div class="d-flex align-center ga-2 mb-1">
                      <v-chip
                        size="x-small"
                        class="font-weight-bold subject-chip"
                        :style="{ background: getSubjectMeta(template.lesson.chapter.book.subject).bg, color: getSubjectMeta(template.lesson.chapter.book.subject).color }"
                      >
                        {{ template.lesson.chapter.book.subject }}
                      </v-chip>
                      <v-chip size="x-small" variant="tonal" color="slate">
                        {{ t('examBank.grade', { grade: template.lesson.chapter.book.gradeLevel }) }}
                      </v-chip>
                    </div>
                  </div>
                </div>

                <!-- Nút Xóa nhanh ở góc -->
                <v-btn
                  icon="mdi-trash-can-outline"
                  size="x-small"
                  variant="text"
                  color="grey-darken-1"
                  class="delete-btn-ghost"
                  :title="t('examBank.delete')"
                  @click="requestDelete(template)"
                />
              </div>

              <!-- Tiêu đề đề thi & Sách giáo khoa -->
              <div class="mb-3">
                <h2 class="template-title font-weight-black mb-1" :title="template.title">
                  {{ template.title }}
                </h2>
                <div class="d-flex align-center ga-1 text-caption text-secondary text-truncate">
                  <v-icon icon="mdi-book-open-page-variant-outline" size="14" class="text-primary flex-shrink-0" />
                  <span class="text-truncate font-weight-medium">{{ template.lesson.chapter.book.title }}</span>
                </div>
              </div>

              <!-- Khung Chương & Bài học được phân tách tinh tế -->
              <div class="template-curriculum-box mb-4">
                <div class="curriculum-item d-flex align-start ga-2 mb-1">
                  <v-icon icon="mdi-bookmark-outline" size="14" class="text-secondary mt-1 flex-shrink-0" />
                  <div class="text-caption text-secondary text-truncate" :title="template.lesson.chapter.title">
                    {{ template.lesson.chapter.title }}
                  </div>
                </div>
                <div class="curriculum-item d-flex align-start ga-2">
                  <v-icon icon="mdi-text-box-outline" size="14" class="text-primary mt-1 flex-shrink-0" />
                  <div class="text-caption font-weight-bold text-slate-800 text-truncate" :title="template.lesson.title">
                    {{ template.lesson.title }}
                  </div>
                </div>
              </div>

              <!-- Metadata: Số câu hỏi & Thời gian -->
              <div class="d-flex align-center justify-space-between text-caption text-secondary mb-4 px-1">
                <div class="d-flex align-center ga-1 font-weight-medium">
                  <v-icon icon="mdi-help-circle-outline" size="15" color="primary" />
                  <span>{{ t('examBank.questionCount', { count: template.questions.length }) }}</span>
                </div>
                <div class="d-flex align-center ga-1">
                  <v-icon icon="mdi-calendar-clock-outline" size="14" />
                  <span>{{ formatDate(template.updatedAt) }}</span>
                </div>
              </div>

              <v-divider class="mb-3 border-dashed" />

              <!-- Thao tác cuối thẻ -->
              <div class="d-flex align-center justify-space-between ga-2 mt-auto">
                <v-btn
                  variant="outlined"
                  color="primary"
                  rounded="pill"
                  size="small"
                  prepend-icon="mdi-eye-outline"
                  class="text-none flex-grow-1"
                  @click="openPreview(template)"
                >
                  {{ t('examBank.preview') }}
                </v-btn>
                <v-btn
                  color="primary"
                  rounded="pill"
                  size="small"
                  elevation="0"
                  prepend-icon="mdi-send-outline"
                  class="text-none font-weight-bold flex-grow-1"
                  @click="useTemplate(template)"
                >
                  {{ t('examBank.use') }}
                </v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- TRƯỜNG HỢP 2: CHẾ ĐỘ BẢNG THU GỌN (TABLE VIEW) -->
        <v-card v-else-if="!loading && filteredTemplates.length && viewMode === 'table'" class="rounded-xl border bg-white overflow-hidden" elevation="0">
          <v-table density="comfortable" class="exam-table">
            <colgroup>
              <col class="exam-col-title" />
              <col class="exam-col-book" />
              <col class="exam-col-curriculum" />
              <col class="exam-col-count" />
              <col class="exam-col-date" />
              <col class="exam-col-actions" />
            </colgroup>
            <thead>
              <tr class="bg-grey-lighten-4">
                <th class="font-weight-black text-caption text-uppercase text-secondary">
                  {{ t('examBank.title') }}
                </th>
                <th class="font-weight-black text-caption text-uppercase text-secondary">
                  {{ t('examBank.bookLabel') }}
                </th>
                <th class="font-weight-black text-caption text-uppercase text-secondary">
                  {{ t('examBank.curriculumLabel') }}
                </th>
                <th class="font-weight-black text-caption text-uppercase text-secondary text-center text-no-wrap">
                  {{ t('examBank.questionCountShort') }}
                </th>
                <th class="font-weight-black text-caption text-uppercase text-secondary text-no-wrap">
                  {{ t('examBank.savedOn') }}
                </th>
                <th class="font-weight-black text-caption text-uppercase text-secondary text-right text-no-wrap">
                  {{ t('examBank.actions') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="template in filteredTemplates" :key="template.id" class="table-row-hover">
                <td>
                  <div class="d-flex align-center ga-3 py-2">
                    <v-avatar
                      :style="{ background: getSubjectMeta(template.lesson.chapter.book.subject).bg, color: getSubjectMeta(template.lesson.chapter.book.subject).color }"
                      rounded="lg"
                      size="36"
                    >
                      <v-icon :icon="getSubjectMeta(template.lesson.chapter.book.subject).icon" size="18" />
                    </v-avatar>
                    <div class="min-w-0">
                      <div class="font-weight-black text-body-2 text-truncate" :title="template.title">{{ template.title }}</div>
                      <div class="d-flex align-center ga-1 mt-1">
                        <v-chip size="x-small" class="font-weight-bold" :style="{ background: getSubjectMeta(template.lesson.chapter.book.subject).bg, color: getSubjectMeta(template.lesson.chapter.book.subject).color }">
                          {{ template.lesson.chapter.book.subject }}
                        </v-chip>
                        <v-chip size="x-small" variant="tonal">
                          {{ t('examBank.grade', { grade: template.lesson.chapter.book.gradeLevel }) }}
                        </v-chip>
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="d-flex align-center ga-1 text-caption font-weight-medium">
                    <v-icon icon="mdi-book-open-outline" size="14" class="text-primary flex-shrink-0" />
                    <span class="text-truncate" :title="template.lesson.chapter.book.title">{{ template.lesson.chapter.book.title }}</span>
                  </div>
                </td>
                <td>
                  <div class="exam-curriculum-title text-caption text-secondary mb-0_5" :title="template.lesson.chapter.title">
                    {{ template.lesson.chapter.title }}
                  </div>
                  <div class="exam-curriculum-title text-caption font-weight-bold text-slate-800" :title="template.lesson.title">
                    {{ template.lesson.title }}
                  </div>
                </td>
                <td class="text-center">
                  <v-chip size="small" color="primary" variant="tonal" class="font-weight-bold">
                    {{ template.questions.length }} câu
                  </v-chip>
                </td>
                <td>
                  <span class="text-caption text-secondary">{{ formatDate(template.updatedAt) }}</span>
                </td>
                <td class="text-right">
                  <div class="d-flex align-center justify-end ga-1">
                    <v-btn
                      icon="mdi-eye-outline"
                      size="small"
                      variant="text"
                      color="primary"
                      :title="t('examBank.preview')"
                      @click="openPreview(template)"
                    />
                    <v-btn
                      color="primary"
                      rounded="pill"
                      size="small"
                      elevation="0"
                      class="text-none px-3 font-weight-bold"
                      @click="useTemplate(template)"
                    >
                      {{ t('examBank.use') }}
                    </v-btn>
                    <v-btn
                      icon="mdi-trash-can-outline"
                      size="small"
                      variant="text"
                      color="error"
                      :title="t('examBank.delete')"
                      @click="requestDelete(template)"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>

        <!-- KHI TÌM KIẾM HOẶC LỌC KHÔNG CÓ KẾT QUẢ -->
        <v-card v-else-if="!loading && templates.length && !filteredTemplates.length" class="empty-state rounded-2xl text-center pa-10 my-4" elevation="0">
          <v-avatar color="warning" variant="tonal" size="64" class="mb-3">
            <v-icon icon="mdi-file-search-outline" size="32" />
          </v-avatar>
          <h2 class="text-h6 font-weight-black mb-1">{{ t('examBank.noSearchResult') }}</h2>
          <p class="text-body-2 text-secondary mb-4">{{ t('examBank.noSearchHint') }}</p>
          <v-btn color="primary" variant="outlined" rounded="pill" prepend-icon="mdi-refresh" @click="resetFilters">
            {{ t('examBank.resetFilter') }}
          </v-btn>
        </v-card>

        <!-- KHO ĐỀ TRỐNG HOÀN TOÀN -->
        <v-card v-else-if="!loading && !templates.length" class="empty-state rounded-2xl text-center pa-12 my-4" elevation="0">
          <v-avatar color="primary" variant="tonal" size="76" class="mb-4">
            <v-icon icon="mdi-folder-open-outline" size="38" />
          </v-avatar>
          <h2 class="text-h6 font-weight-black mb-2">{{ t('examBank.emptyTitle') }}</h2>
          <p class="text-body-2 text-secondary mb-6 mx-auto" style="max-width: 480px">
            {{ t('examBank.emptyHint') }}
          </p>
          <v-btn color="primary" rounded="pill" elevation="0" prepend-icon="mdi-plus" class="px-6 font-weight-bold" @click="router.push('/assignments')">
            {{ t('examBank.create') }}
          </v-btn>
        </v-card>
      </v-container>
    </v-main>

    <!-- MODAL XEM TRƯỚC ĐỀ THI (QUESTION PREVIEW MODAL) -->
    <v-dialog v-model="previewDialog" max-width="760" scrollable>
      <v-card rounded="2xl" class="preview-modal">
        <v-card-item class="pb-2 border-b">
          <div class="d-flex align-center justify-space-between w-100">
            <div class="d-flex align-center ga-3 min-w-0">
              <v-avatar
                v-if="selectedPreview"
                :style="{ background: getSubjectMeta(selectedPreview.lesson.chapter.book.subject).bg, color: getSubjectMeta(selectedPreview.lesson.chapter.book.subject).color }"
                rounded="lg"
                size="38"
              >
                <v-icon :icon="getSubjectMeta(selectedPreview.lesson.chapter.book.subject).icon" size="20" />
              </v-avatar>
              <div class="min-w-0">
                <div class="text-caption text-secondary font-weight-bold text-uppercase">{{ t('examBank.previewTitle') }}</div>
                <h3 class="text-h6 font-weight-black text-truncate">{{ selectedPreview?.title }}</h3>
              </div>
            </div>
            <v-btn icon="mdi-close" variant="text" size="small" @click="previewDialog = false" />
          </div>
        </v-card-item>

        <v-card-text class="pa-5" style="max-height: 65vh">
          <div v-if="selectedPreview" class="preview-meta-panel pa-3 mb-4 rounded-xl border bg-grey-lighten-5">
            <v-row dense>
              <v-col cols="12" sm="6">
                <div class="text-caption text-secondary">{{ t('examBank.bookLabel') }}</div>
                <div class="font-weight-bold text-body-2">{{ selectedPreview.lesson.chapter.book.title }}</div>
              </v-col>
              <v-col cols="12" sm="6">
                <div class="text-caption text-secondary">{{ t('examBank.curriculumLabel') }}</div>
                <div class="font-weight-medium text-body-2 text-truncate">
                  {{ selectedPreview.lesson.chapter.title }} · {{ selectedPreview.lesson.title }}
                </div>
              </v-col>
              <v-col cols="12" class="d-flex align-center ga-2 mt-2 pt-2 border-t">
                <v-chip size="small" color="primary" variant="tonal" class="font-weight-bold">
                  {{ selectedPreview.lesson.chapter.book.subject }}
                </v-chip>
                <v-chip size="small" variant="tonal">
                  {{ t('examBank.grade', { grade: selectedPreview.lesson.chapter.book.gradeLevel }) }}
                </v-chip>
                <v-chip size="small" color="success" variant="tonal" class="font-weight-bold">
                  {{ t('examBank.questionCount', { count: selectedPreview.questions.length }) }}
                </v-chip>
                <v-spacer />
                <span class="text-caption text-secondary">{{ formatDate(selectedPreview.updatedAt) }}</span>
              </v-col>
            </v-row>
          </div>

          <div class="text-subtitle-2 font-weight-black mb-3 d-flex align-center ga-2">
            <v-icon icon="mdi-format-list-numbered" size="18" color="primary" />
            <span>{{ t('examBank.questionList') }} ({{ selectedPreview?.questions.length }})</span>
          </div>

          <div class="question-preview-list d-flex flex-column ga-3">
            <div
              v-for="(item, idx) in selectedPreview?.questions"
              :key="item.id || idx"
              class="question-preview-item pa-4 rounded-xl border bg-white"
            >
              <div class="d-flex align-center justify-space-between ga-2 mb-2">
                <div class="d-flex align-center ga-2">
                  <v-chip size="small" color="primary" class="font-weight-black px-2">
                    {{ t('examBank.questionItem', { num: idx + 1 }) }}
                  </v-chip>
                  <v-chip size="small" variant="tonal">
                    {{ getQuestionTypeLabel(item.question?.type) }}
                  </v-chip>
                </div>
                <v-chip
                  v-if="item.question?.difficulty"
                  size="small"
                  :color="getDifficultyChip(item.question.difficulty).color"
                  variant="tonal"
                  class="font-weight-medium"
                >
                  {{ getDifficultyChip(item.question.difficulty).text }}
                </v-chip>
              </div>

              <!-- Nội dung câu hỏi -->
              <div class="question-text text-body-2 font-weight-medium text-slate-800">
                {{ item.question?.content || 'Chưa có nội dung câu hỏi' }}
              </div>
            </div>
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4 justify-space-between bg-grey-lighten-5">
          <v-btn variant="text" rounded="pill" class="text-none" @click="previewDialog = false">
            {{ t('examBank.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            rounded="pill"
            elevation="0"
            prepend-icon="mdi-send-outline"
            class="px-5 font-weight-bold text-none"
            @click="useTemplate(selectedPreview)"
          >
            {{ t('examBank.useNow') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DIALOG XÁC NHẬN XÓA ĐỀ MẪU -->
    <v-dialog v-model="deleteDialog" max-width="440">
      <v-card rounded="2xl" class="pa-5">
        <div class="d-flex align-center ga-3 mb-3">
          <v-avatar color="error" variant="tonal" size="44" rounded="xl">
            <v-icon icon="mdi-alert-circle-outline" size="24" />
          </v-avatar>
          <div>
            <h2 class="text-h6 font-weight-black text-slate-900">{{ t('examBank.confirmTitle') }}</h2>
            <div class="text-caption text-secondary">Hành động này không thể hoàn tác</div>
          </div>
        </div>
        <p class="text-body-2 text-secondary mb-4">
          {{ t('examBank.confirmDelete', { title: selectedTemplate?.title }) }}
        </p>
        <div class="d-flex justify-end ga-2">
          <v-btn variant="text" rounded="pill" class="text-none" @click="deleteDialog = false">
            {{ t('examBank.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            rounded="pill"
            elevation="0"
            class="text-none font-weight-bold px-4"
            :loading="deleting"
            @click="deleteTemplate"
          >
            {{ t('examBank.delete') }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { api } from '../../services/api'
import AppHeader from '../../components/shared/AppHeader.vue'
import TeacherSidebar from '../../components/shared/TeacherSidebar.vue'

const { t, locale } = useI18n()
const router = useRouter()

const templates = ref([])
const loading = ref(false)
const deleting = ref(false)
const errorMessage = ref('')
const deleteDialog = ref(false)
const selectedTemplate = ref(null)

// View mode, search & filter state
const viewMode = ref('grid') // 'grid' | 'table'
const searchQuery = ref('')
const selectedSubject = ref('ALL')
const selectedGrade = ref('ALL')

// Preview modal state
const previewDialog = ref(false)
const selectedPreview = ref(null)

onMounted(loadTemplates)

async function loadTemplates() {
  loading.value = true
  errorMessage.value = ''
  try {
    templates.value = await api('/assignments/templates')
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}

// KPI Thống kê
const kpiStats = computed(() => {
  const total = templates.value.length
  const subjects = new Set()
  const grades = new Set()
  let questions = 0

  templates.value.forEach(tmpl => {
    const subj = tmpl.lesson?.chapter?.book?.subject
    if (subj) subjects.add(subj)
    const gr = tmpl.lesson?.chapter?.book?.gradeLevel
    if (gr !== undefined && gr !== null) grades.add(gr)
    questions += tmpl.questions?.length || 0
  })

  return {
    total,
    subjects: subjects.size,
    grades: grades.size,
    questions,
  }
})

// Danh sách môn học cho dropdown lọc
const subjectOptions = computed(() => {
  const set = new Set()
  templates.value.forEach(tmpl => {
    const s = tmpl.lesson?.chapter?.book?.subject
    if (s) set.add(s)
  })
  const options = [{ title: t('examBank.allSubjects'), value: 'ALL' }]
  Array.from(set).sort().forEach(s => {
    options.push({ title: s, value: s })
  })
  return options
})

// Danh sách khối lớp cho dropdown lọc
const gradeOptions = computed(() => {
  const set = new Set()
  templates.value.forEach(tmpl => {
    const g = tmpl.lesson?.chapter?.book?.gradeLevel
    if (g !== undefined && g !== null) set.add(g)
  })
  const options = [{ title: t('examBank.allGrades'), value: 'ALL' }]
  Array.from(set).sort((a, b) => a - b).forEach(g => {
    options.push({ title: t('examBank.grade', { grade: g }), value: g })
  })
  return options
})

// Danh sách đề thi đã được lọc và tìm kiếm
const filteredTemplates = computed(() => {
  let list = templates.value

  // Lọc theo từ khóa
  if (searchQuery.value && searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(tmpl => {
      const title = (tmpl.title || '').toLowerCase()
      const book = (tmpl.lesson?.chapter?.book?.title || '').toLowerCase()
      const chap = (tmpl.lesson?.chapter?.title || '').toLowerCase()
      const les = (tmpl.lesson?.title || '').toLowerCase()
      const subj = (tmpl.lesson?.chapter?.book?.subject || '').toLowerCase()
      return title.includes(q) || book.includes(q) || chap.includes(q) || les.includes(q) || subj.includes(q)
    })
  }

  // Lọc theo Môn học
  if (selectedSubject.value && selectedSubject.value !== 'ALL') {
    list = list.filter(tmpl => tmpl.lesson?.chapter?.book?.subject === selectedSubject.value)
  }

  // Lọc theo Khối lớp
  if (selectedGrade.value && selectedGrade.value !== 'ALL') {
    list = list.filter(tmpl => tmpl.lesson?.chapter?.book?.gradeLevel === selectedGrade.value)
  }

  return list
})

function resetFilters() {
  searchQuery.value = ''
  selectedSubject.value = 'ALL'
  selectedGrade.value = 'ALL'
}

function useTemplate(template) {
  if (!template) return
  if (previewDialog.value) previewDialog.value = false
  router.push({ name: 'assignments', query: { templateId: template.id } })
}

function openPreview(template) {
  selectedPreview.value = template
  previewDialog.value = true
}

function requestDelete(template) {
  selectedTemplate.value = template
  deleteDialog.value = true
}

async function deleteTemplate() {
  if (!selectedTemplate.value) return
  deleting.value = true
  try {
    await api(`/assignments/templates/${selectedTemplate.value.id}`, { method: 'DELETE' })
    templates.value = templates.value.filter(({ id }) => id !== selectedTemplate.value.id)
    deleteDialog.value = false
    selectedTemplate.value = null
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    deleting.value = false
  }
}

function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat(locale.value === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'medium' }).format(new Date(value))
}

// Bảng màu & Icon sinh động theo môn học
function getSubjectMeta(subject) {
  if (!subject) return { bg: '#eff6ff', color: '#1d4ed8', icon: 'mdi-file-document-outline' }
  const s = subject.toLowerCase()
  if (s.includes('toán') || s.includes('math')) {
    return { bg: '#eff6ff', color: '#1d4ed8', icon: 'mdi-calculator-variant-outline' }
  }
  if (s.includes('văn') || s.includes('tiếng việt') || s.includes('literature')) {
    return { bg: '#fff7ed', color: '#c2410c', icon: 'mdi-book-open-page-variant-outline' }
  }
  if (s.includes('anh') || s.includes('english')) {
    return { bg: '#faf5ff', color: '#7e22ce', icon: 'mdi-translate' }
  }
  if (s.includes('khoa') || s.includes('sinh') || s.includes('hóa') || s.includes('lý') || s.includes('tự nhiên')) {
    return { bg: '#f0fdf4', color: '#15803d', icon: 'mdi-flask-outline' }
  }
  if (s.includes('sử') || s.includes('địa')) {
    return { bg: '#fffbeb', color: '#b45309', icon: 'mdi-compass-outline' }
  }
  return { bg: '#f1f5f9', color: '#334155', icon: 'mdi-file-document-outline' }
}

function getDifficultyChip(diff) {
  switch (diff) {
    case 'EASY':
    case 'EASY_LEVEL':
      return { text: 'Nhận biết', color: 'success' }
    case 'MEDIUM':
      return { text: 'Thông hiểu', color: 'info' }
    case 'HARD':
      return { text: 'Vận dụng', color: 'warning' }
    case 'VERY_HARD':
      return { text: 'Vận dụng cao', color: 'error' }
    default:
      return { text: diff || 'Tiêu chuẩn', color: 'secondary' }
  }
}

function getQuestionTypeLabel(type) {
  const normalizedType = String(type || '').trim().toUpperCase()
  const typeLabels = {
    MCQ: 'Trắc nghiệm một đáp án',
    MULTIPLE_CHOICE: 'Trắc nghiệm một đáp án',
    SINGLE_CHOICE: 'Trắc nghiệm một đáp án',
    MULTI_MCQ: 'Trắc nghiệm nhiều đáp án',
    TRUE_FALSE: 'Đúng / sai',
    MATCHING: 'Nối cặp',
    FILL: 'Điền khuyết',
    ESSAY: 'Tự luận',
    DRAG_DROP: 'Kéo thả',
  }
  return typeLabels[normalizedType] || 'Loại câu hỏi khác'
}
</script>

<style scoped>
.exam-bank-page {
  background: #f4f8ff;
  min-height: 100vh;
}

/* Hero Section */
.exam-bank-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 24px 28px;
  border: 1px solid #dce8fb;
  border-radius: 20px;
  background: linear-gradient(115deg, #ffffff 0%, #f8fbff 65%, #eaf2ff 100%);
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.04);
}

.hero-eyebrow {
  color: #1d4ed8;
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.hero-title {
  color: #0f172a;
  letter-spacing: -0.02em;
}

.hero-subtitle {
  color: #64748b;
  max-width: 640px;
  line-height: 1.5;
}

/* KPI Cards */
.kpi-card {
  border-color: #e2edfa !important;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.03);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.06);
}

/* Filter Toolbar */
.filter-toolbar {
  border-color: #e2edfa !important;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.03);
}

/* Template Card (Grid Mode) */
.template-card {
  display: flex;
  flex-direction: column;
  padding: 22px;
  border: 1px solid #e2edfa;
  background: #ffffff;
  box-shadow: 0 3px 12px rgba(15, 23, 42, 0.03);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.template-card:hover {
  transform: translateY(-4px);
  border-color: #93c5fd;
  box-shadow: 0 12px 28px rgba(37, 99, 235, 0.08);
}

.template-title {
  font-size: 1.05rem;
  line-height: 1.35;
  color: #0f172a;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.7rem;
}

.template-curriculum-box {
  padding: 10px 14px;
  border: 1px solid #e8f0fc;
  border-radius: 12px;
  background: #f8fbff;
}

.delete-btn-ghost {
  opacity: 0.6;
  transition: opacity 0.15s ease, color 0.15s ease;
}

.delete-btn-ghost:hover {
  opacity: 1;
  color: #ef4444 !important;
}

/* Table View */
.exam-table {
  background: transparent;
}

.exam-table :deep(.v-table__wrapper) {
  overflow-x: hidden;
}

.exam-table :deep(table) {
  width: 100%;
  min-width: 0;
  table-layout: fixed;
}

.exam-col-title { width: 21%; }
.exam-col-book { width: 17%; }
.exam-col-curriculum { width: 26%; }
.exam-col-count { width: 8%; }
.exam-col-date { width: 9%; }
.exam-col-actions { width: 19%; }

.exam-table :deep(th),
.exam-table :deep(td) {
  overflow: hidden;
  text-overflow: ellipsis;
}

.exam-table :deep(th) {
  white-space: nowrap;
}

.exam-curriculum-title {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.table-row-hover:hover {
  background: #f8fbff;
}

/* Empty State */
.empty-state {
  border: 2px dashed #cbd9ed;
  background: rgba(255, 255, 255, 0.85);
}

/* Question Preview Modal */
.preview-modal {
  border: 1px solid #dce8fb;
}

.question-preview-item {
  border-color: #e2edfa !important;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.02);
  transition: border-color 0.15s ease;
}

.question-preview-item:hover {
  border-color: #bfdbfe !important;
}

.question-text {
  line-height: 1.6;
  white-space: pre-wrap;
}

@media (max-width: 600px) {
  .exam-bank-hero {
    align-items: flex-start;
    flex-direction: column;
    padding: 20px;
  }
  .hero-title {
    font-size: 1.5rem !important;
  }
}
</style>
