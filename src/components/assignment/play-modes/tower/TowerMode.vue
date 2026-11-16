<template>
  <div class="tower-mode-scene">
    <!-- THANH TIẾN ĐỘ THÁP TRÊN CÙNG -->
    <div class="tower-top-bar">
      <div class="tower-level-badge">
        <span class="castle-icon">🏰</span>
        <span class="floor-text">
          Tầng {{ currentFloorDisplay }} / {{ totalFloors }}
        </span>
      </div>

      <!-- Thưởng sao -->
      <div class="stars-badge">
        <span class="star-icon">⭐</span>
        <span>{{ stars }} sao</span>
      </div>
    </div>

    <!-- KHÔNG GIAN THÁP CAO (VERTICAL TOWER) -->
    <div class="tower-climb-viewport" ref="viewportRef">
      <!-- Cột tháp nền 2 bên -->
      <div class="tower-structure-bg">
        <div class="tower-pillar pillar-l"></div>
        <div class="tower-pillar pillar-r"></div>
      </div>

      <!-- BONG BÓNG THOẠI CÂU HỎI -->
      <div v-if="currentQuestionItem" class="question-speech-bubble-wrapper">
        <div class="question-speech-bubble">
          <div class="question-text">
            {{ currentQuestionItem.question.content }}
          </div>
        </div>
      </div>

      <!-- SÂN KHẤU TẦNG THÁP & BẬC THANG ĐÁP ÁN -->
      <div v-if="currentQuestionItem" class="tower-stage-row">
        <!-- Nhân vật hoạt hình đứng trên bệ tầng -->
        <div
          class="hero-character-box"
          :class="{
            'hero--jumping': isJumping,
            'hero--correct': checkFeedback === 'correct',
            'hero--wrong': checkFeedback === 'wrong',
          }"
        >
          <div class="hero-character-sprite">
            {{ characterEmoji }}
          </div>
          <div class="hero-pedestal">
            <span>TẦNG {{ currentFloorDisplay }}</span>
          </div>
        </div>

        <!-- Các bậc thang lơ lửng đáp án (cho MCQ / MULTI_MCQ) -->
        <div v-if="isMcqType" class="staircase-wrapper">
          <TowerAnswerInput
            :question="currentQuestionItem.question"
            :model-value="session.answers[currentQuestionItem.question.id]"
            :disabled="isChecking || isChecked"
            :feedback="checkFeedback"
            @update:model-value="onAnswerChange"
            @confirm="onStairConfirm"
          />
        </div>

        <!-- Fallback cho các dạng khác (nếu có dạng MATCHING / DRAG_DROP) -->
        <div v-else class="non-mcq-fallback-card pa-4 bg-white rounded-xl border">
          <QuestionItem
            :item="currentQuestionItem"
            :index="session.currentIndex.value"
            :answer="session.answers[currentQuestionItem.question.id]"
            :level="1"
            mode="tower"
            @answered="onLegacyAnswered"
          />
          <div class="d-flex justify-end mt-4">
            <v-btn
              color="amber-darken-3"
              size="large"
              class="font-weight-bold px-6"
              :disabled="!session.hasAnswer(currentQuestionItem.question.id)"
              @click="onStairConfirm"
            >
              Bước lên tầng tiếp theo
            </v-btn>
          </div>
        </div>
      </div>

      <!-- ĐỈNH THÁP KHI LEO HẾT BÀI -->
      <div v-if="reachedPeak" class="tower-peak-congrats">
        <div class="peak-trophy">🏆</div>
        <h2 class="text-h4 font-weight-black text-amber-darken-4 mb-2">
          Chúc mừng! Bạn đã chinh phục đỉnh tháp!
        </h2>
        <p class="text-body-1 font-weight-bold text-slate-700 mb-5">
          Bạn đã xuất sắc vượt qua toàn bộ các tầng tháp và thu thập được {{ stars }} sao!
        </p>
        <v-btn
          color="primary"
          size="x-large"
          prepend-icon="mdi-flag-checkered"
          :loading="session.submitting.value"
          class="px-10 font-weight-black elevation-6"
          rounded="pill"
          @click="session.submit()"
        >
          Cắm Cờ & Nộp Bài Ngay
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import TowerAnswerInput from "./TowerAnswerInput.vue";
import QuestionItem from "../../QuestionItem.vue";

const props = defineProps({
  session: { type: Object, required: true },
});

const { t } = useI18n();

const stars = ref(0);
const climbedFloors = ref(0);
const isJumping = ref(false);
const isChecking = ref(false);
const checkFeedback = ref(null); // 'correct' | 'wrong' | null
const reachedPeak = ref(false);
const checkedQuestions = ref({});

const totalFloors = computed(() => props.session.totalQuestions.value || 1);
const currentQuestionItem = computed(() => props.session.currentQuestionItem.value);
const currentFloorDisplay = computed(() => props.session.currentIndex.value + 1);

const isMcqType = computed(() => {
  const type = currentQuestionItem.value?.question?.type;
  return type === "MCQ" || type === "MULTI_MCQ" || type === "TRUE_FALSE";
});

const isChecked = computed(() => {
  const qId = currentQuestionItem.value?.question?.id;
  return Boolean(checkedQuestions.value[qId]);
});

// Nhân vật sư tử / chim cánh cụt hoạt hình đáng yêu cho học sinh lớp 1
const characterEmoji = computed(() => {
  if (reachedPeak.value) return "👑";
  if (checkFeedback.value === "correct") return "🦁";
  if (checkFeedback.value === "wrong") return "🙈";
  return "🦁";
});

function onAnswerChange(payload) {
  const qId = currentQuestionItem.value?.question?.id;
  if (qId) {
    props.session.setAnswer(qId, payload);
  }
}

function onLegacyAnswered(questionId) {
  // handled via session.setAnswer
}

async function onStairConfirm() {
  const q = currentQuestionItem.value?.question;
  if (!q || isChecking.value || isChecked.value) return;

  isChecking.value = true;
  isJumping.value = true;
  checkFeedback.value = null;

  try {
    const res = await props.session.checkQuestion(q.id);
    checkedQuestions.value[q.id] = res;

    if (res?.isCorrect === true) {
      checkFeedback.value = "correct";
      stars.value += 3;
      climbedFloors.value += 1;
    } else {
      checkFeedback.value = "wrong";
    }

    // Sau hiệu ứng nhảy 1.2s: tự chuyển sang tầng tháp câu tiếp theo
    setTimeout(() => {
      isJumping.value = false;
      checkFeedback.value = null;
      if (!props.session.isLastQuestion.value) {
        props.session.next();
      } else {
        reachedPeak.value = true;
      }
    }, 1300);
  } catch (err) {
    isJumping.value = false;
    // Nếu đã check trước đó thì vẫn cho đi tiếp
    if (!props.session.isLastQuestion.value) {
      props.session.next();
    } else {
      reachedPeak.value = true;
    }
  } finally {
    isChecking.value = false;
  }
}
</script>

<style scoped>
.tower-mode-scene {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 140px);
  width: 100%;
  position: relative;
}

/* TOP STATUS BAR */
.tower-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 12px 24px;
  border-radius: 24px;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.12);
  border: 2px solid #a7f3d0;
  margin-bottom: 24px;
}

.tower-level-badge {
  display: flex;
  align-items: center;
  gap: 10px;
}

.castle-icon {
  font-size: 2rem;
}

.floor-text {
  font-size: 1.35rem;
  font-weight: 900;
  color: #065f46;
}

.stars-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fef3c7;
  padding: 6px 16px;
  border-radius: 9999px;
  font-size: 1.25rem;
  font-weight: 900;
  color: #b45309;
  border: 2px solid #fde68a;
  box-shadow: 0 4px 10px rgba(245, 158, 11, 0.15);
}

/* KHUNG VIEWPORT THÁP */
.tower-climb-viewport {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  position: relative;
  min-height: 540px;
  padding-bottom: 24px;
}

/* Hai trụ tháp nền */
.tower-structure-bg {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
  opacity: 0.15;
}

.tower-pillar {
  width: 80px;
  height: 100%;
  background: repeating-linear-gradient(
    45deg,
    #10b981,
    #10b981 20px,
    #059669 20px,
    #059669 40px
  );
  border-radius: 24px 24px 0 0;
}

/* BONG BÓNG THOẠI CÂU HỎI */
.question-speech-bubble-wrapper {
  width: 100%;
  max-width: 650px;
  margin-bottom: 30px;
  z-index: 10;
  animation: bubbleFloat 3s ease-in-out infinite alternate;
}

@keyframes bubbleFloat {
  0% { transform: translateY(0); }
  100% { transform: translateY(-8px); }
}

.question-speech-bubble {
  background: #ffffff;
  padding: 24px 32px;
  border-radius: 28px;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.1);
  border: 4px solid #10b981;
  position: relative;
  text-align: center;
}

.question-speech-bubble::after {
  content: "";
  position: absolute;
  bottom: -22px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 22px 18px 0;
  border-style: solid;
  border-color: #10b981 transparent;
  display: block;
  width: 0;
}

.question-text {
  font-size: 1.5rem;
  font-weight: 900;
  line-height: 1.5;
  color: #0f172a;
}

/* HÀNG SÂN KHẤU TẦNG THÁP & BẬC THANG */
.tower-stage-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  width: 100%;
  max-width: 860px;
  gap: 30px;
  z-index: 10;
}

/* NHÂN VẬT HOẠT HÌNH TRÊN BỆ ĐÁ */
.hero-character-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.hero-character-sprite {
  font-size: 85px;
  filter: drop-shadow(0 12px 18px rgba(0, 0, 0, 0.2));
  animation: heroIdle 1.6s ease-in-out infinite alternate;
}

@keyframes heroIdle {
  0% { transform: translateY(0); }
  100% { transform: translateY(-10px); }
}

.hero--jumping {
  transform: translateY(-40px) scale(1.15);
}

.hero--correct .hero-character-sprite {
  filter: drop-shadow(0 0 20px #10b981);
}

.hero-pedestal {
  width: 150px;
  height: 40px;
  background: linear-gradient(180deg, #10b981 0%, #047857 100%);
  border-radius: 14px;
  border: 3px solid #34d399;
  box-shadow: 0 8px 18px rgba(16, 185, 129, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 900;
  font-size: 1rem;
  letter-spacing: 0.5px;
}

.staircase-wrapper {
  flex: 1;
  max-width: 480px;
}

/* ĐỈNH THÁP HOÀN THÀNH */
.tower-peak-congrats {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: rgba(255, 255, 255, 0.95);
  padding: 36px 24px;
  border-radius: 28px;
  border: 3px solid #f59e0b;
  box-shadow: 0 16px 36px rgba(245, 158, 11, 0.2);
  z-index: 20;
  max-width: 600px;
}

.peak-trophy {
  font-size: 5rem;
  margin-bottom: 12px;
  animation: trophyPop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes trophyPop {
  0% { transform: scale(0.4) rotate(-20deg); opacity: 0; }
  100% { transform: scale(1) rotate(0); opacity: 1; }
}

/* RESPONSIVE MOBILE 375PX & 414PX */
@media (max-width: 600px) {
  .tower-stage-row {
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }
  .question-text {
    font-size: 1.25rem;
  }
  .question-speech-bubble {
    padding: 16px 20px;
  }
  .hero-character-sprite {
    font-size: 64px;
  }
  .hero-pedestal {
    width: 120px;
    height: 32px;
    font-size: 0.85rem;
  }
  .staircase-wrapper {
    width: 100%;
    max-width: 100%;
  }
  .tower-pillar {
    width: 40px;
  }
}
</style>
