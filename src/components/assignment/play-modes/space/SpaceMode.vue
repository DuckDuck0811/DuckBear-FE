<template>
  <div class="space-mode-scene">
    <!-- STARFIELD BACKGROUND -->
    <div class="starfield" aria-hidden="true">
      <span v-for="n in 60" :key="n" class="star" :style="starStyle(n)" />
    </div>

    <!-- HEADER: Planet journey -->
    <div class="space-header">
      <div class="space-title">
        <span class="text-h5">🚀</span>
        <div>
          <div class="text-subtitle-1 font-weight-black text-cyan-200">Du Hành Vũ Trụ</div>
          <div class="text-caption text-cyan-400">Câu {{ currentNum }} / {{ totalQuestions }}</div>
        </div>
      </div>

      <!-- Planet orbit dots: group by 5 -->
      <div class="planet-orbit-bar">
        <div
          v-for="(group, gi) in questionGroups"
          :key="gi"
          class="orbit-group"
        >
          <span class="group-planet-emoji">{{ groupEmojis[gi % groupEmojis.length] }}</span>
          <div class="orbit-dots">
            <div
              v-for="(qIdx, qi) in group"
              :key="qi"
              class="orbit-dot"
              :class="{
                'dot--done': results[qIdx] !== undefined,
                'dot--correct': results[qIdx] === true,
                'dot--wrong': results[qIdx] === false,
                'dot--current': qIdx === currentIndex,
              }"
              @click="session.goTo(qIdx)"
            />
          </div>
        </div>
      </div>

      <!-- Timer -->
      <div v-if="session.timeLabel?.value" class="space-timer text-cyan-300 font-weight-black">
        ⏱ {{ session.timeLabel.value }}
      </div>
    </div>

    <!-- MAIN: Spaceship cabin -->
    <div class="spaceship-cabin">
      <div v-if="currentQuestionItem" class="cabin-inner">
        <div class="cabin-header text-caption text-cyan-400 mb-3">
          🛸 Khoang Điều Khiển — Hành tinh {{ Math.floor(currentIndex / 5) + 1 }}
        </div>
        <div class="question-text">{{ currentQuestionItem.question.content }}</div>
      </div>
    </div>

    <!-- FEEDBACK BANNER -->
    <transition name="fade-slide">
      <div v-if="feedbackMsg" class="feedback-banner" :class="feedbackClass">
        {{ feedbackMsg }}
      </div>
    </transition>

    <!-- ANSWER INPUT -->
    <div v-if="currentQuestionItem && !isVictory" class="answer-area">
      <SpaceAnswerInput
        :question="currentQuestionItem.question"
        :model-value="session.answers[currentQuestionItem.question.id]"
        :disabled="isChecking"
        :feedback="checkFeedback"
        @update:model-value="onAnswerChange"
        @confirm="onConfirm"
      />
    </div>

    <!-- VICTORY SCREEN -->
    <div v-if="isVictory" class="victory-screen text-center pa-8">
      <div class="text-h2 mb-3">🌟🚀🌟</div>
      <h2 class="text-h4 font-weight-black text-cyan-200 mb-2">Nhiệm Vụ Hoàn Thành!</h2>
      <p class="text-body-1 text-cyan-400 mb-6">
        Em đã vượt qua {{ correctCount }} / {{ totalQuestions }} trạm vũ trụ!
      </p>
      <v-btn
        color="cyan"
        size="x-large"
        rounded="pill"
        prepend-icon="mdi-send"
        :loading="session.submitting.value"
        class="font-weight-black"
        @click="session.submit()"
      >
        Gửi Báo Cáo Nhiệm Vụ 🚀
      </v-btn>
    </div>

    <!-- SUBMIT (last question, not yet complete) -->
    <div
      v-if="session.isLastQuestion.value && !isVictory && checkFeedback === null && !isChecking"
      class="submit-row mt-4"
    >
      <v-btn
        color="cyan-darken-1"
        variant="outlined"
        rounded="pill"
        :loading="session.submitting.value"
        class="font-weight-black"
        @click="session.submit()"
      >
        Nộp Bài 🚀
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import SpaceAnswerInput from './SpaceAnswerInput.vue'

const props = defineProps({
  session: { type: Object, required: true },
})

const isChecking = ref(false)
const checkFeedback = ref(null)
const feedbackMsg = ref('')
const isVictory = ref(false)
const results = ref({}) // { [qIdx]: true|false }

const currentQuestionItem = computed(() => props.session.currentQuestionItem.value)
const currentIndex = computed(() => props.session.currentIndex.value)
const totalQuestions = computed(() => props.session.totalQuestions.value || 1)
const currentNum = computed(() => currentIndex.value + 1)
const correctCount = computed(() => Object.values(results.value).filter(Boolean).length)

const groupEmojis = ['🪐', '⭐', '🌙', '☄️', '🌍', '🌟', '💫']

const questionGroups = computed(() => {
  const groups = []
  const total = totalQuestions.value
  for (let i = 0; i < total; i += 5) {
    groups.push(Array.from({ length: Math.min(5, total - i) }, (_, j) => i + j))
  }
  return groups
})

const feedbackClass = computed(() =>
  checkFeedback.value === 'correct' ? 'feedback--correct' : 'feedback--wrong'
)

function starStyle(n) {
  const seed = n * 7919
  const x = ((seed * 1234567) % 100).toFixed(1)
  const y = ((seed * 9876543) % 100).toFixed(1)
  const size = (1 + (seed % 3)) + 'px'
  const dur = (2 + (seed % 4)) + 's'
  const delay = (seed % 5) + 's'
  return { left: x + '%', top: y + '%', width: size, height: size, animationDuration: dur, animationDelay: delay }
}

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
    const idx = currentIndex.value
    if (res?.isCorrect === true) {
      checkFeedback.value = 'correct'
      feedbackMsg.value = '⭐ Xuất sắc! Hành tinh đã chinh phục!'
      results.value[idx] = true
    } else {
      checkFeedback.value = 'wrong'
      feedbackMsg.value = 'Tiếp Tục Bay 🛸 — Thử lại ở lần sau!'
      results.value[idx] = false
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
    }, 1200)
  } catch {
    isChecking.value = false
    if (!props.session.isLastQuestion.value) props.session.next()
    else isVictory.value = true
  }
}
</script>

<style scoped>
.space-mode-scene {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(180deg, #020617 0%, #0f0f3d 50%, #1e1b4b 100%);
  overflow: hidden;
  padding: 16px;
  box-sizing: border-box;
}

/* STARFIELD */
.starfield {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.star {
  position: absolute;
  border-radius: 50%;
  background: #ffffff;
  animation: twinkle ease-in-out infinite alternate;
}
@keyframes twinkle {
  from { opacity: 0.1; transform: scale(0.8); }
  to   { opacity: 1;   transform: scale(1.2); }
}

/* HEADER */
.space-header {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  background: rgba(255,255,255,0.05);
  border: 1.5px solid rgba(34,211,238,0.3);
  border-radius: 20px;
  padding: 12px 18px;
  margin-bottom: 16px;
  backdrop-filter: blur(8px);
}

.space-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.planet-orbit-bar {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.orbit-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.group-planet-emoji {
  font-size: 20px;
}

.orbit-dots {
  display: flex;
  gap: 5px;
}

.orbit-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  border: 1.5px solid rgba(255,255,255,0.3);
  cursor: pointer;
  transition: all 0.3s;
}
.dot--current {
  background: #22d3ee;
  border-color: #22d3ee;
  box-shadow: 0 0 8px #22d3ee;
}
.dot--correct {
  background: #fbbf24;
  border-color: #fbbf24;
}
.dot--wrong {
  background: #ef4444;
  border-color: #ef4444;
}
.dot--done:not(.dot--correct):not(.dot--wrong) {
  background: rgba(255,255,255,0.4);
}

/* CABIN */
.spaceship-cabin {
  position: relative;
  z-index: 10;
  background: rgba(0,30,80,0.7);
  border: 2.5px solid #22d3ee;
  border-radius: 24px;
  padding: 24px 28px;
  margin-bottom: 16px;
  box-shadow: 0 0 24px rgba(34,211,238,0.25), inset 0 0 40px rgba(34,211,238,0.05);
  backdrop-filter: blur(10px);
}

.cabin-inner {
  display: flex;
  flex-direction: column;
}

.question-text {
  font-size: 1.4rem;
  font-weight: 900;
  color: #e2e8f0;
  line-height: 1.6;
}

/* FEEDBACK */
.feedback-banner {
  position: relative;
  z-index: 10;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 800;
  padding: 12px 20px;
  border-radius: 16px;
  margin-bottom: 12px;
}
.feedback--correct {
  background: rgba(251,191,36,0.15);
  border: 2px solid #fbbf24;
  color: #fbbf24;
}
.feedback--wrong {
  background: rgba(239,68,68,0.12);
  border: 2px solid #ef4444;
  color: #f87171;
}

/* ANSWER AREA */
.answer-area {
  position: relative;
  z-index: 10;
}

/* VICTORY */
.victory-screen {
  position: relative;
  z-index: 10;
  background: rgba(0,30,80,0.85);
  border: 2px solid #22d3ee;
  border-radius: 28px;
  backdrop-filter: blur(12px);
  box-shadow: 0 0 40px rgba(34,211,238,0.3);
}

.submit-row {
  display: flex;
  justify-content: center;
  position: relative;
  z-index: 10;
}

.space-timer {
  font-size: 1rem;
}

/* TRANSITIONS */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-12px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

@media (max-width: 375px) {
  .question-text {
    font-size: 1.1rem;
  }
  .spaceship-cabin {
    padding: 16px 14px;
  }
  .space-mode-scene {
    padding: 10px;
  }
}
</style>
