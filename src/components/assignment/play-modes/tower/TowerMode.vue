<template>
  <div class="tower-game" :class="{ 'reduce-motion': game.prefersReducedMotion.value }">

    <!-- ===== HEADER: TIẾN ĐỘ THÁP + THANH CỜ + SAO VÀNG + ÂM THANH ===== -->
    <header class="tower-header">
      <!-- Huy hiệu tầng hiện tại (trái) -->
      <div class="tower-floor-badge">
        <span class="castle-emoji" aria-hidden="true">🏰</span>
        <div class="floor-badge-text">
          <span class="floor-caption">{{ t('playModes.towerUI.headerCaption') }}</span>
          <strong class="floor-label">
            {{ t('playModes.towerUI.floorLabel', { current: game.displayNum.value, total: game.totalQuestions.value }) }}
          </strong>
        </div>
      </div>

      <!-- Thanh tiến độ có cờ chạy ở giữa -->
      <div class="tower-progress-wrap" aria-label="Tiến độ tháp">
        <div
          class="progress-flag"
          :style="{ left: `${Math.min(97, (game.displayNum.value / game.totalQuestions.value) * 100)}%` }"
          aria-hidden="true"
        >🚩</div>
        <div class="progress-track">
          <div
            class="progress-fill"
            :style="{ width: `${(game.displayNum.value / game.totalQuestions.value) * 100}%` }"
          ></div>
        </div>
      </div>

      <!-- Sao vàng + Âm thanh (phải) -->
      <div class="tower-header-right">
        <div class="star-badge">
          <span aria-hidden="true">⭐</span>
          <strong class="star-count">{{ game.stars.value }}</strong>
        </div>
        <SoundToggle
          :model-value="game.isSoundEnabled.value"
          @toggle="game.toggleSound()"
        />
      </div>
    </header>

    <!-- ===== ARENA CHÍNH: 2 CỘT ===== -->
    <main class="tower-arena">

      <!-- ── CỘT TRÁI: THÁC NƯỚC + THÁP ĐÁ + NHÂN VẬT ── -->
      <section class="tower-stage" aria-label="Thác nước và tháp đá">

        <!-- Dòng thác nước 2 bên cuồn cuộn -->
        <div class="waterfall-left" aria-hidden="true"></div>
        <div class="waterfall-right" aria-hidden="true"></div>
        <div class="waterfall-mist" aria-hidden="true"></div>

        <!-- Tháp đá nhiều tầng có ổ khóa (hiển thị max 5 tầng trực quan) -->
        <div class="stone-tower" aria-label="Tháp đá">
          <!-- Đỉnh tháp cắm cờ đỏ -->
          <div class="tower-peak-flag" aria-hidden="true">
            <GameSprite mode="tower" name="flag" width="24" height="30">
              <span class="flag-fallback">🚩</span>
            </GameSprite>
          </div>

          <!-- Stack tầng tháp (max 5 tầng hiển thị — chia theo totalFloors) -->
          <div class="tower-arches">
            <div
              v-for="tier in VISIBLE_TIERS"
              :key="tier"
              class="tower-arch"
              :class="{
                'arch--cleared': isFloorCleared(tier),
                'arch--active':  isFloorActive(tier),
                'arch--locked':  isFloorLocked(tier),
              }"
              :aria-label="isFloorCleared(tier) ? `Tầng đã qua` : isFloorActive(tier) ? `Tầng đang làm` : `Tầng khóa`"
            >
              <div class="arch-inner">
                <GameSprite
                  v-if="isFloorLocked(tier)"
                  mode="tower"
                  name="lock"
                  width="28"
                  height="28"
                >
                  <span class="arch-icon">🔒</span>
                </GameSprite>
                <span v-else-if="isFloorCleared(tier)" class="arch-icon">✨</span>
                <span v-else class="arch-icon">🔓</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Nhân vật Khủng Long xanh + bong bóng thoại Tầng X -->
        <div
          class="dino-area"
          :class="{
            'dino--jump': heroAnim === 'jump',
            'dino--shake': heroAnim === 'shake',
          }"
        >
          <!-- Bong bóng thoại -->
          <div class="speech-bubble" aria-live="polite">
            <span class="bubble-inner">
              Tầng<br/>
              <strong>{{ game.displayNum.value }}</strong>
            </span>
            <div class="bubble-tail" aria-hidden="true"></div>
          </div>

          <!-- GameSprite: ảnh thật nếu có, SVG fallback nếu chưa có -->
          <GameSprite
            mode="tower"
            :name="heroSpriteName"
            :alt="heroAltText"
            class="dino-sprite"
          >
            <!-- SVG fallback: Khủng long xanh quàng khăn đỏ đeo balo -->
            <svg
              viewBox="0 0 110 110"
              class="dino-svg"
              aria-hidden="true"
              preserveAspectRatio="xMidYMid meet"
            >
              <!-- Balo thám hiểm xanh lá mạ -->
              <rect x="20" y="52" width="22" height="26" rx="6" fill="#84cc16" stroke="#4d7c0f" stroke-width="2.5"/>
              <rect x="23" y="60" width="16" height="5" rx="2" fill="#a3e635"/>
              <line x1="26" y1="52" x2="26" y2="76" stroke="#4d7c0f" stroke-width="2"/>

              <!-- Đuôi khủng long -->
              <path d="M28 85 Q12 90 8 72 Q18 78 30 78 Z" fill="#22c55e" stroke="#15803d" stroke-width="3"/>

              <!-- Thân chính tròn mũm mĩm -->
              <ellipse cx="55" cy="70" rx="28" ry="26" fill="#22c55e" stroke="#15803d" stroke-width="3"/>
              <ellipse cx="62" cy="74" rx="16" ry="17" fill="#bbf7d0"/>

              <!-- Tay trước vịn -->
              <ellipse cx="78" cy="68" rx="8" ry="6" fill="#16a34a"/>

              <!-- Chân sau bám đá -->
              <ellipse cx="44" cy="94" rx="12" ry="7" fill="#15803d"/>
              <ellipse cx="68" cy="94" rx="12" ry="7" fill="#15803d"/>

              <!-- Đầu tròn cute -->
              <circle cx="68" cy="38" r="24" fill="#22c55e" stroke="#15803d" stroke-width="3"/>
              <ellipse cx="84" cy="44" rx="14" ry="11" fill="#22c55e" stroke="#15803d" stroke-width="2.5"/>
              <circle cx="86" cy="40" r="1.8" fill="#15803d"/>

              <!-- Mắt to -->
              <ellipse cx="72" cy="34" rx="6" ry="8" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
              <circle cx="73" cy="35" r="4" fill="#0f172a"/>
              <circle cx="75" cy="32" r="1.5" fill="#ffffff"/>

              <!-- Khăn quàng đỏ -->
              <path d="M50 48 Q68 56 84 50 L84 58 Q68 64 50 54 Z" fill="#ef4444" stroke="#b91c1c" stroke-width="2"/>
              <path d="M48 50 Q30 46 16 54 Q28 62 48 56 Z" fill="#ef4444" stroke="#b91c1c" stroke-width="2"/>
              <path d="M46 54 Q32 56 22 66 Q34 68 46 58 Z" fill="#dc2626" stroke="#b91c1c" stroke-width="2"/>

              <!-- Hiệu ứng vui (sao bắn ra khi đúng) -->
              <g v-if="heroAnim === 'jump'" class="success-sparks">
                <text x="88" y="20" font-size="16" fill="#fbbf24">⭐</text>
                <text x="94" y="38" font-size="12" fill="#fde047">✨</text>
              </g>
            </svg>
          </GameSprite>

          <!-- Bờ đá dưới chân khủng long -->
          <div class="cliff-ledge" aria-hidden="true">
            <div class="ledge-rope">
              <div class="rope-post"></div>
              <div class="rope-line"></div>
              <div class="rope-post"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── CỘT PHẢI: CÂU HỎI + ĐÁP ÁN + NÚT LEO ── -->
      <section class="tower-quiz-panel" v-if="currentQuestionItem && !game.isComplete.value">

        <!-- Bảng câu hỏi thử thách -->
        <div class="quiz-board">
          <div class="quiz-board-badge">
            <span aria-hidden="true">📖</span>
            <span>{{ t('playModes.towerUI.questionBadge', { current: game.displayNum.value, total: game.totalQuestions.value }) }}</span>
          </div>
          <h2 class="quiz-question-text">
            {{ currentQuestionItem.question.content }}
          </h2>
        </div>

        <!-- CÁC ĐÁP ÁN MCQ / TRUE_FALSE — Thanh dài có huy hiệu A/B/C/D -->
        <div
          v-if="isMcqType"
          class="answers-list"
          role="listbox"
          :aria-label="`Đáp án câu hỏi ${game.displayNum.value}`"
        >
          <button
            v-for="(option, idx) in options"
            :key="option.id"
            type="button"
            class="answer-btn"
            role="option"
            :aria-selected="isOptionSelected(option.id)"
            :class="{
              'ans--selected': isOptionSelected(option.id),
              'ans--correct':  game.checkFeedback.value === 'correct' && isOptionSelected(option.id),
              'ans--wrong':    game.checkFeedback.value === 'wrong'   && isOptionSelected(option.id),
              'ans--disabled': game.isChecking.value || isChecked,
            }"
            :disabled="game.isChecking.value || isChecked"
            @click="onPick(option.id)"
          >
            <!-- Huy hiệu tròn A/B/C/D 4 màu -->
            <div class="answer-pill" :class="`pill-${idx % 4}`">
              <span class="pill-letter">{{ letters[idx] }}</span>
            </div>

            <span class="answer-text">{{ option.content }}</span>

            <!-- Icon phản hồi đúng/sai -->
            <span
              v-if="isOptionSelected(option.id) && game.checkFeedback.value"
              class="answer-feedback-icon"
              aria-hidden="true"
            >
              <span v-if="game.checkFeedback.value === 'correct'">⭐</span>
              <span v-else>💨</span>
            </span>
          </button>
        </div>

        <!-- MULTI_MCQ: chọn nhiều -->
        <div
          v-else-if="isMultiMcqType"
          class="answers-list"
          role="listbox"
          aria-multiselectable="true"
        >
          <button
            v-for="(option, idx) in options"
            :key="option.id"
            type="button"
            class="answer-btn answer-btn--multi"
            role="option"
            :aria-selected="isOptionSelected(option.id)"
            :class="{
              'ans--selected': isOptionSelected(option.id),
              'ans--correct':  game.checkFeedback.value === 'correct' && isOptionSelected(option.id),
              'ans--wrong':    game.checkFeedback.value === 'wrong'   && isOptionSelected(option.id),
              'ans--disabled': game.isChecking.value || isChecked,
            }"
            :disabled="game.isChecking.value || isChecked"
            @click="onToggleMulti(option.id)"
          >
            <div class="answer-pill" :class="`pill-${idx % 4}`">
              <span v-if="isOptionSelected(option.id)" class="pill-letter">✓</span>
              <span v-else class="pill-letter">{{ letters[idx] }}</span>
            </div>
            <span class="answer-text">{{ option.content }}</span>
          </button>
        </div>

        <!-- Fallback: FILL / ESSAY / MATCHING qua QuestionItem.vue -->
        <div v-else class="fallback-card">
          <QuestionItem
            :item="currentQuestionItem"
            :index="session.currentIndex.value"
            :answer="session.answers[currentQuestionItem.question.id] || {}"
            :level="1"
            mode="tower"
            :disabled="game.isChecking.value || isChecked"
            @answered="onQuestionAnswered"
          />
        </div>

        <!-- Thông báo lỗi mạng + thử lại -->
        <div v-if="game.networkError.value" class="network-error-banner" role="alert">
          <span>⚠️ {{ game.networkError.value }}</span>
          <button type="button" class="retry-btn" @click="onConfirmClimb">
            🔄 {{ t('playModes.shared.retry') }}
          </button>
        </div>

        <!-- Nút LEO THÁC -->
        <div class="climb-action-wrap">
          <button
            type="button"
            class="btn-climb"
            :class="{ 'btn-climb--ready': canCommit }"
            :disabled="!canCommit"
            @click="onConfirmClimb"
            :aria-label="t('playModes.towerUI.actionClimb')"
          >
            <span class="btn-climb-flag" aria-hidden="true">🏁</span>
            <span class="btn-climb-text">
              {{ game.isChecking.value
                 ? t('playModes.towerUI.checking')
                 : isMcqType || isMultiMcqType
                   ? t('playModes.towerUI.actionClimb')
                   : t('playModes.towerUI.actionClimbContinue') }}
            </span>
          </button>
        </div>
      </section>
    </main>

    <!-- ===== MÀN CHINH PHỤC ĐỈNH THÁC (KẾT QUẢ) ===== -->
    <Transition name="tower-finish-fade">
      <div v-if="game.isComplete.value" class="tower-peak-modal" role="dialog" aria-modal="true" aria-label="Kết quả">
        <div class="peak-card">
          <div class="peak-icons" aria-hidden="true">🏆 🚩 ✨</div>
          <h2 class="peak-heading">{{ t('playModes.towerUI.finishHeadline') }}</h2>
          <p class="peak-desc">
            {{ t('playModes.towerUI.finishDesc', {
                total: game.totalQuestions.value,
                stars: game.stars.value,
              }) }}
          </p>

          <div class="peak-stats">
            <div class="peak-stat">
              <span class="stat-num">{{ game.stars.value }} / {{ game.totalQuestions.value }}</span>
              <span class="stat-lbl">Câu đúng ⭐</span>
            </div>
            <div class="peak-stat">
              <span class="stat-num">🔥 ×{{ game.maxCombo.value }}</span>
              <span class="stat-lbl">{{ t('playModes.shared.combo') }} cao nhất</span>
            </div>
          </div>

          <button
            type="button"
            class="btn-submit-peak"
            :disabled="session.submitting.value"
            @click="session.submit()"
          >
            {{ session.submitting.value
               ? t('playModes.towerUI.submitting')
               : t('playModes.towerUI.submitNow') }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import QuestionItem from '../../QuestionItem.vue';
import GameSprite from '../shared/GameSprite.vue';
import SoundToggle from '../shared/SoundToggle.vue';
import { useQuizGame } from '../composables/useQuizGame.js';

const props = defineProps({
  session: { type: Object, required: true },
});

const { t } = useI18n();
const game = useQuizGame(props.session);

// ─── Hằng số ───────────────────────────────────────────────────────────────
const letters = ['A', 'B', 'C', 'D', 'E'];
const VISIBLE_TIERS = [1, 2, 3, 4, 5]; // 5 tầng hiển thị trực quan trên tháp

// ─── Trạng thái local ───────────────────────────────────────────────────────
const heroAnim    = ref('idle'); // 'idle' | 'jump' | 'shake'
const selectedId  = ref(null);  // MCQ single-select
const selectedIds = ref([]);    // MULTI_MCQ multi-select

// ─── Computed từ session ────────────────────────────────────────────────────
const currentQuestionItem = computed(() => props.session.currentQuestionItem?.value);
const options             = computed(() => currentQuestionItem.value?.question?.options || []);

const isMcqType = computed(() => {
  const tp = currentQuestionItem.value?.question?.type;
  return tp === 'MCQ' || tp === 'TRUE_FALSE';
});

const isMultiMcqType = computed(() => {
  return currentQuestionItem.value?.question?.type === 'MULTI_MCQ';
});

const isChecked = computed(() => {
  const qId = currentQuestionItem.value?.question?.id;
  return qId != null && props.session.checkedQuestions?.[String(qId)] != null;
});

// Có thể commit (bấm nút Leo Thác) không?
const canCommit = computed(() => {
  if (game.isChecking.value || isChecked.value) return false;
  if (isMcqType.value)      return selectedId.value !== null;
  if (isMultiMcqType.value) return selectedIds.value.length > 0;
  // Fallback: có answer không?
  const qId = currentQuestionItem.value?.question?.id;
  return qId != null && props.session.hasAnswer?.(qId);
});

// ─── Sprite theo trạng thái ─────────────────────────────────────────────────
const heroSpriteName = computed(() => {
  if (heroAnim.value === 'jump')  return 'heroHappy';
  if (heroAnim.value === 'shake') return 'heroSad';
  return 'hero';
});

const heroAltText = computed(() => {
  if (heroAnim.value === 'jump')  return 'Khủng long vui mừng leo lên';
  if (heroAnim.value === 'shake') return 'Khủng long buồn vì sai câu';
  return 'Khủng long đang chờ trả lời';
});

// ─── Tính tầng để hiển thị trên tháp 5 ô ───────────────────────────────────
// Mỗi tầng trong VISIBLE_TIERS = 1 "slot", chia đều theo totalFloors
// Slot i "cleared" khi progress >= i/5; slot i "active" khi = i/5 (gần nhất)
function floorProgress() {
  const total = game.totalQuestions.value;
  const done  = Math.max(0, game.displayNum.value - 1); // số câu đã qua
  return done / total; // 0..1
}

function isFloorCleared(tier) {
  // tier ∈ [1..5], từ dưới lên trên (tier 1 = tầng thấp nhất)
  // Hiển thị từ trên xuống: tier 1 ở đáy stack → reversed
  const prog = floorProgress();
  return prog >= tier / VISIBLE_TIERS.length;
}

function isFloorActive(tier) {
  const prog = floorProgress();
  const lo = (tier - 1) / VISIBLE_TIERS.length;
  const hi = tier / VISIBLE_TIERS.length;
  return prog >= lo && prog < hi;
}

function isFloorLocked(tier) {
  return !isFloorCleared(tier) && !isFloorActive(tier);
}

// ─── Chọn đáp án ────────────────────────────────────────────────────────────
function onPick(optId) {
  if (game.isChecking.value || isChecked.value) return;
  game.playSfx('click');
  selectedId.value = optId;
}

function onToggleMulti(optId) {
  if (game.isChecking.value || isChecked.value) return;
  game.playSfx('click');
  const idx = selectedIds.value.indexOf(optId);
  if (idx >= 0) {
    selectedIds.value.splice(idx, 1);
  } else {
    selectedIds.value.push(optId);
  }
}

function isOptionSelected(optId) {
  if (isMcqType.value)      return selectedId.value === optId;
  if (isMultiMcqType.value) return selectedIds.value.includes(optId);
  return false;
}

function onQuestionAnswered(questionId) {
  const ans = props.session.answers[questionId];
  if (ans) props.session.setAnswer(questionId, { ...ans });
}

// ─── Commit câu trả lời ─────────────────────────────────────────────────────
async function onConfirmClimb() {
  const q = currentQuestionItem.value?.question;
  if (!q || game.isChecking.value || isChecked.value) return;

  let patch;
  if (isMcqType.value && selectedId.value !== null) {
    patch = { selectedOptionId: selectedId.value, selectedOptionIds: [selectedId.value] };
  } else if (isMultiMcqType.value && selectedIds.value.length > 0) {
    patch = { selectedOptionId: selectedIds.value[0], selectedOptionIds: [...selectedIds.value] };
  }

  await game.submitAndCheck(q.id, patch, {
    delayNext: 1300,
    onResolved: (isCorrect) => {
      heroAnim.value = isCorrect ? 'jump' : 'shake';
      setTimeout(() => { heroAnim.value = 'idle'; }, 1200);
    },
  });
}

// ─── Điều khiển bàn phím ────────────────────────────────────────────────────
function onKeydown(e) {
  if (game.isComplete.value || game.isChecking.value || isChecked.value) return;
  const opts = options.value;
  const map  = { '1': 0, '2': 1, '3': 2, '4': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3,
                 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
  const idx  = map[e.key];

  if (idx !== undefined && opts[idx]) {
    if (isMcqType.value)      onPick(opts[idx].id);
    else if (isMultiMcqType.value) onToggleMulti(opts[idx].id);
  }
  if (e.key === 'Enter' && canCommit.value) {
    e.preventDefault();
    onConfirmClimb();
  }
}

// ─── Watchers ───────────────────────────────────────────────────────────────
watch(() => props.session.currentIndex?.value, () => {
  selectedId.value  = null;
  selectedIds.value = [];
  heroAnim.value    = 'idle';
});

// ─── Lifecycle ──────────────────────────────────────────────────────────────
onMounted(() => {
  document.addEventListener('keydown', onKeydown);
  // Khôi phục trạng thái đã đươc xử lý trong useQuizGame.restoreState()
});

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
/* =====================================================================
   LEO THÁP — TOWER MODE
   Màu chủ đạo: Xanh lam sky (#38bdf8), Xanh lá (#22c55e), Vàng sao (#fbbf24)
   ===================================================================== */

/* ── Khung game tổng thể ── */
.tower-game {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 580px;
  height: min(760px, calc(100vh - 112px));
  max-height: calc(100vh - 112px);
  background: linear-gradient(170deg, #bae6fd 0%, #7dd3fc 30%, #38bdf8 60%, #0ea5e9 100%);
  border: 4px solid #0284c7;
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 16px 40px rgba(2, 132, 199, 0.28);
  position: relative;
  font-family: inherit;
  user-select: none;
}

/* ── HEADER ── */
.tower-header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 20px;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border-bottom: 3px solid #7dd3fc;
  z-index: 10;
  flex-shrink: 0;
}

/* Huy hiệu tầng (trái) */
.tower-floor-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border: 2px solid #bae6fd;
  padding: 6px 16px;
  border-radius: 999px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.07);
  white-space: nowrap;
}

.castle-emoji { font-size: 1.9rem; }

.floor-badge-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.floor-caption {
  font-size: 0.68rem;
  font-weight: 800;
  color: #0369a1;
  letter-spacing: 0.5px;
}

.floor-label {
  font-size: 1.1rem;
  font-weight: 900;
  color: #0f172a;
}

/* Thanh tiến độ có cờ */
.tower-progress-wrap {
  position: relative;
  height: 24px;
  display: flex;
  align-items: center;
  padding: 0 4px;
}

.progress-flag {
  position: absolute;
  top: -16px;
  font-size: 1.3rem;
  transform: translateX(-50%);
  transition: left 0.5s ease;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.2));
  z-index: 2;
  pointer-events: none;
}

.progress-track {
  width: 100%;
  height: 16px;
  background: #e0f2fe;
  border: 2.5px solid #7dd3fc;
  border-radius: 999px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.07);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #38bdf8, #0284c7);
  border-radius: 999px;
  transition: width 0.5s ease;
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.5);
}

/* Phải: sao + âm thanh */
.tower-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.star-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fef3c7;
  border: 2.5px solid #fcd34d;
  padding: 6px 16px;
  border-radius: 999px;
  box-shadow: 0 3px 8px rgba(245, 158, 11, 0.18);
  font-size: 1.5rem;
}

.star-count {
  font-size: 1.3rem;
  font-weight: 900;
  color: #b45309;
}

/* ── ARENA 2 CỘT ── */
.tower-arena {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 20px;
  padding: 18px 24px;
  flex: 1;
  min-height: 0;
  align-items: center;
}

/* ── CỘT TRÁI: THÁC + THÁP + NHÂN VẬT ── */
.tower-stage {
  position: relative;
  height: 100%;
  min-height: 440px;
  max-height: 540px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
}

/* Thác nước 2 bên */
.waterfall-left,
.waterfall-right {
  position: absolute;
  top: 0;
  bottom: 110px;
  width: 64px;
  background: linear-gradient(
    180deg,
    rgba(255,255,255,0.75) 0%,
    rgba(186,230,253,0.85) 50%,
    rgba(255,255,255,0.9) 100%
  );
  filter: blur(1.5px);
  border-radius: 0 0 20px 20px;
  animation: waterFlow 1.3s linear infinite alternate;
}

.waterfall-left  { left: 10px; }
.waterfall-right { right: 10px; }

@keyframes waterFlow {
  from { opacity: 0.78; transform: translateY(0px); }
  to   { opacity: 0.95; transform: translateY(7px); }
}

.waterfall-mist {
  position: absolute;
  bottom: 85px;
  left: 0;
  right: 0;
  height: 65px;
  background: radial-gradient(ellipse at center, rgba(255,255,255,0.88) 0%, transparent 70%);
  pointer-events: none;
}

/* Tháp đá */
.stone-tower {
  position: relative;
  width: 130px;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 5;
  margin-bottom: 44px;
}

.tower-peak-flag {
  position: absolute;
  top: -30px;
  font-size: 1.5rem;
  animation: flagWave 1s ease-in-out infinite alternate;
}

.flag-fallback { font-size: 1.5rem; }

@keyframes flagWave {
  from { transform: rotate(-8deg); }
  to   { transform: rotate(8deg); }
}

.tower-arches {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 5px;
  background: #64748b;
  border: 4px solid #475569;
  border-radius: 18px 18px 0 0;
  padding: 8px 10px 10px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.tower-arch {
  height: 48px;
  border-radius: 14px 14px 4px 4px;
  border: 3px solid #94a3b8;
  background: #334155;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.35s ease, box-shadow 0.35s ease;
}

.arch-inner { display: flex; align-items: center; justify-content: center; }
.arch-icon  { font-size: 1.3rem; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3)); }

.arch--locked  { background: #334155; border-color: #94a3b8; }
.arch--active  {
  background: #f59e0b;
  border-color: #fde68a;
  box-shadow: 0 0 16px rgba(245, 158, 11, 0.8);
  animation: archPulse 1.1s ease-in-out infinite alternate;
}
.arch--cleared {
  background: #0ea5e9;
  border-color: #7dd3fc;
  box-shadow: 0 0 10px rgba(14, 165, 233, 0.5);
}

@keyframes archPulse {
  from { transform: scale(1); }
  to   { transform: scale(1.05); }
}

/* Nhân vật khủng long */
.dino-area {
  position: absolute;
  bottom: 0;
  left: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 10;
}

/* Kích thước ảnh nhân vật — controlled bởi CSS vars để ảnh thật cũng vừa */
.dino-sprite {
  width: var(--dino-w, 100px);
  height: var(--dino-h, 100px);
  max-width: 115px;
  max-height: 115px;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 8px 12px rgba(0, 0, 0, 0.25));
  animation: dinoIdle 2s ease-in-out infinite alternate;
}

.dino-svg {
  width: 100%;
  height: 100%;
}

/* GameSprite image sizing — quan trọng: giới hạn kích thước ảnh thật */
.dino-sprite :deep(img) {
  max-width: 115px;
  max-height: 115px;
  width: auto;
  height: auto;
  object-fit: contain;
}

@keyframes dinoIdle {
  from { transform: translateY(0); }
  to   { transform: translateY(-6px); }
}

.dino--jump .dino-sprite {
  animation: dinoJump 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes dinoJump {
  0%   { transform: translateY(0) scale(1); }
  45%  { transform: translateY(-44px) scale(1.14) rotate(5deg); }
  100% { transform: translateY(0) scale(1); }
}

.dino--shake .dino-sprite {
  animation: dinoShake 0.5s ease-in-out forwards;
}

@keyframes dinoShake {
  0%, 100% { transform: translateX(0); }
  25%       { transform: translateX(-10px) rotate(-5deg); }
  75%       { transform: translateX(10px) rotate(5deg); }
}

/* Bong bóng thoại */
.speech-bubble {
  position: absolute;
  top: -72px;
  left: 0;
  background: #fef08a;
  border: 3px solid #ca8a04;
  border-radius: 50%;
  width: 62px;
  height: 62px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.14);
  animation: bubbleWobble 2.2s ease-in-out infinite alternate;
  z-index: 2;
}

@keyframes bubbleWobble {
  from { transform: translateY(0) rotate(-2deg); }
  to   { transform: translateY(-6px) rotate(2deg); }
}

.bubble-inner {
  font-size: 0.75rem;
  color: #854d0e;
  line-height: 1.1;
  font-weight: 800;
}

.bubble-inner strong {
  font-size: 1.15rem;
  font-weight: 900;
  color: #713f12;
}

.bubble-tail {
  position: absolute;
  bottom: -9px;
  right: 14px;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 9px solid #ca8a04;
}

/* Bờ đá dưới chân nhân vật */
.cliff-ledge {
  width: 130px;
  height: 22px;
  background: #78716c;
  border: 3px solid #57534e;
  border-radius: 14px 14px 0 0;
  margin-top: -6px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.ledge-rope {
  display: flex;
  align-items: center;
  padding: 0 10px;
  height: 100%;
}

.rope-post {
  width: 5px;
  height: 16px;
  background: #a16207;
  border-radius: 2px;
}

.rope-line {
  flex: 1;
  height: 3px;
  background: #a16207;
  border-radius: 2px;
}

/* ── CỘT PHẢI: BẢNG CÂU HỎI + ĐÁP ÁN + NÚT ── */
.tower-quiz-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  overflow-y: auto;
  max-height: 100%;
  padding-right: 2px;
}

/* Bảng câu hỏi */
.quiz-board {
  background: #fffbeb;
  border: 4px solid #0284c7;
  border-radius: 24px;
  padding: 16px 22px;
  box-shadow: 0 10px 25px rgba(2, 132, 199, 0.14), inset 0 2px 0 #ffffff;
  text-align: center;
  flex-shrink: 0;
}

.quiz-board-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #e0f2fe;
  border: 2px solid #38bdf8;
  padding: 3px 16px;
  border-radius: 999px;
  font-size: 0.84rem;
  font-weight: 900;
  color: #0369a1;
  margin-bottom: 10px;
}

.quiz-question-text {
  font-size: 1.4rem;
  font-weight: 900;
  color: #0f172a;
  line-height: 1.45;
  margin: 0;
}

/* Danh sách đáp án */
.answers-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
}

.answer-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #ffffff;
  border: 3.5px solid #cbd5e1;
  border-radius: 999px;
  padding: 10px 22px 10px 10px;
  cursor: pointer;
  box-shadow: 0 5px 14px rgba(0, 0, 0, 0.08);
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-align: left;
  position: relative;
}

.answer-btn:hover:not(:disabled) {
  transform: translateX(8px) scale(1.01);
  border-color: #38bdf8;
  background: #f0f9ff;
  box-shadow: 0 10px 20px rgba(56, 189, 248, 0.2);
}

.answer-btn:active:not(:disabled) {
  transform: scale(0.98) translateX(4px);
}

.answer-btn--multi { border-radius: 18px; }

/* Badge tròn A/B/C/D */
.answer-pill {
  width: 50px;
  height: 50px;
  min-width: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.14);
  border: 3px solid #ffffff;
}

.pill-0 { background: linear-gradient(135deg, #fbbf24, #f59e0b); }
.pill-1 { background: linear-gradient(135deg, #60a5fa, #3b82f6); }
.pill-2 { background: linear-gradient(135deg, #4ade80, #22c55e); }
.pill-3 { background: linear-gradient(135deg, #c084fc, #a855f7); }

.pill-letter {
  font-size: 1.75rem;
  font-weight: 900;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.answer-text {
  flex: 1;
  font-size: 1.3rem;
  font-weight: 800;
  color: #1e293b;
  line-height: 1.4;
}

.answer-feedback-icon {
  font-size: 1.75rem;
}

/* Trạng thái chọn / đúng / sai */
.ans--selected {
  border-color: #0284c7 !important;
  background: #e0f2fe !important;
  box-shadow: 0 8px 22px rgba(2, 132, 199, 0.28) !important;
  transform: translateX(8px) !important;
}

.ans--correct {
  border-color: #10b981 !important;
  background: #dcfce7 !important;
  box-shadow: 0 0 24px rgba(16, 185, 129, 0.45) !important;
}

.ans--wrong {
  border-color: #ef4444 !important;
  background: #fee2e2 !important;
  animation: wrongShake 0.4s ease;
}

@keyframes wrongShake {
  0%, 100% { transform: translateX(8px); }
  25%       { transform: translateX(-4px); }
  75%       { transform: translateX(16px); }
}

.ans--disabled { opacity: 0.75; cursor: default; }

/* Fallback card */
.fallback-card {
  background: #ffffff;
  border: 3px solid #0284c7;
  border-radius: 20px;
  padding: 18px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.09);
}

/* Banner lỗi mạng */
.network-error-banner {
  background: #fef2f2;
  border: 2px solid #ef4444;
  border-radius: 14px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #991b1b;
  font-weight: 700;
  font-size: 0.95rem;
  flex-shrink: 0;
}

.retry-btn {
  background: #ef4444;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  padding: 6px 14px;
  font-weight: 900;
  cursor: pointer;
  white-space: nowrap;
}

/* Nút Leo Thác */
.climb-action-wrap {
  display: flex;
  justify-content: center;
  flex-shrink: 0;
  padding-bottom: 4px;
}

.btn-climb {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  max-width: 320px;
  padding: 14px 32px;
  border-radius: 999px;
  border: none;
  border-bottom: 5px solid #475569;
  background: linear-gradient(180deg, #94a3b8, #64748b);
  color: #cbd5e1;
  font-size: 1.3rem;
  font-weight: 900;
  cursor: not-allowed;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  letter-spacing: 0.5px;
  opacity: 0.65;
}

.btn-climb--ready {
  background: linear-gradient(180deg, #818cf8, #6366f1) !important;
  border-bottom-color: #4338ca !important;
  color: #ffffff !important;
  opacity: 1 !important;
  cursor: pointer !important;
  box-shadow: 0 10px 24px rgba(99, 102, 241, 0.4) !important;
  animation: climbPulse 1.3s ease-in-out infinite alternate;
}

.btn-climb--ready:hover {
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 14px 28px rgba(99, 102, 241, 0.5) !important;
}

.btn-climb--ready:active {
  transform: translateY(4px) scale(0.98);
  border-bottom-width: 2px !important;
}

@keyframes climbPulse {
  from { filter: brightness(1); }
  to   { filter: brightness(1.12); }
}

.btn-climb-flag { font-size: 1.5rem; }
.btn-climb-text { }

/* ── MÀN KẾT QUẢ ── */
.tower-peak-modal {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.78);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.peak-card {
  background: #ffffff;
  border: 5px solid #0284c7;
  border-radius: 32px;
  padding: 36px 30px;
  text-align: center;
  max-width: 450px;
  width: 100%;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  animation: peakEntrance 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes peakEntrance {
  from { transform: scale(0.7) translateY(40px); opacity: 0; }
  to   { transform: scale(1)   translateY(0);    opacity: 1; }
}

.peak-icons    { font-size: 3.5rem; margin-bottom: 12px; }
.peak-heading  { font-size: 1.65rem; font-weight: 900; color: #0369a1; margin-bottom: 10px; }
.peak-desc     { font-size: 1.1rem; color: #475569; line-height: 1.5; margin-bottom: 20px; }

.peak-stats {
  display: flex;
  gap: 14px;
  justify-content: center;
  margin-bottom: 24px;
}

.peak-stat {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 12px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-num { font-size: 1.5rem; font-weight: 900; color: #0f172a; }
.stat-lbl { font-size: 0.82rem; color: #64748b; font-weight: 700; }

.btn-submit-peak {
  width: 100%;
  padding: 14px;
  border-radius: 999px;
  border: none;
  border-bottom: 5px solid #15803d;
  background: linear-gradient(180deg, #4ade80, #22c55e);
  color: #ffffff;
  font-size: 1.2rem;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(34, 197, 94, 0.4);
  transition: all 0.2s ease;
}

.btn-submit-peak:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(34, 197, 94, 0.5);
}

.btn-submit-peak:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Transition màn kết quả */
.tower-finish-fade-enter-active { transition: opacity 0.4s ease; }
.tower-finish-fade-enter-from   { opacity: 0; }

/* ── RESPONSIVE ── */
@media (max-width: 768px) {
  .tower-header {
    grid-template-columns: 1fr auto;
    gap: 10px;
    padding: 10px 14px;
  }

  .tower-progress-wrap { display: none; }

  .tower-arena {
    grid-template-columns: 1fr;
    gap: 14px;
    padding: 12px;
    overflow-y: auto;
  }

  .tower-stage {
    height: 200px;
    min-height: 180px;
    flex-direction: row;
    justify-content: center;
    align-items: flex-end;
    gap: 16px;
  }

  .stone-tower { margin-bottom: 10px; width: 100px; }

  .dino-sprite { max-width: 80px; max-height: 80px; }
  .dino-sprite :deep(img) { max-width: 80px; max-height: 80px; }

  .speech-bubble { width: 52px; height: 52px; top: -60px; }

  .quiz-question-text { font-size: 1.15rem; }

  .answer-btn { padding: 8px 14px 8px 8px; }
  .answer-pill { width: 42px; height: 42px; min-width: 42px; }
  .pill-letter { font-size: 1.4rem; }
  .answer-text { font-size: 1.1rem; }

  .btn-climb { font-size: 1.1rem; padding: 12px 20px; }
}

/* ── PREFERS-REDUCED-MOTION ── */
.reduce-motion * {
  animation: none !important;
  transition: none !important;
}
</style>
