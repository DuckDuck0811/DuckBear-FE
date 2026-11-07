<template>
  <v-layout class="min-vh-100 assignment-page">
    <AppHeader />
    <TeacherSidebar />
    <StudentSidebar />
    <v-main class="pb-16">
      <v-container class="py-5 px-4 px-md-8 assignment-container">
        <!-- Compact Hero Header -->
        <section class="assignment-hero mb-5">
          <div class="hero-copy">
            <div class="hero-eyebrow">
              <v-icon icon="mdi-clipboard-text-clock-outline" size="16" class="mr-1" />
              {{ t('assignmentHub.eyebrow') }}
            </div>
            <h1 class="text-h5 font-weight-black mb-1">
              {{ isStudent ? t('assignmentHub.studentTitle') : t('assignmentHub.teacherTitle') }}
            </h1>
            <p class="text-body-2 text-secondary mb-0">
              {{ isStudent ? t('assignmentHub.studentSubtitle') : t('assignmentHub.teacherSubtitle') }}
            </p>
          </div>
          <v-btn
            v-if="!isStudent"
            class="hero-action font-weight-bold text-none px-5"
            color="primary"
            rounded="pill"
            prepend-icon="mdi-plus"
            @click="openCreateDialog"
          >
            {{ t('assignmentHub.newAssignment') }}
          </v-btn>
        </section>

        <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>
        <v-progress-linear v-if="loading" indeterminate color="primary" rounded class="mb-4" />

        <!-- Thanh KPI Thống kê nhanh khi có bài tập -->
        <v-row v-if="assignments.length" class="mb-4 kpi-row" dense>
          <v-col cols="6" sm="3">
            <v-card class="kpi-card pa-3 rounded-xl border bg-white" elevation="0">
              <div class="d-flex align-center ga-3">
                <v-avatar color="primary" variant="tonal" rounded="lg" size="38">
                  <v-icon icon="mdi-clipboard-text-outline" size="20" />
                </v-avatar>
                <div>
                  <div class="text-h6 font-weight-black text-primary lh-1">{{ kpiStats.total }}</div>
                  <div class="text-caption text-secondary">{{ t('assignmentHub.totalAssignments') }}</div>
                </div>
              </div>
            </v-card>
          </v-col>
          <v-col cols="6" sm="3">
            <v-card class="kpi-card pa-3 rounded-xl border bg-white" elevation="0">
              <div class="d-flex align-center ga-3">
                <v-avatar color="success" variant="tonal" rounded="lg" size="38">
                  <v-icon icon="mdi-clock-check-outline" size="20" />
                </v-avatar>
                <div>
                  <div class="text-h6 font-weight-black text-success lh-1">{{ kpiStats.active }}</div>
                  <div class="text-caption text-secondary">{{ t('assignmentHub.activeAssignments') }}</div>
                </div>
              </div>
            </v-card>
          </v-col>
          <v-col cols="6" sm="3">
            <v-card class="kpi-card pa-3 rounded-xl border bg-white" elevation="0">
              <div class="d-flex align-center ga-3">
                <v-avatar color="error" variant="tonal" rounded="lg" size="38">
                  <v-icon icon="mdi-clock-alert-outline" size="20" />
                </v-avatar>
                <div>
                  <div class="text-h6 font-weight-black text-error lh-1">{{ kpiStats.expired }}</div>
                  <div class="text-caption text-secondary">{{ t('assignmentHub.expiredAssignments') }}</div>
                </div>
              </div>
            </v-card>
          </v-col>
          <v-col cols="6" sm="3">
            <v-card class="kpi-card pa-3 rounded-xl border bg-white" elevation="0">
              <div class="d-flex align-center ga-3">
                <v-avatar color="purple" variant="tonal" rounded="lg" size="38">
                  <v-icon icon="mdi-account-check-outline" size="20" />
                </v-avatar>
                <div>
                  <div class="text-h6 font-weight-black text-purple lh-1">{{ kpiStats.submissions }}</div>
                  <div class="text-caption text-secondary">{{ isStudent ? 'Lượt đã làm' : t('assignmentHub.totalSubmissions') }}</div>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Thanh Tìm kiếm, Bộ lọc & Nút chuyển đổi View Mode -->
        <v-card v-if="assignments.length" class="pa-3 mb-5 rounded-xl border bg-white filter-toolbar" elevation="0">
          <v-row align="center" dense>
            <!-- Ô tìm kiếm -->
            <v-col cols="12" md="4">
              <v-text-field
                v-model="searchQuery"
                :placeholder="t('assignmentHub.searchPlaceholder')"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                rounded="lg"
                hide-details
                clearable
                color="primary"
              />
            </v-col>

            <!-- Lọc theo Lớp (cho Giáo viên) -->
            <v-col v-if="!isStudent && classOptions.length > 1" cols="6" sm="4" md="3">
              <v-select
                v-model="selectedClassFilter"
                :items="classOptions"
                item-title="title"
                item-value="value"
                prepend-inner-icon="mdi-google-classroom"
                variant="outlined"
                density="compact"
                rounded="lg"
                hide-details
                color="primary"
              />
            </v-col>

            <!-- Lọc theo Trạng thái -->
            <v-col cols="6" sm="4" :md="!isStudent && classOptions.length > 1 ? 3 : 5">
              <div class="d-flex ga-1 flex-wrap">
                <v-btn
                  v-for="st in statusOptions"
                  :key="st.value"
                  size="small"
                  rounded="pill"
                  :color="statusFilter === st.value ? 'primary' : undefined"
                  :variant="statusFilter === st.value ? 'flat' : 'text'"
                  class="font-weight-bold text-none px-3"
                  @click="statusFilter = st.value"
                >
                  {{ st.title }}
                </v-btn>
              </div>
            </v-col>

            <!-- Nút chuyển đổi chế độ xem Table vs Grid -->
            <v-col cols="12" sm="4" md="2" class="d-flex justify-end align-center">
              <div class="view-toggle-group pa-1 rounded-pill border d-inline-flex align-center">
                <v-btn
                  size="x-small"
                  rounded="pill"
                  :color="viewMode === 'table' ? 'primary' : undefined"
                  :variant="viewMode === 'table' ? 'flat' : 'text'"
                  class="font-weight-bold"
                  icon="mdi-format-list-bulleted"
                  :title="t('assignmentHub.tableView')"
                  @click="setViewMode('table')"
                />
                <v-btn
                  size="x-small"
                  rounded="pill"
                  :color="viewMode === 'grid' ? 'primary' : undefined"
                  :variant="viewMode === 'grid' ? 'flat' : 'text'"
                  class="font-weight-bold"
                  icon="mdi-view-grid-outline"
                  :title="t('assignmentHub.gridView')"
                  @click="setViewMode('grid')"
                />
              </div>
            </v-col>
          </v-row>
        </v-card>

        <!-- CHẾ ĐỘ 1: XEM BẢNG DANH SÁCH TINH GỌN (TABLE VIEW - TIẾT KIỆM 70% DIỆN TÍCH) -->
        <v-card
          v-if="assignments.length && filteredAssignments.length && viewMode === 'table'"
          class="rounded-xl border overflow-hidden assignment-table-card mb-6"
          elevation="0"
        >
          <v-table hover class="assignment-table">
            <thead>
              <tr class="table-header-row">
                <th class="font-weight-black text-secondary">{{ t('assignmentHub.colAssignment') }}</th>
                <th class="font-weight-black text-secondary">{{ isStudent ? 'Giáo viên' : t('assignmentHub.colClass') }}</th>
                <th class="font-weight-black text-secondary">{{ t('assignmentHub.colMeta') }}</th>
                <th class="font-weight-black text-secondary">{{ t('assignmentHub.colDeadline') }}</th>
                <th class="font-weight-black text-secondary text-center">{{ isStudent ? t('assignmentHub.colAttempts') : t('assignmentHub.colSubmissions') }}</th>
                <th class="font-weight-black text-secondary text-center">{{ t('assignmentHub.colActions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="assignment in pagedAssignments"
                :key="assignment.id"
                class="assignment-tr"
              >
                <!-- Cột 1: Tên bài & Bài học -->
                <td class="py-3">
                  <div class="d-flex align-center ga-3">
                    <v-avatar color="primary" variant="tonal" rounded="lg" size="36" class="flex-shrink-0">
                      <v-icon icon="mdi-file-document-edit-outline" size="20" />
                    </v-avatar>
                    <div class="min-w-0">
                      <div class="font-weight-black text-primary text-body-2 text-truncate" :title="assignment.title">
                        {{ assignment.title }}
                      </div>
                      <div class="assignment-lesson text-caption text-secondary" :title="assignment.lesson?.title">
                        {{ assignment.lesson?.title || assignment.book?.title || 'Bài tập chung' }}
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Cột 2: Lớp học / Giáo viên -->
                <td>
                  <v-chip v-if="!isStudent" size="small" color="primary" variant="tonal" class="font-weight-bold">
                    {{ assignment.class?.name || 'Chưa gán lớp' }}
                  </v-chip>
                  <span v-else class="text-body-2 text-secondary font-weight-medium">
                    {{ assignment.createdBy?.fullName || 'Giáo viên' }}
                  </span>
                </td>

                <!-- Cột 3: Thời lượng & Số câu hỏi -->
                <td>
                  <div class="d-flex align-center ga-2 text-caption font-weight-medium text-secondary">
                    <span class="d-inline-flex align-center ga-1">
                      <v-icon icon="mdi-comment-multiple-outline" size="14" color="primary" />
                      {{ assignment._count?.questions || 0 }} {{ t('assignmentHub.questions') }}
                    </span>
                    <span>&middot;</span>
                    <span class="d-inline-flex align-center ga-1">
                      <v-icon icon="mdi-clock-outline" size="14" color="primary" />
                      {{ formatDuration(assignment.durationMinutes) }}
                    </span>
                  </div>
                </td>

                <!-- Cột 4: Hạn nộp & Trạng thái -->
                <td>
                  <div class="d-flex flex-column ga-1">
                    <div class="text-caption font-weight-medium" :class="{ 'text-secondary': assignment.deadline, 'text-disabled': !assignment.deadline }">
                      {{ assignment.deadline ? formatDate(assignment.deadline) : t('assignmentHub.noDeadline') }}
                    </div>
                    <div>
                      <v-chip v-if="assignment.deadline" size="x-small" :color="getDeadlineStatus(assignment).color" :variant="getDeadlineStatus(assignment).variant" class="font-weight-bold">
                        {{ getDeadlineStatus(assignment).label }}
                      </v-chip>
                    </div>
                  </div>
                </td>

                <!-- Cột 5: Lượt nộp / Lượt làm -->
                <td class="text-center">
                  <div v-if="isStudent">
                    <v-chip size="small" :color="studentStatusColor(assignment)" variant="tonal" class="font-weight-bold">
                      {{ studentStatus(assignment) }}
                    </v-chip>
                    <div class="text-caption text-secondary mt-1">
                      {{ t('assignmentHub.attemptsUsed', { used: assignment.myAttempts?.length || 0, max: attemptLimitLabel(assignment) }) }}
                    </div>
                  </div>
                  <div v-else>
                    <span class="font-weight-black text-body-2 text-primary">
                      {{ assignment._count?.attempts || 0 }}
                    </span>
                    <span class="text-caption text-secondary">&nbsp;{{ t('assignmentHub.submissions') }}</span>
                  </div>
                </td>

                <!-- Cột 6: Thao tác -->
                <td class="text-center">
                  <v-btn
                    v-if="isStudent"
                    color="primary"
                    rounded="pill"
                    size="small"
                    class="font-weight-bold text-none px-4"
                    :disabled="!canStart(assignment)"
                    @click="router.push({ name: 'assignment-take', params: { id: assignment.id } })"
                  >
                    {{ hasActiveAttempt(assignment) ? t('assignmentHub.continue') : t('assignmentHub.start') }}
                    <v-icon end :icon="hasActiveAttempt(assignment) ? 'mdi-arrow-right' : 'mdi-play'" />
                  </v-btn>
                  <v-btn
                    v-else
                    variant="tonal"
                    color="primary"
                    rounded="pill"
                    size="small"
                    prepend-icon="mdi-clipboard-list-outline"
                    class="font-weight-bold text-none px-3"
                    title="Bài nộp"
                    @click="openSubmissions(assignment)"
                  >
                    Bài nộp
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
          <ListPagination v-model="assignmentsPage" :total="filteredAssignments.length" />
        </v-card>

        <!-- CHẾ ĐỘ 2: XEM THẺ LƯỚI THU GỌN (COMPACT GRID VIEW - 3 ĐẾN 4 CỘT) -->
        <v-row v-else-if="assignments.length && filteredAssignments.length && viewMode === 'grid'">
          <v-col
            v-for="assignment in pagedAssignments"
            :key="assignment.id"
            cols="12"
            sm="6"
            lg="4"
            xl="3"
          >
            <v-card class="assignment-card-compact h-100 rounded-xl" elevation="0">
              <div class="card-compact-header d-flex justify-space-between align-center mb-2">
                <v-chip v-if="!isStudent" size="small" color="primary" variant="tonal" class="font-weight-bold">
                  {{ assignment.class?.name || 'Chưa gán lớp' }}
                </v-chip>
                <v-chip v-else size="small" :color="studentStatusColor(assignment)" variant="tonal" class="font-weight-bold">
                  {{ studentStatus(assignment) }}
                </v-chip>

                <v-chip size="x-small" :color="getDeadlineStatus(assignment).color" :variant="getDeadlineStatus(assignment).variant" class="font-weight-bold">
                  {{ getDeadlineStatus(assignment).label }}
                </v-chip>
              </div>

              <h3 class="card-compact-title text-truncate font-weight-black mb-1" :title="assignment.title">
                {{ assignment.title }}
              </h3>
              <p class="card-compact-sub text-truncate text-caption text-secondary mb-3" :title="assignment.lesson?.title">
                {{ assignment.lesson?.title || assignment.book?.title || 'Bài tập chung' }}<span v-if="isStudent"> &middot; {{ assignment.createdBy?.fullName }}</span>
              </p>

              <div class="card-compact-meta pa-2 rounded-lg mb-3">
                <div class="d-flex justify-space-between text-caption text-secondary mb-1">
                  <span><v-icon icon="mdi-comment-multiple-outline" size="14" color="primary" class="mr-1" />{{ assignment._count?.questions || 0 }} {{ t('assignmentHub.questions') }}</span>
                  <span><v-icon icon="mdi-clock-outline" size="14" color="primary" class="mr-1" />{{ formatDuration(assignment.durationMinutes) }}</span>
                </div>
                <div class="d-flex justify-space-between text-caption text-secondary">
                  <span class="text-truncate mr-2"><v-icon icon="mdi-calendar-clock-outline" size="14" color="primary" class="mr-1" />{{ assignment.deadline ? formatDate(assignment.deadline) : t('assignmentHub.noDeadline') }}</span>
                  <span class="font-weight-bold text-primary flex-shrink-0">
                    {{ isStudent ? `${assignment.myAttempts?.length || 0}/${attemptLimitLabel(assignment)}` : `${assignment._count?.attempts || 0} nộp` }}
                  </span>
                </div>
              </div>

              <div class="card-compact-footer mt-auto pt-1">
                <v-btn
                  v-if="isStudent"
                  color="primary"
                  rounded="pill"
                  size="small"
                  block
                  class="font-weight-bold text-none"
                  :disabled="!canStart(assignment)"
                  @click="router.push({ name: 'assignment-take', params: { id: assignment.id } })"
                >
                  {{ hasActiveAttempt(assignment) ? t('assignmentHub.continue') : t('assignmentHub.start') }}
                  <v-icon end :icon="hasActiveAttempt(assignment) ? 'mdi-arrow-right' : 'mdi-play'" />
                </v-btn>
                <v-btn
                  v-else
                  variant="tonal"
                  color="primary"
                  rounded="pill"
                  size="small"
                  block
                  prepend-icon="mdi-clipboard-list-outline"
                  class="font-weight-bold text-none"
                  @click="openSubmissions(assignment)"
                >
                  {{ t('assignmentHub.viewSubmissions') }}
                </v-btn>
              </div>
            </v-card>
          </v-col>
          <v-col cols="12"><ListPagination v-model="assignmentsPage" :total="filteredAssignments.length" /></v-col>
        </v-row>

        <!-- Trạng thái không tìm thấy bài tập khi lọc -->
        <v-card
          v-else-if="assignments.length && !filteredAssignments.length"
          class="assignment-empty rounded-xl text-center pa-8 border"
          elevation="0"
        >
          <v-icon icon="mdi-filter-remove-outline" size="44" color="secondary" class="mb-2" />
          <div class="text-h6 font-weight-bold mb-1">{{ t('assignmentHub.noMatchingAssignments') }}</div>
          <p class="text-body-2 text-secondary mb-4">Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.</p>
          <v-btn color="primary" variant="tonal" rounded="pill" size="small" class="font-weight-bold text-none px-4" @click="clearFilters">
            {{ t('assignmentHub.clearFilters') }}
          </v-btn>
        </v-card>

        <!-- Trạng thái chưa có bài tập nào -->
        <v-card v-else-if="!loading" class="assignment-empty rounded-xl border" elevation="0">
          <v-avatar color="primary" variant="tonal" size="72" class="mb-4">
            <v-icon :icon="isStudent ? 'mdi-clipboard-check-outline' : 'mdi-clipboard-text-outline'" size="34" />
          </v-avatar>
          <div class="text-h6 font-weight-bold mb-1">{{ isStudent ? t('assignmentHub.noStudentAssignments') : t('assignmentHub.noTeacherAssignments') }}</div>
          <p class="text-body-2 text-secondary mb-4">{{ isStudent ? t('assignmentHub.studentSubtitle') : t('assignmentHub.teacherSubtitle') }}</p>
          <v-btn v-if="!isStudent" color="primary" rounded="pill" prepend-icon="mdi-plus" @click="openCreateDialog">
            {{ t('assignmentHub.newAssignment') }}
          </v-btn>
        </v-card>
      </v-container>
    </v-main>

    <!-- Dialog Tạo bài tập -->
    <v-dialog v-model="createDialog" max-width="880" scrollable>
      <v-card class="create-dialog" rounded="xl">
        <v-card-title class="dialog-heading">
          <v-avatar color="primary" variant="tonal" rounded="lg"><v-icon icon="mdi-clipboard-plus-outline" /></v-avatar>
          <div><h2>{{ t('assignmentHub.newAssignment') }}</h2><p>{{ t('assignmentHub.dialogSubtitle') }}</p></div>
        </v-card-title>
        <v-card-text class="create-dialog-body">
          <v-alert v-if="formError" type="error" variant="tonal" class="mb-4">{{ formError }}</v-alert>
          <v-alert v-if="formSuccess" type="success" variant="tonal" class="mb-4">{{ formSuccess }}</v-alert>
          <v-text-field v-model="form.title" :label="t('assignmentHub.title')" variant="outlined" class="mb-2" prepend-inner-icon="mdi-format-title" />
          <div class="form-section-title"><span>1</span>{{ t('assignmentHub.selectClassAndLesson') }}</div>
          <v-row>
            <v-col cols="12" md="4"><v-select v-model="form.classId" :items="classes" item-title="name" item-value="id" :label="t('assignmentHub.class')" variant="outlined" hide-details /></v-col>
            <v-col cols="12" md="4"><v-select v-model="form.bookId" :items="books" item-title="title" item-value="id" :label="t('assignmentHub.book')" variant="outlined" hide-details @update:model-value="selectBook" /></v-col>
            <v-col cols="12" md="4"><v-select v-model="form.lessonId" :items="lessonOptions" item-title="title" item-value="id" :label="t('assignmentHub.lesson')" variant="outlined" hide-details :disabled="!form.bookId" @update:model-value="loadQuestions" /></v-col>
          </v-row>
          <v-alert v-if="form.lessonId === 'ALL'" type="info" variant="tonal" density="comfortable" class="mt-3">
            {{ t('assignmentHub.bookExamHint', { count: form.questionIds.length }) }}
          </v-alert>
          <!-- PHẦN 2: CHỌN CÂU HỎI (COMPACT QUESTION PICKER) -->
          <div v-if="form.lessonId" class="question-section mb-5">
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="form-section-title mb-0">
                <span>2</span>{{ t('assignmentHub.pickQuestions') }}
              </div>
              <div class="d-flex align-center ga-2">
                <!-- Status Chip -->
                <v-chip
                  size="small"
                  :color="form.lessonId === 'ALL' ? (form.questionIds.length === 40 ? 'success' : 'warning') : 'primary'"
                  variant="tonal"
                  class="font-weight-bold"
                >
                  <v-icon :icon="form.lessonId === 'ALL' && form.questionIds.length === 40 ? 'mdi-check-circle-outline' : 'mdi-checkbox-marked-circle-outline'" size="16" class="mr-1" />
                  {{ t('assignmentHub.selectedCount', { count: form.questionIds.length }) }}
                  <span v-if="form.lessonId === 'ALL'" class="ml-1 text-caption">/ 40</span>
                </v-chip>

                <!-- Collapse / Expand Toggle Button -->
                <v-btn
                  variant="text"
                  size="small"
                  density="comfortable"
                  color="secondary"
                  :prepend-icon="isQuestionsCollapsed ? 'mdi-chevron-down' : 'mdi-chevron-up'"
                  class="text-none font-weight-medium"
                  @click="isQuestionsCollapsed = !isQuestionsCollapsed"
                >
                  {{ isQuestionsCollapsed ? t('assignmentHub.expandQuestions') : t('assignmentHub.collapseQuestions') }}
                </v-btn>
              </div>
            </div>

            <!-- Loading State -->
            <div v-if="questionsLoading" class="py-8"><v-progress-linear indeterminate color="primary" rounded /></div>

            <!-- Empty State -->
            <v-alert v-else-if="!questions.length" type="info" variant="tonal" density="comfortable">{{ t('assignmentHub.noQuestionsInLesson') }}</v-alert>

            <!-- Tóm tắt khi thu gọn -->
            <div v-else-if="isQuestionsCollapsed" class="collapsed-summary pa-3 px-4 rounded-xl border bg-blue-lighten-5 d-flex align-center justify-space-between">
              <div class="d-flex align-center ga-2">
                <v-icon icon="mdi-check-circle" color="primary" size="20" />
                <span class="text-body-2 font-weight-bold text-slate-800">
                  {{ t('assignmentHub.questionsSummary', { selected: form.questionIds.length, total: questions.length }) }}
                </span>
                <span v-if="selectedTypeSummary" class="text-caption text-secondary">
                  &bull; {{ selectedTypeSummary }}
                </span>
              </div>
              <v-btn size="x-small" variant="tonal" color="primary" rounded="pill" class="text-none font-weight-bold" @click="isQuestionsCollapsed = false">
                {{ t('assignmentHub.expandQuestions') }}
              </v-btn>
            </div>

            <!-- Khung chọn câu hỏi độc lập (Toolbar + Scroll Box) -->
            <div v-else class="question-picker-container rounded-xl border bg-white overflow-hidden">
              <!-- Smart Question Toolbar -->
              <div class="question-toolbar pa-2 px-3 bg-grey-lighten-5 border-b">
                <v-row dense align="center">
                  <!-- Search box -->
                  <v-col cols="12" sm="4">
                    <v-text-field
                      v-model="questionSearchQuery"
                      :placeholder="t('assignmentHub.searchQuestionPlaceholder')"
                      prepend-inner-icon="mdi-magnify"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                      rounded="lg"
                      class="bg-white"
                    />
                  </v-col>

                  <!-- Filter by Type -->
                  <v-col cols="6" sm="2">
                    <v-select
                      v-model="questionTypeFilter"
                      :items="questionTypeOptions"
                      item-title="title"
                      item-value="value"
                      variant="outlined"
                      density="compact"
                      hide-details
                      rounded="lg"
                      class="bg-white"
                    />
                  </v-col>

                  <!-- Filter by Difficulty -->
                  <v-col cols="6" sm="2">
                    <v-select
                      v-model="questionDifficultyFilter"
                      :items="questionDifficultyOptions"
                      item-title="title"
                      item-value="value"
                      variant="outlined"
                      density="compact"
                      hide-details
                      rounded="lg"
                      class="bg-white"
                    />
                  </v-col>

                  <!-- Quick actions buttons -->
                  <v-col cols="12" sm="4" class="question-picker-actions d-flex justify-end align-center">
                    <!-- Button Chọn lại 40 câu ngẫu nhiên (nếu là ALL) -->
                    <v-btn
                      v-if="form.lessonId === 'ALL'"
                      variant="tonal"
                      color="primary"
                      size="small"
                      rounded="pill"
                      prepend-icon="mdi-dice-multiple-outline"
                      class="text-none font-weight-bold px-3"
                      @click="reshuffleBookQuestions"
                    >
                      {{ t('assignmentHub.reshuffle') }}
                    </v-btn>

                    <!-- Nút Chọn tất cả / Bỏ chọn cho bài đơn lẻ -->
                    <template v-else>
                      <v-btn
                        variant="text"
                        size="small"
                        color="primary"
                        class="question-picker-action text-none font-weight-bold px-1"
                        @click="selectAllQuestions"
                      >
                        {{ t('assignmentHub.selectAll') }}
                      </v-btn>
                      <span class="question-picker-divider text-grey-lighten-1">|</span>
                      <v-btn
                        variant="text"
                        size="small"
                        color="secondary"
                        class="question-picker-action text-none px-1"
                        @click="deselectAllQuestions"
                      >
                        {{ t('assignmentHub.deselectAll') }}
                      </v-btn>
                    </template>
                  </v-col>
                </v-row>

                <!-- Subtoolbar / Filter Status Bar -->
                <div class="d-flex align-center justify-space-between mt-2 pt-1 text-caption text-secondary border-t">
                  <div class="d-flex align-center ga-2">
                    <span class="font-weight-medium">{{ t('assignmentHub.questionsSummary', { selected: form.questionIds.length, total: questions.length }) }}</span>
                    <span v-if="filteredQuestions.length !== questions.length" class="text-primary font-weight-bold">
                      &bull; Lọc ra {{ filteredQuestions.length }} câu
                    </span>
                  </div>
                  <div class="d-flex align-center ga-1">
                    <v-btn-toggle v-model="questionSelectionFilter" mandatory density="compact" variant="text" color="primary">
                      <v-btn value="ALL" size="x-small" class="text-none px-2">{{ t('assignmentHub.filterAllStatus') }}</v-btn>
                      <v-btn value="SELECTED" size="x-small" class="text-none px-2">{{ t('assignmentHub.filterSelectedOnly') }} ({{ form.questionIds.length }})</v-btn>
                      <v-btn value="UNSELECTED" size="x-small" class="text-none px-2">{{ t('assignmentHub.filterUnselectedOnly') }} ({{ questions.length - form.questionIds.length }})</v-btn>
                    </v-btn-toggle>
                  </div>
                </div>
              </div>

              <!-- Khung cuộn độc lập chứa danh sách câu hỏi -->
              <div class="question-scroll-box pa-2">
                <!-- Empty filter message -->
                <div v-if="!filteredQuestions.length" class="text-center py-6 text-secondary text-caption">
                  <v-icon icon="mdi-filter-variant-remove" size="24" class="mb-1 d-block mx-auto text-grey" />
                  {{ t('assignmentHub.noQuestionsMatch') }}
                </div>

                <!-- Dòng câu hỏi siêu gọn (Compact Question Row) -->
                <div
                  v-for="(question, index) in pagedQuestions"
                  :key="question.id"
                  class="question-row-compact d-flex align-start pa-2 px-3 mb-1 rounded-lg"
                  :class="{
                    'question-row-selected': form.questionIds.includes(Number(question.id)),
                    'question-row-disabled': isDragQuestionIncomplete(question)
                  }"
                  @click="!isDragQuestionIncomplete(question) && toggleQuestion(question.id, !form.questionIds.includes(Number(question.id)))"
                >
                  <div class="d-flex align-start ga-2 min-w-0 flex-grow-1">
                    <v-checkbox-btn
                      :model-value="form.questionIds.includes(Number(question.id))"
                      :disabled="isDragQuestionIncomplete(question)"
                      density="compact"
                      color="primary"
                      class="question-row-checkbox"
                      @click.stop="toggleQuestion(question.id, !form.questionIds.includes(Number(question.id)))"
                    />
                    <span class="question-stt-badge flex-shrink-0">
                      #{{ (questionPage - 1) * questionPageSize + index + 1 }}
                    </span>
                    <div class="question-row-content min-w-0 flex-grow-1">
                      <div class="question-text text-body-2 font-weight-medium text-slate-800" :title="question.content">
                        {{ question.content }}
                      </div>
                      <div v-if="form.lessonId === 'ALL'" class="question-source-tag text-caption text-secondary" :title="question.lessonTitle">
                        <v-icon icon="mdi-bookmark-outline" size="11" class="mr-0_5 text-primary" />
                        <span>{{ question.lessonTitle?.split(' · ').at(-1) || question.lessonTitle }}</span>
                      </div>
                      <div class="d-flex align-center ga-1 flex-wrap mt-1">
                        <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-medium">
                          {{ t(`questionBank.types.${question.type}`) }}
                        </v-chip>
                        <v-chip size="x-small" :color="getDifficultyColor(question.difficulty)" variant="tonal" class="font-weight-medium">
                          {{ t(`questionBank.difficulties.${question.difficulty}`) }}
                        </v-chip>
                        <v-chip v-if="isDragQuestionIncomplete(question)" size="x-small" color="warning" variant="flat">
                          {{ t('assignmentHub.dragDataMissing') }}
                        </v-chip>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <ListPagination v-model="questionPage" :total="filteredQuestions.length" :page-size="questionPageSize" />
          <div class="form-section-title"><span>{{ form.lessonId ? 3 : 2 }}</span>{{ t('assignmentHub.conditions') }}</div>
          <v-row>
            <v-col cols="12" md="6"><v-text-field v-model="form.deadline" type="datetime-local" :min="minDeadline" :label="t('assignmentHub.deadlineOptional')" :hint="t('assignmentHub.deadlineHint')" persistent-hint variant="outlined" /></v-col>
            <v-col cols="6" md="3"><v-text-field v-model.number="form.durationMinutes" type="number" min="1" max="300" :label="t('assignmentHub.duration')" variant="outlined" /></v-col>
            <v-col cols="6" md="3"><v-text-field v-model.number="form.maxAttempts" type="number" min="0" :label="t('assignmentHub.maxAttempts')" :hint="t('assignmentHub.unlimitedAttemptsHint')" persistent-hint variant="outlined" /></v-col>
            <v-col cols="12" sm="6"><v-checkbox v-model="form.shuffleQuestions" :label="t('assignmentHub.shuffleQuestions')" :hint="t('assignmentHub.shuffleQuestionsHint')" persistent-hint hide-details="auto" color="primary" /></v-col>
            <v-col cols="12" sm="6"><v-checkbox v-model="form.shuffleOptions" :label="t('assignmentHub.shuffleOptions')" :hint="t('assignmentHub.shuffleOptionsHint')" persistent-hint hide-details="auto" color="primary" /></v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-5 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="createDialog = false">{{ t('assignmentHub.cancel') }}</v-btn>
          <v-btn v-if="!isStudent && form.lessonId !== 'ALL'" variant="tonal" color="primary" prepend-icon="mdi-content-save-outline" :loading="savingTemplate" @click="saveTemplate">{{ t('examBank.saveTemplate') }}</v-btn>
          <v-btn color="primary" rounded="pill" prepend-icon="mdi-send-outline" :loading="saving" :disabled="form.lessonId === 'ALL' && form.questionIds.length !== 40" @click="saveAssignment">{{ t('assignmentHub.assign') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Xem bài nộp -->
    <v-dialog v-model="submissionsDialog" max-width="900" scrollable>
      <v-card rounded="xl">
        <v-card-title class="pa-5 d-flex align-center justify-space-between">
          <div class="text-truncate">
            <span class="font-weight-black text-h6">{{ selectedAssignment?.title }}</span>
            <span class="text-secondary text-body-2 ml-2">&middot; {{ t('assignmentHub.submissions') }}</span>
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" @click="submissionsDialog = false" />
        </v-card-title>
        <v-card-text>
          <v-progress-linear v-if="loadingSubmissions" indeterminate color="primary" />
          <div v-else-if="!submissionDetails?.attempts?.length" class="text-body-2 text-secondary py-6 text-center">
            {{ t('assignmentHub.noSubmissions') }}
          </div>
          <div v-else>
          <v-expansion-panels variant="accordion">
            <v-expansion-panel v-for="attempt in pagedSubmissionAttempts" :key="attempt.id">
              <v-expansion-panel-title>
                <div class="d-flex flex-wrap align-center ga-3">
                  <strong>{{ attempt.student.fullName }}</strong>
                  <span>{{ t('assignmentHub.attemptLabel', { number: attempt.attemptNo, max: submissionDetails.maxAttempts ? submissionDetails.maxAttempts : t('assignmentHub.unlimited') }) }}</span>
                  <span>{{ attempt.submittedAt ? formatDate(attempt.submittedAt) : t('assignmentHub.inProgress') }}</span>
                  <v-chip v-if="attempt.score !== null" size="x-small" color="success" variant="tonal">{{ attempt.score }}%</v-chip>
                  <v-chip v-else-if="attempt.submittedAt && hasEssayAnswers(attempt)" size="x-small" color="warning" variant="tonal">{{ t('assignmentHub.awaitingGrade') }}</v-chip>
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <div v-for="(answer, index) in attempt.answers" :key="answer.id" class="mb-4">
                  <div class="font-weight-bold">{{ index + 1 }}. {{ answer.question.content }}</div>
                  <div class="text-body-2 text-secondary">{{ t('assignmentHub.studentAnswer') }}: {{ answer.selectedOption?.content || answer.displayAnswer || t('assignmentHub.noAnswer') }}</div>
                  <v-img v-if="answer.imageUrl" :src="answer.imageUrl" :alt="t('assignmentHub.attachedWork')" max-height="360" max-width="640" width="100%" contain rounded="lg" class="mt-3 submission-image" />
                  <v-chip v-if="answer.isCorrect !== null" size="x-small" :color="answer.isCorrect ? 'success' : 'error'" variant="tonal" class="mt-1">
                    {{ answer.isCorrect ? t('assignmentHub.correct') : t('assignmentHub.incorrect') }}
                  </v-chip>
                  <div v-if="answer.question.type === 'ESSAY' && attempt.submittedAt" class="essay-grade-fields mt-3">
                    <v-text-field v-model.number="answer.score" type="number" min="0" :max="answer.points" step="0.1" :label="t('assignmentHub.gradePoints', { points: answer.points })" variant="outlined" density="compact" hide-details />
                    <v-textarea v-model="answer.teacherFeedback" :label="t('assignmentHub.teacherFeedback')" variant="outlined" density="compact" rows="2" auto-grow hide-details />
                  </div>
                  <div v-else-if="answer.teacherFeedback" class="teacher-feedback mt-2"><strong>{{ t('assignmentHub.teacherFeedback') }}:</strong> {{ answer.teacherFeedback }}</div>
                </div>
                <v-alert v-if="gradeErrors[attempt.id]" type="error" variant="tonal" density="compact" class="mt-3">{{ gradeErrors[attempt.id] }}</v-alert>
                <div v-if="attempt.submittedAt && hasEssayAnswers(attempt)" class="d-flex justify-end mt-3">
                  <v-btn color="primary" size="small" rounded="pill" prepend-icon="mdi-check-decagram-outline" :loading="gradingAttemptId === attempt.id" :disabled="!canSaveGrade(attempt)" @click="saveAttemptGrade(attempt)">
                    {{ t('assignmentHub.returnGrade') }}
                  </v-btn>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
          <ListPagination v-model="submissionPage" :total="submissionDetails.attempts.length" />
          </div>
        </v-card-text>
        <v-card-actions class="pa-5 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="submissionsDialog = false">{{ t('assignmentHub.cancel') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import AppHeader from '../../components/shared/AppHeader.vue'
import TeacherSidebar from '../../components/shared/TeacherSidebar.vue'
import StudentSidebar from '../../components/shared/StudentSidebar.vue'
import ListPagination from '../../components/shared/ListPagination.vue'

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const isStudent = computed(() => auth.user?.role === 'STUDENT')
const loading = ref(false)
const saving = ref(false)
const savingTemplate = ref(false)
const questionsLoading = ref(false)
const createDialog = ref(false)
const submissionsDialog = ref(false)
const loadingSubmissions = ref(false)
const selectedAssignment = ref(null)
const submissionDetails = ref(null)
const submissionPage = ref(1)
const gradingAttemptId = ref(null)
const gradeErrors = ref({})
const submissionPageSize = 20
const errorMessage = ref('')
const formError = ref('')
const formSuccess = ref('')
const assignments = ref([])
const assignmentsPage = ref(1)
const assignmentPageSize = 20
const classes = ref([])
const books = ref([])
const bookDetails = ref(null)
const questions = ref([])
const minDeadline = ref(toLocalDateTimeInput(Date.now()))

// State chế độ xem & bộ lọc
const viewMode = ref(localStorage.getItem('duckbear_assignment_view_mode') || 'table')
const searchQuery = ref('')
const selectedClassFilter = ref('ALL')
const statusFilter = ref('ALL')

// State Question Picker nâng cấp
const isQuestionsCollapsed = ref(false)
const questionSearchQuery = ref('')
const questionTypeFilter = ref('ALL')
const questionDifficultyFilter = ref('ALL')
const questionSelectionFilter = ref('ALL')
const questionPage = ref(1)
const questionPageSize = 20

function setViewMode(mode) {
  viewMode.value = mode
  localStorage.setItem('duckbear_assignment_view_mode', mode)
}

function clearFilters() {
  searchQuery.value = ''
  selectedClassFilter.value = 'ALL'
  statusFilter.value = 'ALL'
}

// Helpers cho Question Picker
const questionTypeOptions = computed(() => [
  { title: t('assignmentHub.filterAllTypes'), value: 'ALL' },
  { title: t('questionBank.types.MULTIPLE_CHOICE'), value: 'MULTIPLE_CHOICE' },
  { title: t('questionBank.types.ESSAY'), value: 'ESSAY' },
  { title: t('questionBank.types.DRAG_DROP'), value: 'DRAG_DROP' },
  { title: t('questionBank.types.MATCHING'), value: 'MATCHING' },
].filter(opt => opt.value === 'ALL' || questions.value.some(q => q.type === opt.value)))

const questionDifficultyOptions = computed(() => [
  { title: t('assignmentHub.filterAllDifficulties'), value: 'ALL' },
  { title: t('questionBank.difficulties.EASY'), value: 'EASY' },
  { title: t('questionBank.difficulties.MEDIUM'), value: 'MEDIUM' },
  { title: t('questionBank.difficulties.HARD'), value: 'HARD' },
  { title: t('questionBank.difficulties.VERY_HARD'), value: 'VERY_HARD' },
].filter(opt => opt.value === 'ALL' || questions.value.some(q => q.difficulty === opt.value)))

const filteredQuestions = computed(() => {
  let list = questions.value
  const q = questionSearchQuery.value?.trim().toLowerCase()
  if (q) list = list.filter(qn => (qn.content || '').toLowerCase().includes(q) || (qn.lessonTitle || '').toLowerCase().includes(q))
  if (questionTypeFilter.value !== 'ALL') list = list.filter(qn => qn.type === questionTypeFilter.value)
  if (questionDifficultyFilter.value !== 'ALL') list = list.filter(qn => qn.difficulty === questionDifficultyFilter.value)
  if (questionSelectionFilter.value === 'SELECTED') list = list.filter(qn => form.questionIds.includes(Number(qn.id)))
  if (questionSelectionFilter.value === 'UNSELECTED') list = list.filter(qn => !form.questionIds.includes(Number(qn.id)))
  return list
})
const pagedQuestions = computed(() => filteredQuestions.value.slice((questionPage.value - 1) * questionPageSize, questionPage.value * questionPageSize))
watch([questionSearchQuery, questionTypeFilter, questionDifficultyFilter, questionSelectionFilter], () => { questionPage.value = 1 })
watch(() => Math.ceil(filteredQuestions.value.length / questionPageSize), pageCount => {
  if (questionPage.value > pageCount) questionPage.value = Math.max(1, pageCount)
})

const selectedTypeSummary = computed(() => {
  if (!form.questionIds.length || !questions.value.length) return ''
  const typeCount = {}
  questions.value.filter(q => form.questionIds.includes(Number(q.id))).forEach(q => {
    typeCount[q.type] = (typeCount[q.type] || 0) + 1
  })
  return Object.entries(typeCount).map(([type, count]) => `${count} ${t(`questionBank.types.${type}`)}`).join(' · ')
})

function getDifficultyColor(diff) {
  switch (diff) {
    case 'EASY': return 'success'
    case 'MEDIUM': return 'info'
    case 'HARD': return 'warning'
    case 'VERY_HARD': return 'error'
    default: return 'secondary'
  }
}

function selectAllQuestions() {
  const validIds = questions.value.filter(q => !isDragQuestionIncomplete(q)).map(q => Number(q.id))
  form.questionIds = [...new Set([...form.questionIds, ...validIds])]
}

function deselectAllQuestions() {
  form.questionIds = []
}

async function reshuffleBookQuestions() {
  if (!bookDetails.value) return
  questionsLoading.value = true
  formError.value = ''
  try {
    const lessonQuestionSets = await Promise.all(lessons.value.map(async (lesson) => ({
      lesson,
      questions: await api(`/lessons/${lesson.id}/questions`),
    })))
    const pools = lessonQuestionSets.map(({ lesson, questions: lessonQuestions }) => ({
      lesson,
      questions: lessonQuestions.filter(q => !isDragQuestionIncomplete(q)).sort(() => Math.random() - 0.5),
      cursor: 0,
    }))
    const selected = []
    while (selected.length < 40 && pools.some(pool => pool.cursor < pool.questions.length)) {
      for (const pool of pools) {
        if (selected.length >= 40) break
        if (pool.cursor < pool.questions.length) {
          selected.push({ ...pool.questions[pool.cursor++], lessonTitle: pool.lesson.title })
        }
      }
    }
    questions.value = pools.flatMap(pool => pool.questions.map(q => ({ ...q, lessonTitle: pool.lesson.title })))
    form.questionIds = selected.map(({ id }) => Number(id))
    if (selected.length < 40) formError.value = t('assignmentHub.bookExamInsufficient', { available: selected.length })
  } catch (error) {
    formError.value = error.message
  } finally {
    questionsLoading.value = false
  }
}

// Helpers kiểm tra hạn nộp
function isExpired(assignment) {
  return assignment.deadline && new Date(assignment.deadline).getTime() < Date.now()
}

function isEndingSoon(assignment) {
  if (!assignment.deadline || isExpired(assignment)) return false
  const diff = new Date(assignment.deadline).getTime() - Date.now()
  return diff <= 24 * 60 * 60 * 1000 // Còn dưới 24h
}

function getDeadlineStatus(assignment) {
  if (!assignment.deadline) {
    return { label: t('assignmentHub.noDeadline'), color: 'secondary', variant: 'tonal' }
  }
  if (isExpired(assignment)) {
    return { label: t('assignmentHub.statusExpired'), color: 'error', variant: 'tonal' }
  }
  if (isEndingSoon(assignment)) {
    return { label: t('assignmentHub.statusEndingSoon'), color: 'warning', variant: 'flat' }
  }
  return { label: t('assignmentHub.statusActive'), color: 'success', variant: 'tonal' }
}

// KPI Thống kê nhanh
const kpiStats = computed(() => {
  const total = assignments.value.length
  let active = 0
  let expired = 0
  let submissions = 0

  for (const a of assignments.value) {
    if (isExpired(a)) {
      expired++
    } else {
      active++
    }
    submissions += a._count?.attempts || a.myAttempts?.length || 0
  }

  return { total, active, expired, submissions }
})

// Danh sách lớp học cho dropdown lọc
const classOptions = computed(() => {
  const options = [{ title: t('assignmentHub.allClasses'), value: 'ALL' }]
  for (const c of classes.value) {
    options.push({ title: c.name, value: c.id })
  }
  return options
})

// Danh sách tùy chọn trạng thái
const statusOptions = computed(() => [
  { title: t('assignmentHub.statusAll'), value: 'ALL' },
  { title: t('assignmentHub.statusActive'), value: 'ACTIVE' },
  { title: t('assignmentHub.statusExpired'), value: 'EXPIRED' },
])

// Danh sách bài tập đã lọc
const filteredAssignments = computed(() => {
  let list = assignments.value

  // 1. Lọc theo lớp học
  if (selectedClassFilter.value !== 'ALL') {
    list = list.filter((a) => a.classId === Number(selectedClassFilter.value))
  }

  // 2. Lọc theo trạng thái
  if (statusFilter.value === 'ACTIVE') {
    list = list.filter((a) => !isExpired(a))
  } else if (statusFilter.value === 'EXPIRED') {
    list = list.filter((a) => isExpired(a))
  }

  // 3. Lọc theo từ khóa tìm kiếm
  if (searchQuery.value && searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter((a) => {
      const matchTitle = (a.title || '').toLowerCase().includes(q)
      const matchLesson = (a.lesson?.title || '').toLowerCase().includes(q)
      const matchClass = (a.class?.name || '').toLowerCase().includes(q)
      const matchTeacher = (a.createdBy?.fullName || '').toLowerCase().includes(q)
      return matchTitle || matchLesson || matchClass || matchTeacher
    })
  }

  return list
})
const pagedAssignments = computed(() => filteredAssignments.value.slice((assignmentsPage.value - 1) * assignmentPageSize, assignmentsPage.value * assignmentPageSize))
const pagedSubmissionAttempts = computed(() => (submissionDetails.value?.attempts || []).slice((submissionPage.value - 1) * submissionPageSize, submissionPage.value * submissionPageSize))
watch([searchQuery, selectedClassFilter, statusFilter], () => { assignmentsPage.value = 1 })
watch(() => Math.ceil(filteredAssignments.value.length / assignmentPageSize), pageCount => {
  if (assignmentsPage.value > pageCount) assignmentsPage.value = Math.max(1, pageCount)
})

const form = reactive({ title: '', classId: null, bookId: null, lessonId: null, questionIds: [], deadline: '', durationMinutes: null, maxAttempts: 0, shuffleQuestions: false, shuffleOptions: false })
const selectedBook = computed(() => bookDetails.value)
const lessons = computed(() => (selectedBook.value?.chapters || []).flatMap((chapter) => chapter.lessons.map((lesson) => ({ ...lesson, title: `${chapter.title} · ${lesson.title}` }))))
const lessonOptions = computed(() => [
  { id: 'ALL', title: t('assignmentHub.allLessons') },
  ...lessons.value,
])

onMounted(async () => {
  await loadData()
  if (route.query.templateId && !isStudent.value) {
    await prefillFromTemplate(route.query.templateId)
  }
})
watch(() => form.lessonId, (id) => { if (!id) { questions.value = []; form.questionIds = [] } })

async function loadData() {
  loading.value = true
  errorMessage.value = ''
  try {
    assignments.value = await api('/assignments/mine')
    if (!isStudent.value) {
      const [classResult, bookResult] = await Promise.all([api('/classes/mine'), api('/books')])
      classes.value = classResult.classes || []
      books.value = bookResult || []
    }
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}

async function loadQuestions() {
  form.questionIds = []
  questions.value = []
  if (!form.lessonId) return
  questionsLoading.value = true
  formError.value = ''
  try {
    if (form.lessonId === 'ALL') {
      const lessonQuestionSets = await Promise.all(lessons.value.map(async (lesson) => ({
        lesson,
        questions: await api(`/lessons/${lesson.id}/questions`),
      })))
      const pools = lessonQuestionSets.map(({ lesson, questions: lessonQuestions }) => ({
        lesson,
        questions: lessonQuestions
          .filter((question) => !isDragQuestionIncomplete(question))
          .sort(() => Math.random() - 0.5),
        cursor: 0,
      }))
      const selected = []
      while (selected.length < 40 && pools.some((pool) => pool.cursor < pool.questions.length)) {
        for (const pool of pools) {
          if (selected.length >= 40) break
          if (pool.cursor < pool.questions.length) {
            selected.push({
              ...pool.questions[pool.cursor++],
              lessonTitle: `${pool.lesson.title}`,
            })
          }
        }
      }
      questions.value = pools.flatMap((pool) => pool.questions.map((question) => ({
        ...question,
        lessonTitle: pool.lesson.title,
      })))
      form.questionIds = selected.map(({ id }) => Number(id))
      if (selected.length < 40) {
        formError.value = t('assignmentHub.bookExamInsufficient', { available: selected.length })
      }
    } else {
      questions.value = await api(`/lessons/${form.lessonId}/questions`)
    }
  }
  catch (error) { formError.value = error.message }
  finally { questionsLoading.value = false }
}

async function selectBook(id) {
  form.lessonId = null
  questions.value = []
  form.questionIds = []
  bookDetails.value = id ? await api(`/books/${id}`) : null
}

function toggleQuestion(id, checked) {
  const questionId = Number(id)
  if (checked && form.lessonId === 'ALL' && form.questionIds.length >= 40) {
    formError.value = t('assignmentHub.bookExamLimit')
    return
  }
  formError.value = ''
  form.questionIds = checked
    ? [...new Set([...form.questionIds, questionId])]
    : form.questionIds.filter((value) => value !== questionId)
}

function isDragQuestionIncomplete(question) {
  return question.type === 'DRAG_DROP' &&
    (question.options?.length !== 4 || question.options.filter((option) => option.isCorrect).length !== 1 || question.options.some((option) => !option.content?.trim()))
}

async function saveAssignment() {
  formError.value = ''
  if (form.deadline && new Date(form.deadline).getTime() <= Date.now()) {
    formError.value = t('assignmentHub.deadlinePast')
    return
  }
  if (!form.classId || !form.lessonId || !form.questionIds.length || (form.lessonId === 'ALL' && form.questionIds.length !== 40)) {
    formError.value = t('assignmentHub.requiredSelection')
    return
  }
  saving.value = true
  try {
    await api('/assignments', {
      method: 'POST',
      body: {
        title: (form.title.trim() || (form.lessonId === 'ALL' ? `${selectedBook.value?.title} - ${t('assignmentHub.bookExamTitle')}` : lessons.value.find((lesson) => lesson.id === form.lessonId)?.title) || t('assignmentHub.defaultTitle')).slice(0, 150),
        classId: Number(form.classId),
        ...(form.lessonId === 'ALL'
          ? { scope: 'BOOK', bookId: Number(form.bookId) }
          : { scope: 'LESSON', lessonId: Number(form.lessonId) }),
        questionIds: form.questionIds,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
        maxAttempts: Number(form.maxAttempts ?? 0),
        shuffleQuestions: form.shuffleQuestions,
        shuffleOptions: form.shuffleOptions,
      },
    })
    createDialog.value = false
    form.title = ''; form.classId = null; form.bookId = null; bookDetails.value = null; form.lessonId = null; form.questionIds = []; form.deadline = ''; form.durationMinutes = null; form.maxAttempts = 0; form.shuffleQuestions = false; form.shuffleOptions = false
    await loadData()
    if (route.query.templateId) router.replace({ name: 'assignments' })
  } catch (error) {
    formError.value = error.message
  } finally {
    saving.value = false
  }
}

async function saveTemplate() {
  formError.value = ''
  formSuccess.value = ''
  if (!form.lessonId || !form.questionIds.length) {
    formError.value = t('assignmentHub.requiredSelection')
    return
  }
  savingTemplate.value = true
  try {
    await api('/assignments/templates', {
      method: 'POST',
      body: {
        title: form.title.trim() || lessons.value.find((lesson) => lesson.id === form.lessonId)?.title || t('assignmentHub.defaultTitle'),
        lessonId: Number(form.lessonId),
        questionIds: form.questionIds.map(Number),
      },
    })
    formSuccess.value = t('examBank.templateSaved')
  } catch (error) {
    formError.value = error.message
  } finally {
    savingTemplate.value = false
  }
}

async function prefillFromTemplate(templateId) {
  try {
    formError.value = ''
    const template = await api(`/assignments/templates/${templateId}`)
    const bookId = template.lesson.chapter.book.id
    form.title = template.title
    form.classId = null
    form.deadline = ''
    form.durationMinutes = null
    form.maxAttempts = 0
    form.bookId = bookId
    await selectBook(bookId)
    form.lessonId = template.lessonId
    await loadQuestions()
    form.questionIds = template.questions.map(({ questionId }) => Number(questionId))
    openCreateDialog()
  } catch (error) {
    errorMessage.value = error.message
  }
}

function hasActiveAttempt(assignment) { return assignment.myAttempts?.some((attempt) => !attempt.submittedAt) }
function attemptLimitLabel(assignment) { return assignment.maxAttempts > 0 ? assignment.maxAttempts : t('assignmentHub.unlimited') }
function canStart(assignment) { return (!assignment.deadline || new Date(assignment.deadline) > new Date()) && (hasActiveAttempt(assignment) || !assignment.maxAttempts || (assignment.myAttempts?.length || 0) < assignment.maxAttempts) }
function studentStatus(assignment) { if (hasActiveAttempt(assignment)) return t('assignmentHub.inProgress'); if (assignment.maxAttempts > 0 && (assignment.myAttempts?.length || 0) >= assignment.maxAttempts) return t('assignmentHub.completed'); return t('assignmentHub.notStarted') }
function studentStatusColor(assignment) { return hasActiveAttempt(assignment) ? 'warning' : (assignment.maxAttempts > 0 && (assignment.myAttempts?.length || 0) >= assignment.maxAttempts) ? 'success' : 'primary' }
function formatDate(value) { return new Intl.DateTimeFormat(locale.value === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) }
function formatDuration(value) { return value ? `${value} ${t('assignmentHub.minutes')}` : t('assignmentHub.noDuration') }
function toLocalDateTimeInput(timestamp) {
  const date = new Date(timestamp - new Date(timestamp).getTimezoneOffset() * 60000)
  return date.toISOString().slice(0, 16)
}
function openCreateDialog() {
  formError.value = ''
  formSuccess.value = ''
  form.shuffleQuestions = false
  form.shuffleOptions = false
  minDeadline.value = toLocalDateTimeInput(Date.now())
  isQuestionsCollapsed.value = false
  questionSearchQuery.value = ''
  questionTypeFilter.value = 'ALL'
  questionDifficultyFilter.value = 'ALL'
  questionSelectionFilter.value = 'ALL'
  createDialog.value = true
}

async function openSubmissions(assignment) {
  selectedAssignment.value = assignment
  submissionDetails.value = null
  submissionPage.value = 1
  gradeErrors.value = {}
  submissionsDialog.value = true
  loadingSubmissions.value = true
  try { submissionDetails.value = await api(`/assignments/${assignment.id}`) }
  catch (error) { errorMessage.value = error.message }
  finally { loadingSubmissions.value = false }
}

function hasEssayAnswers(attempt) {
  return attempt.answers?.some(answer => answer.question?.type === 'ESSAY') || false
}

function canSaveGrade(attempt) {
  return attempt.answers
    .filter(answer => answer.question?.type === 'ESSAY')
    .every(answer => answer.score !== null && answer.score !== '' && Number.isFinite(Number(answer.score)) && Number(answer.score) >= 0 && Number(answer.score) <= Number(answer.points))
}

async function saveAttemptGrade(attempt) {
  if (!canSaveGrade(attempt) || gradingAttemptId.value !== null) return
  gradingAttemptId.value = attempt.id
  gradeErrors.value[attempt.id] = ''
  try {
    const result = await api(`/assignments/attempts/${attempt.id}/grade`, {
      method: 'POST',
      body: {
        answers: attempt.answers
          .filter(answer => answer.question?.type === 'ESSAY')
          .map(answer => ({ answerId: answer.id, score: Number(answer.score), feedback: answer.teacherFeedback || '' })),
      },
    })
    attempt.score = result.score
    const now = result.gradedAt
    for (const answer of attempt.answers.filter(item => item.question?.type === 'ESSAY')) {
      answer.gradedAt = now
    }
  } catch (error) {
    gradeErrors.value[attempt.id] = error.message || t('assignmentHub.gradeError')
  } finally {
    gradingAttemptId.value = null
  }
}
</script>

<style scoped>
.assignment-page { background: #f4f8ff; }
.assignment-container { max-width: 1360px; }
.essay-grade-fields { display: grid; grid-template-columns: minmax(140px, 190px) minmax(220px, 1fr); gap: 12px; align-items: start; }
.teacher-feedback { padding: 10px 12px; border-radius: 10px; background: #eef5ff; color: #315d9c; font-size: .88rem; }

/* Hero thu gọn */
.assignment-hero {
  position: relative;
  display: flex;
  min-height: 100px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 20px 28px;
  border: 1px solid #dce8fb;
  border-radius: 20px;
  background: linear-gradient(115deg, #fff 0%, #f9fbff 62%, #eaf2ff 100%);
  box-shadow: 0 4px 16px rgba(47, 124, 246, .05);
}
.hero-copy { position: relative; z-index: 1; }
.hero-eyebrow { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; color: #2f7cf6; font-size: .75rem; font-weight: 800; letter-spacing: .06em; }
.hero-copy h1 { margin: 0 0 4px; color: #172b4d; font-size: clamp(1.4rem, 2.5vw, 1.75rem); font-weight: 900; letter-spacing: -.02em; }
.hero-copy p { margin: 0; color: #52647e; font-size: .9rem; }
.hero-action { z-index: 1; flex: none; box-shadow: 0 4px 14px rgba(47, 124, 246, 0.25) !important; }

/* KPI mini cards */
.kpi-card {
  border-color: #e2edfa !important;
  box-shadow: 0 4px 12px rgba(47, 124, 246, .03) !important;
}
.lh-1 { line-height: 1.1; }

/* Filter Toolbar */
.filter-toolbar {
  border-color: #e2edfa !important;
  box-shadow: 0 4px 14px rgba(47, 124, 246, .04) !important;
}

.view-toggle-group {
  background: #f4f8ff;
  border-color: #dce8fb !important;
}

/* Table View */
.assignment-table-card {
  border-color: #e2edfa !important;
  box-shadow: 0 6px 20px rgba(31, 79, 145, .04) !important;
}

.assignment-table {
  width: 100%;
  table-layout: fixed;
}

.assignment-table-card :deep(.v-table__wrapper) {
  overflow-x: hidden;
}

/* Keep the six columns predictable so metadata and actions don't wrap unevenly. */
.assignment-table th:nth-child(1),
.assignment-table td:nth-child(1) { width: 39%; }
.assignment-table th:nth-child(2),
.assignment-table td:nth-child(2) { width: 9%; }
.assignment-table th:nth-child(3),
.assignment-table td:nth-child(3) { width: 16%; }
.assignment-table th:nth-child(4),
.assignment-table td:nth-child(4) { width: 16%; }
.assignment-table th:nth-child(5),
.assignment-table td:nth-child(5) { width: 8%; }
.assignment-table th:nth-child(6),
.assignment-table td:nth-child(6) { width: 12%; }

.assignment-table td {
  vertical-align: middle;
}

.assignment-table td:nth-child(3) > div {
  flex-wrap: nowrap;
  white-space: nowrap;
}

.assignment-table td:nth-child(5) {
  white-space: nowrap;
}

.assignment-lesson {
  max-width: 38ch;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-header-row th {
  background: #f8fbff;
  font-size: 0.76rem;
  padding: 12px 9px !important;
  border-bottom: 1.5px solid #e2edfa !important;
  white-space: nowrap;
}

.assignment-tr {
  transition: background 0.15s ease;
}

.assignment-tr:hover {
  background: #f8fbff !important;
}

.assignment-tr td {
  padding: 12px 9px !important;
  border-bottom: 1px solid #edf2f9 !important;
}

.assignment-tr td:last-child :deep(.v-btn) {
  max-width: 100%;
  padding-inline: 8px !important;
  font-size: 0.76rem;
}

.assignment-tr:last-child td {
  border-bottom: 0 !important;
}

/* Compact Grid Card View */
.assignment-card-compact {
  display: flex;
  flex-direction: column;
  padding: 16px 18px 14px;
  border: 1px solid #e0e9f7;
  background: #fff;
  box-shadow: 0 4px 14px rgba(31, 79, 145, .04);
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
}
.assignment-card-compact:hover {
  transform: translateY(-2px);
  border-color: #c9dcfb;
  box-shadow: 0 10px 24px rgba(31, 79, 145, .08);
}
.card-compact-title {
  color: #1c2c46;
  font-size: 1.05rem;
  line-height: 1.35;
}
.card-compact-sub {
  min-height: 18px;
}
.card-compact-meta {
  background: #f8fbff;
  border: 1px solid #e8f0fc;
}

/* Empty State */
.assignment-empty {
  display: flex;
  min-height: 240px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  border: 1px dashed #cbd9ed;
  background: rgba(255,255,255,.8);
  text-align: center;
}

/* Dialog Styles */
.create-dialog {
  display: flex;
  max-height: 90vh;
  max-height: 90dvh;
  flex-direction: column;
  overflow: hidden;
}
.create-dialog-body {
  min-height: 0;
  flex: 1 1 auto;
  overflow-y: auto !important;
  overflow-x: hidden;
}
.dialog-heading { display: flex; align-items: center; gap: 14px; padding: 20px 24px 16px; border-bottom: 1px solid #edf1f7; white-space: normal; }
.dialog-heading h2 { margin: 0; color: #1c2c46; font-size: 1.25rem; font-weight: 850; }
.dialog-heading p { margin: 4px 0 0; color: #728097; font-size: .86rem; font-weight: 400; }
.form-section-title { display: flex; align-items: center; gap: 10px; margin: 8px 0 14px; color: #263b59; font-size: .95rem; font-weight: 800; }
.form-section-title > span { display: grid; width: 26px; height: 26px; flex: none; place-items: center; border-radius: 50%; background: #eaf2ff; color: #2f7cf6; font-size: .8rem; }
.question-section-heading { min-width: 0; }
.question-count-chip { flex: none; white-space: nowrap; }
.question-section { padding-top: 4px; }

/* NEW: Compact Question Picker Container */
.question-picker-container {
  border-color: #dce8fb !important;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
}

/* NEW: Smart Question Toolbar */
.question-toolbar {
  border-bottom: 1px solid #e8f0fb;
  background: #f7faff;
}

.question-picker-actions {
  gap: 4px;
  min-width: 0;
  flex-wrap: wrap;
}
.question-picker-action {
  min-width: 0;
  white-space: nowrap;
}
.question-picker-divider {
  flex: 0 0 auto;
}

/* NEW: Bounded Scroll Box */
.question-scroll-box {
  max-height: 360px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #c7d7f0 transparent;
}

.question-scroll-box::-webkit-scrollbar {
  width: 6px;
}

.question-scroll-box::-webkit-scrollbar-track {
  background: transparent;
}

.question-scroll-box::-webkit-scrollbar-thumb {
  background: #c7d7f0;
  border-radius: 3px;
}

/* NEW: Compact Question Row */
.question-row-compact {
  cursor: pointer;
  border: 1px solid #e8f0fb;
  transition: all 0.14s ease;
  background: #fff;
  min-height: 44px;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

.question-row-compact > .d-flex {
  width: 100%;
}

.question-row-checkbox {
  width: 32px;
  min-width: 32px;
  flex: 0 0 32px;
}

.question-row-checkbox :deep(.v-selection-control) {
  width: 32px;
  min-width: 32px;
  flex: 0 0 32px;
}

.question-row-compact:hover {
  border-color: #93c5fd;
  background: #f5f9ff;
}

.question-row-selected {
  border-color: #60a5fa !important;
  background: #eff6ff !important;
}

.question-row-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.question-row-compact:last-child {
  margin-bottom: 0 !important;
}

.question-stt-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  min-width: 30px;
  flex: 0 0 30px;
  height: 20px;
  padding: 0 5px;
  border-radius: 6px;
  background: #e8f0fc;
  color: #3b82f6;
  font-size: 0.72rem;
  font-weight: 700;
  flex-shrink: 0;
}

.question-row-selected .question-stt-badge {
  background: #bfdbfe;
  color: #1d4ed8;
}

.question-text {
  line-height: 1.35;
  font-size: 0.855rem;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.question-source-tag {
  display: flex;
  align-items: center;
  min-width: 0;
  max-width: 100%;
  font-size: 0.72rem;
  line-height: 1.3;
  margin-top: 1px;
  color: #728097;
}
.question-source-tag span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.question-row-content {
  min-width: 0;
}

/* NEW: Collapsed Summary Strip */
.collapsed-summary {
  border-color: #bfdbfe !important;
  background: #eff6ff !important;
}

/* Legacy classes kept for safety (no longer actively used) */
.question-list { padding: 2px 6px 2px 2px; }
.question-choice { cursor: pointer; border-color: #e0e8f3; transition: background .16s ease, border-color .16s ease; }
.question-choice:hover { border-color: #8db6f7; background: #f8fbff; }
.question-choice--selected { border-color: #73a5f5; background: #f1f6ff; }
.question-source { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

@media (max-width: 600px) {
  .assignment-hero { min-height: 0; flex-direction: column; align-items: flex-start; padding: 18px 20px; }
  .hero-action { align-self: stretch; }
  .essay-grade-fields { grid-template-columns: 1fr; }
}
</style>
