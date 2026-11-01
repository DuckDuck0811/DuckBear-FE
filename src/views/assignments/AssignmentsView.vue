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
                <th class="font-weight-black text-secondary text-end">{{ t('assignmentHub.colActions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="assignment in filteredAssignments"
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
                      <div class="text-caption text-secondary text-truncate" :title="assignment.lesson?.title">
                        {{ assignment.lesson?.title || 'Bài tập chung' }}
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
                      <v-chip size="x-small" :color="getDeadlineStatus(assignment).color" :variant="getDeadlineStatus(assignment).variant" class="font-weight-bold">
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
                    <span class="text-caption text-secondary"> {{ t('assignmentHub.submissions') }}</span>
                  </div>
                </td>

                <!-- Cột 6: Thao tác -->
                <td class="text-end">
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
                    @click="openSubmissions(assignment)"
                  >
                    {{ t('assignmentHub.viewSubmissions') }}
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>

        <!-- CHẾ ĐỘ 2: XEM THẺ LƯỚI THU GỌN (COMPACT GRID VIEW - 3 ĐẾN 4 CỘT) -->
        <v-row v-else-if="assignments.length && filteredAssignments.length && viewMode === 'grid'">
          <v-col
            v-for="assignment in filteredAssignments"
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
                {{ assignment.lesson?.title || 'Bài tập chung' }}<span v-if="isStudent"> &middot; {{ assignment.createdBy?.fullName }}</span>
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
        <v-card-text>
          <v-alert v-if="formError" type="error" variant="tonal" class="mb-4">{{ formError }}</v-alert>
          <v-text-field v-model="form.title" :label="t('assignmentHub.title')" variant="outlined" class="mb-2" prepend-inner-icon="mdi-format-title" />
          <div class="form-section-title"><span>1</span>{{ t('assignmentHub.selectClassAndLesson') }}</div>
          <v-row>
            <v-col cols="12" md="4"><v-select v-model="form.classId" :items="classes" item-title="name" item-value="id" :label="t('assignmentHub.class')" variant="outlined" hide-details /></v-col>
            <v-col cols="12" md="4"><v-select v-model="form.bookId" :items="books" item-title="title" item-value="id" :label="t('assignmentHub.book')" variant="outlined" hide-details @update:model-value="selectBook" /></v-col>
            <v-col cols="12" md="4"><v-select v-model="form.lessonId" :items="lessons" item-title="title" item-value="id" :label="t('assignmentHub.lesson')" variant="outlined" hide-details :disabled="!form.bookId" @update:model-value="loadQuestions" /></v-col>
          </v-row>
          <div v-if="form.lessonId" class="question-section mb-5">
            <div class="form-section-title"><span>2</span>{{ t('assignmentHub.pickQuestions') }}<v-spacer /><v-chip size="small" color="primary" variant="tonal">{{ t('assignmentHub.selectedCount', { count: form.questionIds.length }) }}</v-chip></div>
            <div v-if="questionsLoading" class="py-8"><v-progress-linear indeterminate color="primary" rounded /></div>
            <v-alert v-else-if="!questions.length" type="info" variant="tonal" density="comfortable">{{ t('assignmentHub.noQuestionsInLesson') }}</v-alert>
            <div v-else class="question-list">
              <v-card
                v-for="question in questions"
                :key="question.id"
                variant="outlined"
                class="px-3 mb-2 question-choice"
                :class="{ 'question-choice--selected': form.questionIds.includes(Number(question.id)), 'question-choice--disabled': isDragQuestionIncomplete(question) }"
                rounded="lg"
                role="checkbox"
                tabindex="0"
                :aria-checked="form.questionIds.includes(Number(question.id))"
                @click="!isDragQuestionIncomplete(question) && toggleQuestion(question.id, !form.questionIds.includes(Number(question.id)))"
                @keydown.enter.prevent="!isDragQuestionIncomplete(question) && toggleQuestion(question.id, !form.questionIds.includes(Number(question.id)))"
                @keydown.space.prevent="!isDragQuestionIncomplete(question) && toggleQuestion(question.id, !form.questionIds.includes(Number(question.id)))"
              >
                <v-checkbox
                  :model-value="form.questionIds.includes(Number(question.id))"
                  :disabled="isDragQuestionIncomplete(question)"
                  :label="question.content"
                  hide-details
                  density="compact"
                  @click.stop="toggleQuestion(question.id, !form.questionIds.includes(Number(question.id)))"
                />
                <div class="d-flex ga-2 pb-2">
                  <v-chip size="x-small" color="primary" variant="tonal">{{ t(`questionBank.types.${question.type}`) }}</v-chip>
                  <v-chip size="x-small" variant="tonal">{{ t(`questionBank.difficulties.${question.difficulty}`) }}</v-chip>
                </div>
                <div v-if="isDragQuestionIncomplete(question)" class="text-caption text-warning pb-2">{{ t('assignmentHub.dragDataMissing') }}</div>
              </v-card>
            </div>
          </div>
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
          <v-btn color="primary" rounded="pill" prepend-icon="mdi-send-outline" :loading="saving" @click="saveAssignment">{{ t('assignmentHub.assign') }}</v-btn>
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
          <v-expansion-panels v-else variant="accordion">
            <v-expansion-panel v-for="attempt in submissionDetails.attempts" :key="attempt.id">
              <v-expansion-panel-title>
                <div class="d-flex flex-wrap align-center ga-3">
                  <strong>{{ attempt.student.fullName }}</strong>
                  <span>{{ t('assignmentHub.attemptLabel', { number: attempt.attemptNo, max: submissionDetails.maxAttempts ? submissionDetails.maxAttempts : t('assignmentHub.unlimited') }) }}</span>
                  <span>{{ attempt.submittedAt ? formatDate(attempt.submittedAt) : t('assignmentHub.inProgress') }}</span>
                  <v-chip v-if="attempt.score !== null" size="x-small" color="success" variant="tonal">{{ attempt.score }}%</v-chip>
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <div v-for="(answer, index) in attempt.answers" :key="answer.id" class="mb-4">
                  <div class="font-weight-bold">{{ index + 1 }}. {{ answer.question.content }}</div>
                  <div class="text-body-2 text-secondary">{{ t('assignmentHub.studentAnswer') }}: {{ answer.selectedOption?.content || answer.displayAnswer || t('assignmentHub.noAnswer') }}</div>
                  <v-chip v-if="answer.isCorrect !== null" size="x-small" :color="answer.isCorrect ? 'success' : 'error'" variant="tonal" class="mt-1">
                    {{ answer.isCorrect ? t('assignmentHub.correct') : t('assignmentHub.incorrect') }}
                  </v-chip>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
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
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import AppHeader from '../../components/shared/AppHeader.vue'
import TeacherSidebar from '../../components/shared/TeacherSidebar.vue'
import StudentSidebar from '../../components/shared/StudentSidebar.vue'

const { t, locale } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const isStudent = computed(() => auth.user?.role === 'STUDENT')
const loading = ref(false)
const saving = ref(false)
const questionsLoading = ref(false)
const createDialog = ref(false)
const submissionsDialog = ref(false)
const loadingSubmissions = ref(false)
const selectedAssignment = ref(null)
const submissionDetails = ref(null)
const errorMessage = ref('')
const formError = ref('')
const assignments = ref([])
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

function setViewMode(mode) {
  viewMode.value = mode
  localStorage.setItem('duckbear_assignment_view_mode', mode)
}

function clearFilters() {
  searchQuery.value = ''
  selectedClassFilter.value = 'ALL'
  statusFilter.value = 'ALL'
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

const form = reactive({ title: '', classId: null, bookId: null, lessonId: null, questionIds: [], deadline: '', durationMinutes: null, maxAttempts: 0, shuffleQuestions: false, shuffleOptions: false })
const selectedBook = computed(() => bookDetails.value)
const lessons = computed(() => (selectedBook.value?.chapters || []).flatMap((chapter) => chapter.lessons.map((lesson) => ({ ...lesson, title: `${chapter.title} · ${lesson.title}` }))))

onMounted(loadData)
watch(() => form.lessonId, (id) => { if (!id) { questions.value = []; form.questionIds = [] } })

async function loadData() {
  loading.value = true
  errorMessage.value = ''
  try {
    assignments.value = await api('/assignments/mine')
    if (!isStudent.value) {
      const [classResult, bookResult] = await Promise.all([api('/classes/mine'), api('/books')])
      classes.value = classResult.classes || []
      books.value = (bookResult || []).filter((book) => book.createdById === auth.user?.id)
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
  try { questions.value = await api(`/lessons/${form.lessonId}/questions`) }
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
  if (!form.classId || !form.lessonId || !form.questionIds.length) {
    formError.value = t('assignmentHub.requiredSelection')
    return
  }
  saving.value = true
  try {
    await api('/assignments', {
      method: 'POST',
      body: {
        title: form.title.trim() || lessons.value.find((lesson) => lesson.id === form.lessonId)?.title || t('assignmentHub.defaultTitle'),
        classId: Number(form.classId),
        lessonId: Number(form.lessonId),
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
  } catch (error) {
    formError.value = error.message
  } finally {
    saving.value = false
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
  form.shuffleQuestions = false
  form.shuffleOptions = false
  minDeadline.value = toLocalDateTimeInput(Date.now())
  createDialog.value = true
}

async function openSubmissions(assignment) {
  selectedAssignment.value = assignment
  submissionDetails.value = null
  submissionsDialog.value = true
  loadingSubmissions.value = true
  try { submissionDetails.value = await api(`/assignments/${assignment.id}`) }
  catch (error) { errorMessage.value = error.message }
  finally { loadingSubmissions.value = false }
}
</script>

<style scoped>
.assignment-page { background: #f4f8ff; }
.assignment-container { max-width: 1360px; }

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
}

.table-header-row th {
  background: #f8fbff;
  font-size: 0.8rem;
  padding: 12px 16px !important;
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
  padding: 10px 16px !important;
  border-bottom: 1px solid #edf2f9 !important;
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
.create-dialog { overflow: hidden; }
.dialog-heading { display: flex; align-items: center; gap: 14px; padding: 20px 24px 16px; border-bottom: 1px solid #edf1f7; white-space: normal; }
.dialog-heading h2 { margin: 0; color: #1c2c46; font-size: 1.25rem; font-weight: 850; }
.dialog-heading p { margin: 4px 0 0; color: #728097; font-size: .86rem; font-weight: 400; }
.form-section-title { display: flex; align-items: center; gap: 10px; margin: 8px 0 14px; color: #263b59; font-size: .95rem; font-weight: 800; }
.form-section-title > span { display: grid; width: 26px; height: 26px; flex: none; place-items: center; border-radius: 50%; background: #eaf2ff; color: #2f7cf6; font-size: .8rem; }
.question-section { padding-top: 4px; }
.question-list { max-height: 330px; overflow-y: auto; padding: 2px 6px 2px 2px; }
.question-choice { cursor: pointer; border-color: #e0e8f3; transition: background .16s ease, border-color .16s ease; }
.question-choice:hover { border-color: #8db6f7; background: #f8fbff; }
.question-choice--selected { border-color: #73a5f5; background: #f1f6ff; }
.question-choice:focus-visible { outline: 2px solid #2f7cf6; outline-offset: 2px; }

@media (max-width: 600px) {
  .assignment-hero { min-height: 0; flex-direction: column; align-items: flex-start; padding: 18px 20px; }
  .hero-action { align-self: stretch; }
}
</style>
