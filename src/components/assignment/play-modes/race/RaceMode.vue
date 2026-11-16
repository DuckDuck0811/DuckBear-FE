<template>
  <div class="race-mode-scene">
    <!-- TOP STATS: ĐỒNG HỒ TỐC ĐỘ & TIẾN ĐỘ VỀ ĐÍCH -->
    <div class="race-top-bar">
      <div class="d-flex align-center ga-3">
        <span class="text-h4">🏁</span>
        <div>
          <div class="text-subtitle-1 font-weight-black text-slate-800">Đường Đua Thần Tốc</div>
          <div class="text-caption font-weight-bold text-slate-500">Chặng {{ currentNum }} / {{ totalQuestions }}</div>
        </div>
      </div>

      <div class="d-flex align-center ga-3">
        <!-- Đồng hồ tốc độ -->
        <v-chip color="deep-orange" variant="flat" size="large" class="font-weight-black px-4">
          <v-icon icon="mdi-speedometer" start size="20" />
          {{ speed }} km/h
        </v-chip>

        <!-- Sao thưởng -->
        <div class="stars-box bg-white px-3 py-1 rounded-pill border d-flex align-center ga-1 font-weight-black text-amber-darken-3">
          <span>⭐</span>
          <span>{{ stars }}</span>
        </div>
      </div>
    </div>

    <!-- KHUNG ĐƯỜNG ĐUA NHÌN TỪ TRÊN XUỐNG -->
    <div class="racetrack-viewport">
      <!-- Bảng hiệu câu hỏi trên đường đua -->
      <div v-if="currentQuestionItem" class="track-billboard-sign">
        <div class="billboard-board">
          <div class="billboard-tag">BIỂN BÁO THỬ THÁCH · CHẶNG {{ currentNum }}</div>
          <div class="billboard-question-text">
            {{ currentQuestionItem.question.content }}
          </div>
        </div>
      </div>

      <!-- 4 LÀN ĐUA ĐÁP ÁN -->
      <div v-if="currentQuestionItem" class="track-lanes-area mt-4">
        <RaceAnswerInput
          :question="currentQuestionItem.question"
          :model-value="session.answers[currentQuestionItem.question.id]"
          :disabled="isChecking"
          :feedback="checkFeedback"
          @update:model-value="onAnswerChange"
          @confirm="onSteerConfirm"
        />
      </div>

      <!-- Vạch đích khi về đích -->
      <div v-if="isComplete" class="race-finish-overlay pa-6 text-center">
        <div class="text-h2 mb-2">🏆 🏁 🏎️</div>
        <h2 class="text-h4 font-weight-black text-orange-darken-4 mb-2">
          Chúc mừng tay đua siêu đẳng đã cán đích!
        </h2>
        <p class="text-body-1 font-weight-bold text-slate-700 mb-5">
          Tốc độ tối đa: {{ speed }} km/h · Thu thập: {{ stars }} sao!
        </p>
        <v-btn
          color="primary"
          size="x-large"
          rounded="pill"
          prepend-icon="mdi-flag-checkered"
          :loading="session.submitting.value"
          class="font-weight-black px-10 elevation-6"
          @click="session.submit()"
        >
          Cán Đích & Nộp Bài
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import RaceAnswerInput from "./RaceAnswerInput.vue";

const props = defineProps({
  session: { type: Object, required: true },
});

const isChecking = ref(false);
const checkFeedback = ref(null);
const speed = ref(60);
const stars = ref(0);
const isComplete = ref(false);

const currentQuestionItem = computed(() => props.session.currentQuestionItem.value);
const totalQuestions = computed(() => props.session.totalQuestions.value || 1);
const currentNum = computed(() => props.session.currentIndex.value + 1);

function onAnswerChange(payload) {
  const qId = currentQuestionItem.value?.question?.id;
  if (qId) {
    props.session.setAnswer(qId, payload);
  }
}

async function onSteerConfirm() {
  const q = currentQuestionItem.value?.question;
  if (!q || isChecking.value) return;

  isChecking.value = true;
  checkFeedback.value = null;

  try {
    const res = await props.session.checkQuestion(q.id);
    if (res?.isCorrect === true) {
      checkFeedback.value = "correct";
      speed.value = Math.min(240, speed.value + 30);
      stars.value += 5;
    } else {
      checkFeedback.value = "wrong";
      speed.value = Math.max(40, speed.value - 10);
    }

    setTimeout(() => {
      checkFeedback.value = null;
      if (!props.session.isLastQuestion.value) {
        props.session.next();
      } else {
        isComplete.value = true;
      }
    }, 1100);
  } catch (err) {
    if (!props.session.isLastQuestion.value) {
      props.session.next();
    } else {
      isComplete.value = true;
    }
  } finally {
    isChecking.value = false;
  }
}
</script>

<style scoped>
.race-mode-scene {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.race-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  padding: 12px 20px;
  border-radius: 20px;
  border: 2px solid #fdba74;
  margin-bottom: 20px;
}

.racetrack-viewport {
  position: relative;
  background: #0f172a;
  border-radius: 28px;
  border: 4px solid #334155;
  padding: 30px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 540px;
}

.track-billboard-sign {
  width: 100%;
  max-width: 680px;
  z-index: 10;
}

.billboard-board {
  background: #1e293b;
  border: 3px solid #f97316;
  border-radius: 20px;
  padding: 20px 28px;
  text-align: center;
  box-shadow: 0 0 24px rgba(249, 115, 22, 0.3);
}

.billboard-tag {
  font-size: 0.85rem;
  font-weight: 900;
  color: #fdba74;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.billboard-question-text {
  font-size: 1.45rem;
  font-weight: 900;
  color: #ffffff;
  line-height: 1.5;
}

.track-lanes-area {
  width: 100%;
  max-width: 780px;
  z-index: 10;
}

.race-finish-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 20;
}
</style>
