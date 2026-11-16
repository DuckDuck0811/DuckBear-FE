<template>
  <div class="tower-game" :class="{ 'reduce-motion': prefersReducedMotion }">
    <!-- TOP HUD: Thanh trạng thái -->
    <header class="tower-hud">
      <div class="hud-item hud-floor">
        <span class="hud-icon">🏰</span>
        <div class="hud-text">
          <span class="hud-caption">TIẾN ĐỘ THÁP</span>
          <strong class="hud-val">Tầng {{ displayFloor }} / {{ totalFloors }}</strong>
        </div>
      </div>

      <!-- Thanh tiến độ leo tháp nhỏ gọn -->
      <div class="hud-progress-track" aria-hidden="true">
        <div
          class="hud-progress-fill"
          :style="{ width: `${(displayFloor / totalFloors) * 100}%` }"
        ></div>
      </div>

      <div class="hud-item hud-stars">
        <span class="star-sparkle">⭐</span>
        <strong class="stars-val">{{ stars }}</strong>
      </div>
    </header>

    <!-- MAIN GAME ARENA (Chia 2 khu vực: Sân khấu tháp & Khu vực chọn đáp án) -->
    <main class="tower-arena">
      <!-- CỘT TRÁI: SÂN KHẤU TÒA THÁP HOẠT HÌNH & NHÂN VẬT -->
      <section class="tower-stage-container" aria-label="Sân khấu leo tháp">
        <!-- Bầu trời & mây bay -->
        <div class="sky-elements" aria-hidden="true">
          <div class="cloud cloud-1">☁️</div>
          <div class="cloud cloud-2">☁️</div>
        </div>

        <div class="tower-viewport" ref="viewportRef">
          <!-- Cột tháp đá hoạt hình -->
          <div class="castle-tower">
            <!-- Đỉnh tháp -->
            <div class="castle-roof">
              <div class="flag">🚩</div>
              <div class="roof-cone"></div>
            </div>

            <!-- Thân tháp gồm các tầng gạch -->
            <div class="tower-shaft">
              <div
                v-for="i in 5"
                :key="i"
                class="tower-shaft-segment"
              >
                <div class="brick-pattern"></div>
                <div class="tower-window">🪟</div>
              </div>
            </div>

            <!-- Bệ đứng tầng hiện tại & nhân vật -->
            <div
              class="hero-floor-platform"
              :class="{
                'anim-jump': heroAnim === 'jump',
                'anim-shake': heroAnim === 'shake',
              }"
            >
              <!-- Nhân vật hoạt hình SVG (Bé Rồng Con Tinh Nghịch) -->
              <div class="hero-character-box">
                <svg viewBox="0 0 100 110" width="90" height="100" class="hero-svg">
                  <!-- Đuôi vẫy -->
                  <path d="M25 80 Q10 75 12 60 Q20 68 30 75" fill="#10b981" />
                  <circle cx="10" cy="58" r="4" fill="#fbbf24" />

                  <!-- Thân béo mập -->
                  <ellipse cx="50" cy="70" rx="28" ry="30" fill="#34d399" stroke="#059669" stroke-width="3" />
                  <!-- Bụng vàng tròn -->
                  <ellipse cx="50" cy="74" rx="18" ry="20" fill="#fef08a" />

                  <!-- Đầu tròn to siêu cute -->
                  <circle cx="50" cy="38" r="26" fill="#34d399" stroke="#059669" stroke-width="3" />

                  <!-- Cặp sừng vàng nhỏ xíu -->
                  <polygon points="38,15 44,22 34,22" fill="#fbbf24" stroke="#d97706" stroke-width="1.5" />
                  <polygon points="62,15 66,22 56,22" fill="#fbbf24" stroke="#d97706" stroke-width="1.5" />

                  <!-- Mắt to long lanh hoạt hình -->
                  <!-- Mắt trái -->
                  <ellipse cx="40" cy="35" rx="7" ry="9" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
                  <circle cx="41" cy="35" r="4.5" fill="#0f172a" />
                  <circle cx="43" cy="33" r="1.8" fill="#ffffff" />
                  <!-- Mắt phải -->
                  <ellipse cx="60" cy="35" rx="7" ry="9" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
                  <circle cx="59" cy="35" r="4.5" fill="#0f172a" />
                  <circle cx="61" cy="33" r="1.8" fill="#ffffff" />

                  <!-- Má hồng -->
                  <ellipse cx="32" cy="42" rx="4" ry="2.5" fill="#f43f5e" opacity="0.6" />
                  <ellipse cx="68" cy="42" rx="4" ry="2.5" fill="#f43f5e" opacity="0.6" />

                  <!-- Miệng cười tít mắt -->
                  <path d="M44 43 Q50 49 56 43" stroke="#0f172a" stroke-width="2.5" fill="none" stroke-linecap="round" />

                  <!-- Đôi cánh nhỏ lấp lánh -->
                  <path d="M22 60 Q10 50 18 42 Q25 52 24 62" fill="#38bdf8" opacity="0.8" />
                  <path d="M78 60 Q90 50 82 42 Q75 52 76 62" fill="#38bdf8" opacity="0.8" />

                  <!-- Chân nhỏ bám bệ -->
                  <ellipse cx="36" cy="98" rx="8" ry="6" fill="#059669" />
                  <ellipse cx="64" cy="98" rx="8" ry="6" fill="#059669" />
                </svg>
              </div>

              <!-- Bệ đá hoa cương nâng đỡ -->
              <div class="stone-pedestal">
                <span class="pedestal-gem">💎</span>
                <span class="pedestal-text">TẦNG {{ displayFloor }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CỘT PHẢI: BẢNG CÂU HỎI & CÁC BẬC THANG ĐÁP ÁN -->
      <section class="tower-interactive-panel" v-if="currentQuestionItem && !reachedPeak">
        <!-- BẢNG ĐỀ BÀI HOẠT HÌNH CÓ BÓNG NỔI -->
        <div class="question-scroll-card">
          <div class="scroll-badge">
            <span class="scroll-icon">📜</span>
            <span>CÂU HỎI THỬ THÁCH {{ displayFloor }} / {{ totalFloors }}</span>
          </div>
          <h2 class="question-headline">
            {{ currentQuestionItem.question.content }}
          </h2>
        </div>

        <!-- CÁC BẬC THANG NỔI (MCQ / MULTI_MCQ / TRUE_FALSE) -->
        <div v-if="isMcqType" class="stairs-interactive-zone">
          <p class="zone-instruction">👇 Chạm chọn bậc thang đáp án:</p>
          <TowerAnswerInput
            :question="currentQuestionItem.question"
            :model-value="session.answers[currentQuestionItem.question.id]"
            :disabled="isChecking || isChecked"
            :feedback="checkFeedback"
            :selected-id="localSelected"
            @select="onSelect"
          />

          <!-- NÚT LEO THÁP 3D SIÊU NỔI BẬT -->
          <div class="action-commit-bar">
            <button
              type="button"
              class="btn-climb-action"
              :class="{ 'btn-ready': localSelected !== null && !isChecking && !isChecked }"
              :disabled="localSelected === null || isChecking || isChecked"
              @click="onConfirm"
            >
              <span class="btn-icon" v-if="isChecking">⏳</span>
              <span class="btn-icon" v-else>🧗</span>
              <span class="btn-label">
                {{ isChecking ? 'Đang nhảy bậc...' : 'LEO LÊN NGAY!' }}
              </span>
            </button>
          </div>
        </div>

        <!-- DÀNH CHO CÂU MATCHING, DRAG_DROP, FILL, ESSAY -->
        <div v-else class="mission-task-card">
          <div class="mission-card-header">
            <span>⚔️ Nhiệm vụ giải đố đặc biệt</span>
          </div>
          <div class="mission-card-body">
            <QuestionItem
              :item="currentQuestionItem"
              :index="session.currentIndex.value"
              :answer="session.answers[currentQuestionItem.question.id]"
              :level="1"
              mode="tower"
              @answered="onLegacyAnswer"
            />
          </div>
          <div class="action-commit-bar mt-4">
            <button
              type="button"
              class="btn-climb-action btn-ready"
              :disabled="!session.hasAnswer(currentQuestionItem.question.id) || isChecking || isChecked"
              @click="onConfirm"
            >
              <span class="btn-icon">🧗</span>
              <span class="btn-label">BƯỚC LÊN TẦNG TIẾP!</span>
            </button>
          </div>
        </div>
      </section>
    </main>

    <!-- HIỆU ỨNG PHẢN HỒI NỔI CHÍNH GIỮA (ĐÚNG / SAI) -->
    <Transition name="bounce-feedback">
      <div v-if="showFeedback" class="feedback-banner" :class="feedbackClass">
        <span class="fb-icon">{{ feedbackIcon }}</span>
        <div class="fb-content">
          <strong class="fb-title">{{ feedbackTitle }}</strong>
          <span class="fb-desc">{{ feedbackText }}</span>
        </div>
      </div>
    </Transition>

    <!-- SAO BAY BÙNG NỔ KHI ĐÚNG -->
    <div v-if="showStars" class="stars-explosion" aria-hidden="true">
      <span v-for="i in 10" :key="i" class="sparkle-star" :style="starStyle(i)">⭐</span>
    </div>

    <!-- MÀN CHINH PHỤC ĐỈNH THÁP -->
    <Transition name="celebrate-fade">
      <div v-if="reachedPeak" class="peak-celebration-modal">
        <div class="celebration-backdrop"></div>
        <div class="celebration-card">
          <div class="fireworks-anim" aria-hidden="true">🎆✨🎉</div>
          <div class="trophy-cup">🏆</div>
          <h2 class="congrats-title">CHINH PHỤC ĐỈNH THÁP!</h2>
          <p class="congrats-subtitle">
            Bé thật xuất sắc! Đã leo qua tất cả <strong>{{ totalFloors }}</strong> tầng và rinh về <strong>{{ stars }}</strong> sao vàng!
          </p>
          <button
            type="button"
            class="btn-finish-submit"
            :disabled="session.submitting.value"
            @click="session.submit()"
          >
            {{ session.submitting.value ? 'Đang nộp bài...' : 'CẮM CỜ & NỘP BÀI 🏁' }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, nextTick } from 'vue';
import TowerAnswerInput from './TowerAnswerInput.vue';
import QuestionItem from '../../QuestionItem.vue';

const props = defineProps({
  session: { type: Object, required: true },
});

const stars = ref(0);
const currentFloor = ref(0);
const heroAnim = ref('idle'); // 'idle' | 'jump' | 'shake'
const isChecking = ref(false);
const checkFeedback = ref(null);
const reachedPeak = ref(false);
const localSelected = ref(null);
const showFeedback = ref(false);
const showStars = ref(false);

const feedbackIcon = ref('🎉');
const feedbackTitle = ref('');
const feedbackText = ref('');
const feedbackClass = ref('fb--correct');

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const totalFloors = computed(() => props.session.totalQuestions.value || 1);
const currentQuestionItem = computed(() => props.session.currentQuestionItem.value);
const displayFloor = computed(() => props.session.currentIndex.value + 1);

const isMcqType = computed(() => {
  const t = currentQuestionItem.value?.question?.type;
  return t === 'MCQ' || t === 'MULTI_MCQ' || t === 'TRUE_FALSE';
});

const isChecked = computed(() => {
  const qId = currentQuestionItem.value?.question?.id;
  return qId != null && props.session.checkedQuestions?.[String(qId)] != null;
});

function onSelect(optionId) {
  if (!isChecked.value && !isChecking.value) {
    localSelected.value = optionId;
  }
}

function onLegacyAnswer() {}

// Phím tắt bàn phím
function onKeydown(e) {
  if (reachedPeak.value || isChecking.value || isChecked.value) return;
  if (!currentQuestionItem.value) return;
  const opts = currentQuestionItem.value.question?.options || [];
  const map = { '1': 0, '2': 1, '3': 2, '4': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3, 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
  const idx = map[e.key];
  if (idx !== undefined && opts[idx]) {
    localSelected.value = opts[idx].id;
  }
  if (e.key === 'Enter' && localSelected.value !== null) {
    onConfirm();
  }
}

async function onConfirm() {
  const q = currentQuestionItem.value?.question;
  if (!q || isChecking.value || isChecked.value) return;
  if (isMcqType.value && localSelected.value === null) return;

  isChecking.value = true;
  checkFeedback.value = null;
  showFeedback.value = false;
  showStars.value = false;

  if (isMcqType.value && localSelected.value !== null) {
    props.session.setAnswer(q.id, { selectedOptionId: localSelected.value });
  }

  try {
    const res = await props.session.checkQuestion(q.id);
    const correct = res?.isCorrect === true;

    if (correct) {
      checkFeedback.value = 'correct';
      feedbackIcon.value = '🌟';
      feedbackTitle.value = 'CHÍNH XÁC!';
      feedbackText.value = 'Bé giỏi lắm, leo thẳng lên tầng tiếp theo nào!';
      feedbackClass.value = 'fb--correct';
      stars.value += 3;
      heroAnim.value = 'jump';

      if (!prefersReducedMotion) {
        showStars.value = true;
        setTimeout(() => { showStars.value = false; }, 1200);
      }
    } else {
      checkFeedback.value = 'wrong';
      feedbackIcon.value = '💨';
      feedbackTitle.value = 'BƯỚC CHƯA CHUẨN!';
      feedbackText.value = 'Không sao cả! Bé vẫn bám chắc và leo tiếp nhé!';
      feedbackClass.value = 'fb--wrong';
      heroAnim.value = 'shake';
    }

    showFeedback.value = true;

    // Chuyển câu mượt mà sau 1.3s
    setTimeout(() => {
      showFeedback.value = false;
      heroAnim.value = 'idle';
      if (!props.session.isLastQuestion.value) {
        props.session.next();
      } else {
        reachedPeak.value = true;
      }
    }, prefersReducedMotion ? 500 : 1300);

  } catch {
    heroAnim.value = 'idle';
    setTimeout(() => {
      if (!props.session.isLastQuestion.value) props.session.next();
      else reachedPeak.value = true;
    }, 400);
  } finally {
    isChecking.value = false;
  }
}

watch(() => props.session.currentIndex.value, () => {
  localSelected.value = null;
  checkFeedback.value = null;
  heroAnim.value = 'idle';
});

onMounted(() => {
  document.addEventListener('keydown', onKeydown);
  // Khôi phục từ check questions
  const checked = props.session.checkedQuestions || {};
  const checkedCount = Object.keys(checked).length;
  if (checkedCount > 0) {
    currentFloor.value = checkedCount;
    stars.value = Object.values(checked).filter(c => c.isCorrect === true).length * 3;
    if (checkedCount >= props.session.totalQuestions.value) {
      reachedPeak.value = true;
    }
  }
  return () => document.removeEventListener('keydown', onKeydown);
});

function starStyle(i) {
  const angle = (i - 1) * 36;
  const dist = 70 + (i % 3) * 30;
  return {
    '--angle': `${angle}deg`,
    '--dist': `${dist}px`,
    animationDelay: `${(i - 1) * 40}ms`,
  };
}
</script>

<style scoped>
/* ================= TỔNG THỂ KHUNG MINI-GAME ================= */
.tower-game {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 620px;
  background: linear-gradient(180deg, #dbeafe 0%, #bae6fd 40%, #e0f2fe 100%);
  border: 4px solid #38bdf8;
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 16px 40px rgba(14, 165, 233, 0.2);
  position: relative;
  font-family: inherit;
  user-select: none;
}

/* ================= HEADER HUD ================= */
.tower-hud {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  padding: 12px 24px;
  border-bottom: 3px solid #7dd3fc;
  z-index: 20;
}

.hud-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hud-icon {
  font-size: 2.2rem;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}

.hud-text {
  display: flex;
  flex-direction: column;
}

.hud-caption {
  font-size: 0.72rem;
  font-weight: 800;
  color: #0284c7;
  letter-spacing: 0.5px;
}

.hud-val {
  font-size: 1.25rem;
  font-weight: 900;
  color: #0f172a;
}

.hud-progress-track {
  flex: 1;
  max-width: 320px;
  height: 14px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
  border: 2px solid #cbd5e1;
}

.hud-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #38bdf8, #0284c7);
  border-radius: 999px;
  transition: width 0.4s ease;
}

.hud-stars {
  background: #fef3c7;
  padding: 6px 18px;
  border-radius: 999px;
  border: 2px solid #fcd34d;
  box-shadow: 0 4px 10px rgba(245, 158, 11, 0.2);
}

.star-sparkle {
  font-size: 1.5rem;
}

.stars-val {
  font-size: 1.35rem;
  font-weight: 900;
  color: #b45309;
}

/* ================= ARENA 2 CỘT RÕ RÀNG ================= */
.tower-arena {
  display: grid;
  grid-template-columns: minmax(220px, 0.52fr) minmax(0, 1fr);
  flex: 1;
  gap: 20px;
  padding: 20px;
  position: relative;
  align-items: stretch;
}

/* CỘT TRÁI: SÂN KHẤU TÒA THÁP */
.tower-stage-container {
  background: linear-gradient(180deg, #bae6fd 0%, #7dd3fc 100%);
  border: 3px solid #38bdf8;
  border-radius: 24px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  box-shadow: inset 0 4px 12px rgba(255, 255, 255, 0.6);
  min-height: 480px;
}

.sky-elements {
  position: absolute;
  top: 10px;
  left: 0;
  right: 0;
  pointer-events: none;
}

.cloud {
  position: absolute;
  font-size: 1.8rem;
  opacity: 0.85;
  animation: floatCloud 8s ease-in-out infinite alternate;
}
.cloud-1 { top: 15px; left: 15px; }
.cloud-2 { top: 45px; right: 20px; animation-delay: -4s; }

@keyframes floatCloud {
  from { transform: translateX(0); }
  to { transform: translateX(18px); }
}

.tower-viewport {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  padding-bottom: 24px;
  position: relative;
  z-index: 5;
}

/* CẤU TRÚC TÒA THÁP */
.castle-tower {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.castle-roof {
  position: relative;
  margin-bottom: -4px;
}

.flag {
  position: absolute;
  top: -24px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.4rem;
  animation: flagWave 1.2s ease-in-out infinite alternate;
}

@keyframes flagWave {
  from { transform: translateX(-50%) rotate(-5deg); }
  to { transform: translateX(-50%) rotate(5deg); }
}

.roof-cone {
  width: 0;
  height: 0;
  border-left: 55px solid transparent;
  border-right: 55px solid transparent;
  border-bottom: 45px solid #f43f5e;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.15));
}

.tower-shaft {
  width: 130px;
  background: #cbd5e1;
  border: 4px solid #94a3b8;
  border-top: none;
  border-radius: 0 0 12px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  box-shadow: inset 0 0 16px rgba(0,0,0,0.1);
}

.tower-shaft-segment {
  display: flex;
  justify-content: center;
  align-items: center;
}

.tower-window {
  font-size: 1.5rem;
  background: #475569;
  border-radius: 12px 12px 0 0;
  padding: 4px 6px;
  border: 2px solid #64748b;
}

/* NHÂN VẬT & BỆ ĐỨNG */
.hero-floor-platform {
  position: absolute;
  bottom: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 10;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.hero-character-box {
  filter: drop-shadow(0 10px 14px rgba(0, 0, 0, 0.2));
  animation: idleBounce 2s ease-in-out infinite alternate;
}

@keyframes idleBounce {
  from { transform: translateY(0); }
  to { transform: translateY(-8px); }
}

.anim-jump .hero-character-box {
  animation: jumpFly 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes jumpFly {
  0% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-45px) scale(1.15) rotate(5deg); }
  100% { transform: translateY(0) scale(1); }
}

.anim-shake .hero-character-box {
  animation: shakeFall 0.5s ease-in-out;
}

@keyframes shakeFall {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-12px) rotate(-6deg); }
  75% { transform: translateX(12px) rotate(6deg); }
}

.stone-pedestal {
  margin-top: -6px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(180deg, #10b981 0%, #047857 100%);
  border: 3px solid #34d399;
  border-radius: 999px;
  padding: 6px 18px;
  color: #ffffff;
  font-weight: 900;
  font-size: 0.95rem;
  box-shadow: 0 6px 16px rgba(5, 150, 105, 0.4), inset 0 2px 0 rgba(255,255,255,0.4);
}

.pedestal-gem {
  font-size: 1.1rem;
}

/* ================= CỘT PHẢI: BẢNG TƯƠNG TÁC LÀM BÀI ================= */
.tower-interactive-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  justify-content: center;
  min-width: 0;
}

/* THẺ ĐỀ BÀI CUỘN GIẤY */
.question-scroll-card {
  background: #ffffff;
  border: 3px solid #0284c7;
  border-radius: 22px;
  padding: 20px 24px;
  box-shadow: 0 10px 24px rgba(2, 132, 199, 0.12), inset 0 1px 0 #ffffff;
  text-align: center;
}

.scroll-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #e0f2fe;
  color: #0369a1;
  font-weight: 800;
  font-size: 0.8rem;
  padding: 4px 14px;
  border-radius: 999px;
  border: 1.5px solid #bae6fd;
  margin-bottom: 10px;
}

.question-headline {
  font-size: 1.45rem;
  font-weight: 900;
  color: #0f172a;
  line-height: 1.5;
  margin: 0;
}

/* KHU VỰC BẬC THANG */
.stairs-interactive-zone {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.zone-instruction {
  font-size: 0.95rem;
  font-weight: 800;
  color: #0369a1;
  margin: 0 0 2px 4px;
}

/* THẺ NHIỆM VỤ DÀNH CHO CÂU ĐẶC BIỆT */
.mission-task-card {
  background: #ffffff;
  border: 3px solid #0284c7;
  border-radius: 20px;
  padding: 18px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.mission-card-header {
  font-size: 1rem;
  font-weight: 900;
  color: #0284c7;
  margin-bottom: 12px;
}

/* NÚT LEO THÁP 3D */
.action-commit-bar {
  display: flex;
  justify-content: center;
  margin-top: 6px;
}

.btn-climb-action {
  width: 100%;
  max-width: 380px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 28px;
  background: linear-gradient(180deg, #94a3b8 0%, #64748b 100%);
  border: none;
  border-bottom: 5px solid #475569;
  border-radius: 999px;
  color: #ffffff;
  font-size: 1.35rem;
  font-weight: 900;
  cursor: not-allowed;
  opacity: 0.6;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  letter-spacing: 0.5px;
}

.btn-climb-action.btn-ready {
  background: linear-gradient(180deg, #f59e0b 0%, #d97706 100%);
  border-bottom: 5px solid #b45309;
  opacity: 1;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(217, 119, 6, 0.4);
  animation: pulseClimb 1.6s infinite alternate;
}

@keyframes pulseClimb {
  from { transform: scale(1); }
  to { transform: scale(1.03); }
}

.btn-climb-action.btn-ready:hover {
  transform: translateY(-2px) scale(1.04);
  box-shadow: 0 14px 28px rgba(217, 119, 6, 0.5);
}

.btn-climb-action.btn-ready:active {
  transform: translateY(3px) scale(0.98);
  border-bottom-width: 2px;
}

.btn-icon {
  font-size: 1.7rem;
}

/* ================= BANNER PHẢN HỒI ĐÚNG / SAI ================= */
.feedback-banner {
  position: absolute;
  top: 90px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 28px;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.2);
  z-index: 50;
  border: 4px solid;
}

.fb--correct {
  border-color: #10b981;
  color: #065f46;
}

.fb--wrong {
  border-color: #ef4444;
  color: #991b1b;
}

.fb-icon {
  font-size: 2.2rem;
}

.fb-content {
  display: flex;
  flex-direction: column;
}

.fb-title {
  font-size: 1.15rem;
  font-weight: 900;
}

.fb-desc {
  font-size: 0.95rem;
  font-weight: 700;
}

.bounce-feedback-enter-active {
  animation: bounceIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.bounce-feedback-leave-active {
  animation: bounceOut 0.2s ease-in;
}

@keyframes bounceIn {
  from { transform: translate(-50%, -30px) scale(0.7); opacity: 0; }
  to { transform: translate(-50%, 0) scale(1); opacity: 1; }
}

@keyframes bounceOut {
  to { transform: translate(-50%, -20px) scale(0.8); opacity: 0; }
}

/* ================= SAO BAY BÙNG NỔ ================= */
.stars-explosion {
  position: absolute;
  top: 50%;
  left: 30%;
  pointer-events: none;
  z-index: 60;
}

.sparkle-star {
  position: absolute;
  font-size: 2rem;
  animation: starBurst 1s ease-out forwards;
}

@keyframes starBurst {
  0% { transform: rotate(var(--angle)) translateY(0) scale(0.5); opacity: 1; }
  100% { transform: rotate(var(--angle)) translateY(calc(-1 * var(--dist))) scale(1.3); opacity: 0; }
}

/* ================= MÀN KẾT THÚC ĐỈNH THÁP ================= */
.peak-celebration-modal {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.celebration-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
}

.celebration-card {
  position: relative;
  z-index: 10;
  background: #ffffff;
  border: 5px solid #f59e0b;
  border-radius: 32px;
  padding: 36px 32px;
  text-align: center;
  max-width: 440px;
  width: 90%;
  box-shadow: 0 24px 50px rgba(0, 0, 0, 0.3);
  animation: popTrophy 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes popTrophy {
  from { transform: scale(0.6); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.fireworks-anim {
  font-size: 2.5rem;
  margin-bottom: 8px;
}

.trophy-cup {
  font-size: 5rem;
  filter: drop-shadow(0 10px 14px rgba(245, 158, 11, 0.4));
  margin-bottom: 12px;
}

.congrats-title {
  font-size: 1.6rem;
  font-weight: 900;
  color: #92400e;
  margin-bottom: 10px;
}

.congrats-subtitle {
  font-size: 1.1rem;
  color: #475569;
  line-height: 1.5;
  margin-bottom: 24px;
}

.btn-finish-submit {
  width: 100%;
  padding: 16px 32px;
  background: linear-gradient(180deg, #10b981 0%, #059669 100%);
  border: none;
  border-bottom: 5px solid #047857;
  border-radius: 999px;
  color: #ffffff;
  font-size: 1.3rem;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(5, 150, 105, 0.4);
  transition: transform 0.15s;
}

.btn-finish-submit:hover:not(:disabled) {
  transform: translateY(-2px);
}

.btn-finish-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ================= RESPONSIVE TRÊN MOBILE (375PX & 414PX) ================= */
@media (max-width: 768px) {
  .tower-arena {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 14px;
  }

  .tower-stage-container {
    min-height: 180px;
    max-height: 200px;
  }

  .tower-shaft {
    height: 80px;
    padding: 6px 0;
  }

  .roof-cone {
    border-left-width: 40px;
    border-right-width: 40px;
    border-bottom-width: 32px;
  }

  .hero-floor-platform {
    bottom: 12px;
  }

  .hero-svg {
    width: 65px;
    height: 75px;
  }

  .stone-pedestal {
    padding: 4px 12px;
    font-size: 0.85rem;
  }

  .question-headline {
    font-size: 1.2rem;
  }

  .btn-climb-action {
    font-size: 1.15rem;
    padding: 14px 20px;
  }

  .hud-progress-track {
    display: none;
  }
}

/* ================= REDUCED MOTION ================= */
.reduce-motion * {
  animation: none !important;
  transition: none !important;
}
</style>
