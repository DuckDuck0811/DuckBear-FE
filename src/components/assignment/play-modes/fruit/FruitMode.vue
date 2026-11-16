<template>
  <div class="fruit-mode-scene">
    <!-- TOP STATS: GIỎ QUẢ & SAO THƯỞNG -->
    <div class="fruit-top-bar">
      <div class="fruit-title-badge">
        <span class="text-h4 mr-2">🌳</span>
        <div>
          <div class="text-subtitle-1 font-weight-black text-emerald-900">Vườn Quả Thông Thái</div>
          <div class="text-caption font-weight-bold text-emerald-700">Câu {{ currentNum }} / {{ totalQuestions }}</div>
        </div>
      </div>

      <!-- Giỏ quả đầy dần -->
      <div class="basket-counter-box">
        <span class="basket-emoji">🧺</span>
        <div class="basket-info">
          <div class="basket-count text-h6 font-weight-black text-amber-darken-4">
            {{ harvestedCount }} / {{ totalQuestions }} quả
          </div>
          <v-progress-linear
            :model-value="(harvestedCount / totalQuestions) * 100"
            color="amber-darken-3"
            height="8"
            rounded
          />
        </div>
      </div>
    </div>

    <!-- TÁN CÂY ĂN QUẢ VỚI BẢNG CÂU HỎI -->
    <div class="orchard-canvas">
      <!-- Tán cây xanh -->
      <div class="tree-canopy">
        <div class="tree-leaf-cluster cluster-left"></div>
        <div class="tree-leaf-cluster cluster-center"></div>
        <div class="tree-leaf-cluster cluster-right"></div>
      </div>

      <!-- Khung câu hỏi treo trên tán cây -->
      <div v-if="currentQuestionItem" class="tree-question-sign">
        <div class="wooden-board">
          <div class="question-content-text">
            {{ currentQuestionItem.question.content }}
          </div>
        </div>
      </div>

      <!-- Các quả táo đáp án treo lơ lửng -->
      <div v-if="currentQuestionItem" class="tree-fruits-area mt-4">
        <FruitAnswerInput
          :question="currentQuestionItem.question"
          :model-value="session.answers[currentQuestionItem.question.id]"
          :disabled="isChecking"
          :feedback="checkFeedback"
          @update:model-value="onAnswerChange"
          @confirm="onFruitConfirm"
        />
      </div>

      <!-- Giỏ đựng quả ở gốc cây -->
      <div class="tree-trunk-bottom">
        <div class="trunk-wood"></div>
        <div class="ground-basket" :class="{ 'basket-bounce': checkFeedback === 'correct' }">
          <span class="big-basket">🧺</span>
          <span class="basket-label font-weight-black">Giỏ táo của em</span>
        </div>
      </div>

      <!-- Màn hình hoàn thành khi hái hết quả -->
      <div v-if="isComplete" class="fruit-complete-overlay pa-6 text-center">
        <div class="text-h2 mb-2">🎉 🧺 🍎</div>
        <h2 class="text-h4 font-weight-black text-emerald-900 mb-2">
          Xuất sắc! Đã thu hoạch toàn bộ khu vườn!
        </h2>
        <p class="text-body-1 font-weight-bold text-slate-700 mb-5">
          Em đã hái được {{ harvestedCount }} quả táo chín mọng vào giỏ!
        </p>
        <v-btn
          color="primary"
          size="x-large"
          rounded="pill"
          prepend-icon="mdi-check-bold"
          :loading="session.submitting.value"
          class="font-weight-black px-10 elevation-6"
          @click="session.submit()"
        >
          Nộp Giỏ Quả & Hoàn Thành
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import FruitAnswerInput from "./FruitAnswerInput.vue";

const props = defineProps({
  session: { type: Object, required: true },
});

const isChecking = ref(false);
const checkFeedback = ref(null);
const harvestedCount = ref(0);
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

async function onFruitConfirm() {
  const q = currentQuestionItem.value?.question;
  if (!q || isChecking.value) return;

  isChecking.value = true;
  checkFeedback.value = null;

  try {
    const res = await props.session.checkQuestion(q.id);
    if (res?.isCorrect === true) {
      checkFeedback.value = "correct";
      harvestedCount.value += 1;
    } else {
      checkFeedback.value = "wrong";
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
.fruit-mode-scene {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.fruit-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f0fdf4;
  padding: 12px 20px;
  border-radius: 20px;
  border: 2px solid #86efac;
  margin-bottom: 20px;
}

.fruit-title-badge {
  display: flex;
  align-items: center;
}

.basket-counter-box {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #ffffff;
  padding: 6px 16px;
  border-radius: 9999px;
  border: 2px solid #fde68a;
}

.basket-emoji {
  font-size: 26px;
}

.orchard-canvas {
  position: relative;
  background: linear-gradient(180deg, #dcfce7 0%, #bbf7d0 100%);
  border-radius: 28px;
  border: 4px solid #4ade80;
  padding: 30px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 540px;
  overflow: hidden;
}

.wooden-board {
  background: #fef3c7;
  border: 4px solid #b45309;
  border-radius: 20px;
  padding: 20px 28px;
  text-align: center;
  box-shadow: 0 10px 24px rgba(180, 83, 9, 0.2);
  max-width: 680px;
  z-index: 10;
}

.question-content-text {
  font-size: 1.45rem;
  font-weight: 900;
  color: #78350f;
  line-height: 1.5;
}

.tree-fruits-area {
  width: 100%;
  max-width: 720px;
  z-index: 10;
}

.tree-trunk-bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 24px;
}

.trunk-wood {
  width: 50px;
  height: 36px;
  background: #78350f;
  border-radius: 8px 8px 0 0;
}

.ground-basket {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  padding: 8px 20px;
  border-radius: 9999px;
  border: 3px solid #b45309;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.basket-bounce {
  animation: basketPop 0.4s ease;
}

@keyframes basketPop {
  0% { transform: scale(1); }
  50% { transform: scale(1.18); }
  100% { transform: scale(1); }
}

.big-basket {
  font-size: 32px;
}

.basket-label {
  font-size: 1.1rem;
  color: #78350f;
}

.fruit-complete-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 20;
}
</style>
