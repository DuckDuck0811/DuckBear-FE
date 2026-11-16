<template>
  <div class="waterfall-game" :class="{ 'reduce-motion': prefersReducedMotion }">
    <!-- TOP BAR TRÊN CÙNG: TIẾN ĐỘ THÁP, THANH CỜ, SAO VÀNG -->
    <header class="wf-header">
      <!-- Cột trái: Huy hiệu tầng hiện tại -->
      <div class="wf-floor-badge">
        <span class="wf-castle-icon">🏰</span>
        <div class="wf-badge-col">
          <span class="wf-caption">TIẾN ĐỘ THÁP</span>
          <strong class="wf-floor-text">Tầng {{ displayFloor }} / {{ totalFloors }}</strong>
        </div>
      </div>

      <!-- Giữa: Thanh chạy dài có cờ cắm -->
      <div class="wf-progress-bar-wrap">
        <div class="wf-flag-node" :style="{ left: `${Math.min(100, (displayFloor / totalFloors) * 100)}%` }">
          🚩
        </div>
        <div class="wf-progress-track">
          <div
            class="wf-progress-fill"
            :style="{ width: `${(displayFloor / totalFloors) * 100}%` }"
          ></div>
        </div>
      </div>

      <!-- Phải: Sao vàng to 3D -->
      <div class="wf-star-badge">
        <span class="wf-star-icon">⭐</span>
        <strong class="wf-star-count">{{ stars }}</strong>
      </div>

      <button
        type="button"
        class="wf-submit-early"
        :disabled="session.submitting.value || isChecking"
        @click="session.submit()"
      >
        {{ session.submitting.value ? 'ĐANG NỘP...' : 'Nộp bài' }}
      </button>
    </header>

    <!-- SÂN KHẤU CHÍNH: BÊN TRÁI THÁC NƯỚC & THÁP ĐÁ, BÊN PHẢI BẢNG CÂU HỎI & NÚT -->
    <main class="wf-main-arena">
      <!-- CỘT TRÁI: THÁC NƯỚC VÀ THÁP ĐÁ CÓ Ổ KHÓA CÙNG KHỦNG LONG XANH -->
      <section class="wf-waterfall-stage" aria-label="Thác nước và tháp đá">
        <!-- Thác nước bọt trắng xóa bồng bềnh 2 bên -->
        <div class="waterfall-stream-left"></div>
        <div class="waterfall-stream-right"></div>
        <div class="waterfall-mist-base"></div>

        <!-- CỘT THÁP ĐÁ HÌNH VÒM TỪNG TẦNG CÓ Ổ KHÓA -->
        <div class="stone-waterfall-tower">
          <!-- Đỉnh tháp cắm cờ đỏ -->
          <div class="tower-roof-flag">
            <span class="red-flag">🚩</span>
          </div>

          <!-- Các tầng tháp cửa vòm đá có ổ khóa (5 tầng hiển thị trực quan) -->
          <div class="tower-arches-stack">
            <div
              v-for="tier in 5"
              :key="tier"
              class="tower-arch-window"
              :class="{
                'arch--cleared': tier > (5 - currentTierIndex),
                'arch--current': tier === (5 - currentTierIndex),
              }"
            >
              <div class="arch-stone-border">
                <span class="lock-icon" v-if="tier < (5 - currentTierIndex)">🔒</span>
                <span class="lock-icon unlock-icon" v-else-if="tier === (5 - currentTierIndex)">🔓</span>
                <span class="lock-icon cleared-icon" v-else>✨</span>
              </div>
            </div>
          </div>
        </div>

        <!-- BỜ ĐÁ & BÉ KHỦNG LONG XANH QUÀNG KHĂN ĐỎ ĐEO BALO -->
        <div
          class="dino-platform-area"
          :class="{
            'dino--climb-anim': heroAnim === 'jump',
            'dino--shake-anim': heroAnim === 'shake',
          }"
        >
          <!-- Bong bóng thoại Tầng X chỉ vào khủng long -->
          <div class="dino-speech-bubble">
            <span class="dino-bubble-text">Tầng<br/><strong>{{ displayFloor }}</strong></span>
            <div class="bubble-arrow"></div>
          </div>

          <!-- Nhân vật Khủng long xanh nhí quàng khăn đỏ đeo balo (Chuẩn theo ảnh mẫu) -->
          <div class="dino-character-sprite">
            <svg viewBox="0 0 110 110" width="105" height="105" class="dino-svg">
              <!-- Balo thám hiểm xanh lá mạ trên lưng -->
              <rect x="20" y="52" width="22" height="26" rx="6" fill="#84cc16" stroke="#4d7c0f" stroke-width="2.5" />
              <rect x="23" y="60" width="16" height="5" rx="2" fill="#a3e635" />
              <line x1="26" y1="52" x2="26" y2="76" stroke="#4d7c0f" stroke-width="2" />

              <!-- Đuôi khủng long vểnh lên phía sau -->
              <path d="M28 85 Q12 90 8 72 Q18 78 30 78 Z" fill="#22c55e" stroke="#15803d" stroke-width="3" />
              <circle cx="12" cy="74" r="3" fill="#15803d" />

              <!-- Thân khủng long tròn mũm mĩm -->
              <ellipse cx="55" cy="70" rx="28" ry="26" fill="#22c55e" stroke="#15803d" stroke-width="3" />
              <!-- Bụng màu xanh bơ sáng -->
              <ellipse cx="62" cy="74" rx="16" ry="17" fill="#bbf7d0" />

              <!-- Chân trước / Tay vịn -->
              <ellipse cx="78" cy="68" rx="8" ry="6" fill="#16a34a" />

              <!-- Chân sau bám chắc bờ đá -->
              <ellipse cx="44" cy="94" rx="12" ry="7" fill="#15803d" />
              <ellipse cx="68" cy="94" rx="12" ry="7" fill="#15803d" />

              <!-- Đầu khủng long tròn cute quay sang phải nhìn về tháp -->
              <circle cx="68" cy="38" r="24" fill="#22c55e" stroke="#15803d" stroke-width="3" />
              <!-- Mõm nhô phía trước -->
              <ellipse cx="84" cy="44" rx="14" ry="11" fill="#22c55e" stroke="#15803d" stroke-width="2.5" />
              <circle cx="86" cy="40" r="1.8" fill="#15803d" /> <!-- Lỗ mũi -->

              <!-- Mắt to ngây thơ long lanh -->
              <ellipse cx="72" cy="34" rx="6" ry="8" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
              <circle cx="73" cy="34" r="4" fill="#0f172a" />
              <circle cx="75" cy="32" r="1.5" fill="#ffffff" />

              <!-- Khăn quàng đỏ buộc cổ có vạt bay phấp phới -->
              <path d="M50 48 Q68 56 84 50 L84 58 Q68 64 50 54 Z" fill="#ef4444" stroke="#b91c1c" stroke-width="2" />
              <!-- Hai vạt khăn đỏ bay dài phía sau lưng -->
              <path d="M48 50 Q30 46 16 54 Q28 62 48 56 Z" fill="#ef4444" stroke="#b91c1c" stroke-width="2" />
              <path d="M46 54 Q32 56 22 66 Q34 68 46 58 Z" fill="#dc2626" stroke="#b91c1c" stroke-width="2" />
            </svg>
          </div>

          <!-- Bờ đá tự nhiên nhô cao có hàng rào cọc gỗ thắt dây thừng -->
          <div class="stone-cliff-ledge">
            <div class="cliff-rocks"></div>
            <div class="wooden-rope-fence">
              <div class="fence-post"></div>
              <div class="fence-rope"></div>
              <div class="fence-post"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- CỘT PHẢI: BẢNG CÂU HỎI THỬ THÁCH, CÁC ĐÁP ÁN NẰM TRÊN BẬC BO TRÒN VÀ NÚT LEO THÁC -->
      <section class="wf-interactive-panel" v-if="currentQuestionItem && !reachedPeak">
        <!-- BẢNG CÂU HỎI THỬ THÁCH NHƯ HÌNH MẪU -->
        <div class="wf-question-board">
          <div class="wf-board-badge">
            <span class="book-icon">📖</span>
            <span>CÂU HỎI THỬ THÁCH {{ displayFloor }} / {{ totalFloors }}</span>
          </div>
          <h2 class="wf-question-content">
            {{ currentQuestionItem.question.content }}
          </h2>
        </div>

        <!-- CÁC LỰA CHỌN ĐÁP ÁN NẰM NGANG CÓ BADGE TRÒN A, B, C, D (MCQ / TRUE_FALSE) -->
        <div v-if="isMcqType" class="wf-answers-list">
          <button
            v-for="(option, idx) in options"
            :key="option.id"
            type="button"
            class="wf-answer-btn"
            :class="{
              'ans--selected': localSelected === option.id,
              'ans--correct': checkFeedback === 'correct' && localSelected === option.id,
              'ans--wrong': checkFeedback === 'wrong' && localSelected === option.id,
              'ans--disabled': isChecking || isChecked,
            }"
            :disabled="isChecking || isChecked"
            @click="onPick(option.id)"
          >
            <!-- Badge chữ cái tròn màu sắc tươi vui A: Vàng, B: Xanh dương, C: Xanh lá, D: Tím -->
            <div class="wf-pill-badge" :class="`pill-color-${idx % 4}`">
              <span class="wf-letter">{{ letters[idx] }}</span>
            </div>

            <!-- Nội dung chữ đáp án to, in đậm, rõ nét -->
            <span class="wf-option-text">{{ option.content }}</span>

            <!-- Biểu tượng phản hồi sau khi check -->
            <span class="wf-feedback-icon" v-if="localSelected === option.id && checkFeedback">
              <span v-if="checkFeedback === 'correct'">⭐</span>
              <span v-else-if="checkFeedback === 'wrong'">💨</span>
            </span>
          </button>

          <!-- NÚT "LEO THÁC!" TO RÕ PHÍA DƯỚI -->
          <div class="wf-commit-action-wrap">
            <button
              type="button"
              class="btn-climb-waterfall"
              :class="{ 'btn-wf--ready': localSelected !== null && !isChecking && !isChecked }"
              :disabled="localSelected === null || isChecking || isChecked"
              @click="onConfirmClimb"
            >
              <span class="wf-btn-flag">🏁</span>
              <span class="wf-btn-text">
                {{ isChecking ? 'ĐANG LEO...' : 'Leo Thác!' }}
              </span>
            </button>
          </div>
        </div>

        <!-- DÀNH CHO CÂU ĐIỀN KHUYẾT / TỰ LUẬN / MATCHING -->
        <div v-else class="wf-mission-card">
          <QuestionItem
            :item="currentQuestionItem"
            :index="session.currentIndex.value"
            :answer="session.answers[currentQuestionItem.question.id] || {}"
            :level="1"
            mode="tower"
            :disabled="isChecking || isChecked"
            @answered="onQuestionAnswered"
          />
          <div class="wf-commit-action-wrap mt-4">
            <button
              type="button"
              class="btn-climb-waterfall btn-wf--ready"
              :disabled="!session.hasAnswer(currentQuestionItem.question.id) || isChecking || isChecked"
              @click="onConfirmClimb"
            >
              <span class="wf-btn-flag">🏁</span>
              <span class="wf-btn-text">Leo Thác Tiếp Tục!</span>
            </button>
          </div>
        </div>
      </section>
    </main>

    <!-- MÀN CHINH PHỤC ĐỈNH THÁP KHI LÀM XONG -->
    <Transition name="fade">
      <div v-if="reachedPeak" class="wf-peak-modal">
        <div class="wf-peak-card">
          <div class="peak-icons">🏆 🚩 ✨</div>
          <h2 class="peak-heading">CHINH PHỤC ĐỈNH THÁC THÀNH CÔNG!</h2>
          <p class="peak-desc">
            Bé Khủng Long đã xuất sắc vượt qua toàn bộ <strong>{{ totalFloors }}</strong> tầng thác và rinh về <strong>{{ stars }}</strong> ngôi sao sáng!
          </p>
          <button
            type="button"
            class="btn-climb-waterfall btn-wf--ready wf-submit-btn"
            :disabled="session.submitting.value"
            @click="session.submit()"
          >
            {{ session.submitting.value ? 'ĐANG NỘP BÀI...' : '🎉 NỘP BÀI NGAY' }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue';
import QuestionItem from '../../QuestionItem.vue';

const props = defineProps({
  session: { type: Object, required: true },
});

const letters = ['A', 'B', 'C', 'D', 'E'];

const stars = ref(0);
const currentFloor = ref(0);
const heroAnim = ref('idle');
const isChecking = ref(false);
const checkFeedback = ref(null);
const reachedPeak = ref(false);
const localSelected = ref(null);

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const totalFloors = computed(() => props.session.totalQuestions?.value || 1);
const currentQuestionItem = computed(() => props.session.currentQuestionItem?.value);
const displayFloor = computed(() => (props.session.currentIndex?.value || 0) + 1);

const isMcqType = computed(() => {
  const t = currentQuestionItem.value?.question?.type;
  return t === 'MCQ' || t === 'MULTI_MCQ' || t === 'TRUE_FALSE';
});

const options = computed(() => currentQuestionItem.value?.question?.options || []);

const isChecked = computed(() => {
  const qId = currentQuestionItem.value?.question?.id;
  return qId != null && props.session.checkedQuestions?.[String(qId)] != null;
});

// Chỉ số tầng hoạt hình trên tháp đá (1 đến 5)
const currentTierIndex = computed(() => {
  return ((displayFloor.value - 1) % 5) + 1;
});

function onPick(optionId) {
  if (isChecking.value || isChecked.value) return;
  localSelected.value = optionId;
}

function onQuestionAnswered(questionId) {
  const answer = props.session.answers[questionId];
  if (answer) props.session.setAnswer(questionId, { ...answer });
}

// Hỗ trợ phím tắt A-D / 1-4 / Enter
function onKeydown(e) {
  if (reachedPeak.value || isChecking.value || isChecked.value) return;
  if (!currentQuestionItem.value) return;
  const opts = options.value;
  const map = { '1': 0, '2': 1, '3': 2, '4': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3, 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
  const idx = map[e.key];
  if (idx !== undefined && opts[idx]) {
    localSelected.value = opts[idx].id;
  }
  if (e.key === 'Enter' && localSelected.value !== null) {
    onConfirmClimb();
  }
}

async function onConfirmClimb() {
  const q = currentQuestionItem.value?.question;
  if (!q || isChecking.value || isChecked.value) return;
  if (isMcqType.value && localSelected.value === null) return;

  isChecking.value = true;
  checkFeedback.value = null;

  if (isMcqType.value && localSelected.value !== null) {
    props.session.setAnswer(q.id, { selectedOptionId: localSelected.value });
  }

  try {
    const res = await props.session.checkQuestion(q.id);
    const correct = res?.isCorrect === true;

    if (correct) {
      checkFeedback.value = 'correct';
      stars.value += 3;
      heroAnim.value = 'jump';
    } else {
      checkFeedback.value = 'wrong';
      heroAnim.value = 'shake';
    }

    // Đợi nhảy xong rồi chuyển sang tầng kế tiếp
    setTimeout(() => {
      checkFeedback.value = null;
      heroAnim.value = 'idle';
      if (!props.session.isLastQuestion?.value) {
        props.session.next();
      } else {
        reachedPeak.value = true;
      }
    }, prefersReducedMotion ? 400 : 1300);

  } catch {
    heroAnim.value = 'idle';
    setTimeout(() => {
      if (!props.session.isLastQuestion?.value) props.session.next();
      else reachedPeak.value = true;
    }, 400);
  } finally {
    isChecking.value = false;
  }
}

watch(() => props.session.currentIndex?.value, () => {
  localSelected.value = null;
  checkFeedback.value = null;
  heroAnim.value = 'idle';
});

onMounted(() => {
  document.addEventListener('keydown', onKeydown);
  const checked = props.session.checkedQuestions || {};
  const checkedCount = Object.keys(checked).length;
  const firstUnansweredIndex = props.session.questions.value.findIndex(
    ({ question }) => !checked[String(question.id)],
  );
  if (firstUnansweredIndex >= 0) {
    props.session.goTo(firstUnansweredIndex);
  }
  if (checkedCount > 0) {
    currentFloor.value = checkedCount;
    stars.value = Object.values(checked).filter(c => c.isCorrect === true).length * 3;
    if (firstUnansweredIndex < 0) {
      reachedPeak.value = true;
    }
  }
  return () => document.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
/* ================= KHUNG GAME LEO THÁC CHUẨN ================= */
.waterfall-game {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 600px;
  background: linear-gradient(180deg, #93c5fd 0%, #60a5fa 30%, #38bdf8 70%, #0284c7 100%);
  border: 4px solid #0284c7;
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 16px 40px rgba(2, 132, 199, 0.25);
  position: relative;
  font-family: inherit;
  user-select: none;
}

/* ================= HEADER TOP BAR ================= */
.wf-header {
  display: grid;
  grid-template-columns: 190px 1fr 120px auto;
  align-items: center;
  gap: 20px;
  padding: 14px 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 3px solid #7dd3fc;
  z-index: 10;
}

.wf-floor-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ffffff;
  border: 2px solid #bae6fd;
  padding: 6px 14px;
  border-radius: 999px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.06);
}

.wf-castle-icon {
  font-size: 2rem;
}

.wf-badge-col {
  display: flex;
  flex-direction: column;
}

.wf-caption {
  font-size: 0.7rem;
  font-weight: 800;
  color: #0369a1;
  letter-spacing: 0.5px;
}

.wf-floor-text {
  font-size: 1.15rem;
  font-weight: 900;
  color: #0f172a;
}

/* THANH TIẾN ĐỘ CHẠY CỜ */
.wf-progress-bar-wrap {
  position: relative;
  width: 100%;
  height: 22px;
  display: flex;
  align-items: center;
}

.wf-flag-node {
  position: absolute;
  top: -14px;
  transform: translateX(-50%);
  font-size: 1.4rem;
  z-index: 4;
  transition: left 0.4s ease;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
}

.wf-progress-track {
  width: 100%;
  height: 16px;
  background: #ffffff;
  border: 3px solid #7dd3fc;
  border-radius: 999px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.06);
}

.wf-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #38bdf8, #0284c7);
  border-radius: 999px;
  transition: width 0.4s ease;
}

/* SAO VÀNG 3D */
.wf-star-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #fef3c7;
  border: 2.5px solid #fcd34d;
  padding: 6px 16px;
  border-radius: 999px;
  box-shadow: 0 4px 10px rgba(245, 158, 11, 0.2);
}

.wf-star-icon {
  font-size: 1.5rem;
}

.wf-star-count {
  font-size: 1.35rem;
  font-weight: 900;
  color: #b45309;
}

.wf-submit-early {
  min-height: 44px;
  padding: 0 18px;
  border: 2px solid #0284c7;
  border-radius: 999px;
  background: #ffffff;
  color: #0369a1;
  font: inherit;
  font-weight: 900;
  cursor: pointer;
}

.wf-submit-early:disabled {
  opacity: 0.6;
  cursor: wait;
}

/* ================= MAIN ARENA 2 CỘT RÕ RÀNG ================= */
.wf-main-arena {
  display: grid;
  grid-template-columns: minmax(260px, 0.4fr) minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  flex: 1;
  min-height: 0;
  gap: 16px;
  padding: 12px 16px;
  position: relative;
  align-items: center;
}

/* ================= CỘT TRÁI: THÁC NƯỚC, THÁP ĐÁ, KHỦNG LONG ================= */
.wf-waterfall-stage {
  position: relative;
  height: 480px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
}

/* Dòng thác nước 2 bên cuồn cuộn */
.waterfall-stream-left,
.waterfall-stream-right {
  position: absolute;
  top: 0;
  bottom: 80px;
  width: 75px;
  background: linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(186,230,253,0.85) 50%, rgba(255,255,255,0.9) 100%);
  filter: blur(1px);
  border-radius: 0 0 20px 20px;
  animation: waterFlow 1.2s linear infinite alternate;
}

.waterfall-stream-left { left: 15px; }
.waterfall-stream-right { right: 15px; }

@keyframes waterFlow {
  from { opacity: 0.8; transform: translateY(0); }
  to { opacity: 0.95; transform: translateY(6px); }
}

.waterfall-mist-base {
  position: absolute;
  bottom: 50px;
  left: 0;
  right: 0;
  height: 60px;
  background: radial-gradient(ellipse at center, rgba(255,255,255,0.9) 0%, transparent 70%);
  pointer-events: none;
}

/* THÁP ĐÁ HÌNH VÒM CỬA SỔ */
.stone-waterfall-tower {
  position: relative;
  width: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 5;
  margin-bottom: 50px;
}

.tower-roof-flag {
  position: absolute;
  top: -24px;
  font-size: 1.5rem;
  animation: flagWave 1s ease-in-out infinite alternate;
}

.tower-arches-stack {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: #64748b;
  border: 4px solid #475569;
  border-radius: 20px 20px 0 0;
  padding: 8px 10px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
}

.tower-arch-window {
  height: 52px;
  background: #334155;
  border: 3px solid #94a3b8;
  border-radius: 16px 16px 4px 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.lock-icon {
  font-size: 1.4rem;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}

.arch--cleared {
  background: #0ea5e9;
  border-color: #7dd3fc;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.6);
}

.arch--current {
  background: #f59e0b;
  border-color: #fde68a;
  box-shadow: 0 0 16px rgba(245, 158, 11, 0.8);
  animation: archPulse 1.2s infinite alternate;
}

@keyframes archPulse {
  from { transform: scale(1); }
  to { transform: scale(1.05); }
}

/* KHỦNG LONG XANH QUÀNG KHĂN ĐỎ & BỜ ĐÁ */
.dino-platform-area {
  position: absolute;
  bottom: 0;
  left: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 10;
}

/* BONG BÓNG THOẠI CHỈ VÀO KHỦNG LONG */
.dino-speech-bubble {
  position: absolute;
  top: -55px;
  left: 0;
  background: #fef08a;
  border: 3px solid #ca8a04;
  border-radius: 50%;
  width: 65px;
  height: 65px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: bubbleWobble 2s ease-in-out infinite alternate;
}

@keyframes bubbleWobble {
  from { transform: translateY(0); }
  to { transform: translateY(-5px); }
}

.dino-bubble-text {
  font-size: 0.8rem;
  color: #854d0e;
  line-height: 1.1;
  font-weight: 800;
}

.dino-bubble-text strong {
  font-size: 1.2rem;
  font-weight: 900;
  color: #713f12;
}

.bubble-arrow {
  position: absolute;
  bottom: -8px;
  right: 18px;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 8px solid #ca8a04;
}

/* ANIMATION NHẢY / RUNG CỦA KHỦNG LONG */
.dino-character-sprite {
  filter: drop-shadow(0 8px 12px rgba(0, 0, 0, 0.25));
  animation: dinoIdle 2s ease-in-out infinite alternate;
}

@keyframes dinoIdle {
  from { transform: translateY(0); }
  to { transform: translateY(-6px); }
}

.dino--climb-anim .dino-character-sprite {
  animation: dinoJumpSuccess 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes dinoJumpSuccess {
  0% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-40px) scale(1.15) rotate(6deg); }
  100% { transform: translateY(0) scale(1); }
}

.dino--shake-anim .dino-character-sprite {
  animation: dinoShakeWrong 0.5s ease-in-out;
}

@keyframes dinoShakeWrong {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px) rotate(-5deg); }
  75% { transform: translateX(10px) rotate(5deg); }
}

/* BỜ ĐÁ TỰ NHIÊN */
.stone-cliff-ledge {
  position: relative;
  width: 140px;
  height: 28px;
  background: #78716c;
  border: 3px solid #57534e;
  border-radius: 16px 16px 0 0;
  margin-top: -8px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
}

/* ================= CỘT PHẢI: BẢNG CÂU HỎI & CÁC LỰA CHỌN ĐÁP ÁN ================= */
.wf-interactive-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  min-width: 0;
  min-height: 0;
  max-height: 100%;
  overflow-y: auto;
  padding: 4px 4px 10px;
  scrollbar-gutter: stable;
}

/* BẢNG CÂU HỎI THỬ THÁCH (Trắng viền xanh như hình mẫu) */
.wf-question-board {
  background: #fffbeb;
  border: 4px solid #0284c7;
  border-radius: 24px;
  padding: 12px 18px;
  box-shadow: 0 10px 25px rgba(2, 132, 199, 0.15), inset 0 2px 0 #ffffff;
  position: relative;
  text-align: center;
}

.wf-board-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #e0f2fe;
  border: 2px solid #38bdf8;
  padding: 3px 14px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 900;
  color: #0369a1;
  margin-bottom: 6px;
}

.book-icon {
  font-size: 1.1rem;
}

.wf-question-content {
  font-size: 1.3rem;
  font-weight: 900;
  color: #0f172a;
  line-height: 1.45;
  margin: 0;
}

/* DANH SÁCH BẬC THANG ĐÁP ÁN NGANG */
.wf-answers-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wf-answer-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #ffffff;
  border: 3.5px solid #cbd5e1;
  border-radius: 999px;
  padding: 6px 18px 6px 10px;
  cursor: pointer;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.08);
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-align: left;
  position: relative;
}

.wf-answer-btn:hover:not(:disabled) {
  transform: translateX(8px) scale(1.01);
  border-color: #38bdf8;
  background: #f0f9ff;
  box-shadow: 0 10px 20px rgba(56, 189, 248, 0.2);
}

.wf-answer-btn:active:not(:disabled) {
  transform: scale(0.98);
}

/* BADGE TRÒN A, B, C, D 4 MÀU RỰC RỠ CHUẨN MẪU */
.wf-pill-badge {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  border: 3px solid #ffffff;
}

.pill-color-0 { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); } /* A: Vàng cam */
.pill-color-1 { background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%); } /* B: Xanh dương */
.pill-color-2 { background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%); } /* C: Xanh lá */
.pill-color-3 { background: linear-gradient(135deg, #c084fc 0%, #a855f7 100%); } /* D: Tím */

.wf-letter {
  font-size: 1.55rem;
  font-weight: 900;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.wf-option-text {
  flex: 1;
  font-size: 1.15rem;
  font-weight: 800;
  color: #1e293b;
  line-height: 1.4;
}

.wf-feedback-icon {
  font-size: 1.8rem;
}

/* TRẠNG THÁI CHỌN */
.ans--selected {
  border-color: #0284c7 !important;
  background: #e0f2fe !important;
  box-shadow: 0 8px 24px rgba(2, 132, 199, 0.3) !important;
  transform: translateX(8px) !important;
}

.ans--correct {
  border-color: #10b981 !important;
  background: #dcfce7 !important;
  box-shadow: 0 0 24px rgba(16, 185, 129, 0.5) !important;
}

.ans--wrong {
  border-color: #ef4444 !important;
  background: #fee2e2 !important;
  animation: wrongShake 0.4s ease;
}

@keyframes wrongShake {
  0%, 100% { transform: translateX(8px); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(16px); }
}

.ans--disabled {
  opacity: 0.8;
  cursor: default;
}

/* NÚT LEO THÁC 3D (GIỐNG NÚT LEO THÁC MÀU XÁM XANH NỔI TRÊN ẢNH) */
.wf-commit-action-wrap {
  display: flex;
  justify-content: center;
  margin-top: 2px;
  position: sticky;
  bottom: 0;
  z-index: 2;
  padding: 10px 0 6px;
  background: linear-gradient(180deg, rgba(96, 165, 250, 0), rgba(96, 165, 250, 0.96) 35%);
}

.btn-climb-waterfall {
  width: 100%;
  max-width: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 10px 24px;
  border-radius: 999px;
  background: linear-gradient(180deg, #94a3b8 0%, #64748b 100%);
  border: none;
  border-bottom: 5px solid #475569;
  color: #ffffff;
  font-size: 1.15rem;
  font-weight: 900;
  cursor: not-allowed;
  opacity: 0.6;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
  letter-spacing: 0.5px;
}

.btn-climb-waterfall.btn-wf--ready {
  background: linear-gradient(180deg, #64748b 0%, #475569 100%);
  border-bottom: 5px solid #334155;
  opacity: 1;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(71, 85, 105, 0.4);
  animation: wfBtnPulse 1.5s infinite alternate;
}

@keyframes wfBtnPulse {
  from { transform: scale(1); }
  to { transform: scale(1.04); }
}

.btn-climb-waterfall.btn-wf--ready:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 14px 28px rgba(71, 85, 105, 0.5);
}

.btn-climb-waterfall.btn-wf--ready:active {
  transform: translateY(3px) scale(0.98);
  border-bottom-width: 2px;
}

.wf-btn-flag {
  font-size: 1.6rem;
}

/* DÀNH CHO CÂU ĐIỀN KHUYẾT / TỰ LUẬN */
.wf-mission-card {
  background: #ffffff;
  border: 3px solid #0284c7;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.1);
}

/* MÀN ĐỈNH THÁC */
.wf-peak-modal {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.wf-peak-card {
  background: #ffffff;
  border: 5px solid #0284c7;
  border-radius: 32px;
  padding: 36px 30px;
  text-align: center;
  max-width: 440px;
  width: 90%;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}

.peak-icons {
  font-size: 3.5rem;
  margin-bottom: 12px;
}

.peak-heading {
  font-size: 1.6rem;
  font-weight: 900;
  color: #0369a1;
  margin-bottom: 10px;
}

.peak-desc {
  font-size: 1.1rem;
  color: #475569;
  line-height: 1.5;
  margin-bottom: 24px;
}

.wf-submit-btn {
  width: 100%;
}

/* ================= RESPONSIVE TRÊN MOBILE ================= */
@media (max-width: 768px) {
  .wf-header {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 10px 14px;
  }

  .wf-submit-early {
    justify-self: stretch;
  }

  .wf-progress-bar-wrap {
    display: none;
  }

  .wf-main-arena {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 14px;
  }

  .wf-waterfall-stage {
    height: 220px;
  }

  .stone-waterfall-tower {
    margin-bottom: 20px;
    width: 110px;
  }

  .dino-platform-area {
    left: 10px;
  }

  .dino-svg {
    width: 75px;
    height: 75px;
  }

  .wf-question-content {
    font-size: 1.2rem;
  }

  .wf-answer-btn {
    padding: 8px 16px 8px 10px;
  }

  .wf-pill-badge {
    width: 42px;
    height: 42px;
  }

  .wf-letter {
    font-size: 1.4rem;
  }

  .wf-option-text {
    font-size: 1.1rem;
  }

  .btn-climb-waterfall {
    font-size: 1.15rem;
    padding: 12px 20px;
  }
}

/* REDUCED MOTION */
.reduce-motion * {
  animation: none !important;
  transition: none !important;
}
</style>
