<template>
  <div class="boss-mode">
    <!-- KHUNG ĐẤU BOSS QUỶ VƯƠNG -->
    <v-card class="pa-4 pa-md-5 mb-5 boss-header-card" elevation="3" rounded="xl">
      <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-3">
        <div class="d-flex align-center ga-3">
          <div class="boss-avatar-badge" :class="{ 'boss-shaking': isAttacking }">
            <span class="text-h3">{{ bossHp > 0 ? '👹' : '💀' }}</span>
          </div>
          <div>
            <div class="text-h6 font-weight-black text-red-lighten-4">
              Hầm ngục: Boss Hắc Ám
            </div>
            <div class="text-body-2 font-weight-bold text-slate-300">
              Đòn đánh: <span class="text-red-lighten-2 font-weight-black">Hiệp {{ currentIndex + 1 }} / {{ questions.length }}</span>
            </div>
          </div>
        </div>

        <div class="d-flex align-center ga-3">
          <!-- Trạng thái Boss -->
          <v-chip
            :color="bossHp > 0 ? 'red' : 'success'"
            variant="flat"
            class="font-weight-black px-3"
            size="large"
          >
            {{ bossHp > 0 ? `Boss HP: ${bossHp}%` : 'Boss Đã Bị Hạ!' }}
          </v-chip>

          <!-- Sát thương tích lũy -->
          <div class="d-flex align-center ga-1 text-subtitle-2 font-weight-black text-amber-lighten-3 bg-slate-900 px-3 py-1 rounded-pill border-red">
            <v-icon icon="mdi-sword-cross" color="red-lighten-2" size="20" />
            <span>{{ totalDamage }} Sát thương</span>
          </div>
        </div>
      </div>

      <!-- THANH MÁU CỦA BOSS -->
      <div class="boss-hp-bar mt-2">
        <div class="d-flex justify-space-between align-center text-caption font-weight-bold text-slate-300 mb-1">
          <span>Thanh sinh mệnh Boss</span>
          <span>{{ bossHp }} / 100 HP</span>
        </div>
        <v-progress-linear
          :model-value="bossHp"
          color="red-accent-3"
          height="14"
          rounded
          striped
        />
      </div>
    </v-card>

    <!-- CÂU HỎI HIỆN TẠI -->
    <div v-if="currentQuestionItem" class="current-question-container">
      <QuestionItem
        :item="currentQuestionItem"
        :index="currentIndex"
        :answer="answers[currentQuestionItem.question.id]"
        :level="2"
        mode="boss"
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
            <span v-if="checkResult.isCorrect">💥 CHÍ MẠNG! Trả lời chính xác, Boss trúng đòn và mất máu!</span>
            <span v-else-if="checkResult.status === 'PENDING_TEACHER_GRADE'">📝 Đòn đánh tự luận đã được ghi nhận, chờ trọng tài xác nhận!</span>
            <span v-else>🛡️ BOSS ĐỠ ĐƯỢC! Hãy tập trung để tung đòn quyết định ở câu kế tiếp!</span>
          </div>
          <div v-if="checkResult.explanation" class="text-body-2 mt-2">
            <strong>Lời giải thích:</strong> {{ checkResult.explanation }}
          </div>
        </v-alert>
      </v-fade-transition>

      <!-- Nút điều hướng & Tấn công -->
      <div class="d-flex justify-space-between align-center mt-6">
        <v-btn
          variant="outlined"
          color="secondary"
          size="large"
          prepend-icon="mdi-arrow-left"
          :disabled="currentIndex === 0 || checking"
          @click="prevQuestion"
        >
          Hiệp trước
        </v-btn>

        <div class="d-flex ga-3">
          <v-btn
            v-if="!isCurrentChecked"
            color="red-darken-3"
            size="large"
            variant="flat"
            prepend-icon="mdi-sword"
            :loading="checking"
            :disabled="!hasAnswer(currentQuestionItem.question.id)"
            class="px-6 font-weight-bold text-white"
            @click="handleCheckAnswer"
          >
            Tấn công Boss
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
            Hiệp tiếp theo
          </v-btn>

          <v-btn
            v-if="isLastQuestion"
            color="primary"
            size="large"
            variant="flat"
            prepend-icon="mdi-skull-crossbones"
            :loading="submitting"
            class="px-8 font-weight-bold"
            @click="$emit('submit')"
          >
            Kết liễu & Nộp bài
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
const successfulHits = ref(0);
const isAttacking = ref(false);
const checking = ref(false);
const checkedQuestions = reactive({});

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

const totalDamage = computed(() => successfulHits.value * 250);

const bossHp = computed(() => {
  const total = props.questions.length;
  if (total <= 0) return 100;
  const remainingPercent = Math.max(0, 100 - Math.round((successfulHits.value / total) * 100));
  return remainingPercent;
});

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
      successfulHits.value += 1;
      isAttacking.value = true;
      setTimeout(() => {
        isAttacking.value = false;
      }, 800);
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
.boss-header-card {
  background: linear-gradient(135deg, #1c1917 0%, #450a0a 100%);
  border: 2px solid #b91c1c !important;
  color: white;
}

.boss-avatar-badge {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: #292524;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
  border: 2px solid #ef4444;
}

.boss-shaking {
  animation: bossHurt 0.15s 4 alternate;
}

@keyframes bossHurt {
  0% { transform: translate(0, 0) scale(1); filter: brightness(1); }
  50% { transform: translate(-4px, 2px) scale(0.95); filter: brightness(2) drop-shadow(0 0 10px red); }
  100% { transform: translate(4px, -2px) scale(1); filter: brightness(1); }
}

.border-red {
  border: 1px solid #dc2626;
}
</style>
