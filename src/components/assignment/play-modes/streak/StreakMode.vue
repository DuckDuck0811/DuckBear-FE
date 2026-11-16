<template>
  <div class="streak-mode-scene" tabindex="0" @keydown="onKeyDown" ref="rootEl">
    <!-- HEADER: Combo counter -->
    <div class="streak-header">
      <div class="streak-title-row">
        <span class="text-h5">🔥</span>
        <div>
          <div class="text-subtitle-1 font-weight-black text-orange-100">Chuỗi Lửa</div>
          <div class="text-caption text-orange-300">Câu {{ currentNum }} / {{ totalQuestions }}</div>
        </div>
      </div>

      <!-- Combo counter -->
      <div class="combo-box">
        <transition name="combo-pop" mode="out-in">
          <div :key="combo" class="combo-number">{{ combo }}</div>
        </transition>
        <div class="combo-label">🔥 COMBO</div>
      </div>

      <!-- Badge milestones -->
      <div class="badges-row">
        <span v-if="maxCombo >= 5" class="milestone-badge" title="Combo 5">🥉×5</span>
        <span v-if="maxCombo >= 10" class="milestone-badge" title="Combo 10">🥈×10</span>
        <span v-if="maxCombo >= 20" class="milestone-badge" title="Combo 20">🏆×20</span>
      </div>
    </div>

    <!-- FEEDBACK OVERLAY (broken heart) -->
    <transition name="heart-fade">
      <div v-if="showHeart" class="broken-heart-overlay" aria-live="assertive">
        💔
      </div>
    </transition>

    <!-- QUESTION CARD -->
    <div class="streak-question-card" v-if="currentQuestionItem">
      <div class="question-num text-caption text-orange-300 mb-2">
        🔥 Câu {{ currentNum }}
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
    <div v-if="currentQuestionItem && !isVictory" class="answer-area">
      <!-- Trắc nghiệm: Nút Combo phím tắt -->
      <div v-if="isMcqType">
        <StreakAnswerInput
          :question="currentQuestionItem.question"
          :model-value="session.answers[currentQuestionItem.question.id]"
          :disabled="isChecking"
          :feedback="checkFeedback"
          @update:model-value="onAnswerChange"
          @confirm="onConfirm"
        />
        <!-- KEYBOARD HINT -->
        <div class="keyboard-hint text-caption text-orange-400 mt-3 text-center">
          Phím tắt: A B C D
        </div>
      </div>

      <!-- Dạng điền khuyết (FILL), tự luận (ESSAY)... -->
      <div v-else class="non-mcq-fallback-card pa-4 pa-md-5 bg-white rounded-xl elevation-2 text-slate-800">
        <QuestionItem
          :item="currentQuestionItem"
          :index="currentIndex"
          :answer="session.answers[currentQuestionItem.question.id] || {}"
          :level="2"
          mode="streak"
          :disabled="isChecking"
          @answered="onAnswerChange"
        />
        <div class="mt-4 d-flex justify-center">
          <v-btn
            color="deep-orange-darken-2"
            size="large"
            rounded="pill"
            class="font-weight-black px-8 elevation-3"
            :disabled="isChecking || !hasAnswer"
            @click="onConfirm"
          >
            🔥 Duy Trì Chuỗi Lửa!
          </v-btn>
        </div>
      </div>
    </div>

    <!-- VICTORY -->
    <div v-if="isVictory" class="victory-screen text-center pa-8">
      <div class="text-h2 mb-3">🔥🏆🔥</div>
      <h2 class="text-h4 font-weight-black text-orange-200 mb-2">Chuỗi Lửa Huyền Thoại!</h2>
      <p class="text-body-1 text-orange-300 mb-2">
        Combo cao nhất: <strong>{{ maxCombo }}</strong>
      </p>
      <p class="text-body-1 text-orange-300 mb-6">
        Đúng {{ correctCount }} / {{ totalQuestions }} câu
      </p>
      <v-btn
        color="orange-darken-2"
        size="x-large"
        rounded="pill"
        prepend-icon="mdi-send"
        :loading="session.submitting.value"
        class="font-weight-black"
        @click="session.submit()"
      >
        Nộp Bài 🔥
      </v-btn>
    </div>

    <!-- SUBMIT (last question fallback) -->
    <div
      v-if="session.isLastQuestion.value && !isVictory && !isChecking && checkFeedback === null"
      class="submit-row mt-4"
    >
      <v-btn
        color="orange-darken-2"
        variant="outlined"
        rounded="pill"
        :loading="session.submitting.value"
        class="font-weight-black"
        @click="session.submit()"
      >
        Nộp Bài 🔥
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import StreakAnswerInput from './StreakAnswerInput.vue'
import QuestionItem from '../../QuestionItem.vue'

const props = defineProps({
  session: { type: Object, required: true },
})

const isChecking = ref(false)
const checkFeedback = ref(null)
const feedbackMsg = ref('')
const combo = ref(0)
const maxCombo = ref(0)
const isVictory = ref(false)
const showHeart = ref(false)
const correctCount = ref(0)
const rootEl = ref(null)

const currentQuestionItem = computed(() => props.session.currentQuestionItem.value)
const currentIndex = computed(() => props.session.currentIndex.value)
const totalQuestions = computed(() => props.session.totalQuestions.value || 1)
const currentNum = computed(() => currentIndex.value + 1)

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

onMounted(() => rootEl.value?.focus())

function onAnswerChange(payload) {
  const qId = currentQuestionItem.value?.question?.id
  if (qId) props.session.setAnswer(qId, payload)
}

// Keyboard shortcut: A/B/C/D
function onKeyDown(e) {
  if (isChecking.value) return
  const key = e.key.toUpperCase()
  if (!['A','B','C','D'].includes(key)) return
  const opts = currentQuestionItem.value?.question?.options || []
  const idx = key.charCodeAt(0) - 65
  if (idx < opts.length) {
    const opt = opts[idx]
    onAnswerChange({ selectedOptionId: opt.id, selectedOptionIds: [opt.id] })
    onConfirm()
  }
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
      combo.value++
      correctCount.value++
      if (combo.value > maxCombo.value) maxCombo.value = combo.value
      checkFeedback.value = 'correct'
      feedbackMsg.value = `✅ Chính xác! Combo: ${combo.value} 🔥`
    } else {
      combo.value = 0
      checkFeedback.value = 'wrong'
      feedbackMsg.value = '💔 Sai rồi — Combo về 0!'
      showHeart.value = true
      setTimeout(() => { showHeart.value = false }, 900)
    }

    setTimeout(() => {
      checkFeedback.value = null
      feedbackMsg.value = ''
      if (!props.session.isLastQuestion.value) {
        props.session.next()
      } else {
        isVictory.value = true
      }
      isChecking.value = false
    }, 1000)
  } catch {
    isChecking.value = false
    if (!props.session.isLastQuestion.value) props.session.next()
    else isVictory.value = true
  }
}
</script>

<style scoped>
.streak-mode-scene {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(160deg, #7c2d12 0%, #c2410c 40%, #ea580c 70%, #fed7aa 100%);
  padding: 16px;
  box-sizing: border-box;
  outline: none;
  position: relative;
}

/* HEADER */
.streak-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  background: rgba(0,0,0,0.25);
  border-radius: 20px;
  padding: 14px 18px;
  margin-bottom: 16px;
  backdrop-filter: blur(6px);
}

.streak-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* COMBO */
.combo-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.combo-number {
  font-size: 3rem;
  font-weight: 900;
  color: #fff;
  line-height: 1;
  text-shadow: 0 0 20px rgba(251,191,36,0.8), 0 2px 8px rgba(0,0,0,0.5);
}

.combo-label {
  font-size: 0.75rem;
  font-weight: 800;
  color: #fed7aa;
  letter-spacing: 2px;
}

/* BADGE */
.badges-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.milestone-badge {
  font-size: 1.3rem;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
}

/* BROKEN HEART OVERLAY */
.broken-heart-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8rem;
  pointer-events: none;
  z-index: 100;
  animation: heartPulse 0.5s ease;
}

@keyframes heartPulse {
  0% { transform: scale(0.5); opacity: 0; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(1); opacity: 0.8; }
}

/* QUESTION CARD */
.streak-question-card {
  background: #ffffff;
  border: 3.5px solid #f97316;
  border-radius: 24px;
  padding: 24px 28px;
  margin-bottom: 16px;
  box-shadow: 0 10px 25px rgba(249, 115, 22, 0.2);
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
  background: rgba(34,197,94,0.2);
  border: 2px solid #22c55e;
  color: #bbf7d0;
}

.feedback--wrong {
  background: rgba(239,68,68,0.15);
  border: 2px solid #ef4444;
  color: #fecaca;
}

.answer-area { width: 100%; }
.keyboard-hint { opacity: 0.7; }

/* VICTORY */
.victory-screen {
  background: rgba(0,0,0,0.4);
  border: 2px solid rgba(255,165,0,0.5);
  border-radius: 28px;
  backdrop-filter: blur(10px);
}

.submit-row {
  display: flex;
  justify-content: center;
}

/* TRANSITIONS */
.combo-pop-enter-active,
.combo-pop-leave-active {
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.combo-pop-enter-from {
  opacity: 0;
  transform: scale(0.5) translateY(-16px);
}
.combo-pop-leave-to {
  opacity: 0;
  transform: scale(1.5) translateY(10px);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s ease;
}
.fade-slide-enter-from { opacity: 0; transform: translateY(-10px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(10px); }

.heart-fade-enter-active,
.heart-fade-leave-active { transition: opacity 0.4s ease; }
.heart-fade-enter-from, .heart-fade-leave-to { opacity: 0; }

@media (max-width: 375px) {
  .question-text { font-size: 1.1rem; }
  .combo-number { font-size: 2.2rem; }
  .streak-mode-scene { padding: 10px; }
}
</style>
