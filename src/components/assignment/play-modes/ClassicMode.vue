<template>
  <div class="classic-mode">
    <!-- Header thông tin bài tập -->
    <v-card
      v-if="assignment"
      class="pa-5 pa-md-6 mb-4 classic-header-card"
      rounded="xl"
      elevation="1"
    >
      <div class="d-flex flex-wrap align-center justify-space-between ga-3">
        <div>
          <div class="text-overline text-primary font-weight-bold mb-1">
            {{ assignment.class?.name || t("classroom.defaultClass") || "Lớp học" }}
            ·
            {{ assignment.lesson?.title || assignment.book?.title || t("assignmentHub.onlineAssignment") || "Bài tập trực tuyến" }}
          </div>
          <!-- Tiêu đề bài tập nổi bật với khoảng cách hợp lý -->
          <h1 class="text-h4 font-weight-black my-2 text-grey-darken-4">
            {{ assignment.title }}
          </h1>
          <!-- Dòng lần làm rõ ràng: Lần làm thứ X · Không giới hạn số lần -->
          <div class="d-flex flex-wrap align-center ga-3 mt-2 text-body-2 text-secondary font-weight-medium">
            <span class="attempt-badge px-2 py-1 rounded-md bg-grey-lighten-4 text-grey-darken-3 font-weight-bold">
              {{ attemptInfoText }}
            </span>
            <span v-if="assignment.points">
              · {{ assignment.points }} {{ t("assignmentHub.pointsShort") || "điểm" }}
            </span>
          </div>
        </div>

        <v-chip
          v-if="timeLabel"
          color="warning"
          variant="tonal"
          size="large"
          prepend-icon="mdi-timer-outline"
          class="font-weight-black px-4"
        >
          {{ timeLabel }}
        </v-chip>
      </div>
    </v-card>

    <!-- Header tiến độ & điều hướng nhanh (Sticky cố định đầu trang khi cuộn) -->
    <v-card
      class="pa-4 pa-md-5 mb-5 sticky-progress-card"
      elevation="2"
      rounded="xl"
    >
      <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-3">
        <div class="d-flex align-baseline ga-2">
          <!-- Text: Câu hỏi (X/Y đã làm) chuẩn i18n -->
          <span class="text-subtitle-1 font-weight-black text-grey-darken-4">
            {{ t("questionBank.questionCount") || "Câu hỏi" }}
          </span>
          <span class="text-body-2 font-weight-bold text-secondary">
            ({{ answeredCount }}/{{ questions.length }} {{ t("assignments.statusDone") || "đã làm" }})
          </span>
        </div>

        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-send"
          :loading="submitting"
          rounded="lg"
          class="font-weight-black px-5"
          @click="openSubmitConfirm"
        >
          {{ t("assignmentHub.submit") }}
        </v-btn>
      </div>

      <!-- Thanh tiến độ mượt mà -->
      <v-progress-linear
        :model-value="progressPercent"
        color="primary"
        height="8"
        rounded
        class="progress-animated mb-2"
      />

      <!-- Thanh mở rộng / thu gọn danh sách câu hỏi trên mobile (< 640px) -->
      <div class="d-flex align-center justify-space-between mt-2 mb-1 d-sm-none mobile-expand-bar">
        <span class="text-caption font-weight-bold text-secondary">
          {{ t("questionBank.questionNumber", { number: currentActiveIndex + 1 }) }} / {{ questions.length }}
        </span>
        <button
          type="button"
          class="toggle-expand-btn text-caption font-weight-bold text-primary d-inline-flex align-center cursor-pointer"
          @click="isMobileExpanded = !isMobileExpanded"
        >
          <v-icon
            :icon="isMobileExpanded ? 'mdi-chevron-up' : 'mdi-view-grid-outline'"
            size="16"
            class="mr-1"
          />
          {{
            isMobileExpanded
              ? (t("assignmentHub.collapseQuestionGrid") || "Thu gọn")
              : (t("assignmentHub.viewAllQuestions") || "Xem tất cả câu")
          }}
        </button>
      </div>

      <!-- Bảng số câu 1..N: Phản hồi tức thì, ring câu đang xem, hover/focus bàn phím -->
      <div
        id="question-chips-bar"
        class="question-chips-container mt-2"
        :class="{
          'chips--single-row': !isMobileExpanded,
          'chips--expanded': isMobileExpanded,
        }"
        role="navigation"
        :aria-label="t('questionBank.questionCount')"
      >
        <button
          v-for="(item, index) in questions"
          :id="'chip-question-' + index"
          :key="item.question.id"
          type="button"
          class="question-nav-chip font-weight-bold"
          :class="{
            'chip--answered': isQuestionAnswered(item.question.id),
            'chip--unanswered': !isQuestionAnswered(item.question.id),
            'chip--active': currentActiveIndex === index,
            'chip--flagged': isQuestionFlagged(item.question.id),
          }"
          :aria-label="`Câu ${index + 1}`"
          :aria-current="currentActiveIndex === index ? 'true' : undefined"
          @click="handleSelectQuestion(index)"
        >
          {{ index + 1 }}
          <!-- Chấm cam nhỏ ở góc trên-phải khi đánh dấu xem lại -->
          <span
            v-if="isQuestionFlagged(item.question.id)"
            class="flag-dot"
            aria-hidden="true"
          />
        </button>
      </div>
    </v-card>

    <!-- Danh sách câu hỏi cuộn dọc -->
    <div class="questions-list">
      <QuestionItem
        v-for="(item, index) in questions"
        :id="'question-card-' + index"
        :key="item.question.id"
        :item="item"
        :index="index"
        :answer="answers[item.question.id]"
        :level="level"
        :is-first="index === 0"
        :is-last="index === questions.length - 1"
        :is-flagged="isQuestionFlagged(item.question.id)"
        mode="classic"
        @answered="onAnswered(item.question.id, index)"
        @prev="handlePrevQuestion(index)"
        @next="handleNextQuestion(index)"
        @toggle-flag="toggleFlag(item.question.id)"
      />
    </div>

    <!-- Nút nộp bài cuối trang -->
    <div class="d-flex justify-end mt-6 mb-10">
      <v-btn
        color="primary"
        size="large"
        prepend-icon="mdi-send"
        rounded="pill"
        :loading="submitting"
        class="px-8 font-weight-black"
        elevation="2"
        @click="openSubmitConfirm"
      >
        {{ t("assignmentHub.submit") }}
      </v-btn>
    </div>

    <!-- HỘP THOẠI XÁC NHẬN NỘP BÀI -->
    <v-dialog v-model="showSubmitDialog" max-width="480" persistent>
      <v-card class="pa-6 rounded-2xl" elevation="6">
        <div class="d-flex align-center mb-3">
          <v-avatar
            :color="unansweredCount > 0 ? 'warning' : 'success'"
            variant="tonal"
            size="48"
            class="mr-3"
          >
            <v-icon
              :icon="unansweredCount > 0 ? 'mdi-alert-circle' : 'mdi-check-circle'"
              size="28"
            />
          </v-avatar>
          <div>
            <h3 class="text-h6 font-weight-black">
              {{
                unansweredCount > 0
                  ? (t("assignmentHub.confirmSubmitTitle") || "Xác nhận nộp bài")
                  : (t("assignmentHub.confirmSubmitCompleteTitle") || "Hoàn thành bài tập!")
              }}
            </h3>
            <span class="text-caption text-secondary">
              {{ answeredCount }}/{{ questions.length }} {{ t("assignments.statusDone") || "đã làm" }}
            </span>
          </div>
        </div>

        <p class="text-body-1 text-grey-darken-3 my-3">
          <template v-if="unansweredCount > 0">
            {{
              t("assignmentHub.confirmSubmitIncomplete", { count: unansweredCount }) ||
              `Bạn còn ${unansweredCount} câu chưa làm. Bạn có chắc muốn nộp bài?`
            }}
          </template>
          <template v-else>
            {{
              t("assignmentHub.confirmSubmitComplete", { count: questions.length }) ||
              `Bạn đã hoàn thành tất cả ${questions.length} câu hỏi. Bạn có chắc muốn nộp bài ngay bây giờ?`
            }}
          </template>
        </p>

        <div class="d-flex justify-end ga-3 pt-4 border-t mt-3">
          <v-btn
            variant="outlined"
            rounded="pill"
            class="font-weight-bold px-4"
            @click="showSubmitDialog = false"
          >
            {{ t("assignmentHub.continueWorking") || "Làm tiếp" }}
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            rounded="pill"
            :loading="submitting"
            class="font-weight-black px-6"
            @click="confirmFinalSubmit"
          >
            {{ t("assignmentHub.confirmSubmitBtn") || "Nộp bài ngay" }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import QuestionItem from "../QuestionItem.vue";

const props = defineProps({
  session: { type: Object, default: null },
  assignment: { type: Object, default: () => ({}) },
  questions: { type: Array, default: () => [] },
  answers: { type: Object, default: () => ({}) },
  loading: { type: Boolean, default: false },
  submitting: { type: Boolean, default: false },
  level: { type: Number, default: 3 },
});

const emit = defineEmits(["submit", "answer-change"]);
const { t } = useI18n();

const assignment = computed(
  () => props.session?.assignment?.value || props.assignment,
);
const questions = computed(
  () => props.session?.questions?.value || props.questions || [],
);
const answers = computed(() => props.session?.answers || props.answers || {});
const submitting = computed(
  () => props.session?.submitting?.value ?? props.submitting,
);
const level = computed(() => props.session?.level?.value ?? props.level);
const timeLabel = computed(() => props.session?.timeLabel?.value || "");
const attemptNo = computed(() => props.session?.attemptNo?.value || 1);

// Quản lý trạng thái câu hỏi đang xem và mở rộng ô câu trên mobile
const currentActiveIndex = ref(0);
const isMobileExpanded = ref(false);
const showSubmitDialog = ref(false);

// Quản lý câu hỏi được đánh dấu xem lại (Flag)
const flaggedQuestions = ref(new Set());

function isQuestionFlagged(questionId) {
  return flaggedQuestions.value.has(questionId);
}

function toggleFlag(questionId) {
  if (flaggedQuestions.value.has(questionId)) {
    flaggedQuestions.value.delete(questionId);
  } else {
    flaggedQuestions.value.add(questionId);
  }
  flaggedQuestions.value = new Set(flaggedQuestions.value);
  saveDraftToStorage();
}

// Format số lần làm bài rõ ràng
const attemptInfoText = computed(() => {
  const current = attemptNo.value || 1;
  const max = assignment.value?.maxAttempts;
  if (!max) {
    return t("assignmentHub.attemptUnlimited", { number: current }) || `Lần làm thứ ${current} · Không giới hạn số lần`;
  }
  return t("assignmentHub.attemptLimited", { number: current, max }) || `Lần làm thứ ${current} / ${max}`;
});

function isQuestionAnswered(questionId) {
  const a = answers.value[questionId];
  if (!a) return false;
  const hasSingle =
    a.selectedOptionId !== null && a.selectedOptionId !== undefined;
  const hasMulti =
    Array.isArray(a.selectedOptionIds) && a.selectedOptionIds.length > 0;
  const hasText =
    typeof a.answerText === "string" && a.answerText.trim().length > 0;
  const hasMatch = a.matchAnswers && Object.keys(a.matchAnswers).length > 0;
  return Boolean(hasSingle || hasMulti || hasText || hasMatch);
}

const answeredCount = computed(() => {
  return questions.value.filter((q) => isQuestionAnswered(q.question.id)).length;
});

const unansweredCount = computed(() => {
  return Math.max(0, questions.value.length - answeredCount.value);
});

const progressPercent = computed(() => {
  if (!questions.value.length) return 0;
  return (answeredCount.value / questions.value.length) * 100;
});

// Draft key trong localStorage để lưu tạm tránh mất bài khi reload (lưu kèm cờ đánh dấu)
function getStorageKey() {
  const assignId = assignment.value?.id;
  return assignId ? `assignment_draft_${assignId}` : null;
}

function saveDraftToStorage() {
  const key = getStorageKey();
  if (key) {
    try {
      const data = {
        answers: answers.value,
        flagged: Array.from(flaggedQuestions.value),
      };
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // Bỏ qua lỗi quota nếu có
    }
  }
}

function restoreDraftFromStorage() {
  const key = getStorageKey();
  if (!key) return;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        const savedAnswers = parsed.answers || parsed;
        const savedFlagged = Array.isArray(parsed.flagged) ? parsed.flagged : [];

        if (savedAnswers && typeof savedAnswers === "object") {
          Object.entries(savedAnswers).forEach(([qId, val]) => {
            if (val && typeof val === "object" && (!answers.value[qId] || !isQuestionAnswered(Number(qId)))) {
              answers.value[qId] = val;
              if (props.session) {
                props.session.setAnswer(Number(qId), val);
              }
            }
          });
        }
        if (savedFlagged.length > 0) {
          flaggedQuestions.value = new Set(savedFlagged);
        }
      }
    }
  } catch {
    // Bỏ qua nếu dữ liệu storage không hợp lệ
  }
}

function onAnswered(questionId, index) {
  if (props.session) {
    props.session.setAnswer(questionId, answers.value[questionId]);
  }
  saveDraftToStorage();
  emit("answer-change", { questionId, index });
}

// Cờ ngăn chặn Observer ghi đè câu hiện tại khi đang chạy animation cuộn chủ động
let isProgrammaticScrolling = false;
let scrollTimeout = null;

function scrollToQuestion(index) {
  if (index < 0 || index >= questions.value.length) return;
  currentActiveIndex.value = index;
  isProgrammaticScrolling = true;
  if (scrollTimeout) clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    isProgrammaticScrolling = false;
  }, 750);

  const el = document.getElementById("question-card-" + index);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function handleSelectQuestion(index) {
  scrollToQuestion(index);
}

function handlePrevQuestion(index) {
  if (index > 0) {
    scrollToQuestion(index - 1);
  }
}

function handleNextQuestion(index) {
  if (index < questions.value.length - 1) {
    scrollToQuestion(index + 1);
  } else {
    openSubmitConfirm();
  }
}

function openSubmitConfirm() {
  showSubmitDialog.value = true;
}

function confirmFinalSubmit() {
  showSubmitDialog.value = false;
  // Xóa draft storage sau khi nộp
  const key = getStorageKey();
  if (key) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Bỏ qua
    }
  }

  if (props.session) {
    props.session.submit();
  } else {
    emit("submit");
  }
}

// Tự động cuộn ô số câu tương ứng vào giữa thanh cuộn ngang trên mobile
function scrollActiveChipIntoView(index) {
  nextTick(() => {
    const chipEl = document.getElementById("chip-question-" + index);
    if (chipEl) {
      chipEl.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  });
}

watch(currentActiveIndex, (newIdx) => {
  scrollActiveChipIntoView(newIdx);
});

// Hỗ trợ phím tắt: 1–4 hoặc A–D để chọn đáp án, mũi tên để chuyển câu
function handleKeydown(e) {
  const tag = e.target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable) {
    return;
  }

  if (e.key === "ArrowDown" || e.key === "ArrowRight") {
    if (currentActiveIndex.value < questions.value.length - 1) {
      e.preventDefault();
      scrollToQuestion(currentActiveIndex.value + 1);
    }
    return;
  }
  if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
    if (currentActiveIndex.value > 0) {
      e.preventDefault();
      scrollToQuestion(currentActiveIndex.value - 1);
    }
    return;
  }

  const keyUpper = e.key.toUpperCase();
  const digitMap = { "1": 0, "2": 1, "3": 2, "4": 3 };
  const letterMap = { "A": 0, "B": 1, "C": 2, "D": 3 };
  const optIdx = digitMap[e.key] ?? letterMap[keyUpper];

  if (optIdx !== undefined) {
    const curQuestionItem = questions.value[currentActiveIndex.value];
    if (!curQuestionItem) return;
    const q = curQuestionItem.question;

    if (["MCQ", "TRUE_FALSE"].includes(q.type) && Array.isArray(q.options) && q.options[optIdx]) {
      e.preventDefault();
      const targetOption = q.options[optIdx];
      const curAnswer = answers.value[q.id] || {};
      curAnswer.selectedOptionId = targetOption.id;
      answers.value[q.id] = curAnswer;
      onAnswered(q.id, currentActiveIndex.value);
    }
  }
}

// IntersectionObserver theo dõi câu hỏi đang nằm trong vùng nhìn thấy
let observer = null;
const visibleCards = new Map();

function setupScrollObserver() {
  if (typeof IntersectionObserver === "undefined") return;

  observer = new IntersectionObserver(
    (entries) => {
      if (isProgrammaticScrolling) return;

      // Khi người dùng đang ở trên đầu trang (gần header), câu hiện tại luôn là câu 1 (index 0)
      if (window.scrollY < 120) {
        currentActiveIndex.value = 0;
        return;
      }

      entries.forEach((entry) => {
        const match = entry.target.id.match(/question-card-(\d+)/);
        if (match) {
          const idx = Number(match[1]);
          if (entry.isIntersecting) {
            visibleCards.set(idx, entry.boundingClientRect.top);
          } else {
            visibleCards.delete(idx);
          }
        }
      });

      if (visibleCards.size > 0) {
        // Tìm câu hỏi có vị trí đỉnh gần với mép dưới thanh sticky header nhất (~170px)
        let closestIdx = -1;
        let minDistance = Infinity;
        const targetFocusY = 170;

        for (const [idx, top] of visibleCards.entries()) {
          const dist = Math.abs(top - targetFocusY);
          if (dist < minDistance) {
            minDistance = dist;
            closestIdx = idx;
          }
        }

        if (closestIdx !== -1) {
          currentActiveIndex.value = closestIdx;
        }
      }
    },
    {
      rootMargin: "-80px 0px -25% 0px",
      threshold: [0.1, 0.4, 0.7],
    },
  );

  questions.value.forEach((_, idx) => {
    const el = document.getElementById("question-card-" + idx);
    if (el) observer.observe(el);
  });
}

function handleWindowScroll() {
  if (isProgrammaticScrolling) return;
  if (window.scrollY < 120) {
    currentActiveIndex.value = 0;
  }
}

onMounted(() => {
  restoreDraftFromStorage();
  window.addEventListener("keydown", handleKeydown);
  window.addEventListener("scroll", handleWindowScroll, { passive: true });
  setTimeout(setupScrollObserver, 300);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown);
  window.removeEventListener("scroll", handleWindowScroll);
  if (scrollTimeout) clearTimeout(scrollTimeout);
  if (observer) {
    observer.disconnect();
  }
});
</script>

<style scoped>
/* Sticky Progress Card */
.sticky-progress-card {
  position: sticky;
  top: 12px;
  z-index: 25;
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.95) !important;
  border: 1px solid rgba(226, 232, 240, 0.9);
  transition: box-shadow 0.2s ease;
}

.progress-animated :deep(.v-progress-linear__determinate) {
  transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Lưới chip số câu 1..N trên Desktop */
.question-chips-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 140px;
  overflow-y: auto;
  padding: 4px 2px;
  transition: all 0.25s ease;
}

.question-chips-container::-webkit-scrollbar {
  height: 4px;
  width: 5px;
}
.question-chips-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

/* Ô số câu: vùng bấm tối thiểu 40px */
.question-nav-chip {
  min-width: 40px;
  height: 40px;
  padding: 0 6px;
  border-radius: 10px;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.18s ease;
  user-select: none;
  position: relative;
  flex-shrink: 0;
  box-sizing: border-box;
}

/* Chấm cam nhỏ ở góc trên phải khi đánh dấu xem lại */
.flag-dot {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 8px;
  height: 8px;
  background-color: #f97316;
  border-radius: 50%;
  border: 1.5px solid #ffffff;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
  pointer-events: none;
}

/* Chưa làm: viền xám, nền trắng, chữ đen sẫm đạt WCAG AA */
.chip--unanswered {
  background: #ffffff;
  color: #1e293b;
  border: 1.5px solid #cbd5e1;
}
.chip--unanswered:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}

/* Đã làm: nền xanh dương, chữ trắng */
.chip--answered {
  background: #2563eb;
  color: #ffffff;
  border: 1.5px solid #2563eb;
}
.chip--answered:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

/* Câu đang xem: ring xanh nổi bật */
.chip--active {
  box-shadow: 0 0 0 3px #1d4ed8 !important;
  font-weight: 900 !important;
}

/* Focus bàn phím */
.question-nav-chip:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

/* Tự động căn lề cuộn mượt cho thẻ câu hỏi dưới sticky header */
:deep(.quiz-card) {
  scroll-margin-top: 175px;
}

/* Nút thu gọn / mở rộng trên mobile */
.toggle-expand-btn {
  background: none;
  border: none;
  padding: 4px 6px;
  border-radius: 6px;
  transition: background 0.15s ease;
}
.toggle-expand-btn:hover {
  background: rgba(37, 99, 235, 0.08);
}

/* MOBILE RESPONSIVE (< 640px) */
@media (max-width: 639px) {
  .question-nav-chip {
    min-width: 40px;
    height: 40px;
    font-size: 0.88rem;
  }

  /* Mặc định trên mobile: 1 hàng duy nhất cuộn ngang */
  .question-chips-container.chips--single-row {
    flex-wrap: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 4px 2px 8px 2px;
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
  }

  /* Khi bấm 'Xem tất cả câu': mở rộng lưới nhiều hàng */
  .question-chips-container.chips--expanded {
    flex-wrap: wrap;
    max-height: 180px;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 4px 2px;
  }
}
</style>
