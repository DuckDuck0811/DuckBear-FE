<template>
  <div class="space-mode">
    <!-- KHUNG TRẠM KHÔNG GIAN VŨ TRỤ -->
    <v-card class="pa-4 pa-md-5 mb-5 space-header-card" elevation="3" rounded="xl">
      <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-3">
        <div class="d-flex align-center ga-3">
          <div class="space-avatar-badge">
            <span class="text-h4">🚀</span>
          </div>
          <div>
            <div class="text-h6 font-weight-black text-indigo-lighten-4">
              Thám hiểm dải ngân hà
            </div>
            <div class="text-body-2 font-weight-bold text-slate-300">
              Tọa độ: <span class="text-amber-lighten-3 font-weight-black">Câu {{ currentIndex + 1 }} / {{ questions.length }}</span>
            </div>
          </div>
        </div>

        <div class="d-flex align-center ga-3">
          <!-- Hành tinh hiện tại -->
          <div class="planet-badge d-flex align-center ga-2 px-3 py-1 rounded-pill bg-slate-800 border-indigo">
            <span class="text-h5">{{ currentPlanet.emoji }}</span>
            <div class="text-subtitle-2 font-weight-bold text-indigo-lighten-3">
              {{ currentPlanet.name }}
            </div>
          </div>

          <!-- Nhiên liệu Rocket Fuel -->
          <div class="d-flex align-center ga-1 text-subtitle-2 font-weight-black text-amber-lighten-3 bg-slate-800 px-3 py-1 rounded-pill border">
            <v-icon icon="mdi-gas-station" color="amber-lighten-2" size="20" />
            <span>{{ fuel }}% Nhiên liệu</span>
          </div>
        </div>
      </div>

      <!-- DẢI HÀNH TINH KHÔNG GIAN -->
      <div class="space-galaxy-track mt-2">
        <div class="space-track-planets">
          <div
            v-for="(planet, pIdx) in planetsList"
            :key="planet.name"
            class="planet-node"
            :class="{
              'planet--visited': isPlanetVisited(pIdx),
              'planet--active': currentPlanetIndex === pIdx,
            }"
          >
            <span class="planet-icon">{{ planet.emoji }}</span>
            <span class="planet-label">{{ planet.name }}</span>
          </div>

          <!-- Con tàu vũ trụ -->
          <div
            class="rocket-ship"
            :style="{ left: `${rocketPositionPercent}%` }"
          >
            <span class="rocket-emoji">🚀</span>
          </div>
        </div>
      </div>
    </v-card>

    <!-- CÂU HỎI HIỆN TẠI -->
    <div v-if="currentQuestionItem" class="current-question-container">
      <QuestionItem
        :item="currentQuestionItem"
        :index="currentIndex"
        :answer="answers[currentQuestionItem.question.id]"
        :level="1"
        mode="space"
        :disabled="isCurrentChecked"
        @answered="onAnswered"
      />

      <!-- Thông báo kết quả kiểm tra -->
      <v-fade-transition>
        <v-alert
          v-if="checkResult"
          :type="checkResult.isCorrect ? 'success' : checkResult.status === 'PENDING_TEACHER_GRADE' ? 'info' : 'warning'"
          variant="tonal"
          class="mt-4 mb-4 font-weight-medium rounded-xl"
        >
          <div class="d-flex align-center ga-2 text-subtitle-1 font-weight-bold">
            <span v-if="checkResult.isCorrect">✨ Động cơ phản lực kích hoạt! Tàu vũ trụ nạp đầy năng lượng bay về phía trước!</span>
            <span v-else-if="checkResult.status === 'PENDING_TEACHER_GRADE'">📝 Tín hiệu truyền về trạm kiểm soát Trái Đất, chờ giáo viên chấm nhé!</span>
            <span v-else>🛸 Lệch quỹ đạo nhẹ! Tàu vẫn an toàn giữ vị trí, tiếp tục hành trình nào!</span>
          </div>
          <div v-if="checkResult.explanation" class="text-body-2 mt-2">
            <strong>Lời giải thích:</strong> {{ checkResult.explanation }}
          </div>
        </v-alert>
      </v-fade-transition>

      <!-- Nút điều hướng & Khởi động động cơ -->
      <div class="d-flex justify-space-between align-center mt-6">
        <v-btn
          variant="outlined"
          color="secondary"
          size="large"
          prepend-icon="mdi-arrow-left"
          :disabled="currentIndex === 0 || checking"
          @click="prevQuestion"
        >
          Tọa độ trước
        </v-btn>

        <div class="d-flex ga-3">
          <v-btn
            v-if="!isCurrentChecked"
            color="indigo-darken-2"
            size="large"
            variant="flat"
            prepend-icon="mdi-rocket-launch"
            :loading="checking"
            :disabled="!hasAnswer(currentQuestionItem.question.id)"
            class="px-6 font-weight-bold text-white"
            @click="handleCheckAnswer"
          >
            Kích hoạt tên lửa
          </v-btn>

          <v-btn
            v-if="isCurrentChecked && !isLastQuestion"
            color="success"
            size="large"
            variant="flat"
            append-icon="mdi-arrow-right"
            class="px-6 font-weight-bold"
            @click="nextQuestion"
          >
            Hành tinh kế tiếp
          </v-btn>

          <v-btn
            v-if="isLastQuestion"
            color="primary"
            size="large"
            variant="flat"
            prepend-icon="mdi-flag-variant"
            :loading="submitting"
            class="px-8 font-weight-bold"
            @click="$emit('submit')"
          >
            Cập bến ngân hà & Nộp bài
          </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { api } from "../../../services/api";
import QuestionItem from "../QuestionItem.vue";

const props = defineProps({
  assignment: { type: Object, required: true },
  questions: { type: Array, required: true },
  answers: { type: Object, required: true },
  attemptId: { type: [Number, String], required: true },
  loading: { type: Boolean, default: false },
  submitting: { type: Boolean, default: false },
  level: { type: Number, default: 1 },
});

const emit = defineEmits(["submit", "answer-change"]);
const { t } = useI18n();

const currentIndex = ref(0);
const fuel = ref(100);
const checking = ref(false);
const checkedQuestions = reactive({});

const planetsList = [
  { name: "Trái Đất", emoji: "🌍" },
  { name: "Mặt Trăng", emoji: "🌕" },
  { name: "Sao Hỏa", emoji: "🔴" },
  { name: "Sao Mộc", emoji: "🪐" },
  { name: "Mặt Trời", emoji: "☀️" },
];

const currentQuestionItem = computed(() => props.questions[currentIndex.value]);
const isLastQuestion = computed(() => currentIndex.value >= props.questions.length - 1);
const isCurrentChecked = computed(() => {
  const qId = currentQuestionItem.value?.question?.id;
  return Boolean(checkedQuestions[qId]);
});
const checkResult = computed(() => {
  const qId = currentQuestionItem.value?.question?.id;
  return checkedQuestions[qId] || null;
});

const currentPlanetIndex = computed(() => {
  const segment = Math.floor(currentIndex.value / 5);
  return Math.min(planetsList.length - 1, segment);
});

const currentPlanet = computed(() => planetsList[currentPlanetIndex.value] || planetsList[0]);

const rocketPositionPercent = computed(() => {
  const total = props.questions.length;
  if (total <= 1) return 85;
  return Math.min(88, Math.max(5, (currentIndex.value / (total - 1)) * 80 + 5));
});

function isPlanetVisited(pIdx) {
  return pIdx < currentPlanetIndex.value;
}

function hasAnswer(questionId) {
  const a = props.answers[questionId];
  if (!a) return false;
  const hasSingle = a.selectedOptionId !== null && a.selectedOptionId !== undefined;
  const hasMulti = Array.isArray(a.selectedOptionIds) && a.selectedOptionIds.length > 0;
  const hasText = typeof a.answerText === "string" && a.answerText.trim().length > 0;
  const hasImage = typeof a.imageUrl === "string" && a.imageUrl.length > 0;
  const hasMatch = a.matchAnswers && Object.keys(a.matchAnswers).length > 0;
  return hasSingle || hasMulti || hasText || hasImage || hasMatch;
}

function onAnswered(questionId) {
  emit("answer-change", { questionId, index: currentIndex.value });
}

async function handleCheckAnswer() {
  const q = currentQuestionItem.value?.question;
  if (!q || isCurrentChecked.value) return;

  const a = props.answers[q.id] || {};
  checking.value = true;
  try {
    const payload = {
      questionId: q.id,
      selectedOptionIds: a.selectedOptionId
        ? [a.selectedOptionId]
        : Array.isArray(a.selectedOptionIds)
          ? a.selectedOptionIds
          : [],
      answerText: a.answerText || undefined,
      matchAnswers: a.matchAnswers || undefined,
    };

    const res = await api.post(
      `/assignments/attempts/${props.attemptId}/check-answer`,
      payload,
    );
    checkedQuestions[q.id] = res;

    if (res.isCorrect === true) {
      fuel.value = Math.min(100, fuel.value + 10);
    } else {
      fuel.value = Math.max(10, fuel.value - 10);
    }
  } catch (err) {
    if (err?.status === 409 || err?.response?.status === 409) {
      checkedQuestions[q.id] = { isCorrect: false, status: "ALREADY_CHECKED" };
    }
  } finally {
    checking.value = false;
  }
}

function nextQuestion() {
  if (currentIndex.value < props.questions.length - 1) {
    currentIndex.value += 1;
  }
}

function prevQuestion() {
  if (currentIndex.value > 0) {
    currentIndex.value -= 1;
  }
}
</script>

<style scoped>
.space-header-card {
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
  border: 2px solid #4338ca !important;
  color: white;
}

.space-avatar-badge {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #1e293b;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
  border: 1px solid #6366f1;
}

.border-indigo {
  border: 1px solid #4f46e5;
}

.space-galaxy-track {
  position: relative;
  background: #020617;
  border-radius: 14px;
  padding: 16px 20px;
  border: 1px solid #312e81;
  overflow-x: auto;
}

.space-track-planets {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-width: 450px;
}

.planet-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
  opacity: 0.5;
  transition: all 0.3s ease;
}

.planet--visited {
  opacity: 0.85;
}

.planet--active {
  opacity: 1;
  transform: scale(1.2);
}

.planet-icon {
  font-size: 28px;
}

.planet-label {
  font-size: 10px;
  color: #94a3b8;
  font-weight: bold;
}

.rocket-ship {
  position: absolute;
  top: -8px;
  transform: translateX(-50%);
  transition: left 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 5;
}

.rocket-emoji {
  font-size: 26px;
  filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.8));
}
</style>
