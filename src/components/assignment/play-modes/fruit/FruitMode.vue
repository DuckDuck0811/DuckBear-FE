<template>
  <div class="fruit-game" :class="{ 'reduce-motion': prefersReducedMotion }">
    <!-- HUD: Tiến độ + Giỏ quả -->
    <div class="fruit-hud">
      <div class="hud-left">
        <span class="hud-tree">🌳</span>
        <span class="hud-label">Câu {{ displayQ }} / {{ totalQ }}</span>
      </div>
      <div class="hud-basket">
        <span class="basket-icon">🧺</span>
        <span class="basket-count">{{ basketCount }}</span>
      </div>
    </div>

    <!-- CẢNH CÂY (viewport) -->
    <div class="tree-viewport" ref="vpRef">
      <!-- World cuộn dọc -->
      <div class="tree-world" :style="{ transform: `translateY(${cameraY}px)` }">
        <!-- Thân cây -->
        <div class="tree-trunk"></div>

        <!-- Render từng tầng (nhóm cành) -->
        <div
          v-for="(floorData, fi) in floors"
          :key="fi"
          class="branch-tier"
          :style="branchTierStyle(fi)"
        >
          <!-- Cành trái -->
          <div class="branch branch-left" :class="{ 'branch-shake': shakeFloor === fi && lastResult === 'wrong' }">
            <svg viewBox="0 0 60 30" width="60" height="30">
              <path d="M60 28 Q40 20 10 8" stroke="#6b4f2b" stroke-width="6" fill="none" stroke-linecap="round"/>
            </svg>
          </div>
          <!-- Cành phải -->
          <div class="branch branch-right" :class="{ 'branch-shake': shakeFloor === fi && lastResult === 'wrong' }">
            <svg viewBox="0 0 60 30" width="60" height="30">
              <path d="M0 28 Q20 20 50 8" stroke="#6b4f2b" stroke-width="6" fill="none" stroke-linecap="round"/>
            </svg>
          </div>
        </div>

        <!-- Nhân vật khỉ leo cây -->
        <div class="monkey-wrap" :style="monkeyStyle" :class="{ 'monkey--climb': isClimbing }">
          <svg viewBox="0 0 50 70" width="50" height="70" xmlns="http://www.w3.org/2000/svg">
            <!-- Thân -->
            <ellipse cx="25" cy="45" rx="13" ry="17" fill="#f59e0b"/>
            <!-- Đầu -->
            <circle cx="25" cy="22" r="16" fill="#fbbf24"/>
            <!-- Mặt sáng -->
            <ellipse cx="25" cy="26" rx="10" ry="8" fill="#fde68a"/>
            <!-- Mắt -->
            <circle cx="20" cy="20" r="3" fill="#1e293b"/><circle cx="21" cy="19" r="1" fill="white"/>
            <circle cx="30" cy="20" r="3" fill="#1e293b"/><circle cx="31" cy="19" r="1" fill="white"/>
            <!-- Mũi -->
            <circle cx="23" cy="25" r="1.5" fill="#d97706"/>
            <circle cx="27" cy="25" r="1.5" fill="#d97706"/>
            <!-- Miệng -->
            <path d="M19 29 Q25 34 31 29" stroke="#b45309" stroke-width="2" fill="none" stroke-linecap="round"/>
            <!-- Tai -->
            <circle cx="9" cy="20" r="6" fill="#fbbf24"/>
            <circle cx="9" cy="20" r="3.5" fill="#f97316"/>
            <circle cx="41" cy="20" r="6" fill="#fbbf24"/>
            <circle cx="41" cy="20" r="3.5" fill="#f97316"/>
            <!-- Tay ôm cây -->
            <path d="M12 42 Q4 38 2 50" stroke="#f59e0b" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M38 42 Q46 38 48 50" stroke="#f59e0b" stroke-width="5" fill="none" stroke-linecap="round"/>
            <!-- Chân -->
            <path d="M18 60 Q14 68 10 68" stroke="#f59e0b" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M32 60 Q36 68 40 68" stroke="#f59e0b" stroke-width="5" fill="none" stroke-linecap="round"/>
          </svg>
        </div>
      </div>

      <!-- BẢNG GỖ CÂU HỎI + ĐÁP ÁN (overlay) -->
      <div v-if="currentQuestionItem && !reachedTop" class="question-overlay">
        <!-- Bảng gỗ -->
        <div class="wood-board">
          <div class="board-label">🪵 Câu {{ displayQ }} / {{ totalQ }}</div>
          <div class="board-text">{{ currentQuestionItem.question.content }}</div>
        </div>

        <!-- Quả đáp án (MCQ) -->
        <div v-if="isMcqType" class="fruits-row">
          <FruitAnswerInput
            :question="currentQuestionItem.question"
            :model-value="session.answers[currentQuestionItem.question.id]"
            :disabled="isChecking || isChecked"
            :feedback="checkFeedback"
            :selected-id="localSelected"
            @select="onSelect"
          />
          <button
            class="btn-hai"
            :disabled="localSelected === null || isChecking || isChecked"
            @click="onConfirm"
          >
            <span v-if="isChecking">⏳ Đang kiểm tra…</span>
            <span v-else>🍎 Hái!</span>
          </button>
        </div>

        <!-- Non-MCQ -->
        <div v-else class="mission-card">
          <div class="mission-title">🌿 Nhiệm vụ câu {{ displayQ }}</div>
          <QuestionItem
            :item="currentQuestionItem"
            :index="session.currentIndex.value"
            :answer="session.answers[currentQuestionItem.question.id]"
            :level="2"
            mode="fruit"
            @answered="() => {}"
          />
          <button
            class="btn-hai"
            :disabled="!session.hasAnswer(currentQuestionItem.question.id) || isChecking || isChecked"
            @click="onConfirm"
          >
            <span v-if="isChecking">⏳ Đang kiểm tra…</span>
            <span v-else>🌿 Tiếp tục leo!</span>
          </button>
        </div>
      </div>

      <!-- Feedback -->
      <Transition name="feedback-pop">
        <div v-if="showFeedback" class="feedback-badge" :class="feedbackClass">
          <span>{{ feedbackIcon }}</span>
          <span>{{ feedbackMsg }}</span>
        </div>
      </Transition>

      <!-- Quả bay vào giỏ (khi đúng) -->
      <div v-if="showFlyFruit" class="fly-fruit" aria-hidden="true">🍎</div>
    </div>

    <!-- MÀN NGỌN CÂY -->
    <Transition name="top-reveal">
      <div v-if="reachedTop" class="top-screen">
        <div class="top-content">
          <div class="top-emoji">🌟</div>
          <h2 class="top-title">Lên tới ngọn cây rồi!</h2>
          <div class="basket-summary">
            <span class="big-basket">🧺</span>
            <div class="basket-info">
              <div class="basket-num">{{ basketCount }}</div>
              <div class="basket-sub">quả đã hái</div>
            </div>
          </div>
          <button
            class="btn-submit"
            :disabled="session.submitting.value"
            @click="session.submit()"
          >
            {{ session.submitting.value ? '⏳ Đang nộp…' : '🎉 Nộp Bài!' }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, nextTick } from 'vue';
import FruitAnswerInput from './FruitAnswerInput.vue';
import QuestionItem from '../../QuestionItem.vue';

const props = defineProps({
  session: { type: Object, required: true },
});

const FLOOR_H = 160;

const vpRef = ref(null);
const basketCount = ref(0);
const currentFloor = ref(0);
const cameraY = ref(0);
const isClimbing = ref(false);
const isChecking = ref(false);
const checkFeedback = ref(null);
const reachedTop = ref(false);
const localSelected = ref(null);
const showFeedback = ref(false);
const showFlyFruit = ref(false);
const feedbackIcon = ref('');
const feedbackMsg = ref('');
const feedbackClass = ref('');
const shakeFloor = ref(-1);
const lastResult = ref(null);

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const totalQ = computed(() => props.session.totalQuestions.value || 1);
const currentQuestionItem = computed(() => props.session.currentQuestionItem.value);
const displayQ = computed(() => props.session.currentIndex.value + 1);

const isMcqType = computed(() => {
  const t = currentQuestionItem.value?.question?.type;
  return t === 'MCQ' || t === 'MULTI_MCQ' || t === 'TRUE_FALSE';
});

const isChecked = computed(() => {
  const qId = currentQuestionItem.value?.question?.id;
  return qId != null && props.session.checkedQuestions?.[String(qId)] != null;
});

// Tạo dữ liệu floors cho SVG rendering
const floors = computed(() => Array.from({ length: totalQ.value }, (_, i) => i));

function branchTierStyle(fi) {
  return {
    position: 'absolute',
    left: 0, right: 0,
    bottom: `${(fi + 1) * FLOOR_H - 40}px`,
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  };
}

const monkeyStyle = computed(() => ({
  position: 'absolute',
  left: '50%',
  transform: 'translateX(-50%)',
  bottom: `${currentFloor.value * FLOOR_H + 10}px`,
  transition: prefersReducedMotion ? 'none' : 'bottom 0.6s cubic-bezier(0.34,1.56,0.64,1)',
  zIndex: 20,
}));

function updateCamera() {
  if (!vpRef.value) return;
  const vpH = vpRef.value.clientHeight;
  const monkeyBottom = currentFloor.value * FLOOR_H + 80;
  cameraY.value = Math.min(0, -(monkeyBottom - vpH * 0.4));
}

function onSelect(optionId) {
  if (!isChecked.value && !isChecking.value) localSelected.value = optionId;
}

function onLegacyAnswer() {}

async function onConfirm() {
  const q = currentQuestionItem.value?.question;
  if (!q || isChecking.value || isChecked.value) return;
  if (isMcqType.value && localSelected.value === null) return;

  isChecking.value = true;
  showFeedback.value = false;
  showFlyFruit.value = false;
  checkFeedback.value = null;

  if (isMcqType.value && localSelected.value !== null) {
    props.session.setAnswer(q.id, { selectedOptionId: localSelected.value });
  }

  try {
    const res = await props.session.checkQuestion(q.id);
    const correct = res?.isCorrect === true;
    lastResult.value = correct ? 'correct' : 'wrong';
    shakeFloor.value = currentFloor.value;

    if (correct) {
      checkFeedback.value = 'correct';
      feedbackIcon.value = '✅';
      feedbackMsg.value = 'Hái được rồi! +1 quả!';
      feedbackClass.value = 'feedback--correct';
      basketCount.value++;
      currentFloor.value++;
      if (!prefersReducedMotion) {
        showFlyFruit.value = true;
        setTimeout(() => { showFlyFruit.value = false; }, 1000);
      }
    } else {
      checkFeedback.value = 'wrong';
      feedbackIcon.value = '❌';
      feedbackMsg.value = 'Chưa đúng! Quả vẫn còn treo đó!';
      feedbackClass.value = 'feedback--wrong';
      currentFloor.value++; // vẫn leo lên, không phạt
    }

    isClimbing.value = true;
    showFeedback.value = true;
    updateCamera();

    setTimeout(() => {
      showFeedback.value = false;
      isClimbing.value = false;
      shakeFloor.value = -1;
      if (!props.session.isLastQuestion.value) {
        props.session.next();
      } else {
        reachedTop.value = true;
      }
    }, prefersReducedMotion ? 500 : 1400);
  } catch {
    isClimbing.value = false;
    setTimeout(() => {
      if (!props.session.isLastQuestion.value) props.session.next();
      else reachedTop.value = true;
    }, 400);
  } finally {
    isChecking.value = false;
  }
}

watch(() => props.session.currentIndex.value, () => {
  localSelected.value = null;
  checkFeedback.value = null;
});

onMounted(() => {
  const checked = props.session.checkedQuestions || {};
  const checkedCount = Object.keys(checked).length;
  if (checkedCount > 0) {
    currentFloor.value = checkedCount;
    basketCount.value = Object.values(checked).filter(c => c.isCorrect === true).length;
    if (checkedCount >= props.session.totalQuestions.value) reachedTop.value = true;
    nextTick(updateCamera);
  }
});
</script>

<style scoped>
.fruit-game {
  display: flex;
  flex-direction: column;
  height: calc(100dvh - 120px);
  min-height: 500px;
  background: linear-gradient(180deg, #ecfdf5 0%, #dcfce7 50%, #bbf7d0 100%);
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  user-select: none;
}

/* HUD */
.fruit-hud {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(8px);
  border-bottom: 2px solid #bbf7d0;
  flex-shrink: 0;
  z-index: 30;
}
.hud-left { display: flex; align-items: center; gap: 8px; }
.hud-tree { font-size: 1.5rem; }
.hud-label { font-size: 1.1rem; font-weight: 800; color: #065f46; }
.hud-basket {
  display: flex; align-items: center; gap: 6px;
  background: #fef3c7; padding: 6px 16px; border-radius: 999px;
  border: 2px solid #fde68a; font-weight: 800; color: #b45309;
}
.basket-icon { font-size: 1.3rem; }
.basket-count { font-size: 1.2rem; }

/* VIEWPORT */
.tree-viewport {
  flex: 1;
  position: relative;
  overflow: hidden;
}

/* WORLD */
.tree-world {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  transition: transform 0.5s cubic-bezier(0.25,0.8,0.25,1);
}
.reduce-motion .tree-world { transition: none; }

/* THÂN CÂY */
.tree-trunk {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 0;
  width: 32px;
  height: 2000px;
  background: linear-gradient(90deg, #92400e, #b45309 50%, #78350f);
  border-radius: 8px;
}

/* CÀNH CÂY */
.branch-tier { pointer-events: none; }
.branch { position: absolute; }
.branch-left  { left: calc(50% - 90px); }
.branch-right { right: calc(50% - 90px); }

@keyframes branchShake {
  0%,100% { transform: rotate(0); }
  25%     { transform: rotate(-6deg); }
  75%     { transform: rotate(4deg); }
}
.branch-shake { animation: branchShake 0.4s ease; }

/* MONKEY */
.monkey-wrap { display: flex; justify-content: center; }
.monkey--climb { animation: climbBounce 0.5s cubic-bezier(0.34,1.56,0.64,1); }
@keyframes climbBounce {
  0%  { transform: translateX(-50%) scale(1); }
  50% { transform: translateX(-50%) scale(1.1) translateY(-10px); }
  100%{ transform: translateX(-50%) scale(1); }
}
.reduce-motion .monkey--climb { animation: none; }

/* QUESTION OVERLAY */
.question-overlay {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 16px 16px;
  gap: 10px;
  z-index: 25;
}

/* BẢNG GỖ */
.wood-board {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border: 3px solid #d97706;
  border-radius: 16px;
  padding: 12px 20px;
  max-width: 540px;
  width: 100%;
  text-align: center;
  box-shadow: 0 6px 20px rgba(217,119,6,0.2), inset 0 1px 0 rgba(255,255,255,0.4);
}
.board-label { font-size: 0.75rem; font-weight: 700; color: #92400e; margin-bottom: 4px; }
.board-text  { font-size: 1.15rem; font-weight: 800; color: #1e293b; line-height: 1.5; }

/* FRUITS ROW */
.fruits-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 540px;
}

/* MISSION CARD */
.mission-card {
  background: white;
  border: 2px solid #d97706;
  border-radius: 16px;
  padding: 16px;
  width: 100%;
  max-width: 540px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}
.mission-title { font-size: 0.9rem; font-weight: 700; color: #d97706; margin-bottom: 10px; }

/* BTN HÁI */
.btn-hai {
  width: 100%;
  max-width: 300px;
  padding: 14px 32px;
  font-size: 1.25rem;
  font-weight: 900;
  color: white;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border: none;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(245,158,11,0.4);
  transition: transform 0.15s;
}
.btn-hai:hover:not(:disabled) { transform: translateY(-2px); }
.btn-hai:disabled { opacity: 0.45; cursor: not-allowed; }

/* FEEDBACK */
.feedback-badge {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border-radius: 20px;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1rem;
  font-weight: 800;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  z-index: 40;
  pointer-events: none;
  white-space: nowrap;
}
.feedback--correct { border: 2px solid #10b981; color: #065f46; }
.feedback--wrong   { border: 2px solid #ef4444; color: #991b1b; }

.feedback-pop-enter-active { animation: popIn 0.3s cubic-bezier(0.34,1.56,0.64,1); }
.feedback-pop-leave-active { transition: opacity 0.2s; }
.feedback-pop-leave-to    { opacity: 0; }
@keyframes popIn { from { transform: translateX(-50%) scale(0.6); opacity: 0; } to { transform: translateX(-50%) scale(1); opacity: 1; } }

/* QUASK BAY */
.fly-fruit {
  position: absolute;
  top: 50%;
  right: 20px;
  font-size: 2rem;
  animation: flyToBasket 1s cubic-bezier(0.25,0.8,0.25,1) forwards;
  pointer-events: none;
  z-index: 50;
}
@keyframes flyToBasket {
  0%   { transform: translate(0,0) scale(1); opacity: 1; }
  100% { transform: translate(80px,-120px) scale(0.4); opacity: 0; }
}

/* TOP SCREEN */
.top-screen {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #ecfdf5 0%, #d1fae5 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;
}
.top-content {
  background: white;
  border: 3px solid #10b981;
  border-radius: 24px;
  padding: 32px;
  text-align: center;
  box-shadow: 0 20px 50px rgba(16,185,129,0.2);
  max-width: 380px;
  width: 90%;
}
.top-emoji { font-size: 4rem; margin-bottom: 10px; animation: popIn2 0.6s cubic-bezier(0.34,1.56,0.64,1); }
@keyframes popIn2 { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.top-title { font-size: 1.3rem; font-weight: 900; color: #065f46; margin-bottom: 16px; }
.basket-summary {
  display: flex; align-items: center; justify-content: center; gap: 16px;
  margin-bottom: 20px;
  background: #f0fdf4; padding: 16px; border-radius: 16px;
}
.big-basket { font-size: 3rem; }
.basket-num { font-size: 2rem; font-weight: 900; color: #065f46; }
.basket-sub { font-size: 0.9rem; color: #6b7280; }

.btn-submit {
  padding: 14px 40px;
  font-size: 1.15rem;
  font-weight: 900;
  color: white;
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(16,185,129,0.4);
  transition: transform 0.15s;
}
.btn-submit:hover:not(:disabled) { transform: translateY(-2px); }
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

.top-reveal-enter-active { animation: peakIn 0.4s cubic-bezier(0.34,1.56,0.64,1); }
@keyframes peakIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

@media (max-width: 600px) {
  .board-text { font-size: 1rem; }
  .btn-hai { font-size: 1.05rem; padding: 12px 20px; }
}
.reduce-motion * { animation: none !important; transition: none !important; }
</style>
