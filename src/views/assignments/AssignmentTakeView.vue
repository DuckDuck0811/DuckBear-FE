<template>
  <v-layout
    class="min-vh-100 assignment-take-page play-mode-container"
    :class="`level-${session.level.value}`"
  >
    <!-- Header và Sidebar học sinh hiển thị chuẩn như ngày trước -->
    <AppHeader />
    <StudentSidebar />

    <v-main class="pb-16">
      <v-container class="py-7 px-4 px-md-8" style="max-width: 960px">
        <!-- Nút quay lại chỉ hiển thị khi đã nộp bài xong -->
        <v-btn
          v-if="session.result.value"
          to="/assignments"
          variant="text"
          prepend-icon="mdi-arrow-left"
          class="mb-3 font-weight-bold"
        >
          {{ t("assignmentHub.backToAssignments") }}
        </v-btn>

        <!-- Trạng thái đang tải -->
        <v-progress-linear
          v-if="session.loading.value"
          indeterminate
          color="primary"
          rounded
        />

        <!-- Thông báo lỗi tải bài -->
        <v-alert
          v-else-if="session.errorMessage.value"
          type="error"
          variant="tonal"
          class="ma-4"
        >
          {{ session.errorMessage.value }}
          <div class="mt-3">
            <v-btn
              to="/assignments"
              variant="outlined"
              size="small"
              color="error"
            >
              {{ t("assignmentHub.backToAssignments") }}
            </v-btn>
          </div>
        </v-alert>

        <!-- KẾT QUẢ SAU KHI NỘP BÀI THÀNH CÔNG -->
        <template v-else-if="session.result.value">
          <v-card class="pa-6 mb-5 text-center" rounded="xl" elevation="2">
            <v-avatar color="success" variant="tonal" size="72" class="mb-3">
              <v-icon icon="mdi-check-bold" size="36" />
            </v-avatar>
            <h1 class="text-h4 font-weight-black mb-2">
              {{ t("assignmentHub.submitted") }}
            </h1>
            <p class="text-h6 font-weight-bold text-primary mb-2">
              {{
                session.result.value.needsManualGrading
                  ? t("assignmentHub.waitForGrading")
                  : t("assignmentHub.score", {
                      score: session.result.value.score ?? 0,
                    })
              }}
            </p>
            <p
              v-if="session.result.value.totalPoints"
              class="text-body-1 text-secondary mb-4"
            >
              {{
                t("assignmentHub.points", {
                  earned: session.result.value.earnedPoints,
                  total: session.result.value.totalPoints,
                })
              }}
            </p>

            <!-- Nút bấm nổi bật: Quay về trang Bài tập trực tuyến -->
            <div class="d-flex justify-center ga-3 mt-4">
              <v-btn
                to="/assignments"
                color="primary"
                size="large"
                rounded="pill"
                class="px-8 font-weight-black"
                prepend-icon="mdi-clipboard-check-outline"
                elevation="3"
              >
                Về trang Bài tập trực tuyến
              </v-btn>
            </div>
          </v-card>

          <!-- Danh sách câu hỏi kèm đáp án & lời giải chi tiết -->
          <v-card
            v-for="(answer, index) in session.result.value.answers"
            :key="answer.id"
            class="pa-5 mb-3"
            rounded="xl"
          >
            <div class="d-flex align-center ga-2 mb-2">
              <v-chip size="small" color="primary" variant="tonal">
                {{ t("questionBank.questionNumber", { number: index + 1 }) }}
              </v-chip>
              <v-chip
                v-if="answer.isCorrect !== null"
                size="small"
                :color="answer.isCorrect ? 'success' : 'error'"
                variant="tonal"
              >
                {{
                  answer.isCorrect
                    ? t("assignmentHub.correct")
                    : t("assignmentHub.incorrect")
                }}
              </v-chip>
            </div>
            <div class="font-weight-bold mb-2">
              {{ answer.question.content }}
            </div>
            <div v-if="answer.question.answerText" class="text-body-2 mb-1">
              <strong>{{ t("questionBank.answerText") }}:</strong>
              {{ answer.question.answerText }}
            </div>
            <div
              v-if="answer.question.explanation"
              class="text-body-2 text-secondary"
            >
              <strong>{{ t("questionBank.explanation") }}:</strong>
              {{ answer.question.explanation }}
            </div>
          </v-card>
        </template>

        <!-- ĐANG THAM GIA LÀM BÀI: CHẾ ĐỘ CƠ BẢN (CLASSIC / BASIC) NHƯ NGÀY TRƯỚC -->
        <template v-else-if="session.assignment.value">
          <ClassicMode :session="session" />
        </template>
      </v-container>
    </v-main>

    <!-- HỘP THOẠI XÁC NHẬN NẾU HỌC SINH CỐ TÌNH ĐIỀU HƯỚNG KHI ĐANG LÀM DỞ -->
    <v-dialog v-model="showLeaveConfirmDialog" max-width="480" persistent>
      <v-card class="pa-6 rounded-2xl" elevation="6">
        <div class="d-flex align-center mb-3">
          <v-avatar color="warning" variant="tonal" size="48" class="mr-3">
            <v-icon icon="mdi-alert" color="warning" size="28" />
          </v-avatar>
          <div>
            <h3 class="text-h6 font-weight-black text-warning">
              Rời khỏi bài tập?
            </h3>
            <span class="text-caption text-secondary"
              >Cảnh báo chưa hoàn thành bài</span
            >
          </div>
        </div>

        <p class="text-body-1 text-grey-darken-3 my-3">
          Em đang làm bài tập dở và chưa hoàn thành nộp bài. Em cần làm xong và
          bấm <strong>Nộp bài</strong> để hệ thống ghi nhận kết quả và quay về
          trang Bài tập trực tuyến.
        </p>

        <div class="d-flex justify-end ga-3 pt-4 border-t mt-3">
          <v-btn
            color="primary"
            variant="flat"
            rounded="pill"
            class="font-weight-black px-6"
            @click="cancelLeave"
          >
            Ở lại làm tiếp
          </v-btn>
          <v-btn
            variant="text"
            color="error"
            rounded="pill"
            class="font-weight-bold px-4"
            @click="confirmLeave"
          >
            Vẫn rời đi
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import { onBeforeRouteLeave, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAssignmentSession } from "../../composables/useAssignmentSession";
import AppHeader from "../../components/shared/AppHeader.vue";
import StudentSidebar from "../../components/shared/StudentSidebar.vue";
import ClassicMode from "../../components/assignment/play-modes/ClassicMode.vue";

const { t } = useI18n();
const session = useAssignmentSession();
const router = useRouter();

// Học sinh đang trong quá trình làm bài (đã tải xong đề bài, chưa nộp bài)
const isTakingExam = computed(() => {
  return !session.result.value && Boolean(session.assignment.value);
});

// ─── NAVIGATION GUARD: KHÓA RỜI TRANG KHI ĐANG LÀM BÀI DỞ ───────────────────
const showLeaveConfirmDialog = ref(false);
const pendingNextRoute = ref(null);
const allowLeave = ref(false);

onBeforeRouteLeave((to, from, next) => {
  // Chỉ cảnh báo nếu đang làm bài dở (chưa có kết quả) và chưa được cho phép rời
  if (isTakingExam.value && !allowLeave.value) {
    pendingNextRoute.value = to;
    showLeaveConfirmDialog.value = true;
    next(false);
  } else {
    next();
  }
});

function cancelLeave() {
  showLeaveConfirmDialog.value = false;
  pendingNextRoute.value = null;
}

function confirmLeave() {
  allowLeave.value = true;
  showLeaveConfirmDialog.value = false;
  const target = pendingNextRoute.value || "/assignments";
  pendingNextRoute.value = null;
  router.push(target);
}

// Cảnh báo khi reload F5 hoặc đóng tab trình duyệt
function handleBeforeUnload(e) {
  if (isTakingExam.value && !allowLeave.value) {
    e.preventDefault();
    e.returnValue = "";
  }
}

onMounted(() => {
  window.addEventListener("beforeunload", handleBeforeUnload);
});

onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", handleBeforeUnload);
});
</script>

<style scoped>
.assignment-take-page {
  background: #f4f8ff;
}
</style>
