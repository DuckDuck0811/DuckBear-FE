<template>
  <div class="fruit-game" :class="{ 'reduce-motion': game.prefersReducedMotion.value }">

    <!-- ===== HEADER: CÂY THỬ THÁCH, CỜ ĐÍCH, SAO VÀNG, ĐỒNG HỒ & ÂM THANH ===== -->
    <header class="fruit-header" role="banner">
      <!-- Góc trên trái: Bảng gỗ Cây Thử Thách X/N -->
      <div class="tree-progress-board">
        <div class="tree-icon-badge" aria-hidden="true">
          <span class="tree-emoji">🌳</span>
        </div>
        <div class="tree-board-text">
          <span class="tree-board-title">{{ t('playModes.fruitUI.challengeTree') }}</span>
          <strong class="tree-board-progress">
            {{ game.displayNum.value }} / {{ game.totalQuestions.value }}
          </strong>
        </div>
      </div>

      <!-- Góc trên phải: Sao điểm + Đồng hồ đỏ đếm ngược + Nút âm thanh -->
      <div class="fruit-header-right">
        <!-- Huy hiệu sao vàng -->
        <div class="fruit-star-badge">
          <span class="star-icon" aria-hidden="true">⭐</span>
          <strong class="star-count">{{ game.stars.value }}</strong>
        </div>

        <!-- Đồng hồ bấm giờ đỏ (15s mặc định) -->
        <div class="stopwatch-wrap">
          <div
            class="stopwatch-pill"
            :class="{
              'timer--warning': countdown.isWarning.value,
              'timer--expired': timeUpBanner,
            }"
            :aria-label="`Thời gian còn lại: ${countdown.timeLeft.value} giây`"
          >
            <div class="stopwatch-icon" aria-hidden="true">
              <svg viewBox="0 0 32 32" width="22" height="22" class="stopwatch-svg">
                <circle cx="16" cy="18" r="11" fill="#ffffff" stroke="#991b1b" stroke-width="2.5" />
                <rect x="14" y="2" width="4" height="4" rx="1" fill="#78350f" />
                <line x1="16" y1="18" x2="16" y2="11" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" />
                <line x1="16" y1="18" x2="21" y2="18" stroke="#dc2626" stroke-width="2" stroke-linecap="round" />
              </svg>
            </div>
            <span class="stopwatch-digits">{{ countdown.timeLeft.value }}s</span>
          </div>
          <div v-if="timeUpBanner" class="timeup-toast" role="alert">
            {{ t('playModes.fruitUI.timeUp') }}
          </div>
        </div>

        <!-- Nút bật/tắt âm thanh -->
        <SoundToggle
          :model-value="game.isSoundEnabled.value"
          @toggle="game.toggleSound()"
        />
      </div>
    </header>

    <!-- ===== ARENA CHÍNH: DÂY THỪNG LEO CÂY (TRÁI) & BẢNG GỖ CÂU HỎI (GIỮA) ===== -->
    <main class="fruit-arena">

      <!-- ── KHU VỰC BÊN TRÁI: DÂY TIẾN ĐỘ VÀ SÓC ĐỨNG TRÊN MẤU ── -->
      <section ref="treeClimbingZone" class="tree-climbing-zone" aria-label="Dây tiến độ và sóc">
        <div class="tree-finish-flag-node" aria-label="Đích ngọn cây">
          <div class="flag-sprite-wrap">
            <GameSprite
              mode="fruit"
              name="flag"
              width="var(--flag-height)"
              height="var(--flag-height)"
              class="finish-flag-sprite"
            >
              <svg viewBox="0 0 48 48" width="36" height="36" class="flag-fallback-svg">
                <line x1="10" y1="6" x2="10" y2="44" stroke="#78350f" stroke-width="4" stroke-linecap="round" />
                <rect x="10" y="8" width="12" height="10" fill="#000000" />
                <rect x="22" y="8" width="12" height="10" fill="#ffffff" />
                <rect x="10" y="18" width="12" height="10" fill="#ffffff" />
                <rect x="22" y="18" width="12" height="10" fill="#000000" />
                <circle cx="10" cy="6" r="3" fill="#ca8a04" />
              </svg>
            </GameSprite>
          </div>
          <div class="wood-sign-finish">{{ t('playModes.fruitUI.finish') }}</div>
        </div>

        <!-- Sợi dây thừng bện dọc từ gốc lên ngọn -->
        <div class="braided-rope" aria-hidden="true"></div>

        <div
          class="climber-progress-marker"
          :style="{ transform: `translateY(-${climbOffset}px)` }"
        >
          <div class="wooden-peg" aria-hidden="true"></div>

          <!-- Sóc đứng trên mấu gỗ, di chuyển theo câu đang hiển thị -->
          <div class="squirrel-climber-wrap" :class="squirrelState">
            <div class="squirrel-speech-bubble" aria-live="polite">
              <span class="bubble-caption">{{ t('playModes.fruitUI.floorBadge') }}</span>
              <strong class="bubble-num">{{ game.displayNum.value }}</strong>
              <div class="bubble-tail" aria-hidden="true"></div>
            </div>

            <div class="squirrel-motion-container" :class="squirrelMotionClass">
              <GameSprite
                mode="fruit"
                :name="squirrelState"
                width="100%"
                height="100%"
                :alt="squirrelAltText"
                class="squirrel-sprite"
              >
                <svg viewBox="0 0 240 130" class="squirrel-fallback-svg" aria-hidden="true">
                  <path d="M82 107C33 126 12 96 31 58c15-30 47-20 43 8-2 13-12 18-21 8" fill="#c46b24" stroke="#78350f" stroke-width="5" />
                  <ellipse cx="132" cy="84" rx="49" ry="34" fill="#d97706" stroke="#78350f" stroke-width="5" />
                  <path d="M100 104v14m38-16v16m18-22v22m29-27v27" stroke="#78350f" stroke-width="8" stroke-linecap="round" />
                  <circle cx="188" cy="46" r="33" fill="#d97706" stroke="#78350f" stroke-width="5" />
                  <path d="m166 21 5-18 17 20m11 1 16-18 4 27" fill="#d97706" stroke="#78350f" stroke-width="5" stroke-linejoin="round" />
                  <ellipse cx="200" cy="57" rx="17" ry="12" fill="#fef3c7" />
                  <circle cx="199" cy="39" r="5" fill="#1c1917" />
                  <circle cx="213" cy="52" r="4" fill="#78350f" />
                </svg>
              </GameSprite>
            </div>
          </div>
        </div>
      </section>

      <!-- ── KHU VỰC CHÍNH GIỮA: CÂY CỔ THỤ & BẢNG GỖ CÂU HỎI + ĐÁP ÁN ── -->
      <section
        v-if="currentQuestionItem && !game.isComplete.value"
        class="tree-center-trunk"
        :class="{ 'tree-center-trunk--fallback': isFallbackType }"
      >

        <!-- BẢNG GỖ CÂU HỎI CÓ HẠT DẺ TRÊN ĐỈNH -->
        <div class="wood-question-card">
          <!-- Huy hiệu Hạt dẻ trên đỉnh bảng -->
          <div class="acorn-crest-badge">
              <GameSprite
                mode="fruit"
                name="acorn"
                width="var(--acorn-size)"
                height="var(--acorn-size)"
                class="acorn-crest-sprite"
              >
              <span class="acorn-fallback-emoji" aria-hidden="true">🌰</span>
            </GameSprite>
          </div>

          <!-- Đinh ốc 4 góc bảng gỗ -->
          <div class="wood-screw screw-tl" aria-hidden="true"></div>
          <div class="wood-screw screw-tr" aria-hidden="true"></div>
          <div class="wood-screw screw-bl" aria-hidden="true"></div>
          <div class="wood-screw screw-br" aria-hidden="true"></div>
          <span class="question-leaf question-leaf--left" aria-hidden="true">🌿</span>
          <span class="question-leaf question-leaf--right" aria-hidden="true">🍃</span>

          <!-- Nội dung câu hỏi chữ đậm tương phản cao -->
          <h2 class="wood-question-text">
            {{ currentQuestionItem.question.content }}
          </h2>
        </div>

        <!-- LƯỚI ĐÁP ÁN: DẠNG TẤM GỖ XẾP LƯỚI 2x2 CÓ QUẢ TÁO ĐỎ A/B/C/D -->
        <div
          v-if="isMcqType"
          class="wood-options-grid"
          :class="{ 'grid--single-column': options.length <= 3 }"
          role="listbox"
          :aria-label="`Đáp án câu hỏi ${game.displayNum.value}`"
        >
          <button
            v-for="(option, idx) in options"
            :key="option.id"
            type="button"
            class="wood-option-btn"
            role="option"
            :aria-selected="isOptionSelected(option.id)"
            :class="{
              'opt--selected': isOptionSelected(option.id),
              'opt--correct':  getOptionStatus(option.id) === 'correct',
              'opt--wrong':    getOptionStatus(option.id) === 'wrong',
              'opt--dimmed':   getOptionStatus(option.id) === 'dimmed',
            }"
            :disabled="game.isChecking.value || isChecked"
            @click="onPick(option.id)"
          >
            <!-- Chồi lá xanh mọc từ mép cành gỗ -->
            <span class="wood-leaf leaf-top-left" aria-hidden="true">🌿</span>

            <!-- Huy hiệu Quả Táo Đỏ viền chữ cái A, B, C, D -->
            <div class="apple-fruit-badge" :class="`apple-${letters[idx].toLowerCase()}`">
              <GameSprite
                mode="fruit"
                name="apple"
                width="var(--apple-size)"
                height="var(--apple-size)"
                class="apple-sprite"
              >
                <!-- Fallback SVG Quả táo đỏ bóng bẩy có cuống lá -->
                <svg viewBox="0 0 44 44" class="apple-fallback-svg">
                  <!-- Cuống táo & lá xanh -->
                  <path d="M22 10 Q24 4 28 2" stroke="#78350f" stroke-width="2.5" fill="none" stroke-linecap="round" />
                  <ellipse cx="28" cy="6" rx="5" ry="3" fill="#22c55e" stroke="#15803d" stroke-width="1" transform="rotate(-20 28 6)" />
                  <!-- Quả táo đỏ bóng bẩy -->
                  <path d="M22 11 Q29 7 36 14 Q42 22 37 32 Q32 41 22 39 Q12 41 7 32 Q2 22 8 14 Q15 7 22 11 Z" fill="url(#apple-grad)" stroke="#991b1b" stroke-width="2" />
                  <!-- Vệt sáng phản quang -->
                  <ellipse cx="14" cy="18" rx="3.5" ry="5.5" fill="#ffffff" opacity="0.45" transform="rotate(-25 14 18)" />
                  <defs>
                    <radialGradient id="apple-grad" cx="35%" cy="35%" r="65%">
                      <stop offset="0%" stop-color="#f87171" />
                      <stop offset="40%" stop-color="#ef4444" />
                      <stop offset="100%" stop-color="#991b1b" />
                    </radialGradient>
                  </defs>
                </svg>
              </GameSprite>
              <!-- Chữ cái A/B/C/D màu trắng đậm nổi bật trên quả táo -->
              <span class="apple-letter-overlay">{{ letters[idx] }}</span>
            </div>

            <!-- Nội dung chữ của đáp án -->
            <span class="wood-option-text">{{ option.content }}</span>

            <!-- Biểu tượng đúng / sai sau khi kiểm tra -->
            <span
              v-if="getOptionStatus(option.id) !== 'normal' && getOptionStatus(option.id) !== 'dimmed'"
              class="option-feedback-icon"
              aria-hidden="true"
            >
              <span v-if="getOptionStatus(option.id) === 'correct'" class="icon-star">⭐</span>
              <span v-else class="icon-wrong">❌</span>
            </span>
          </button>
        </div>

        <!-- MULTI_MCQ: Chọn nhiều đáp án -->
        <template v-else-if="isMultiMcqType">
          <p class="multi-select-hint">
            {{ t('playModes.fruitUI.multiSelectHint') }}
          </p>
          <div
            class="wood-options-grid"
            :class="{ 'grid--single-column': options.length <= 3 }"
            role="listbox"
            aria-multiselectable="true"
          >
          <button
            v-for="(option, idx) in options"
            :key="option.id"
            type="button"
            class="wood-option-btn"
            role="option"
            :aria-selected="isOptionSelected(option.id)"
            :class="{
              'opt--selected': isOptionSelected(option.id),
              'opt--correct':  getOptionStatus(option.id) === 'correct',
              'opt--wrong':    getOptionStatus(option.id) === 'wrong',
              'opt--dimmed':   getOptionStatus(option.id) === 'dimmed',
            }"
            :disabled="game.isChecking.value || isChecked"
            @click="onToggleMulti(option.id)"
          >
            <span class="wood-leaf leaf-top-left" aria-hidden="true">🌿</span>
            <div class="apple-fruit-badge" aria-hidden="true">
              <GameSprite
                mode="fruit"
                name="apple"
                width="var(--apple-size)"
                height="var(--apple-size)"
                class="apple-sprite"
              >
                <svg viewBox="0 0 44 44" class="apple-fallback-svg">
                  <path d="M22 10 Q24 4 28 2" stroke="#78350f" stroke-width="2.5" fill="none" stroke-linecap="round" />
                  <ellipse cx="28" cy="6" rx="5" ry="3" fill="#22c55e" stroke="#15803d" stroke-width="1" transform="rotate(-20 28 6)" />
                  <path d="M22 11 Q29 7 36 14 Q42 22 37 32 Q32 41 22 39 Q12 41 7 32 Q2 22 8 14 Q15 7 22 11 Z" fill="url(#apple-grad)" stroke="#991b1b" stroke-width="2" />
                  <ellipse cx="14" cy="18" rx="3.5" ry="5.5" fill="#ffffff" opacity="0.45" transform="rotate(-25 14 18)" />
                  <defs>
                    <radialGradient id="apple-grad" cx="35%" cy="35%" r="65%">
                      <stop offset="0%" stop-color="#f87171" />
                      <stop offset="40%" stop-color="#ef4444" />
                      <stop offset="100%" stop-color="#991b1b" />
                    </radialGradient>
                  </defs>
                </svg>
              </GameSprite>
              <span v-if="isOptionSelected(option.id)" class="apple-letter-overlay">✓</span>
              <span v-else class="apple-letter-overlay">{{ letters[idx] }}</span>
            </div>
            <span class="wood-option-text">{{ option.content }}</span>
            <span
              v-if="getOptionStatus(option.id) !== 'normal' && getOptionStatus(option.id) !== 'dimmed'"
              class="option-feedback-icon"
              aria-hidden="true"
            >
              <span v-if="getOptionStatus(option.id) === 'correct'" class="icon-star">⭐</span>
              <span v-else class="icon-wrong">❌</span>
            </span>
            </button>
          </div>
        </template>

        <!-- Fallback cho dạng tự luận / điền khuyết / matching -->
        <div v-else class="fallback-wood-panel">
          <QuestionItem
            :item="currentQuestionItem"
            :index="session.currentIndex.value"
            :answer="session.answers[currentQuestionItem.question.id] || {}"
            :level="1"
            mode="fruit"
            :disabled="game.isChecking.value || isChecked"
            hide-stem
            @answered="onQuestionAnswered"
          />
        </div>

        <!-- Thông báo lỗi mạng + nút thử lại -->
        <div v-if="game.networkError.value" class="network-error-banner" role="alert">
          <span>⚠️ {{ game.networkError.value }}</span>
          <button type="button" class="retry-btn" @click="onConfirmHarvest">
            🔄 {{ t('playModes.shared.retry') }}
          </button>
        </div>

        <!-- NÚT CHÍNH "HÁI!" DẠNG TẤM GỖ 3D KÈM ICON HẠT DẺ -->
        <div class="wood-action-area">
          <!-- Khi đã có kết quả: Có nút "Tiếp tục" bấm là chuyển ngay, hủy timer -->
          <button
            v-if="isChecked"
            type="button"
            class="btn-harvest btn-harvest--continue"
            @click="onContinueNext"
            :aria-label="t('playModes.fruitUI.actionContinue')"
          >
            <span class="harvest-icon" aria-hidden="true">⏩</span>
            <span class="harvest-text">{{ t('playModes.fruitUI.actionContinue') }}</span>
          </button>

          <!-- Trạng thái bình thường: Nút Hái! -->
          <button
            v-else
            type="button"
            class="btn-harvest"
            :class="{ 'btn-harvest--ready': canCommit }"
            :disabled="!canCommit"
            @click="onConfirmHarvest"
            :aria-label="t('playModes.fruitUI.actionHarvest')"
          >
            <span class="harvest-icon" aria-hidden="true">🌰</span>
            <span class="harvest-text">
              {{ game.isChecking.value
                 ? t('playModes.fruitUI.checking')
                 : t('playModes.fruitUI.actionHarvest') }}
            </span>
          </button>
        </div>
      </section>
    </main>

    <!-- ===== MÀN CHINH PHỤC CÂY THỬ THÁCH (KẾT QUẢ) ===== -->
    <Transition name="fruit-finish-fade">
      <div v-if="game.isComplete.value" class="fruit-finish-modal" role="dialog" aria-modal="true" aria-label="Kết quả thu hoạch">
        <div class="finish-wood-card">
          <div class="finish-trophy-emojis" aria-hidden="true">🏆 🧺 🍎 ✨</div>
          <h2 class="finish-heading">{{ t('playModes.fruitUI.finishHeadline') }}</h2>
          <p class="finish-desc">
            {{ t('playModes.fruitUI.finishDesc', {
                stars: game.stars.value,
                total: game.totalQuestions.value,
              }) }}
          </p>

          <div class="finish-stats-row">
            <div class="finish-stat-box">
              <span class="stat-number">{{ game.stars.value }} / {{ game.totalQuestions.value }}</span>
              <span class="stat-title">Quả thu hoạch 🍎</span>
            </div>
            <div class="finish-stat-box">
              <span class="stat-number">🔥 ×{{ game.maxCombo.value }}</span>
              <span class="stat-title">{{ t('playModes.shared.combo') }} cao nhất</span>
            </div>
          </div>

          <button
            type="button"
            class="btn-submit-harvest"
            :disabled="session.submitting.value"
            @click="session.submit()"
          >
            {{ session.submitting.value
               ? t('playModes.fruitUI.submitting')
               : t('playModes.fruitUI.submitNow') }}
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
import { useCountdown } from '../composables/useCountdown.js';
import {
  getFruitClimbProgress,
  getFruitClimbTrackDistance,
  getFruitQuestionDuration,
  hasCompleteMatchingAnswer,
} from './fruitMode.helpers.js';

const props = defineProps({
  session: { type: Object, required: true },
});

const { t } = useI18n();
const game = useQuizGame(props.session);
const countdown = useCountdown();

const letters = ['A', 'B', 'C', 'D'];

// ─── Trạng thái nhân vật & tương tác ─────────────────────────────────────────
const squirrelState       = ref('squirrelIdle');
const squirrelMotionClass = ref('');
const climbTrackDistance  = ref(0);
const treeClimbingZone    = ref(null);
const selectedId          = ref(null);            // Single MCQ
const selectedIds         = ref([]);              // MULTI_MCQ
const timeUpBanner        = ref(false);
let poseTimer = null;
let timeUpTimer = null;

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

const isFallbackType = computed(() => !isMcqType.value && !isMultiMcqType.value);

const isChecked = computed(() => {
  const qId = currentQuestionItem.value?.question?.id;
  return qId != null && (
    props.session.checkedQuestions?.[String(qId)] != null ||
    game.checkedDetails?.value?.[qId] != null
  );
});

const canCommit = computed(() => {
  if (game.isChecking.value || isChecked.value) return false;
  if (isMcqType.value)      return selectedId.value !== null;
  if (isMultiMcqType.value) return selectedIds.value.length > 0;
  const question = currentQuestionItem.value?.question;
  const qId = question?.id;
  if (question?.type === 'MATCHING') {
    return hasCompleteMatchingAnswer(question, props.session.answers[qId]);
  }
  return qId != null && props.session.hasAnswer?.(qId);
});

const squirrelAltText = computed(() => {
  if (squirrelState.value === 'squirrelHappy') return 'Chú sóc nhảy mừng thu hoạch quả thành công';
  if (squirrelState.value === 'squirrelSad')   return 'Chú sóc cúi đầu buồn vì trả lời sai';
  return 'Chú sóc đứng bốn chân trên mấu gỗ';
});

// ─── TIẾN ĐỘ TRÊN DÂY THEO CÂU ĐANG HIỂN THỊ ───────────────────────────────
const climbProgress = computed(() => {
  return getFruitClimbProgress(game.displayNum.value, game.totalQuestions.value);
});
const climbOffset = computed(() => climbTrackDistance.value * climbProgress.value);
const questionTimeLimitSeconds = computed(() =>
  getFruitQuestionDuration(
    currentQuestionItem.value?.question,
    props.session.assignment?.value,
    props.session.remainingSeconds?.value,
  ),
);

// ─── XÁC ĐỊNH TRẠNG THÁI TỪNG ĐÁP ÁN SAU KHI CHẤM ───────────────────────────
function getOptionStatus(optId) {
  const qId = currentQuestionItem.value?.question?.id;
  if (!isChecked.value || !qId) return 'normal';

  const checkInfo = game.checkedDetails?.value?.[qId] || props.session.checkedQuestions?.[String(qId)];
  const isSelected = isOptionSelected(optId);
  const correctOptionIds = checkInfo?.correctOptionIds || [];

  const isCorrectOption =
    correctOptionIds.includes(optId) ||
    (isSelected && checkInfo?.isCorrect === true);

  if (isCorrectOption) {
    return 'correct';
  }
  if (isSelected && checkInfo?.isCorrect === false) {
    return 'wrong';
  }
  return 'dimmed';
}

function isOptionSelected(optId) {
  if (isMcqType.value)      return selectedId.value === optId;
  if (isMultiMcqType.value) return selectedIds.value.includes(optId);
  return false;
}

function onPick(optId) {
  if (game.isChecking.value || isChecked.value) return;
  hideTimeUpNotice();
  game.playSfx('click');
  selectedId.value = selectedId.value === optId ? null : optId;
}

function onToggleMulti(optId) {
  if (game.isChecking.value || isChecked.value) return;
  hideTimeUpNotice();
  game.playSfx('click');
  selectedIds.value = selectedIds.value.includes(optId)
    ? selectedIds.value.filter((id) => id !== optId)
    : [...selectedIds.value, optId];
}

function onQuestionAnswered(questionId) {
  hideTimeUpNotice();
  const ans = props.session.answers[questionId];
  if (ans) props.session.setAnswer(questionId, { ...ans });
}

// ─── ĐỒNG HỒ ĐẾM NGƯỢC MỖI CÂU ──────────────────────────────────────────────
function startQuestionCountdown() {
  hideTimeUpNotice();
  countdown.start(questionTimeLimitSeconds.value, onTimerExpire);
}

function hideTimeUpNotice() {
  if (timeUpTimer !== null) clearTimeout(timeUpTimer);
  timeUpTimer = null;
  timeUpBanner.value = false;
}

function onTimerExpire() {
  if (game.isComplete.value || game.isChecking.value || isChecked.value) return;

  timeUpBanner.value = true;
  timeUpTimer = setTimeout(() => {
    timeUpBanner.value = false;
    timeUpTimer = null;
  }, 4000);
}

function updateClimbTrack() {
  const zone = treeClimbingZone.value;
  if (!zone) return;

  const squirrelHeight = zone.querySelector('.squirrel-climber-wrap')?.offsetHeight || 0;
  const flag = zone.querySelector('.tree-finish-flag-node');
  const flagTop = flag?.offsetTop || 0;
  const flagHeight = flag?.offsetHeight || 0;
  const baseGap = zone.clientHeight * 0.06;
  climbTrackDistance.value = getFruitClimbTrackDistance(
    zone.clientHeight,
    squirrelHeight,
    flagTop,
    flagHeight,
    baseGap,
  );
}

// ─── COMMIT HÁI QUẢ VÀ HIỆU ỨNG TƯ THẾ SÓC ─────────────────────────────────
async function onConfirmHarvest() {
  const q = currentQuestionItem.value?.question;
  if (!q || game.isChecking.value || isChecked.value) return;

  countdown.stop();
  hideTimeUpNotice();

  let patch;
  if (isMcqType.value && selectedId.value !== null) {
    patch = { selectedOptionId: selectedId.value, selectedOptionIds: [selectedId.value] };
  } else if (isMultiMcqType.value && selectedIds.value.length > 0) {
    patch = { selectedOptionId: selectedIds.value[0], selectedOptionIds: [...selectedIds.value] };
  }

  squirrelState.value = 'squirrelIdle';
  squirrelMotionClass.value = '';

  await game.submitAndCheck(q.id, patch, {
    delayNext: 1500,
    onResolved: (isCorrect) => {
      if (poseTimer !== null) clearTimeout(poseTimer);
      if (isCorrect) {
        squirrelState.value = 'squirrelHappy';
        squirrelMotionClass.value = 'squirrel--jump';
      } else {
        squirrelState.value = 'squirrelSad';
        squirrelMotionClass.value = 'squirrel--shake';
      }
      poseTimer = setTimeout(() => {
        squirrelState.value = 'squirrelIdle';
        squirrelMotionClass.value = '';
        poseTimer = null;
      }, 1500);
    },
  });
}

// Bấm nút "Tiếp tục": chuyển câu ngay lập tức, hủy timer 1.5s
function onContinueNext() {
  game.continueToNext();
}

// ─── BÀN PHÍM (A-D, 1-4, Enter) ────────────────────────────────────────────
function onKeydown(e) {
  if (game.isComplete.value) return;

  if (
    e.target instanceof HTMLElement &&
    (e.target.isContentEditable || e.target.matches('input, textarea, select, [role="combobox"]'))
  ) return;

  if (isChecked.value) {
    if (e.key === 'Enter') {
      e.preventDefault();
      onContinueNext();
    }
    return;
  }

  if (game.isChecking.value) return;

  const opts = options.value;
  const map  = { '1': 0, '2': 1, '3': 2, '4': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3,
                 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
  const idx  = map[e.key];

  if (idx !== undefined && opts[idx]) {
    if (isMcqType.value)      onPick(opts[idx].id);
    else if (isMultiMcqType.value) onToggleMulti(opts[idx].id);
  }
  if (
    e.key === 'Enter' &&
    (isMcqType.value || isMultiMcqType.value) &&
    canCommit.value
  ) {
    e.preventDefault();
    onConfirmHarvest();
  }
}

// Khi chuyển sang câu hỏi mới
watch(() => props.session.currentIndex?.value, () => {
  if (poseTimer !== null) clearTimeout(poseTimer);
  poseTimer = null;
  selectedId.value          = null;
  selectedIds.value         = [];
  squirrelState.value       = 'squirrelIdle';
  squirrelMotionClass.value = '';
  hideTimeUpNotice();
  startQuestionCountdown();
});

onMounted(() => {
  updateClimbTrack();
  window.addEventListener('resize', updateClimbTrack);
  document.addEventListener('keydown', onKeydown);
  startQuestionCountdown();
});

onUnmounted(() => {
  window.removeEventListener('resize', updateClimbTrack);
  document.removeEventListener('keydown', onKeydown);
  countdown.stop();
  if (timeUpTimer !== null) clearTimeout(timeUpTimer);
  if (poseTimer !== null) clearTimeout(poseTimer);
});
</script>

<style scoped>
/* =====================================================================
   HÁI QUẢ — FRUIT MODE (CÂY THỬ THÁCH)
   ===================================================================== */
.fruit-game {
  --squirrel-height: clamp(110px, 18vh, 194px);
  --squirrel-width: clamp(195px, 32vh, 345px);
  --flag-height: clamp(36px, 8vh, 100px);
  --apple-size: clamp(36px, 5vh, 48px);
  --acorn-size: clamp(28px, 4.5vh, 40px);
  --peg-width: clamp(60px, 9.92vh, 108px);
  --peg-center: clamp(37px, calc(4.96vh + 7px), 61px);
  --bubble-size: 52px;
  --acorn-clearance: 27px;
  --wood-card-max-width: 680px;

  position: relative;
  width: 100%;
  /* Khung game cao 100dvh trừ navbar, không phải cuộn */
  height: calc(100dvh - 84px);
  min-height: 560px;
  max-height: calc(100dvh - 84px);
  overflow: hidden;
  border-radius: 28px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.25);

  pointer-events: none;
  background-color: #38bdf8;
  background-image: url('/assets/modes/fruit/bg.png'),
    linear-gradient(180deg, #38bdf8 0%, #7dd3fc 45%, #86efac 85%, #4ade80 100%);
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center bottom;

  display: flex;
  flex-direction: column;
  user-select: none;
  font-family: inherit;
}

/* =====================================================================
   HEADER: CÂY THỬ THÁCH, CỜ ĐÍCH, SAO VÀNG, ĐỒNG HỒ & ÂM THANH
   ===================================================================== */
.fruit-header {
  position: absolute;
  top: 14px;
  left: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  z-index: 30;
  pointer-events: none;
}

/* Góc trên trái: Bảng gỗ Cây Thử Thách X/N */
.tree-progress-board {
  pointer-events: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 16px;
  background:
    repeating-linear-gradient(3deg, rgba(255, 232, 179, 0.1) 0 2px, transparent 2px 8px),
    linear-gradient(180deg, #a96332 0%, #87451f 100%);
  border: 3px solid #6f3519;
  border-bottom: 5px solid #51230f;
  border-radius: 14px;
  box-shadow: 0 4px 14px rgba(45, 24, 10, 0.4);
}

.tree-icon-badge {
  display: flex;
  align-items: center;
  justify-content: center;
}

.tree-emoji {
  font-size: 1.6rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
}

.tree-board-text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}

.tree-board-title {
  font-size: 0.65rem;
  font-weight: 800;
  color: #ffedbd;
  letter-spacing: 0.3px;
}

.tree-board-progress {
  font-size: 1.15rem;
  font-weight: 900;
  color: #fff7db;
}

/* Giữa đỉnh ngọn cây: Lá cờ Đích */
.tree-finish-flag-node {
  pointer-events: none;
  display: flex;
  align-items: center;
  gap: 6px;
  position: absolute;
  left: 65%;
  transform: translateX(-50%);
  top: 0;
  z-index: 0;
}

.flag-sprite-wrap {
  display: flex;
  align-items: center;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25));
  pointer-events: none;
}

.finish-flag-sprite,
.flag-fallback-svg,
.wood-sign-finish {
  pointer-events: none;
}

.wood-sign-finish {
  background: linear-gradient(180deg, #d97706 0%, #b45309 100%);
  border: 2px solid #fef08a;
  border-bottom: 4px solid #78350f;
  border-radius: 10px;
  padding: 2px 10px;
  color: #ffffff;
  font-size: 0.85rem;
  font-weight: 900;
  letter-spacing: 0.5px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
}

/* Góc trên phải: Sao + Đồng hồ đỏ + Âm thanh */
.fruit-header-right {
  pointer-events: none;
  display: flex;
  align-items: center;
  gap: 12px;
}

.fruit-header-right :deep(.sound-toggle-btn) {
  pointer-events: auto;
}

.fruit-star-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(180deg, #78350f 0%, #451a03 100%);
  border: 2.5px solid #fcd34d;
  padding: 4px 14px;
  border-radius: 999px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

.star-icon {
  font-size: 1.35rem;
  filter: drop-shadow(0 0 6px rgba(250, 204, 21, 0.8));
}

.star-count {
  font-size: 1.25rem;
  font-weight: 900;
  color: #fef08a;
}

.stopwatch-wrap {
  position: relative;
}

/* Đồng hồ đếm ngược */
.stopwatch-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(180deg, #ef4444 0%, #dc2626 50%, #991b1b 100%);
  border: 2.5px solid #fecaca;
  border-bottom: 4px solid #7f1d1d;
  padding: 4px 14px;
  border-radius: 999px;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.35);
  transition: all 0.3s ease;
  pointer-events: none;
}

.stopwatch-digits {
  font-size: 1.15rem;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: 0.5px;
}

.timeup-toast {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: max-content;
  max-width: min(320px, 70vw);
  padding: 4px 8px;
  border: 1px solid #fecaca;
  border-radius: 10px;
  background: #fff7ed;
  color: #7f1d1d;
  box-shadow: 0 4px 12px rgba(120, 53, 15, 0.2);
  font-size: 0.72rem;
  line-height: 1.2;
  font-weight: 800;
  text-align: center;
  pointer-events: none;
}

/* Cảnh báo khi còn <= 5 giây */
.timer--warning {
  background: linear-gradient(180deg, #dc2626 0%, #b91c1c 100%);
  border-color: #fee2e2;
  animation: timerPulse 0.6s infinite alternate;
}

@keyframes timerPulse {
  from { transform: scale(1); box-shadow: 0 0 10px rgba(239, 68, 68, 0.6); }
  to   { transform: scale(1.08); box-shadow: 0 0 20px rgba(239, 68, 68, 0.95); }
}

/* =====================================================================
   ARENA 2 KHU VỰC: DÂY THỪNG (TRÁI) & BẢNG GỖ CÂU HỎI (GIỮA)
   ===================================================================== */
.fruit-arena {
  position: relative;
  flex: 1;
  display: grid;
  grid-template-columns: minmax(240px, 32%) minmax(0, 1fr);
  gap: 16px;
  padding: 76px 24px 16px 20px;
  height: 100%;
  min-height: 0;
  min-width: 0;
  box-sizing: border-box;
  position: relative;
  z-index: 20;
  pointer-events: none;
}

/* =====================================================================
   DÂY THỪNG BỆN VÀ SÓC BÁM DÂY BÊN TRÁI
   ===================================================================== */
.tree-climbing-zone {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
  z-index: 5;
  pointer-events: none;
}

/* Sợi dây thừng bện chạy dọc */
.braided-rope {
  position: absolute;
  top: 10px;
  bottom: 30px;
  left: 65%;
  width: 14px;
  transform: translateX(-50%);
  background: repeating-linear-gradient(
    45deg,
    #d97706,
    #d97706 8px,
    #b45309 8px,
    #b45309 16px
  );
  border-left: 2px solid #78350f;
  border-right: 2px solid #78350f;
  border-radius: 999px;
  box-shadow: 3px 0 8px rgba(0, 0, 0, 0.3);
  z-index: 5;
  pointer-events: none;
}

/* Cột mốc và mấu gỗ dịch chuyển theo câu đang hiển thị */
.climber-progress-marker {
  position: absolute;
  left: 65%;
  bottom: 0;
  width: 0;
  height: 100%;
  z-index: 20;
  pointer-events: none;
  transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.wooden-peg {
  position: absolute;
  bottom: calc(6% - 18px);
  left: 7px;
  width: var(--peg-width);
  height: 18px;
  box-sizing: border-box;
  background:
    repeating-linear-gradient(0deg, rgba(255, 230, 174, 0.18) 0 1px, transparent 1px 5px),
    linear-gradient(180deg, #d6a35c 0%, #9a5c2d 62%, #6f3519 100%);
  border: 2px solid #6f3519;
  border-radius: 4px 8px 8px 3px;
  box-shadow: 0 3px 5px rgba(45, 24, 10, 0.35);
  pointer-events: none;
}

.squirrel-climber-wrap {
  position: absolute;
  left: var(--peg-center);
  bottom: 6%;
  transform: translateX(-50%);
  width: var(--squirrel-width);
  height: var(--squirrel-height);
  --squirrel-tail-edge: 18.2%;
  z-index: 1;
  pointer-events: none;
}

.squirrel-climber-wrap.squirrelHappy {
  --squirrel-tail-edge: 22.2%;
}

.squirrel-climber-wrap.squirrelSad {
  --squirrel-tail-edge: 17.1%;
}

/* Bong bóng thoại "Tầng n" */
.squirrel-speech-bubble {
  position: absolute;
  top: 8%;
  left: calc(var(--squirrel-tail-edge) - var(--bubble-size) - 10px);
  background: #fef08a;
  border: 3px solid #ca8a04;
  border-radius: 50%;
  width: var(--bubble-size);
  height: var(--bubble-size);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  z-index: 12;
  animation: bubbleFloat 2.2s ease-in-out infinite alternate;
  pointer-events: none;
}

@keyframes bubbleFloat {
  from { transform: translateY(0); }
  to   { transform: translateY(-3px); }
}

.bubble-caption {
  font-size: 0.6rem;
  font-weight: 800;
  color: #854d0e;
  line-height: 1;
}

.bubble-num {
  font-size: 1.1rem;
  font-weight: 900;
  color: #713f12;
  line-height: 1.1;
}

.bubble-tail {
  position: absolute;
  bottom: -7px;
  right: 12px;
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 7px solid #ca8a04;
}

/* Wrapper chuyển động độc lập với flip scale */
.squirrel-motion-container {
  width: var(--squirrel-width);
  height: var(--squirrel-height);
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.3));
}

.squirrel-sprite {
  width: 100%;
  height: 100%;
  display: block;
  max-height: var(--squirrel-height);
  object-fit: contain;
  pointer-events: none;
}

.squirrel-sprite :deep(img),
.squirrel-fallback-svg {
  width: 100%;
  height: 100%;
  max-height: var(--squirrel-height);
  object-fit: contain;
  display: block;
  pointer-events: none;
}

/* Sóc nhảy mừng khi trả lời đúng (15-20% chiều cao) */
.squirrel--jump {
  animation: squirrelJumpHappy 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes squirrelJumpHappy {
  0%   { transform: translateY(0) scale(1); }
  45%  { transform: translateY(clamp(-34px, -3.5vh, -20px)) scale(1.06); }
  100% { transform: translateY(0) scale(1); }
}

/* Sóc rung thất vọng khi trả lời sai */
.squirrel--shake {
  animation: squirrelShakeSad 0.5s ease-in-out forwards;
}

@keyframes squirrelShakeSad {
  0%, 100% { transform: translateX(0); }
  25%       { transform: translateX(-6px) rotate(-3deg); }
  75%       { transform: translateX(6px) rotate(3deg); }
}

/* =====================================================================
   BẢNG GỖ CÂU HỎI VÀ ĐÁP ÁN (GIỮA)
   ===================================================================== */
.tree-center-trunk {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: var(--wood-card-max-width);
  margin: 0 auto;
  height: 100%;
  min-height: 0;
  min-width: 0;
  box-sizing: border-box;
  z-index: 1;
  pointer-events: none;
}

.tree-center-trunk--fallback {
  justify-content: flex-start;
  gap: clamp(6px, 1vh, 12px);
}

.tree-center-trunk--fallback .wood-question-card {
  flex: 0 1 auto;
  max-height: min(28vh, 30%);
  overflow-y: auto;
  margin-bottom: 0;
}

/* THẺ GỖ CÂU HỎI CHÍNH */
.wood-question-card {
  position: relative;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  min-height: 92px;
  background:
    repeating-linear-gradient(2deg, rgba(107, 57, 25, 0.08) 0 2px, transparent 2px 11px),
    linear-gradient(180deg, #e6bc7e 0%, #cf9758 100%);
  border: 3.5px solid #7c421f;
  border-bottom: 6px solid #54280f;
  border-radius: 20px;
  padding: var(--acorn-clearance) clamp(18px, 2.8vw, 32px) clamp(14px, 2.2vh, 22px);
  box-shadow: 0 10px 30px rgba(120, 53, 15, 0.35);
  margin-bottom: clamp(10px, 1.6vh, 18px);
  text-align: center;
  flex-shrink: 0;
}

/* Huy hiệu quả hạt dẻ trên đỉnh bảng */
.acorn-crest-badge {
  position: absolute;
  top: -24px;
  left: 50%;
  transform: translateX(-50%);
  width: 48px;
  height: 48px;
  background: linear-gradient(180deg, #fef3c7 0%, #fde68a 100%);
  border: 3px solid #b45309;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

.acorn-crest-sprite {
  max-height: var(--acorn-size);
  object-fit: contain;
  pointer-events: none;
}

.acorn-fallback-emoji {
  font-size: 1.55rem;
  pointer-events: none;
}

/* Đinh ốc 4 góc bảng */
.wood-screw {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #78350f;
  border-radius: 50%;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.6);
  pointer-events: none;
}

.screw-tl { top: 8px; left: 10px; }
.screw-tr { top: 8px; right: 10px; }
.screw-bl { bottom: 8px; left: 10px; }
.screw-br { bottom: 8px; right: 10px; }

.question-leaf {
  position: absolute;
  top: 50%;
  font-size: 1.35rem;
  pointer-events: none;
}

.question-leaf--left {
  left: -12px;
  transform: translate(-50%, -50%) rotate(-24deg);
}

.question-leaf--right {
  right: -12px;
  transform: translate(50%, -50%) rotate(24deg);
}

.wood-question-text {
  font-size: clamp(1.43rem, 2.6vh, 1.9rem);
  font-weight: 800;
  color: #451a03;
  line-height: 1.4;
  margin: 0;
  text-align: center;
  word-break: break-word;
}

/* =====================================================================
   LƯỚI ĐÁP ÁN: 2x2 CÁC TẤM GỖ CÓ QUẢ TÁO ĐỎ A/B/C/D
   ===================================================================== */
.wood-options-grid {
  width: 100%;
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(10px, 1.5vh, 16px);
  margin-bottom: clamp(10px, 1.5vh, 16px);
  pointer-events: none;
}

.wood-options-grid.grid--single-column {
  grid-template-columns: minmax(0, 1fr);
}

.multi-select-hint {
  align-self: flex-start;
  margin: 0 0 6px;
  color: #713f12;
  font-size: 0.82rem;
  font-weight: 800;
  pointer-events: none;
}

/* Thẻ đáp án gỗ */
.wood-option-btn {
  position: relative;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: clamp(8px, 1.4vh, 14px) clamp(12px, 1.8vw, 18px);
  min-height: clamp(52px, 7vh, 68px);
  background:
    repeating-linear-gradient(1deg, rgba(120, 53, 15, 0.06) 0 1px, transparent 1px 9px),
    linear-gradient(180deg, #f4d7a4 0%, #e8c183 100%);
  border: 2.5px solid #a15a28;
  border-bottom: 5px solid #713a1a;
  border-radius: 16px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(120, 53, 15, 0.18);
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-align: left;
  box-sizing: border-box;
  z-index: 2;
  pointer-events: auto;
}

.wood-option-btn:hover:not(:disabled) {
  border-color: #f59e0b;
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(217, 119, 6, 0.3);
}

.wood-option-btn.opt--selected {
  border-color: #d97706;
  background: linear-gradient(180deg, #fef08a 0%, #fde047 100%);
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.45);
}

/* Chồi lá xanh mọc từ góc cành gỗ */
.wood-leaf {
  position: absolute;
  top: -8px;
  left: -6px;
  font-size: 1.15rem;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.15));
  pointer-events: none;
}

/* Huy hiệu Quả Táo Đỏ viền chữ cái */
.apple-fruit-badge {
  position: relative;
  width: var(--apple-size);
  height: var(--apple-size);
  min-width: var(--apple-size);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  pointer-events: none;
}

.apple-sprite {
  width: var(--apple-size);
  height: var(--apple-size);
  max-height: var(--apple-size);
  display: block;
  object-fit: contain;
  pointer-events: none;
}

.apple-fallback-svg {
  width: 100%;
  height: 100%;
  display: block;
  filter: drop-shadow(0 2px 4px rgba(153, 27, 27, 0.4));
  object-fit: contain;
  pointer-events: none;
}

.apple-letter-overlay {
  position: absolute;
  top: 54%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #ffffff;
  font-size: clamp(1.1rem, 2vh, 1.35rem);
  font-weight: 900;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
  pointer-events: none;
}

.wood-option-text {
  flex: 1;
  min-width: 0;
  font-size: clamp(1rem, 1.8vh, 1.25rem);
  font-weight: 800;
  color: #451a03;
  line-height: 1.35;
  pointer-events: none;
}

/* Phản hồi đúng/sai */
.wood-option-btn.opt--correct {
  background: #dcfce7 !important;
  border-color: #22c55e !important;
  border-bottom-color: #15803d !important;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.4), 0 6px 18px rgba(34, 197, 94, 0.25) !important;
}

.wood-option-btn.opt--wrong {
  background: #fee2e2 !important;
  border-color: #ef4444 !important;
  border-bottom-color: #991b1b !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.4) !important;
}

.wood-option-btn.opt--dimmed {
  opacity: 0.4 !important;
  filter: grayscale(0.4) !important;
  pointer-events: none !important;
}

.option-feedback-icon {
  font-size: 1.4rem;
  flex-shrink: 0;
}

.icon-star {
  filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.85));
}

/* Bảng fallback dạng tự luận / matching */
.fallback-wood-panel {
  width: 100%;
  flex: 0 1 auto;
  min-height: 0;
  max-height: min(45vh, 100%);
  overflow-y: auto;
  overscroll-behavior: contain;
  background:
    repeating-linear-gradient(1deg, rgba(120, 53, 15, 0.06) 0 1px, transparent 1px 9px),
    linear-gradient(180deg, #f4d7a4 0%, #e8c183 100%);
  border: 2.5px solid #8b4b22;
  border-bottom: 5px solid #713a1a;
  border-radius: 18px;
  padding: clamp(10px, 1.5vh, 16px);
  pointer-events: auto;
}

.fallback-wood-panel :deep(.quiz-card--fruit) {
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  color: #451a03;
}

.fallback-wood-panel :deep(.quiz-card--fruit .v-field) {
  border-radius: 12px;
  background: #fff8e7;
  color: #451a03;
}

.fallback-wood-panel :deep(.quiz-card--fruit .v-field__outline) {
  --v-field-border-opacity: 1;
  color: #8b5a2b;
}

.fallback-wood-panel :deep(.quiz-card--fruit .v-field--focused) {
  box-shadow: 0 0 0 3px rgba(234, 179, 8, 0.3);
}

.fallback-wood-panel :deep(.quiz-card--fruit .v-field--focused .v-field__outline) {
  color: #d97706;
}

.fallback-wood-panel :deep(.quiz-card--fruit input),
.fallback-wood-panel :deep(.quiz-card--fruit textarea),
.fallback-wood-panel :deep(.quiz-card--fruit .v-label) {
  color: #451a03;
}

.fallback-wood-panel :deep(.quiz-card--fruit input),
.fallback-wood-panel :deep(.quiz-card--fruit textarea) {
  user-select: text;
}

@keyframes bannerShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.network-error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  background: #fef2f2;
  border: 2px solid #fca5a5;
  color: #991b1b;
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 700;
  margin-bottom: 10px;
  pointer-events: none;
}

.retry-btn {
  background: #dc2626;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 0.8rem;
  font-weight: 800;
  cursor: pointer;
  pointer-events: auto;
}

/* NÚT CHÍNH "HÁI!" DẠNG TẤM GỖ 3D */
.wood-action-area {
  width: 100%;
  display: flex;
  justify-content: center;
  flex: 0 0 auto;
  pointer-events: none;
}

.tree-center-trunk--fallback .wood-action-area {
  margin-top: auto;
}

.btn-harvest {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-width: clamp(200px, 30vw, 280px);
  padding: clamp(10px, 1.8vh, 16px) clamp(24px, 4vw, 42px);
  background: linear-gradient(180deg, #a1a1aa 0%, #71717a 100%);
  border: 3px solid #e4e4e7;
  border-bottom: 6px solid #52525b;
  border-radius: 999px;
  color: #ffffff;
  font-size: clamp(1.15rem, 2vh, 1.4rem);
  font-weight: 900;
  cursor: not-allowed;
  opacity: 0.65;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
  pointer-events: auto;
}

.btn-harvest--ready {
  background: linear-gradient(180deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
  border-color: #fef08a;
  border-bottom-color: #92400e;
  opacity: 1;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(217, 119, 6, 0.45);
}

.btn-harvest--ready:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(217, 119, 6, 0.55);
}

.btn-harvest--ready:active {
  transform: translateY(2px);
  border-bottom-width: 2px;
}

/* Nút Tiếp tục sau khi đã có kết quả */
.btn-harvest--continue {
  background: linear-gradient(180deg, #34d399 0%, #10b981 50%, #059669 100%);
  border-color: #a7f3d0;
  border-bottom-color: #065f46;
  opacity: 1;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.45);
}

.btn-harvest--continue:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(16, 185, 129, 0.55);
}

.harvest-icon {
  font-size: 1.45rem;
}

/* =====================================================================
   MÀN CHINH PHỤC CÂY THỬ THÁCH (KẾT QUẢ)
   ===================================================================== */
.fruit-finish-modal {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.78);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 100;
  pointer-events: none;
}

.finish-wood-card {
  background: #ffffff;
  border: 6px solid #d97706;
  border-radius: 32px;
  padding: 36px 30px;
  text-align: center;
  max-width: 460px;
  width: 100%;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
  animation: finishModalPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  pointer-events: auto;
}

@keyframes finishModalPop {
  from { transform: scale(0.7) translateY(40px); opacity: 0; }
  to   { transform: scale(1) translateY(0); opacity: 1; }
}

.finish-trophy-emojis {
  font-size: 3.5rem;
  margin-bottom: 12px;
}

.finish-heading {
  font-size: 1.65rem;
  font-weight: 900;
  color: #78350f;
  margin-bottom: 10px;
}

.finish-desc {
  font-size: 1.1rem;
  color: #475569;
  line-height: 1.5;
  margin-bottom: 22px;
}

.finish-stats-row {
  display: flex;
  gap: 14px;
  justify-content: center;
  margin-bottom: 24px;
}

.finish-stat-box {
  background: #fef3c7;
  border: 2px solid #fde68a;
  border-radius: 16px;
  padding: 12px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 900;
  color: #78350f;
}

.stat-title {
  font-size: 0.8rem;
  color: #92400e;
  font-weight: 700;
}

.btn-submit-harvest {
  width: 100%;
  padding: 14px;
  border-radius: 999px;
  border: none;
  border-bottom: 5px solid #065f46;
  background: linear-gradient(180deg, #34d399, #10b981);
  color: #ffffff;
  font-size: 1.25rem;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(16, 185, 129, 0.4);
  transition: all 0.2s ease;
}

.btn-submit-harvest:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(16, 185, 129, 0.5);
}

.fruit-finish-fade-enter-active { transition: opacity 0.4s ease; }
.fruit-finish-fade-enter-from   { opacity: 0; }

/* =====================================================================
   RESPONSIVE: 1920x1080, 1366x768, 1280x720, 768x1024, 375x667
   ===================================================================== */
@media (max-width: 768px) {
  .fruit-game {
    --squirrel-height: clamp(100px, 16vh, 140px);
    --squirrel-width: clamp(178px, 28.5vh, 250px);
    --peg-width: clamp(56px, 8.84vh, 78px);
    --peg-center: clamp(35px, calc(4.42vh + 7px), 46px);
    --bubble-size: 42px;
    --acorn-clearance: 22px;
    height: calc(100dvh - 72px);
    min-height: 0;
    max-height: calc(100dvh - 72px);
    overflow-y: auto;
  }

  .fruit-header {
    top: 10px;
    left: 10px;
    right: 10px;
    gap: 8px;
  }

  .tree-finish-flag-node {
    top: 50px;
    left: 50%;
    display: flex;
  }

  .tree-progress-board {
    padding: 4px 10px;
  }

  .stopwatch-pill {
    padding: 4px 10px;
  }

  .fruit-arena {
    grid-template-columns: minmax(0, 1fr);
    padding: 68px 12px 16px 12px;
    gap: 12px;
    height: auto;
  }

  .tree-climbing-zone {
    height: clamp(
      320px,
      calc(var(--squirrel-height) + var(--flag-height) + 180px),
      460px
    );
    min-height: 320px;
  }

  .braided-rope {
    left: 20%;
  }

  .climber-progress-marker,
  .tree-finish-flag-node {
    left: 20%;
  }

  .squirrel-speech-bubble {
    width: 42px;
    height: 42px;
    left: calc(100% - 8px);
    top: 8%;
  }

  .bubble-caption { font-size: 0.55rem; }
  .bubble-num { font-size: 0.95rem; }

  .wood-question-card {
    padding: var(--acorn-clearance) 16px 14px;
    border-radius: 20px;
  }

  .acorn-crest-badge {
    width: 40px;
    height: 40px;
    top: -20px;
  }

  .acorn-fallback-emoji { font-size: 1.25rem; }

  /* Trên mobile: Chuyển lưới đáp án thành 1 cột */
  .wood-options-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .wood-option-btn {
    padding: 10px 14px;
    min-height: 52px;
  }

  .btn-harvest {
    min-width: 100%;
    padding: 12px 20px;
  }
}

/* =====================================================================
   PREFERS-REDUCED-MOTION
   ===================================================================== */
.reduce-motion * {
  animation: none !important;
  transition: none !important;
}

.reduce-motion .timer--warning {
  animation: none !important;
}

.reduce-motion .timer--expired {
  animation: none !important;
}

.timer--expired {
  background: linear-gradient(180deg, #b91c1c 0%, #7f1d1d 100%);
  border-color: #fecaca;
  animation: timerPulse 0.8s ease-in-out infinite alternate;
}
</style>
