<template>
  <div class="boss-mode-scene" :class="{ 'scene--flash-red': flashRed, 'scene--flash-green': flashGreen }">
    <!-- BOSS SECTION -->
    <div class="boss-section">
      <div class="boss-name text-h6 font-weight-black text-red-300 text-center mb-1">
        🐉 Rồng Hắc Ám
      </div>

      <!-- Boss HP bar -->
      <div class="boss-hp-container">
        <div class="hp-label text-caption text-red-400">HP: {{ bossHp.toFixed(0) }} / 100</div>
        <div class="hp-bar-track">
          <div
            class="hp-bar-fill"
            :style="{ width: bossHp + '%' }"
            :class="{ 'hp-bar--low': bossHp <= 30, 'hp-bar--critical': bossHp <= 10 }"
          />
        </div>
      </div>

      <!-- Dragon emoji: different states -->
      <div class="boss-dragon" :class="{ 'dragon--hurt': bossHurtAnim }">
        {{ bossHp <= 0 ? '💀' : '🐉' }}
      </div>
    </div>

    <!-- VS divider -->
    <div class="vs-row text-caption text-purple-400 font-weight-black">⚔️ VS ⚔️</div>

    <!-- QUESTION CARD -->
    <div v-if="currentQuestionItem" class="boss-question-card">
      <div class="question-num text-caption text-purple-400 mb-2">
        📜 Câu {{ currentNum }} / {{ totalQuestions }}
      </div>
      <div class="question-text">{{ currentQuestionItem.question.content }}</div>
    </div>

    <!-- FEEDBACK BANNER -->
    <transition name="fade-slide">
      <div v-if="feedbackMsg" class="feedback-banner" :class="feedbackClass">
        {{ feedbackMsg }}
      </div>
    </transition>

    <!-- ANSWER INPUT -->
    <div v-if="currentQuestionItem && !bossDefeated" class="answer-area">
      <!-- Dạng trắc nghiệm: Thẻ bài ma thuật -->
      <div v-if="isMcqType">
        <BossAnswerInput
          :question="currentQuestionItem.question"
          :model-value="session.answers[currentQuestionItem.question.id]"
          :disabled="isChecking"
          :feedback="checkFeedback"
          @update:model-value="onAnswerChange"
          @confirm="onConfirm"
        />
      </div>

      <!-- Dạng điền khuyết (FILL), tự luận (ESSAY), nối cặp... -->
      <div v-else class="non-mcq-fallback-card pa-4 pa-md-5 bg-white rounded-xl elevation-2 text-slate-800">
        <QuestionItem
          :item="currentQuestionItem"
          :index="currentIndex"
          :answer="session.answers[currentQuestionItem.question.id] || {}"
          :level="2"
          mode="boss"
          :disabled="isChecking"
          @answered="onAnswerChange"
        />
        <div class="attack-row mt-4 d-flex justify-center">
          <v-btn
            color="red-darken-2"
            size="large"
            rounded="pill"
            class="font-weight-black attack-btn px-8"
            :disabled="isChecking || !hasAnswer"
            @click="onConfirm"
          >
            TẤN CÔNG! ⚔️
          </v-btn>
        </div>
      </div>
    </div>

    <!-- SUBMIT (last question fallback) -->
    <div
      v-if="session.isLastQuestion.value && !bossDefeated && !isChecking && checkFeedback === null"
      class="submit-row mt-4"
    >
      <v-btn
        color="purple-darken-2"
        variant="outlined"
        rounded="pill"
        :loading="session.submitting.value"
        class="font-weight-black"
        @click="session.submit()"
      >
        Nộp Bài ⚔️
      </v-btn>
    </div>

    <!-- VICTORY: Boss defeated -->
    <transition name="victory-reveal">
      <div v-if="bossDefeated" class="victory-screen text-center pa-8">
        <div class="text-h2 mb-3">🏆⚔️🎉</div>
        <h2 class="text-h4 font-weight-black text-yellow-300 mb-3">
          RỒNG ĐÃ BỊ ĐẠI BẠI!
        </h2>
        <p class="text-body-1 text-purple-200 mb-2">
          Đúng {{ correctCount }} / {{ totalQuestions }} câu
        </p>
        <p class="text-body-2 text-purple-300 mb-6">
          Ngươi xứng đáng là Dũng Sĩ huyền thoại!
        </p>
        <v-btn
          color="yellow-darken-2"
          size="x-large"
          rounded="pill"
          prepend-icon="mdi-trophy"
          :loading="session.submitting.value"
          class="font-weight-black"
          @click="session.submit()"
        >
          Nộp Chiến Tích 🏆
        </v-btn>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import BossAnswerInput from './BossAnswerInput.vue'
import QuestionItem from '../../QuestionItem.vue'

const props = defineProps({
  session: { type: Object, required: true },
})

const isChecking = ref(false)
const checkFeedback = ref(null)
const feedbackMsg = ref('')
const bossHp = ref(100)
const bossDefeated = ref(false)
const bossHurtAnim = ref(false)
const flashRed = ref(false)
const flashGreen = ref(false)
const correctCount = ref(0)

const currentQuestionItem = computed(() => props.session.currentQuestionItem.value)
const currentIndex = computed(() => props.session.currentIndex.value)
const totalQuestions = computed(() => props.session.totalQuestions.value || 1)
const currentNum = computed(() => currentIndex.value + 1)
const hpPerQuestion = computed(() => 100 / totalQuestions.value)

const isMcqType = computed(() => {
  const t = currentQuestionItem.value?.question?.type
  return (
    (t === 'MCQ' || t === 'MULTI_MCQ' || t === 'TRUE_FALSE') &&
    Array.isArray(currentQuestionItem.value?.question?.options) &&
    currentQuestionItem.value?.question?.options.length > 0
  )
})

const hasAnswer = computed(() => {
  const qId = currentQuestionItem.value?.question?.id
  return qId ? props.session.hasAnswer(qId) : false
})

const feedbackClass = computed(() =>
  checkFeedback.value === 'correct' ? 'feedback--correct' : 'feedback--wrong'
)

function onAnswerChange(payload) {
  const qId = currentQuestionItem.value?.question?.id
  if (qId) props.session.setAnswer(qId, payload)
}

async function onConfirm() {
  const q = currentQuestionItem.value?.question
  if (!q || isChecking.value) return
  isChecking.value = true
  checkFeedback.value = null
  feedbackMsg.value = ''

  try {
    const res = await props.session.checkQuestion(q.id)
    if (res?.isCorrect === true) {
      correctCount.value++
      bossHp.value = Math.max(0, bossHp.value - hpPerQuestion.value)
      bossHurtAnim.value = true
      flashGreen.value = true
      checkFeedback.value = 'correct'
      feedbackMsg.value = `⚔️ Trúng! Boss mất ${hpPerQuestion.value.toFixed(0)} HP!`
      setTimeout(() => {
        bossHurtAnim.value = false
        flashGreen.value = false
      }, 600)
    } else {
      checkFeedback.value = 'wrong'
      feedbackMsg.value = '🛡️ Boss phản đòn! Hero bị thương!'
      flashRed.value = true
      setTimeout(() => { flashRed.value = false }, 600)
    }

    setTimeout(() => {
      checkFeedback.value = null
      feedbackMsg.value = ''
      if (bossHp.value <= 0) {
        bossDefeated.value = true
        isChecking.value = false
      } else if (!props.session.isLastQuestion.value) {
        props.session.next()
        isChecking.value = false
      } else {
        bossDefeated.value = true
        isChecking.value = false
      }
    }, 1200)
  } catch {
    isChecking.value = false
    if (!props.session.isLastQuestion.value) props.session.next()
    else bossDefeated.value = true
  }
}
</script>

<style scoped>
.boss-mode-scene {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(180deg, #1a0030 0%, #2d0060 40%, #1e1b4b 100%);
  padding: 16px;
  box-sizing: border-box;
  position: relative;
  transition: background 0.15s ease;
}

/* Flash effects */
.scene--flash-red {
  animation: flashRed 0.5s ease;
}
.scene--flash-green {
  animation: flashGreen 0.5s ease;
}

@keyframes flashRed {
  0% { background-color: rgba(220, 38, 38, 0); }
  30% { background-color: rgba(220, 38, 38, 0.3); }
  100% { background-color: rgba(220, 38, 38, 0); }
}
@keyframes flashGreen {
  0% { background-color: rgba(34, 197, 94, 0); }
  30% { background-color: rgba(34, 197, 94, 0.2); }
  100% { background-color: rgba(34, 197, 94, 0); }
}

/* BOSS SECTION */
.boss-section {
  background: rgba(0,0,0,0.4);
  border: 2px solid rgba(239,68,68,0.5);
  border-radius: 24px;
  padding: 18px 20px;
  margin-bottom: 10px;
  backdrop-filter: blur(8px);
}

.boss-hp-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

.hp-bar-track {
  width: 100%;
  height: 16px;
  background: rgba(255,255,255,0.1);
  border-radius: 8px;
  overflow: hidden;
  border: 1.5px solid rgba(239,68,68,0.3);
}

.hp-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ef4444, #dc2626);
  border-radius: 8px;
  transition: width 0.6s ease;
  position: relative;
}
.hp-bar-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 60%);
  border-radius: inherit;
}

.hp-bar--low {
  background: linear-gradient(90deg, #f97316, #ef4444);
}
.hp-bar--critical {
  background: linear-gradient(90deg, #fbbf24, #ef4444);
  animation: hpCriticalPulse 0.6s ease infinite alternate;
}

@keyframes hpCriticalPulse {
  from { opacity: 0.7; }
  to   { opacity: 1; }
}

.boss-dragon {
  font-size: 5rem;
  text-align: center;
  line-height: 1;
  transition: transform 0.3s ease;
  filter: drop-shadow(0 0 16px rgba(239,68,68,0.5));
}

.dragon--hurt {
  animation: dragonHurt 0.4s ease;
}

@keyframes dragonHurt {
  0% { transform: scale(1); }
  25% { transform: scale(1.3) rotate(-10deg); filter: brightness(2) drop-shadow(0 0 24px #ef4444); }
  75% { transform: scale(0.9) rotate(5deg); }
  100% { transform: scale(1); }
}

.vs-row {
  text-align: center;
  margin: 6px 0;
  letter-spacing: 4px;
}

/* QUESTION CARD */
.boss-question-card {
  background: #ffffff;
  border: 3px solid #c084fc;
  border-radius: 24px;
  padding: 22px 28px;
  margin-bottom: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.question-num {
  color: #7e22ce !important;
  font-weight: 900 !important;
  font-size: 0.95rem !important;
}

.question-text {
  font-size: 1.45rem;
  font-weight: 900;
  color: #0f172a;
  line-height: 1.6;
}

/* FEEDBACK */
.feedback-banner {
  text-align: center;
  font-size: 1.1rem;
  font-weight: 800;
  padding: 12px 20px;
  border-radius: 16px;
  margin-bottom: 12px;
}

.feedback--correct {
  background: rgba(34,197,94,0.15);
  border: 2px solid #22c55e;
  color: #bbf7d0;
}

.feedback--wrong {
  background: rgba(239,68,68,0.15);
  border: 2px solid #ef4444;
  color: #fecaca;
}

.answer-area { width: 100%; }

.submit-row {
  display: flex;
  justify-content: center;
}

/* VICTORY */
.victory-screen {
  background: rgba(45,0,96,0.9);
  border: 2px solid rgba(251,191,36,0.6);
  border-radius: 28px;
  backdrop-filter: blur(14px);
  box-shadow: 0 0 40px rgba(251,191,36,0.3);
}

/* TRANSITIONS */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s ease;
}
.fade-slide-enter-from { opacity: 0; transform: translateY(-12px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(12px); }

.victory-reveal-enter-active {
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.victory-reveal-enter-from {
  opacity: 0;
  transform: scale(0.7);
}

@media (max-width: 375px) {
  .question-text { font-size: 1.1rem; }
  .boss-dragon { font-size: 3.5rem; }
  .boss-mode-scene { padding: 10px; }
}
</style>
