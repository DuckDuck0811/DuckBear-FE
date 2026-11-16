<template>
  <div class="map-mode">
    <!-- KHUNG CHINH PHỤC BẢN ĐỒ -->
    <v-card class="pa-4 pa-md-5 mb-5 map-header-card" elevation="3" rounded="xl">
      <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-3">
        <div class="d-flex align-center ga-3">
          <div class="map-avatar-badge">
            <span class="text-h4">🧭</span>
          </div>
          <div>
            <div class="text-h6 font-weight-black text-emerald-lighten-4">
              Hành trình Chinh Phục Lục Địa
            </div>
            <div class="text-body-2 font-weight-bold text-slate-300">
              Chặng hiện tại: <span class="text-emerald-lighten-2 font-weight-black">{{ currentZone.name }} (Câu {{ currentIndex + 1 }} / {{ questions.length }})</span>
            </div>
          </div>
        </div>

        <div class="d-flex align-center ga-3">
          <!-- Vùng đất đã mở -->
          <div class="zone-badge d-flex align-center ga-2 px-3 py-1 rounded-pill bg-slate-900 border-emerald">
            <span class="text-h5">{{ currentZone.emoji }}</span>
            <div class="text-subtitle-2 font-weight-bold text-emerald-lighten-3">
              Vùng {{ currentZoneIndex + 1 }} / {{ zones.length }}
            </div>
          </div>

          <!-- Huy hiệu thám hiểm -->
          <div class="d-flex align-center ga-1 text-subtitle-2 font-weight-black text-amber-lighten-3 bg-slate-900 px-3 py-1 rounded-pill border">
            <v-icon icon="mdi-shield-star" color="amber-lighten-2" size="20" />
            <span>{{ expeditionPoints }} Điểm</span>
          </div>
        </div>
      </div>

      <!-- CÁC VÙNG ĐẤT TRÊN LỤC ĐỊA -->
      <div class="continent-track mt-2">
        <div class="zone-cards-list">
          <div
            v-for="(zone, zIdx) in zones"
            :key="zone.name"
            class="zone-card"
            :class="{
              'zone--unlocked': zIdx <= currentZoneIndex,
              'zone--current': zIdx === currentZoneIndex,
              'zone--locked': zIdx > currentZoneIndex,
            }"
          >
            <span class="zone-emoji">{{ zIdx <= currentZoneIndex ? zone.emoji : '🔒' }}</span>
            <span class="zone-name">{{ zone.name }}</span>
            <span class="zone-range">{{ zone.range }}</span>
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
        :level="2"
        mode="map"
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
            <span v-if="checkResult.isCorrect">🗺️ KHAI PHÁ THÀNH CÔNG! Bạn đã ghi dấu ấn trên bản đồ lục địa!</span>
            <span v-else-if="checkResult.status === 'PENDING_TEACHER_GRADE'">📝 Khảo sát tự luận đã gửi về hội đồng địa lý!</span>
            <span v-else>🌿 Lối đi bị chặn! Hãy tìm đường vòng ở thử thách tiếp theo nhé!</span>
          </div>
          <div v-if="checkResult.explanation" class="text-body-2 mt-2">
            <strong>Lời giải thích:</strong> {{ checkResult.explanation }}
          </div>
        </v-alert>
      </v-fade-transition>

      <!-- Nút điều hướng & Khai phá -->
      <div class="d-flex justify-space-between align-center mt-6">
        <v-btn
          variant="outlined"
          color="secondary"
          size="large"
          prepend-icon="mdi-arrow-left"
          :disabled="currentIndex === 0 || checking"
          @click="prevQuestion"
        >
          Cột mốc trước
        </v-btn>

        <div class="d-flex ga-3">
          <v-btn
            v-if="!isCurrentChecked"
            color="emerald-darken-2"
            size="large"
            variant="flat"
            prepend-icon="mdi-compass-outline"
            :loading="checking"
            :disabled="!hasAnswer(currentQuestionItem.question.id)"
            class="px-6 font-weight-bold text-white bg-emerald-600"
            @click="handleCheckAnswer"
          >
            Khai phá vùng đất
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
            Chặng tiếp theo
          </v-btn>

          <v-btn
            v-if="isLastQuestion"
            color="primary"
            size="large"
            variant="flat"
            prepend-icon="mdi-flag-triangle"
            :loading="submitting"
            class="px-8 font-weight-bold"
            @click="$emit('submit')"
          >
            Cắm cờ chinh phục & Nộp bài
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
  level: { type: Number, default: 2 },
});

const emit = defineEmits(["submit", "answer-change"]);
const { t } = useI18n();

const currentIndex = ref(0);
const correctCount = ref(0);
const checking = ref(false);
const checkedQuestions = reactive({});

const zones = [
  { name: "Thung lũng Khởi đầu", emoji: "🏕️", range: "Câu 1-5" },
  { name: "Rừng Rậm Huyền Bí", emoji: "🌲", range: "Câu 6-10" },
  { name: "Sa Mạc Cát Vàng", emoji: "🏜️", range: "Câu 11-15" },
  { name: "Đỉnh Núi Băng Tuyết", emoji: "🏔️", range: "Câu 16-20" },
  { name: "Lâu Đài Rồng Thần", emoji: "🏰", range: "Câu 21+" },
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

const currentZoneIndex = computed(() => {
  const segment = Math.floor(currentIndex.value / 5);
  return Math.min(zones.length - 1, segment);
});

const currentZone = computed(() => zones[currentZoneIndex.value] || zones[0]);
const expeditionPoints = computed(() => correctCount.value * 50);

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
      correctCount.value += 1;
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
.map-header-card {
  background: linear-gradient(135deg, #064e3b 0%, #065f46 100%);
  border: 2px solid #10b981 !important;
  color: white;
}

.map-avatar-badge {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #047857;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
  border: 1px solid #34d399;
}

.border-emerald {
  border: 1px solid #059669;
}

.continent-track {
  background: #022c22;
  border-radius: 14px;
  padding: 12px;
  border: 1px solid #047857;
  overflow-x: auto;
}

.zone-cards-list {
  display: flex;
  gap: 12px;
  min-width: 500px;
}

.zone-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border-radius: 10px;
  background: #064e3b;
  border: 1px solid #059669;
  transition: all 0.3s ease;
}

.zone--current {
  background: #047857;
  border-color: #34d399;
  box-shadow: 0 0 10px rgba(52, 211, 153, 0.5);
  transform: scale(1.05);
}

.zone--locked {
  opacity: 0.45;
}

.zone-emoji {
  font-size: 22px;
}

.zone-name {
  font-size: 11px;
  font-weight: 700;
  color: #a7f3d0;
  text-align: center;
}

.zone-range {
  font-size: 9px;
  color: #6ee7b7;
}

.bg-emerald-600 {
  background-color: #059669 !important;
}
</style>
