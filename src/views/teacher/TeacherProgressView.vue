<template>
  <v-layout class="progress-page min-vh-100">
    <AppHeader />
    <TeacherSidebar />
    <v-main>
      <v-container class="progress-container py-7 px-4 px-md-8">
        <header class="progress-hero mb-6">
          <div class="progress-hero-icon">
            <v-icon icon="mdi-chart-box-outline" size="28" />
          </div>
          <div class="flex-grow-1">
            <div class="progress-eyebrow">
              {{ t("teacherProgress.eyebrow") }}
            </div>
            <h1>{{ t("teacherProgress.title") }}</h1>
            <p>{{ t("teacherProgress.subtitle") }}</p>
          </div>
          <div class="progress-actions">
            <v-btn
              color="primary"
              variant="tonal"
              prepend-icon="mdi-microsoft-excel"
              :loading="exporting"
              :disabled="!selectedClass"
              @click="exportProgress"
              >{{ t("teacherProgress.export") }}</v-btn
            >
            <v-select
              v-model="selectedClassId"
              :items="classOptions"
              item-title="title"
              item-value="value"
              :label="t('teacherProgress.selectClass')"
              variant="outlined"
              density="compact"
              hide-details
              class="class-select"
            />
          </div>
        </header>

        <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{
          error
        }}</v-alert>
        <div v-if="loading" class="progress-state">
          <v-progress-circular indeterminate color="primary" />
        </div>
        <template v-else-if="selectedClass">
          <div class="summary-grid mb-6">
            <v-card
              v-for="metric in metrics"
              :key="metric.label"
              class="summary-card pa-4"
              rounded="xl"
              variant="flat"
            >
              <div class="metric-icon"><v-icon :icon="metric.icon" /></div>
              <small>{{ t(metric.label) }}</small
              ><strong>{{ metric.value }}</strong>
            </v-card>
          </div>

          <v-card class="report-card mb-6" rounded="xl" variant="flat">
            <div class="report-heading">
              <div>
                <h2>{{ t("teacherProgress.students") }}</h2>
                <p>{{ t("teacherProgress.studentsHint") }}</p>
              </div>
              <v-text-field
                v-model="search"
                :placeholder="t('teacherProgress.search')"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                hide-details
                clearable
                class="search-field"
              />
            </div>
            <div class="student-filter-toolbar">
              <v-select
                v-model="studentFilter"
                :items="studentFilterOptions"
                :label="t('teacherProgress.filterStudents')"
                variant="outlined"
                density="compact"
                hide-details
                class="filter-select"
              />
              <v-select
                v-model="studentSort"
                :items="studentSortOptions"
                :label="t('teacherProgress.sortStudents')"
                variant="outlined"
                density="compact"
                hide-details
                class="filter-select"
              />
            </div>
            <v-table class="student-table">
              <thead>
                <tr>
                  <th>{{ t("teacherProgress.student") }}</th>
                  <th>{{ t("teacherProgress.submitted") }}</th>
                  <th>{{ t("teacherProgress.graded") }}</th>
                  <th>{{ t("teacherProgress.quizAverage") }}</th>
                  <th>{{ t("teacherProgress.manualAverage") }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="student in pagedStudents"
                  :key="student.id"
                  class="student-row"
                  tabindex="0"
                  @click="openStudent(student)"
                  @keydown.enter="openStudent(student)"
                  @keydown.space.prevent="openStudent(student)"
                >
                  <td>
                    <strong>{{ student.fullName }}</strong
                    ><small>{{ student.email }}</small>
                  </td>
                  <td>
                    {{ student.submittedCount }} /
                    {{ selectedClass.assignmentCount }}
                  </td>
                  <td>{{ student.gradedCount }}</td>
                  <td>{{ formatScore(student.quizAverage) }}</td>
                  <td>{{ formatScore(student.manualAverage) }}</td>
                </tr>
                <tr v-if="!filteredStudents.length">
                  <td colspan="5" class="empty-row">
                    {{ t("teacherProgress.noStudents") }}
                  </td>
                </tr>
              </tbody>
            </v-table>
            <ListPagination
              v-model="studentsPage"
              :total="filteredStudents.length"
              :page-size="pageSize"
            />
          </v-card>

          <v-card class="report-card" rounded="xl" variant="flat">
            <div class="report-heading">
              <div>
                <h2>{{ t("teacherProgress.assignments") }}</h2>
                <p>{{ t("teacherProgress.assignmentsHint") }}</p>
              </div>
            </div>
            <div
              v-if="selectedClass.assignments.length"
              class="assignment-list"
            >
              <div
                v-for="assignment in pagedAssignments"
                :key="`${assignment.type}-${assignment.id}`"
                class="assignment-row"
              >
                <div class="assignment-symbol">
                  <v-icon
                    :icon="
                      assignment.type === 'quiz'
                        ? 'mdi-clipboard-text-outline'
                        : 'mdi-cloud-upload-outline'
                    "
                  />
                </div>
                <div class="assignment-copy">
                  <strong>{{ assignment.title }}</strong
                  ><small
                    >{{
                      assignment.type === "quiz"
                        ? t("teacherProgress.online")
                        : t("teacherProgress.manual")
                    }}<template v-if="assignment.deadline">
                      ·
                      {{
                        t("teacherProgress.deadline", {
                          date: formatDate(assignment.deadline),
                        })
                      }}</template
                    ></small
                  >
                </div>
                <v-chip size="small" color="primary" variant="tonal">{{
                  t("teacherProgress.submittedOf", {
                    submitted: assignment.submittedCount,
                    total: selectedClass.studentCount,
                  })
                }}</v-chip
                ><v-chip size="small" color="success" variant="tonal">{{
                  t("teacherProgress.gradedOf", {
                    graded: assignment.gradedCount,
                  })
                }}</v-chip
                ><v-btn
                  v-if="assignment.submittedCount < selectedClass.studentCount"
                  size="small"
                  variant="tonal"
                  color="primary"
                  prepend-icon="mdi-bell-outline"
                  :loading="remindingId === assignmentKey(assignment)"
                  :disabled="remindedAssignments.has(assignmentKey(assignment))"
                  @click.stop="remindPending(assignment)"
                  >{{
                    remindedAssignments.has(assignmentKey(assignment))
                      ? t("teacherProgress.reminded")
                      : t("teacherProgress.remind")
                  }}</v-btn
                >
              </div>
            </div>
            <div v-else class="empty-row">
              {{ t("teacherProgress.noAssignments") }}
            </div>
            <ListPagination
              v-model="assignmentsPage"
              :total="selectedClass.assignments.length"
              :page-size="pageSize"
            />
          </v-card>
        </template>
        <v-card
          v-else-if="!error"
          class="report-card empty-state pa-8"
          rounded="xl"
          variant="flat"
          ><v-icon icon="mdi-google-classroom" size="42" /><strong>{{
            t("teacherProgress.noClasses")
          }}</strong
          ><span>{{ t("teacherProgress.noClassesHint") }}</span></v-card
        >
      </v-container>
    </v-main>
    <v-dialog v-model="studentDialog" max-width="860" scrollable>
      <v-card class="student-detail-dialog rounded-xl">
        <!-- Header -->
        <v-card-title
          class="dialog-heading d-flex align-center justify-space-between pa-5"
        >
          <div class="d-flex align-center ga-3">
            <v-avatar
              color="primary"
              variant="flat"
              size="46"
              rounded="lg"
              class="text-h6 font-weight-black text-white"
            >
              {{
                getInitial(
                  studentDetail?.student?.fullName || selectedStudent?.fullName,
                )
              }}
            </v-avatar>
            <div>
              <div class="d-flex align-center ga-2 flex-wrap mb-0_5">
                <h2 class="text-h6 font-weight-black text-slate-800 mb-0">
                  {{
                    studentDetail?.student?.fullName ||
                    selectedStudent?.fullName
                  }}
                </h2>
                <v-chip
                  size="x-small"
                  color="primary"
                  variant="tonal"
                  class="font-weight-bold"
                >
                  {{ studentDetail?.class?.name || selectedClass?.name }}
                </v-chip>
              </div>
              <p class="text-caption text-secondary mb-0">
                {{
                  studentDetail?.student?.email ||
                  selectedStudent?.email ||
                  t("teacherProgress.studentDetail")
                }}
              </p>
            </div>
          </div>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            :aria-label="t('teacherProgress.close')"
            @click="studentDialog = false"
          />
        </v-card-title>
        <v-divider />

        <v-card-text class="pa-5">
          <div v-if="detailLoading" class="progress-state py-12">
            <v-progress-circular indeterminate color="primary" size="44" />
          </div>
          <v-alert
            v-else-if="detailError"
            type="error"
            variant="tonal"
            rounded="lg"
            class="mb-4"
            >{{ detailError }}</v-alert
          >

          <template v-else-if="studentDetail">
            <!-- KPI Thống kê nhanh của học sinh -->
            <v-row dense class="mb-4">
              <v-col cols="6" sm="3">
                <v-card
                  class="kpi-mini-card pa-3 rounded-xl border bg-white"
                  elevation="0"
                >
                  <div class="d-flex align-center ga-3">
                    <v-avatar
                      color="primary"
                      variant="tonal"
                      rounded="lg"
                      size="36"
                    >
                      <v-icon icon="mdi-clipboard-list-outline" size="18" />
                    </v-avatar>
                    <div>
                      <div
                        class="text-subtitle-1 font-weight-black text-slate-800 lh-1"
                      >
                        {{ detailStats.total }}
                      </div>
                      <div class="text-caption text-secondary">
                        Tổng bài tập
                      </div>
                    </div>
                  </div>
                </v-card>
              </v-col>
              <v-col cols="6" sm="3">
                <v-card
                  class="kpi-mini-card pa-3 rounded-xl border bg-white"
                  elevation="0"
                >
                  <div class="d-flex align-center ga-3">
                    <v-avatar
                      color="info"
                      variant="tonal"
                      rounded="lg"
                      size="36"
                    >
                      <v-icon icon="mdi-check-circle-outline" size="18" />
                    </v-avatar>
                    <div>
                      <div
                        class="text-subtitle-1 font-weight-black text-info lh-1"
                      >
                        {{ detailStats.submitted }}
                        <span
                          class="text-caption font-weight-medium text-secondary"
                          >({{ detailStats.completionRate }}%)</span
                        >
                      </div>
                      <div class="text-caption text-secondary">Đã nộp bài</div>
                    </div>
                  </div>
                </v-card>
              </v-col>
              <v-col cols="6" sm="3">
                <v-card
                  class="kpi-mini-card pa-3 rounded-xl border bg-white"
                  elevation="0"
                >
                  <div class="d-flex align-center ga-3">
                    <v-avatar
                      color="warning"
                      variant="tonal"
                      rounded="lg"
                      size="36"
                    >
                      <v-icon icon="mdi-alert-circle-outline" size="18" />
                    </v-avatar>
                    <div>
                      <div
                        class="text-subtitle-1 font-weight-black text-warning lh-1"
                      >
                        {{ detailStats.missing }}
                      </div>
                      <div class="text-caption text-secondary">Chưa nộp</div>
                    </div>
                  </div>
                </v-card>
              </v-col>
              <v-col cols="6" sm="3">
                <v-card
                  class="kpi-mini-card pa-3 rounded-xl border bg-white"
                  elevation="0"
                >
                  <div class="d-flex align-center ga-3">
                    <v-avatar
                      color="success"
                      variant="tonal"
                      rounded="lg"
                      size="36"
                    >
                      <v-icon icon="mdi-star-outline" size="18" />
                    </v-avatar>
                    <div>
                      <div
                        class="text-subtitle-1 font-weight-black text-success lh-1"
                      >
                        {{
                          detailStats.avgScore !== null
                            ? detailStats.avgScore
                            : "—"
                        }}
                      </div>
                      <div class="text-caption text-secondary">
                        Điểm TB đã chấm
                      </div>
                    </div>
                  </div>
                </v-card>
              </v-col>
            </v-row>

            <!-- Bộ lọc trạng thái & Tìm kiếm bài tập -->
            <div
              class="d-flex flex-wrap align-center justify-space-between ga-2 mb-4"
            >
              <div class="d-flex ga-1 flex-wrap">
                <v-btn
                  size="small"
                  rounded="pill"
                  :color="detailStatusFilter === 'ALL' ? 'primary' : undefined"
                  :variant="detailStatusFilter === 'ALL' ? 'flat' : 'text'"
                  class="font-weight-bold text-none px-3"
                  @click="detailStatusFilter = 'ALL'"
                >
                  Tất cả ({{ detailStats.total }})
                </v-btn>
                <v-btn
                  size="small"
                  rounded="pill"
                  :color="
                    detailStatusFilter === 'MISSING' ? 'warning' : undefined
                  "
                  :variant="detailStatusFilter === 'MISSING' ? 'flat' : 'text'"
                  class="font-weight-bold text-none px-3"
                  @click="detailStatusFilter = 'MISSING'"
                >
                  Chưa nộp ({{ detailStats.missing }})
                </v-btn>
                <v-btn
                  size="small"
                  rounded="pill"
                  :color="detailStatusFilter === 'WAITING' ? 'info' : undefined"
                  :variant="detailStatusFilter === 'WAITING' ? 'flat' : 'text'"
                  class="font-weight-bold text-none px-3"
                  @click="detailStatusFilter = 'WAITING'"
                >
                  Chờ chấm ({{ detailStats.submitted - detailStats.graded }})
                </v-btn>
                <v-btn
                  size="small"
                  rounded="pill"
                  :color="
                    detailStatusFilter === 'GRADED' ? 'success' : undefined
                  "
                  :variant="detailStatusFilter === 'GRADED' ? 'flat' : 'text'"
                  class="font-weight-bold text-none px-3"
                  @click="detailStatusFilter = 'GRADED'"
                >
                  Đã chấm ({{ detailStats.graded }})
                </v-btn>
              </div>

              <div style="min-width: 220px" class="flex-grow-1 flex-sm-grow-0">
                <v-text-field
                  v-model="detailSearch"
                  placeholder="Tìm bài tập..."
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="compact"
                  rounded="lg"
                  hide-details
                  clearable
                />
              </div>
            </div>

            <!-- Danh sách bài tập -->
            <div
              v-if="filteredDetailAssignments.length"
              class="detail-card-list"
            >
              <div
                v-for="assignment in pagedDetailAssignments"
                :key="`${assignment.type}-${assignment.id}`"
                class="assignment-detail-card pa-3 px-4 rounded-xl border bg-white mb-2"
              >
                <div
                  class="d-flex align-center justify-space-between ga-3 flex-wrap"
                >
                  <!-- Cột Trái: Icon & Nội dung -->
                  <div class="d-flex align-start ga-3 min-w-0 flex-grow-1">
                    <v-avatar
                      :color="assignment.type === 'quiz' ? 'primary' : 'purple'"
                      variant="tonal"
                      size="42"
                      rounded="lg"
                      class="flex-shrink-0 mt-0_5"
                    >
                      <v-icon
                        :icon="
                          assignment.type === 'quiz'
                            ? 'mdi-clipboard-text-outline'
                            : 'mdi-cloud-upload-outline'
                        "
                        size="22"
                      />
                    </v-avatar>

                    <div class="min-w-0 flex-grow-1">
                      <div
                        class="font-weight-bold text-body-1 text-slate-800 mb-1"
                        :title="assignment.title"
                      >
                        {{ assignment.title }}
                      </div>
                      <div
                        class="d-flex align-center ga-2 flex-wrap text-caption text-secondary"
                      >
                        <v-chip
                          size="x-small"
                          :color="
                            assignment.type === 'quiz' ? 'primary' : 'purple'
                          "
                          variant="tonal"
                          class="font-weight-bold"
                        >
                          {{
                            assignment.type === "quiz"
                              ? t("teacherProgress.online")
                              : t("teacherProgress.manual")
                          }}
                        </v-chip>

                        <span
                          v-if="assignment.submittedAt"
                          class="d-inline-flex align-center ga-1 text-slate-600"
                        >
                          <v-icon
                            icon="mdi-calendar-check-outline"
                            size="13"
                            color="info"
                          />
                          Đã nộp: {{ formatDate(assignment.submittedAt) }}
                        </span>

                        <span
                          v-if="assignment.deadline"
                          class="d-inline-flex align-center ga-1"
                        >
                          <v-icon icon="mdi-clock-outline" size="13" />
                          Hạn: {{ formatDate(assignment.deadline) }}
                        </span>
                      </div>

                      <!-- Lời phê giáo viên -->
                      <div
                        v-if="assignment.feedback?.length"
                        class="feedback-callout mt-2 pa-2 px-3 rounded-lg border bg-blue-lighten-5"
                      >
                        <div
                          class="d-flex align-center ga-1 text-caption font-weight-bold text-primary mb-0_5"
                        >
                          <v-icon icon="mdi-comment-text-outline" size="13" />
                          Nhận xét của giáo viên:
                        </div>
                        <div
                          v-for="(feedback, index) in assignment.feedback"
                          :key="index"
                          class="text-caption text-slate-700"
                        >
                          {{ feedback }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Cột Phải: Trạng thái & Điểm số -->
                  <div class="d-flex flex-column align-end ga-1 flex-shrink-0">
                    <template v-if="!assignment.submitted">
                      <v-chip
                        size="small"
                        color="warning"
                        variant="tonal"
                        class="font-weight-bold"
                      >
                        <v-icon
                          icon="mdi-alert-circle-outline"
                          size="14"
                          class="mr-1"
                        />
                        {{ t("teacherProgress.missing") }}
                      </v-chip>
                    </template>
                    <template v-else-if="!assignment.graded">
                      <v-chip
                        size="small"
                        color="info"
                        variant="tonal"
                        class="font-weight-bold"
                      >
                        <v-icon
                          icon="mdi-check-circle-outline"
                          size="14"
                          class="mr-1"
                        />
                        {{ t("teacherProgress.submittedStatus") }}
                      </v-chip>
                      <v-chip
                        size="x-small"
                        color="secondary"
                        variant="tonal"
                        class="font-weight-medium"
                      >
                        <v-icon icon="mdi-timer-sand" size="12" class="mr-1" />
                        {{ t("teacherProgress.waitingGrade") }}
                      </v-chip>
                    </template>
                    <template v-else>
                      <div class="d-flex align-center ga-1">
                        <v-avatar
                          :color="getScoreColor(assignment.score)"
                          size="36"
                          class="text-body-2 font-weight-black text-white"
                          rounded="lg"
                        >
                          {{ formatScore(assignment.score) }}
                        </v-avatar>
                      </div>
                      <v-chip
                        size="x-small"
                        color="success"
                        variant="tonal"
                        class="font-weight-bold"
                      >
                        <v-icon icon="mdi-check-all" size="12" class="mr-1" />
                        Đã chấm
                      </v-chip>
                    </template>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="text-center py-8">
              <v-icon
                icon="mdi-clipboard-text-search-outline"
                size="48"
                color="secondary"
                class="mb-2"
              />
              <div class="text-body-1 font-weight-bold text-slate-700">
                Không tìm thấy bài tập phù hợp
              </div>
              <p class="text-caption text-secondary">
                Hãy thử chọn bộ lọc khác hoặc tìm kiếm với từ khóa khác.
              </p>
            </div>

            <ListPagination
              v-model="detailPage"
              :total="filteredDetailAssignments.length"
              :page-size="pageSize"
            />
          </template>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-snackbar
      v-model="toast.show"
      :color="toast.color"
      timeout="3500"
      location="top end"
      >{{ toast.message }}</v-snackbar
    >
  </v-layout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { api } from "../../services/api";
import AppHeader from "../../components/shared/AppHeader.vue";
import TeacherSidebar from "../../components/shared/TeacherSidebar.vue";
import ListPagination from "../../components/shared/ListPagination.vue";
import { downloadTeacherProgressWorkbook } from "../../services/teacherProgressExport";

const { t } = useI18n();
const classes = ref([]);
const selectedClassId = ref(null);
const loading = ref(false);
const error = ref("");
const search = ref("");
const studentFilter = ref("all");
const studentSort = ref("missing");
const studentsPage = ref(1);
const assignmentsPage = ref(1);
const studentDialog = ref(false);
const selectedStudent = ref(null);
const studentDetail = ref(null);
const detailLoading = ref(false);
const detailError = ref("");
const detailPage = ref(1);
const remindingId = ref("");
const remindedAssignments = ref(new Set());
const toast = ref({ show: false, message: "", color: "success" });
const exporting = ref(false);
const detailSearch = ref("");
const detailStatusFilter = ref("ALL");
const pageSize = 10;

const selectedClass = computed(() =>
  classes.value.find((item) => item.id === selectedClassId.value),
);
const classOptions = computed(() =>
  classes.value.map((item) => ({
    title: `${item.name} · ${t("teacherProgress.grade", { grade: item.gradeLevel })}`,
    value: item.id,
  })),
);
const studentFilterOptions = computed(() => [
  { title: t("teacherProgress.filterAll"), value: "all" },
  { title: t("teacherProgress.filterMissing"), value: "missing" },
  { title: t("teacherProgress.filterWaiting"), value: "waiting" },
  { title: t("teacherProgress.filterLowScore"), value: "low-score" },
]);
const studentSortOptions = computed(() => [
  { title: t("teacherProgress.sortMissing"), value: "missing" },
  { title: t("teacherProgress.sortWaiting"), value: "waiting" },
  { title: t("teacherProgress.sortScore"), value: "score" },
  { title: t("teacherProgress.sortName"), value: "name" },
]);
const filteredStudents = computed(() => {
  const query = search.value.trim().toLocaleLowerCase();
  const students = (selectedClass.value?.students || []).filter((student) => {
    if (
      query &&
      !`${student.fullName} ${student.email}`
        .toLocaleLowerCase()
        .includes(query)
    )
      return false;
    const missing = Math.max(
      0,
      selectedClass.value.assignmentCount - student.submittedCount,
    );
    const waiting = Math.max(0, student.submittedCount - student.gradedCount);
    if (studentFilter.value === "missing" && !missing) return false;
    if (studentFilter.value === "waiting" && !waiting) return false;
    if (studentFilter.value === "low-score") {
      const score = studentAverageOutOfTen(student);
      if (score === null || score >= 5) return false;
    }
    return true;
  });
  return students.sort((a, b) => {
    if (studentSort.value === "missing")
      return (
        selectedClass.value.assignmentCount -
          b.submittedCount -
          (selectedClass.value.assignmentCount - a.submittedCount) ||
        a.fullName.localeCompare(b.fullName, "vi")
      );
    if (studentSort.value === "waiting")
      return (
        b.submittedCount - b.gradedCount - (a.submittedCount - a.gradedCount) ||
        a.fullName.localeCompare(b.fullName, "vi")
      );
    if (studentSort.value === "score")
      return (
        (studentAverageOutOfTen(a) ?? Number.POSITIVE_INFINITY) -
          (studentAverageOutOfTen(b) ?? Number.POSITIVE_INFINITY) ||
        a.fullName.localeCompare(b.fullName, "vi")
      );
    return a.fullName.localeCompare(b.fullName, "vi");
  });
});
function studentAverageOutOfTen(student) {
  const scores = [];
  if (student.quizAverage !== null && student.quizAverage !== undefined)
    scores.push(Number(student.quizAverage) / 10);
  if (student.manualAverage !== null && student.manualAverage !== undefined)
    scores.push(Number(student.manualAverage));
  return scores.length
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length
    : null;
}
const pagedStudents = computed(() =>
  filteredStudents.value.slice(
    (studentsPage.value - 1) * pageSize,
    studentsPage.value * pageSize,
  ),
);
const pagedAssignments = computed(() =>
  (selectedClass.value?.assignments || []).slice(
    (assignmentsPage.value - 1) * pageSize,
    assignmentsPage.value * pageSize,
  ),
);

const detailStats = computed(() => {
  const list = studentDetail.value?.assignments || [];
  const total = list.length;
  const submitted = list.filter((a) => a.submitted).length;
  const missing = total - submitted;
  const graded = list.filter((a) => a.graded).length;
  const gradedScores = list
    .filter((a) => a.graded && a.score !== null)
    .map((a) => Number(a.score));
  const avgScore = gradedScores.length
    ? (
        gradedScores.reduce((acc, v) => acc + v, 0) / gradedScores.length
      ).toFixed(1)
    : null;
  const completionRate = total ? Math.round((submitted / total) * 100) : 0;
  return { total, submitted, missing, graded, avgScore, completionRate };
});

const filteredDetailAssignments = computed(() => {
  const query = detailSearch.value.trim().toLocaleLowerCase();
  const filter = detailStatusFilter.value;
  return (studentDetail.value?.assignments || []).filter((assignment) => {
    if (query && !assignment.title.toLocaleLowerCase().includes(query))
      return false;
    if (filter === "MISSING") return !assignment.submitted;
    if (filter === "SUBMITTED") return assignment.submitted;
    if (filter === "WAITING") return assignment.submitted && !assignment.graded;
    if (filter === "GRADED") return assignment.graded;
    return true;
  });
});

const pagedDetailAssignments = computed(() => {
  const start = (detailPage.value - 1) * pageSize;
  return filteredDetailAssignments.value.slice(start, start + pageSize);
});

watch([detailSearch, detailStatusFilter], () => {
  detailPage.value = 1;
});

const metrics = computed(() => {
  const item = selectedClass.value;
  return item
    ? [
        {
          label: "teacherProgress.studentCount",
          icon: "mdi-account-group-outline",
          value: item.studentCount,
        },
        {
          label: "teacherProgress.assignmentCount",
          icon: "mdi-clipboard-text-outline",
          value: item.assignmentCount,
        },
        {
          label: "teacherProgress.completion",
          icon: "mdi-check-circle-outline",
          value: `${item.completionRate}%`,
        },
        {
          label: "teacherProgress.gradedTotal",
          icon: "mdi-marker-check",
          value: item.gradedCount,
        },
      ]
    : [];
});

watch(classes, (items) => {
  if (!items.some((item) => item.id === selectedClassId.value))
    selectedClassId.value = items[0]?.id ?? null;
});
watch(selectedClassId, () => {
  studentsPage.value = 1;
  assignmentsPage.value = 1;
});
watch([search, studentFilter, studentSort], () => {
  studentsPage.value = 1;
});
watch(
  () => filteredStudents.value.length,
  (count) => {
    if (studentsPage.value > Math.max(1, Math.ceil(count / pageSize)))
      studentsPage.value = Math.max(1, Math.ceil(count / pageSize));
  },
);
watch(
  () => selectedClass.value?.assignments.length,
  (count = 0) => {
    if (assignmentsPage.value > Math.max(1, Math.ceil(count / pageSize)))
      assignmentsPage.value = Math.max(1, Math.ceil(count / pageSize));
  },
);

onMounted(loadProgress);

async function loadProgress() {
  loading.value = true;
  error.value = "";
  try {
    classes.value = await api("/teacher/overview/progress");
  } catch (cause) {
    error.value = cause?.message || t("teacherProgress.loadError");
  } finally {
    loading.value = false;
  }
}

function formatScore(value) {
  return value === null || value === undefined
    ? "—"
    : Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 });
}
function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getScoreColor(score) {
  if (score === null || score === undefined) return "grey";
  const val = Number(score);
  if (val >= 8) return "success";
  if (val >= 6.5) return "primary";
  if (val >= 5) return "warning";
  return "error";
}

function getInitial(name) {
  return (name || "").trim().charAt(0).toUpperCase() || "H";
}

async function openStudent(student) {
  if (!selectedClass.value) return;
  selectedStudent.value = student;
  studentDetail.value = null;
  detailError.value = "";
  detailSearch.value = "";
  detailStatusFilter.value = "ALL";
  detailPage.value = 1;
  studentDialog.value = true;
  detailLoading.value = true;
  try {
    studentDetail.value = await api(
      `/teacher/overview/progress/${selectedClass.value.id}/students/${student.id}`,
    );
  } catch (cause) {
    detailError.value = cause?.message || t("teacherProgress.detailLoadError");
  } finally {
    detailLoading.value = false;
  }
}
function assignmentKey(assignment) {
  return `${selectedClass.value?.id}-${assignment.type}-${assignment.id}`;
}
async function remindPending(assignment) {
  if (!selectedClass.value || remindingId.value) return;
  const key = assignmentKey(assignment);
  remindingId.value = key;
  try {
    const result = await api(
      `/classes/${selectedClass.value.id}/assignment-reminders`,
      {
        method: "POST",
        body: {
          assignmentId: assignment.id,
          type: assignment.type === "manual" ? "MANUAL" : "QUIZ",
        },
      },
    );
    remindedAssignments.value = new Set(remindedAssignments.value).add(key);
    toast.value = {
      show: true,
      color: "success",
      message: t("teacherProgress.reminderSent", {
        online: result.onlineCount,
        pending: result.pendingCount,
      }),
    };
  } catch (cause) {
    toast.value = {
      show: true,
      color: "error",
      message: cause?.message || t("teacherProgress.reminderError"),
    };
  } finally {
    remindingId.value = "";
  }
}
function exportProgress() {
  if (!selectedClass.value) return;
  exporting.value = true;
  try {
    const keys = [
      "metric",
      "value",
      "class",
      "grade",
      "schoolYear",
      "studentCount",
      "assignmentCount",
      "completion",
      "gradedTotal",
      "student",
      "email",
      "submitted",
      "totalAssignments",
      "graded",
      "quizAverage",
      "manualAverage",
      "assignment",
      "type",
      "deadline",
      "totalStudents",
      "online",
      "manual",
    ];
    const labels = Object.fromEntries(
      keys.map((key) => [key, t(`teacherProgress.exportLabels.${key}`)]),
    );
    const date = new Date().toISOString().slice(0, 10);
    downloadTeacherProgressWorkbook(
      selectedClass.value,
      labels,
      `duckbear-progress-class-${selectedClass.value.id}-${date}.xlsx`,
    );
    toast.value = {
      show: true,
      color: "success",
      message: t("teacherProgress.exportDone"),
    };
  } catch {
    toast.value = {
      show: true,
      color: "error",
      message: t("teacherProgress.exportError"),
    };
  } finally {
    exporting.value = false;
  }
}
</script>

<style scoped>
.progress-page {
  background: #f4f8ff;
}
.progress-container {
  max-width: 1240px;
}
.progress-hero {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 22px 24px;
  border: 1px solid #e2ebf8;
  border-radius: 20px;
  background: linear-gradient(120deg, #fff, #eff6ff);
}
.progress-hero-icon,
.metric-icon,
.assignment-symbol {
  display: grid;
  flex: none;
  place-items: center;
  border-radius: 14px;
  background: #e5efff;
  color: #347cf5;
}
.progress-hero-icon {
  width: 52px;
  height: 52px;
}
.progress-eyebrow {
  color: #347cf5;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.progress-hero h1 {
  margin: 2px 0;
  color: #1e2c43;
  font-size: clamp(1.4rem, 3vw, 1.8rem);
}
.progress-hero p,
.report-heading p {
  margin: 0;
  color: #75839a;
}
.progress-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.class-select {
  max-width: 260px;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}
.summary-card {
  display: grid;
  grid-template-columns: 42px 1fr;
  column-gap: 12px;
  align-items: center;
  border: 1px solid #e3ebf7;
  background: #fff;
}
.metric-icon {
  grid-row: span 2;
  width: 42px;
  height: 42px;
}
.summary-card small {
  color: #75839a;
}
.summary-card strong {
  color: #26364e;
  font-size: 1.35rem;
}
.report-card {
  overflow: hidden;
  border: 1px solid #e3ebf7;
  background: #fff;
}
.report-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 20px 22px;
  border-bottom: 1px solid #edf2f8;
}
.report-heading h2 {
  margin: 0;
  color: #25354d;
  font-size: 1.08rem;
}
.report-heading p {
  margin-top: 4px;
  font-size: 0.85rem;
}
.search-field {
  max-width: 300px;
}
.student-filter-toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 22px 0;
}
.filter-select {
  max-width: 260px;
}
.student-table th {
  color: #75839a !important;
  font-size: 0.72rem !important;
  text-transform: uppercase;
}
.student-table td:first-child {
  min-width: 220px;
}
.student-table td strong,
.student-table td small {
  display: block;
}
.student-table td small {
  color: #75839a;
  font-size: 0.78rem;
}
.student-row {
  cursor: pointer;
}
.student-row:hover,
.student-row:focus-visible {
  background: #f5f9ff;
  outline: none;
}
.assignment-list {
  padding: 0 22px;
}
.assignment-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid #edf2f8;
}
.assignment-row:last-child {
  border-bottom: 0;
}
.assignment-symbol {
  width: 40px;
  height: 40px;
}
.assignment-copy {
  display: flex;
  flex: 1;
  min-width: 120px;
  flex-direction: column;
  gap: 3px;
}
.assignment-copy small {
  color: #75839a;
  font-size: 0.78rem;
}

/* Student Detail Dialog */
.student-detail-dialog {
  display: flex;
  max-height: 90vh;
  max-height: 90dvh;
  flex-direction: column;
  overflow: hidden;
}
.kpi-mini-card {
  border-color: #e2e8f0 !important;
  transition: all 0.2s ease;
}
.kpi-mini-card:hover {
  transform: translateY(-1px);
  border-color: #cbd5e1 !important;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.04);
}
.assignment-detail-card {
  transition: all 0.18s ease;
  border-color: #e2e8f0 !important;
}
.assignment-detail-card:hover {
  border-color: #93c5fd !important;
  background: #f8fbff !important;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.04);
}
.feedback-callout {
  border-color: #bfdbfe !important;
  background: #eff6ff !important;
}
.detail-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  white-space: normal;
}
.detail-title div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.detail-title span,
.detail-title small {
  color: #75839a;
  font-size: 0.78rem;
  font-weight: 500;
}
.detail-title strong {
  color: #26364e;
  font-size: 1.2rem;
}
.detail-list {
  display: flex;
  flex-direction: column;
}
.detail-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid #edf2f8;
}
.detail-row:last-child {
  border-bottom: 0;
}
.detail-status {
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}
.feedback-line {
  margin: 5px 0 0;
  color: #53657d;
  font-size: 0.82rem;
  white-space: normal;
}
.empty-row,
.empty-state,
.progress-state {
  min-height: 160px;
  text-align: center;
  color: #75839a;
}
.empty-row {
  padding: 32px;
  text-align: center;
}
.empty-state,
.progress-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-direction: column;
}
.empty-state strong {
  color: #26364e;
}
.progress-state {
  min-height: 280px;
}

@media (max-width: 850px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .progress-hero {
    flex-wrap: wrap;
  }
  .progress-actions {
    width: 100%;
    flex-wrap: wrap;
  }
  .progress-actions > .v-btn {
    flex: 1;
  }
  .class-select {
    max-width: none;
    width: 100%;
  }
  .report-heading {
    align-items: stretch;
    flex-direction: column;
  }
  .search-field {
    max-width: none;
  }
  .student-filter-toolbar {
    padding: 12px 16px 0;
  }
  .filter-select {
    max-width: none;
    flex: 1;
  }
  .assignment-row {
    flex-wrap: wrap;
  }
  .assignment-copy {
    min-width: calc(100% - 60px);
  }
  .assignment-row .v-chip {
    margin-left: 50px;
  }
}
</style>
