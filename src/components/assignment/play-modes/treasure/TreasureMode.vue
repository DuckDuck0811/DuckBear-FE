<template>
  <div class="treasure-game" :class="{ 'reduce-motion': game.prefersReducedMotion.value }">

    <!-- LỚP TRANG TRÍ NỀN (POINTER-EVENTS: NONE) -->
    <div class="desert-decorations" aria-hidden="true">
      <div class="dune-silhouette dune-bg-1"></div>
      <div class="dune-silhouette dune-bg-2"></div>
      <div class="pyramid-shadow"></div>
    </div>

    <!-- ===== HEADER: HÀNH TRÌNH TÌM RƯƠNG VÀNG, MẢNH BẢN ĐỒ, VÀNG & ÂM THANH ===== -->
    <header class="treasure-header" role="banner">
      <!-- Thẻ trái: Tiêu đề + Câu x/N + Icon la bàn -->
      <div class="header-pill journey-pill">
        <div class="compass-icon-wrap" aria-hidden="true">
          <GameSprite mode="treasure" name="compass" class="compass-sprite">
            <span class="compass-fallback-emoji">🧭</span>
          </GameSprite>
        </div>
        <div class="journey-text-col">
          <span class="journey-caption">{{ t('playModes.treasureUI.journeyTitle') }}</span>
          <strong class="journey-progress">
            {{ t('playModes.treasureUI.questionProgress', { current: game.displayNum.value, total: game.totalQuestions.value }) }}
          </strong>
        </div>
      </div>

      <!-- Thẻ phải: Mảnh bản đồ + Số Vàng + Nút âm thanh -->
      <div class="treasure-header-right">
        <!-- Thẻ mảnh bản đồ -->
        <div class="header-pill map-pieces-pill" :title="t('playModes.treasureUI.mapPieces', { count: mapPiecesCount, total: game.totalQuestions.value })">
          <span class="pill-icon" aria-hidden="true">🗺️</span>
          <strong class="pill-stat">
            {{ mapPiecesCount }} / {{ game.totalQuestions.value }}
          </strong>
          <span class="pill-sub-label">Mảnh</span>
        </div>

        <!-- Thẻ số vàng tích lũy -->
        <div class="header-pill gold-pill" :title="t('playModes.treasureUI.goldCoins', { amount: goldCoinsCount })">
          <span class="pill-icon" aria-hidden="true">💎</span>
          <strong class="pill-stat gold-digits">{{ goldCoinsCount }}</strong>
          <span class="pill-sub-label">Vàng</span>
        </div>

        <!-- Nút bật/tắt âm thanh -->
        <SoundToggle
          :model-value="game.isSoundEnabled.value"
          @toggle="game.toggleSound()"
        />
      </div>
    </header>

    <!-- ===== HÀNG CHIP SỐ CÂU 1..N TRÊN TẤM GIẤY DA (PARCHMENT MAP STRIP) ===== -->
    <section class="parchment-chips-wrapper" aria-label="Danh sách câu hỏi">
      <div class="parchment-chips-board">
        <button
          v-for="(item, idx) in session.questions.value"
          :key="item.question?.id || idx"
          type="button"
          class="question-step-chip"
          :class="getChipClass(idx, item.question?.id)"
          :aria-current="idx === session.currentIndex.value ? 'step' : undefined"
          :aria-label="`Câu ${idx + 1}`"
          @click="onJumpToQuestion(idx)"
        >
          <span class="chip-num">{{ idx + 1 }}</span>
          <!-- Dấu tích nhỏ nếu câu đã trả lời đúng -->
          <span v-if="isQuestionCorrect(item.question?.id)" class="chip-check" aria-hidden="true">✓</span>
        </button>
      </div>
    </section>

    <!-- ===== ARENA CHÍNH: RƯƠNG VÀNG (TRÁI) & CUỘN GIẤY DA CÂU HỎI + ĐÁP ÁN (GIỮA/PHẢI) ===== -->
    <main class="treasure-arena">

      <!-- ── CỘT TRÁI: RƯƠNG VÀNG & HIỆU ỨNG PHÁT SÁNG ── -->
      <section class="treasure-chest-stage" aria-label="Rương vàng báu vật">
        <div class="chest-anchor-box">
          <!-- Hiệu ứng vàng tung bay khi trả lời đúng -->
          <div v-if="showCoinsSparkle" class="coins-sparkle-burst" aria-hidden="true">
            <span class="sparkle-gem gem-1">💎</span>
            <span class="sparkle-gem gem-2">🪙</span>
            <span class="sparkle-gem gem-3">✨</span>
            <span class="sparkle-gem gem-4">🪙</span>
            <span class="sparkle-gem gem-5">💎</span>
          </div>

          <!-- Rương vàng báu vật (chest-idle / chest-happy / chest-sad) -->
          <div
            class="chest-character-wrap"
            :class="chestMotionClass"
          >
            <GameSprite
              mode="treasure"
              :name="chestState"
              :alt="chestAltText"
              class="chest-sprite"
            >
              <!-- Fallback SVG Rương vàng cổ điển -->
              <svg viewBox="0 0 160 140" class="chest-fallback-svg">
                <defs>
                  <linearGradient id="chest-wood" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#b45309" />
                    <stop offset="40%" stop-color="#78350f" />
                    <stop offset="100%" stop-color="#451a03" />
                  </linearGradient>
                  <linearGradient id="chest-gold-trim" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#fef08a" />
                    <stop offset="50%" stop-color="#f59e0b" />
                    <stop offset="100%" stop-color="#b45309" />
                  </linearGradient>
                </defs>
                <!-- Thân rương -->
                <rect x="20" y="55" width="120" height="70" rx="10" fill="url(#chest-wood)" stroke="#291205" stroke-width="3" />
                <!-- Nẹp vàng thân rương -->
                <rect x="24" y="58" width="14" height="64" fill="url(#chest-gold-trim)" />
                <rect x="122" y="58" width="14" height="64" fill="url(#chest-gold-trim)" />
                <rect x="73" y="58" width="14" height="64" fill="url(#chest-gold-trim)" />
                <!-- Nắp rương vòm cong -->
                <path d="M16 56 Q80 18 144 56 L138 62 L22 62 Z" fill="url(#chest-wood)" stroke="#291205" stroke-width="3" />
                <path d="M22 55 Q80 22 138 55" stroke="url(#chest-gold-trim)" stroke-width="8" fill="none" />
                <!-- Ổ khóa vàng ở giữa -->
                <rect x="68" y="58" width="24" height="28" rx="6" fill="#fbbf24" stroke="#78350f" stroke-width="2.5" />
                <circle cx="80" cy="68" r="4" fill="#451a03" />
                <polygon points="78,68 82,68 83,78 77,78" fill="#451a03" />
                <!-- Vàng châu báu lấp lánh hé mở nếu đúng -->
                <ellipse v-if="chestState === 'chestHappy'" cx="80" cy="50" rx="36" ry="12" fill="#fef08a" opacity="0.8" />
              </svg>
            </GameSprite>
          </div>
        </div>
      </section>

      <!-- ── CỘT PHẢI: CUỘN GIẤY DA CÂU HỎI + LƯỚI ĐÁP ÁN + 2 NÚT HÀNH ĐỘNG ── -->
      <section class="treasure-quiz-panel" v-if="currentQuestionItem && !game.isComplete.value">

        <!-- CUỘN GIẤY DA CHỨA CÂU HỎI (PARCHMENT SCROLL) -->
        <div class="parchment-scroll-box">
          <!-- Tag MẶT THỨ SỐ n (hoặc MẬT THƯ SỐ n) -->
          <div class="scroll-tag-badge">
            <span class="tag-pin-icon" aria-hidden="true">📍</span>
            <span class="tag-text">
              {{ t('playModes.treasureUI.secretLetter', { current: game.displayNum.value }) }}
            </span>
          </div>

          <!-- Đề bài câu hỏi chữ nâu đậm -->
          <h2 class="scroll-question-text">
            {{ currentQuestionItem.question.content }}
          </h2>
        </div>

        <!-- HƯỚNG DẪN CHỌN NHIỀU ĐÁP ÁN NẾU LÀ MULTI_MCQ -->
        <div v-if="isMultiMcqType" class="multi-select-hint-chip">
          <span aria-hidden="true">💡</span>
          <span>{{ t('playModes.treasureUI.multiChoiceHint') }}</span>
        </div>

        <!-- LƯỚI ĐÁP ÁN: CÁC THẺ KEM VIỀN CAM BO TRÒN (2 CỘT HOẶC 1 CỘT MOBILE) -->
        <div
          v-if="isMcqType"
          class="treasure-options-grid"
          :class="{
            'grid--two-options': options.length <= 2,
            'grid--three-options': options.length === 3,
          }"
          role="listbox"
          :aria-label="`Đáp án câu hỏi ${game.displayNum.value}`"
        >
          <button
            v-for="(option, idx) in options"
            :key="option.id"
            type="button"
            class="treasure-option-btn"
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
            <!-- Hình mờ núi có cờ ở góc phải thẻ (pointer-events: none) -->
            <div class="mountain-watermark" aria-hidden="true">
              <span>🏔️🚩</span>
            </div>

            <!-- Huy hiệu tròn cam A/B/C/D kèm nhãn "Điểm A/B/C/D" ĐÚNG THỨ TỰ -->
            <div class="point-badge-group">
              <div class="point-letter-pill">
                <span class="letter-char">{{ letters[idx] }}</span>
              </div>
              <span class="point-name-label">
                {{ t('playModes.treasureUI.pointLabel', { letter: letters[idx] }) }}
              </span>
            </div>

            <!-- Nội dung chữ của đáp án -->
            <span class="option-content-text">{{ option.content }}</span>

            <!-- Biểu tượng đúng/sai sau khi check -->
            <span
              v-if="getOptionStatus(option.id) !== 'normal' && getOptionStatus(option.id) !== 'dimmed'"
              class="option-status-icon"
              aria-hidden="true"
            >
              <span v-if="getOptionStatus(option.id) === 'correct'" class="icon-star">⭐</span>
              <span v-else class="icon-wrong">❌</span>
            </span>
          </button>
        </div>

        <!-- MULTI_MCQ: Chọn nhiều đáp án -->
        <div
          v-else-if="isMultiMcqType"
          class="treasure-options-grid"
          role="listbox"
          aria-multiselectable="true"
        >
          <button
            v-for="(option, idx) in options"
            :key="option.id"
            type="button"
            class="treasure-option-btn treasure-option-btn--multi"
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
            <div class="mountain-watermark" aria-hidden="true">
              <span>🏔️🚩</span>
            </div>

            <div class="point-badge-group">
              <div class="point-letter-pill">
                <span v-if="isOptionSelected(option.id)" class="letter-char">✓</span>
                <span v-else class="letter-char">{{ letters[idx] }}</span>
              </div>
              <span class="point-name-label">
                {{ t('playModes.treasureUI.pointLabel', { letter: letters[idx] }) }}
              </span>
            </div>

            <span class="option-content-text">{{ option.content }}</span>

            <span
              v-if="getOptionStatus(option.id) !== 'normal' && getOptionStatus(option.id) !== 'dimmed'"
              class="option-status-icon"
              aria-hidden="true"
            >
              <span v-if="getOptionStatus(option.id) === 'correct'" class="icon-star">⭐</span>
              <span v-else class="icon-wrong">❌</span>
            </span>
          </button>
        </div>

        <!-- DÀNH CHO CÂU ĐIỀN KHUYẾT / TỰ LUẬN / MATCHING -->
        <div v-else class="parchment-fallback-card">
          <QuestionItem
            :item="currentQuestionItem"
            :index="session.currentIndex.value"
            :answer="session.answers[currentQuestionItem.question.id] || {}"
            :level="1"
            mode="treasure"
            :hide-stem="true"
            :disabled="game.isChecking.value || isChecked"
            @answered="onQuestionAnswered"
          />
        </div>

        <!-- Thông báo lỗi mạng + nút thử lại -->
        <div v-if="game.networkError.value" class="network-error-banner" role="alert">
          <span>⚠️ {{ game.networkError.value }}</span>
          <button type="button" class="retry-btn" @click="onActionClick">
            🔄 {{ t('playModes.shared.retry') }}
          </button>
        </div>

        <!-- HAI NÚT HÀNH ĐỘNG DƯỚI CÙNG -->
        <div class="treasure-actions-row">
          <!-- Nút phụ: Khởi Quét Điểm Này (bỏ chọn để chọn lại) -->
          <button
            type="button"
            class="btn-reset-selection"
            :disabled="!canResetSelection"
            @click="onResetSelection"
            :aria-label="t('playModes.treasureUI.actionResetSelection')"
          >
            <span class="action-icon" aria-hidden="true">🔄</span>
            <span class="action-label">{{ t('playModes.treasureUI.actionResetSelection') }}</span>
          </button>

          <!-- Nút chính: Mở rương! / Chặng tiếp theo > -->
          <button
            type="button"
            class="btn-main-action"
            :class="{
              'btn-main--ready': canCommit && !isChecked,
              'btn-main--continue': isChecked,
            }"
            :disabled="(!canCommit && !isChecked) || game.isChecking.value"
            @click="onActionClick"
            :aria-label="actionButtonText"
          >
            <span class="action-icon" aria-hidden="true">
              {{ isChecked ? '🧭' : (game.isChecking.value ? '⏳' : '🗝️') }}
            </span>
            <span class="action-label">{{ actionButtonText }}</span>
          </button>
        </div>
      </section>
    </main>

    <!-- ===== MÀN TỔNG KẾT: CHINH PHỤC KHO BÁU THÀNH CÔNG ===== -->
    <Transition name="treasure-modal-fade">
      <div v-if="game.isComplete.value" class="treasure-finish-modal" role="dialog" aria-modal="true" aria-label="Kết quả săn kho báu">
        <div class="finish-parchment-card">
          <div class="finish-chest-emojis" aria-hidden="true">💎 🎁 🗝️ 🏆</div>
          <h2 class="finish-heading">{{ t('playModes.treasureUI.finishHeadline') }}</h2>
          <p class="finish-desc">
            {{ t('playModes.treasureUI.finishDesc', {
                pieces: mapPiecesCount,
                total: game.totalQuestions.value,
                gold: goldCoinsCount,
              }) }}
          </p>

          <div class="finish-rewards-row">
            <div class="reward-box">
              <span class="reward-val">🗺️ {{ mapPiecesCount }} / {{ game.totalQuestions.value }}</span>
              <span class="reward-lbl">Mảnh bản đồ</span>
            </div>
            <div class="reward-box">
              <span class="reward-val">💎 {{ goldCoinsCount }}</span>
              <span class="reward-lbl">Vàng tích lũy</span>
            </div>
            <div class="reward-box">
              <span class="reward-val">🔥 ×{{ game.maxCombo.value }}</span>
              <span class="reward-lbl">{{ t('playModes.shared.combo') }} cao nhất</span>
            </div>
          </div>

          <button
            type="button"
            class="btn-submit-rewards"
            :disabled="session.submitting.value"
            @click="session.submit()"
          >
            {{ session.submitting.value
               ? t('playModes.treasureUI.submitting')
               : t('playModes.treasureUI.submitNow') }}
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

const letters = ['A', 'B', 'C', 'D'];

// ─── Trạng thái local ───────────────────────────────────────────────────────
const selectedId        = ref(null);
const selectedIds       = ref([]);
const chestState        = ref('chestIdle');  // 'chestIdle' | 'chestHappy' | 'chestSad'
const chestMotionClass  = ref('');           // '' | 'chest--glow' | 'chest--rumble'
const showCoinsSparkle  = ref(false);

// ─── Computed từ session ────────────────────────────────────────────────────
const currentQuestionItem = computed(() => props.session.currentQuestionItem?.value);
const options             = computed(() => currentQuestionItem.value?.question?.options || []);
const currentQId          = computed(() => currentQuestionItem.value?.question?.id);

const isMcqType = computed(() => {
  const tp = currentQuestionItem.value?.question?.type;
  return tp === 'MCQ' || tp === 'TRUE_FALSE';
});

const isMultiMcqType = computed(() => {
  return currentQuestionItem.value?.question?.type === 'MULTI_MCQ';
});

// Câu hỏi hiện tại đã check hay chưa
const isChecked = computed(() => {
  const qId = currentQId.value;
  return qId != null && (
    props.session.checkedQuestions?.[String(qId)] != null ||
    game.checkedDetails?.value?.[qId] != null
  );
});

// Thông tin chi tiết check câu hỏi
const checkedInfo = computed(() => {
  const qId = currentQId.value;
  return game.checkedDetails?.value?.[qId] || props.session.checkedQuestions?.[String(qId)];
});

// Điểm số & Mảnh bản đồ
const mapPiecesCount = computed(() => game.stars.value);
const goldCoinsCount = computed(() => game.stars.value * 100);

const hasSelected = computed(() => {
  if (isMcqType.value)      return selectedId.value !== null;
  if (isMultiMcqType.value) return selectedIds.value.length > 0;
  return false;
});

// Nút Khởi Quét Điểm Này (chỉ dùng trước khi check và khi đã chọn)
const canResetSelection = computed(() => {
  if (isChecked.value || game.isChecking.value) return false;
  return hasSelected.value;
});

const canCommit = computed(() => {
  if (game.isChecking.value || isChecked.value) return false;
  if (isMcqType.value)      return selectedId.value !== null;
  if (isMultiMcqType.value) return selectedIds.value.length > 0;
  const qId = currentQId.value;
  return qId != null && props.session.hasAnswer?.(qId);
});

const chestAltText = computed(() => {
  if (chestState.value === 'chestHappy') return 'Rương báu mở sáng lấp lánh vàng châu báu';
  if (chestState.value === 'chestSad')   return 'Rương báu khóa chặt';
  return 'Rương vàng báu vật bí ẩn';
});

// Nhãn nút chính
const actionButtonText = computed(() => {
  if (game.isChecking.value) {
    return t('playModes.treasureUI.checking');
  }
  if (isChecked.value) {
    if (props.session.isLastQuestion?.value) {
      return t('playModes.treasureUI.actionFinishJourney');
    }
    return t('playModes.treasureUI.actionNextStage');
  }
  return t('playModes.treasureUI.actionOpenChest');
});

// ─── XÁC ĐỊNH TRẠNG THÁI TỪNG CHIP SỐ CÂU 1..N ─────────────────────────────
function getChipClass(idx, qId) {
  if (idx === props.session.currentIndex?.value) {
    return 'chip--current';
  }
  if (qId != null && props.session.checkedQuestions?.[String(qId)]) {
    return props.session.checkedQuestions[String(qId)].isCorrect
      ? 'chip--correct'
      : 'chip--wrong';
  }
  return 'chip--unanswered';
}

function isQuestionCorrect(qId) {
  if (!qId) return false;
  return props.session.checkedQuestions?.[String(qId)]?.isCorrect === true;
}

// ─── NHẢY CÂU HỎI QUA CHIP SỐ CÂU ──────────────────────────────────────────
function onJumpToQuestion(targetIndex) {
  if (game.isChecking.value) return;
  props.session.goTo(targetIndex);
}

// ─── XÁC ĐỊNH TRẠNG THÁI ĐÁP ÁN SAU KHI CÓ KẾT QUẢ ─────────────────────────
function getOptionStatus(optId) {
  const qId = currentQId.value;
  if (!isChecked.value || !qId) return 'normal';

  const info = checkedInfo.value;
  const isSelected = isOptionSelected(optId);
  const correctOptionIds = info?.correctOptionIds || [];

  const isCorrectOpt =
    correctOptionIds.includes(optId) ||
    (isSelected && info?.isCorrect === true);

  if (isCorrectOpt) {
    return 'correct';
  }
  if (isSelected && info?.isCorrect === false) {
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

function onQuestionAnswered(questionId) {
  const ans = props.session.answers[questionId];
  if (ans) props.session.setAnswer(questionId, { ...ans });
}

// ─── NÚT "KHỞI QUÉT ĐIỂM NÀY" (BỎ CHỌN ĐỂ CHỌN LẠI) ────────────────────────
function onResetSelection() {
  if (isChecked.value || game.isChecking.value) return;
  game.playSfx('click');
  selectedId.value = null;
  selectedIds.value = [];
  if (currentQId.value) {
    props.session.setAnswer(currentQId.value, { selectedOptionId: null, selectedOptionIds: [] });
  }
}

// ─── NÚT CHÍNH: MỞ RƯƠNG HOẶC CHẶNG TIẾP THEO ─────────────────────────────
async function onActionClick() {
  if (isChecked.value) {
    onContinueNext();
    return;
  }
  await onConfirmDig();
}

async function onConfirmDig() {
  const q = currentQuestionItem.value?.question;
  if (!q || game.isChecking.value || isChecked.value) return;

  let patch;
  if (isMcqType.value && selectedId.value !== null) {
    patch = { selectedOptionId: selectedId.value, selectedOptionIds: [selectedId.value] };
  } else if (isMultiMcqType.value && selectedIds.value.length > 0) {
    patch = { selectedOptionId: selectedIds.value[0], selectedOptionIds: [...selectedIds.value] };
  }

  chestState.value = 'chestIdle';
  chestMotionClass.value = '';
  showCoinsSparkle.value = false;

  await game.submitAndCheck(q.id, patch, {
    delayNext: 1500,
    onResolved: (isCorrect) => {
      if (isCorrect) {
        // Đúng: Rương sáng lên, vàng bay ra
        chestState.value = 'chestHappy';
        chestMotionClass.value = 'chest--glow';
        showCoinsSparkle.value = true;
      } else {
        // Sai: Rương khóa lại, rung nhẹ
        chestState.value = 'chestSad';
        chestMotionClass.value = 'chest--rumble';
      }

      setTimeout(() => {
        chestState.value = 'chestIdle';
        chestMotionClass.value = '';
        showCoinsSparkle.value = false;
      }, 1800);
    },
  });
}

function onContinueNext() {
  game.continueToNext();
}

// ─── BÀN PHÍM (A-D, 1-4, Enter) ────────────────────────────────────────────
function onKeydown(e) {
  if (game.isComplete.value) return;

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

  if (e.key === 'Enter') {
    e.preventDefault();
    onActionClick();
  }
}

// ─── ĐỒNG BỘ TRẠNG THÁI KHI ĐỔI CÂU HỎI ─────────────────────────────────────
function syncQuestionState() {
  const qId = currentQId.value;
  const ans = qId ? props.session.answers[qId] : null;

  selectedId.value = ans?.selectedOptionId ?? null;
  selectedIds.value = ans?.selectedOptionIds
    ? [...ans.selectedOptionIds]
    : (ans?.selectedOptionId ? [ans.selectedOptionId] : []);

  chestState.value = 'chestIdle';
  chestMotionClass.value = '';
  showCoinsSparkle.value = false;
}

watch(() => props.session.currentIndex?.value, () => {
  syncQuestionState();
});

onMounted(() => {
  document.addEventListener('keydown', onKeydown);
  syncQuestionState();
});

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
/* =====================================================================
   SĂN KHO BÁU — TREASURE MODE (HÀNH TRÌNH TÌM RƯƠNG VÀNG)
   ===================================================================== */
.treasure-game {
  --chest-width: clamp(120px, 15vw, 175px);
  --parchment-max-width: 700px;

  position: relative;
  width: 100%;
  height: calc(100dvh - 84px);
  min-height: 560px;
  max-height: calc(100dvh - 84px);
  overflow: hidden;
  border-radius: 28px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.28);

  /* bg.png phủ kín toàn bộ khung, không bị cắt đáy */
  background-color: #f59e0b;
  background-image:
    radial-gradient(ellipse at 80% 20%, #fef08a 0%, #fde047 30%, transparent 60%),
    linear-gradient(180deg, #fef3c7 0%, #fde68a 35%, #f59e0b 70%, #d97706 100%);
  background-image: url('/assets/modes/treasure/bg.png'),
    linear-gradient(180deg, #fef3c7 0%, #fde68a 35%, #f59e0b 70%, #d97706 100%);
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center bottom;

  display: flex;
  flex-direction: column;
  user-select: none;
  font-family: inherit;
}

/* LỚP TRANG TRÍ ĐỒI CÁT VÀ BÓNG KIM TỰ THÁP (POINTER-EVENTS: NONE) */
.desert-decorations {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.dune-silhouette {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 25%;
  opacity: 0.15;
  background: radial-gradient(ellipse at 50% 100%, #78350f, transparent 70%);
}

/* =====================================================================
   HEADER: HÀNH TRÌNH TÌM RƯƠNG VÀNG, MẢNH BẢN ĐỒ, VÀNG & ÂM THANH
   ===================================================================== */
.treasure-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 20px 6px;
  z-index: 20;
}

.header-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 14px;
  background: rgba(254, 243, 199, 0.95);
  backdrop-filter: blur(8px);
  border: 2px solid #d97706;
  border-radius: 999px;
  box-shadow: 0 4px 12px rgba(180, 83, 9, 0.18);
}

/* Thẻ trái: Tiêu đề + Câu x/N */
.journey-pill {
  white-space: nowrap;
}

.compass-icon-wrap {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.compass-fallback-emoji {
  font-size: 1.4rem;
}

.journey-text-col {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}

.journey-caption {
  font-size: 0.65rem;
  font-weight: 800;
  color: #78350f;
  letter-spacing: 0.4px;
}

.journey-progress {
  font-size: 1.05rem;
  font-weight: 900;
  color: #451a03;
}

/* Thẻ phải: Mảnh bản đồ & Vàng */
.treasure-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pill-icon {
  font-size: 1.25rem;
}

.pill-stat {
  font-size: 1.05rem;
  font-weight: 900;
  color: #78350f;
}

.gold-digits {
  color: #b45309;
}

.pill-sub-label {
  font-size: 0.72rem;
  font-weight: 800;
  color: #92400e;
}

/* =====================================================================
   HÀNG CHIP SỐ CÂU 1..N TRÊN TẤM GIẤY DA (PARCHMENT STRIP)
   ===================================================================== */
.parchment-chips-wrapper {
  position: relative;
  width: 100%;
  max-width: 920px;
  margin: 0 auto;
  padding: 0 20px 4px;
  z-index: 15;
  box-sizing: border-box;
}

.parchment-chips-board {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: clamp(60px, 8.5vh, 85px);
  overflow-y: auto;
  padding: 8px 14px;
  background: linear-gradient(180deg, #fef3c7 0%, #fde68a 100%);
  border: 2px solid #d97706;
  border-radius: 18px;
  box-shadow: inset 0 2px 6px rgba(120, 53, 15, 0.15), 0 4px 12px rgba(0, 0, 0, 0.08);
}

.question-step-chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 34px;
  height: 28px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
}

.question-step-chip:hover {
  transform: scale(1.08);
}

/* 4 Trạng thái chip */
.chip--current {
  background: linear-gradient(135deg, #f97316, #ea580c);
  color: #ffffff;
  font-weight: 900;
  border: 2px solid #fef08a;
  box-shadow: 0 0 10px rgba(249, 115, 22, 0.7);
  transform: scale(1.05);
}

.chip--correct {
  background: #dcfce7;
  border: 1.5px solid #22c55e;
  color: #15803d;
}

.chip--check {
  font-size: 0.75rem;
  font-weight: 900;
}

.chip--wrong {
  background: #fee2e2;
  border: 1.5px solid #ef4444;
  color: #b91c1c;
}

.chip--unanswered {
  border: 1.8px dashed #d97706;
  background: rgba(254, 243, 199, 0.5);
  color: #78350f;
}

/* =====================================================================
   ARENA 2 KHU VỰC: RƯƠNG VÀNG (TRÁI) & CÂU HỎI + ĐÁP ÁN (PHẢI)
   ===================================================================== */
.treasure-arena {
  position: relative;
  flex: 1;
  display: grid;
  grid-template-columns: minmax(130px, 20%) 1fr;
  gap: 16px;
  padding: 4px 24px 16px 20px;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  z-index: 10;
}

/* CỘT TRÁI: RƯƠNG VÀNG */
.treasure-chest-stage {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 20px;
  z-index: 8;
  pointer-events: none;
}

.chest-anchor-box {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chest-character-wrap {
  width: var(--chest-width);
  filter: drop-shadow(0 8px 18px rgba(120, 53, 15, 0.4));
  transition: transform 0.3s ease;
}

.chest-sprite {
  width: 100%;
  display: block;
}

.chest-sprite :deep(img),
.chest-fallback-svg {
  width: 100%;
  height: auto;
  max-height: 160px;
  object-fit: contain;
  display: block;
}

/* Rương phát sáng khi đúng */
.chest--glow {
  animation: chestGlowHappy 0.6s ease-in-out infinite alternate;
}

@keyframes chestGlowHappy {
  from { transform: scale(1) translateY(0); filter: drop-shadow(0 0 10px rgba(250, 204, 21, 0.6)); }
  to   { transform: scale(1.08) translateY(-6px); filter: drop-shadow(0 0 24px rgba(250, 204, 21, 0.95)); }
}

/* Rương rung khi sai */
.chest--rumble {
  animation: chestRumbleSad 0.45s ease-in-out forwards;
}

@keyframes chestRumbleSad {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px) rotate(-3deg); }
  75% { transform: translateX(6px) rotate(3deg); }
}

/* Hiệu ứng vàng tung bay */
.coins-sparkle-burst {
  position: absolute;
  top: -30px;
  display: flex;
  gap: 6px;
  animation: coinsFlyUp 1.2s ease-out forwards;
}

@keyframes coinsFlyUp {
  0% { transform: translateY(10px) scale(0.5); opacity: 0; }
  40% { transform: translateY(-30px) scale(1.2); opacity: 1; }
  100% { transform: translateY(-50px) scale(1); opacity: 0; }
}

.sparkle-gem {
  font-size: 1.4rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

/* =====================================================================
   CỘT PHẢI: CUỘN GIẤY DA CÂU HỎI + ĐÁP ÁN + HAI NÚT HÀNH ĐỘNG
   ===================================================================== */
.treasure-quiz-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: var(--parchment-max-width);
  margin: 0 auto;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
}

/* CUỘN GIẤY DA (PARCHMENT SCROLL) */
.parchment-scroll-box {
  position: relative;
  width: 100%;
  background: linear-gradient(180deg, #fef3c7 0%, #fde68a 35%, #fcd34d 100%);
  border: 3.5px solid #d97706;
  border-bottom: 5.5px solid #b45309;
  border-radius: 24px;
  padding: clamp(14px, 2.2vh, 20px) clamp(18px, 2.8vw, 30px);
  box-shadow: 0 8px 24px rgba(180, 83, 9, 0.28);
  margin-bottom: clamp(10px, 1.4vh, 14px);
  text-align: center;
  flex-shrink: 0;
}

/* Tag MẶT THỨ SỐ n */
.scroll-tag-badge {
  position: absolute;
  top: -16px;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #fef3c7;
  border: 2px solid #d97706;
  border-radius: 999px;
  padding: 2px 14px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12);
}

.tag-pin-icon {
  font-size: 0.9rem;
}

.tag-text {
  font-size: 0.72rem;
  font-weight: 900;
  color: #78350f;
  letter-spacing: 0.5px;
}

.scroll-question-text {
  font-size: clamp(1.05rem, 1.9vh, 1.35rem);
  font-weight: 800;
  color: #451a03;
  line-height: 1.4;
  margin: 0;
  word-break: break-word;
}

/* Chip hướng dẫn Multi-select */
.multi-select-hint-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #fef3c7;
  border: 1.5px solid #d97706;
  border-radius: 999px;
  padding: 3px 12px;
  font-size: 0.75rem;
  font-weight: 800;
  color: #78350f;
  margin-bottom: 10px;
}

/* LƯỚI ĐÁP ÁN: THẺ KEM VIỀN CAM BO TRÒN */
.treasure-options-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: clamp(8px, 1.3vh, 14px);
  margin-bottom: clamp(10px, 1.5vh, 16px);
}

.treasure-options-grid.grid--two-options {
  grid-template-columns: 1fr;
}

/* Thẻ thứ 3 nằm bên cột trái hàng dưới khi có 3 đáp án */
.treasure-options-grid.grid--three-options .treasure-option-btn:nth-child(3) {
  grid-column: 1;
}

/* Thẻ đáp án */
.treasure-option-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: clamp(8px, 1.4vh, 12px) clamp(12px, 1.8vw, 16px);
  min-height: clamp(50px, 6.8vh, 64px);
  background: linear-gradient(180deg, #fffbeb 0%, #fef3c7 60%, #fde68a 100%);
  border: 2.5px solid #f59e0b;
  border-bottom: 4.5px solid #d97706;
  border-radius: 18px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(180, 83, 9, 0.15);
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-align: left;
  box-sizing: border-box;
  overflow: hidden;
}

.treasure-option-btn:hover:not(:disabled) {
  border-color: #d97706;
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(217, 119, 6, 0.28);
}

.treasure-option-btn.opt--selected {
  border-color: #ea580c;
  background: linear-gradient(180deg, #ffedd5 0%, #fed7aa 100%);
  box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.4);
}

/* Hình mờ núi có cờ ở góc phải */
.mountain-watermark {
  position: absolute;
  right: 6px;
  bottom: 2px;
  font-size: 1.5rem;
  opacity: 0.18;
  pointer-events: none;
}

/* Cụm huy hiệu Điểm A/B/C/D */
.point-badge-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.point-letter-pill {
  width: clamp(34px, 4.4vh, 42px);
  height: clamp(34px, 4.4vh, 42px);
  border-radius: 50%;
  background: linear-gradient(135deg, #f97316, #ea580c);
  border: 2px solid #fef08a;
  box-shadow: 0 3px 0 #9a3412, 0 4px 8px rgba(234, 88, 12, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
}

.letter-char {
  color: #ffffff;
  font-size: clamp(1rem, 1.8vh, 1.25rem);
  font-weight: 900;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.point-name-label {
  font-size: 0.72rem;
  font-weight: 900;
  color: #78350f;
  white-space: nowrap;
}

.option-content-text {
  flex: 1;
  font-size: clamp(0.95rem, 1.7vh, 1.2rem);
  font-weight: 800;
  color: #451a03;
  line-height: 1.35;
  z-index: 2;
}

/* Trạng thái sau check */
.treasure-option-btn.opt--correct {
  background: #dcfce7 !important;
  border-color: #22c55e !important;
  border-bottom-color: #15803d !important;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.35), 0 6px 16px rgba(34, 197, 94, 0.2) !important;
}

.treasure-option-btn.opt--wrong {
  background: #fee2e2 !important;
  border-color: #ef4444 !important;
  border-bottom-color: #991b1b !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.35) !important;
}

.treasure-option-btn.opt--dimmed {
  opacity: 0.42 !important;
  filter: grayscale(0.4) !important;
  pointer-events: none !important;
}

.option-status-icon {
  font-size: 1.35rem;
  flex-shrink: 0;
}

.icon-star {
  filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.8));
}

/* Fallback tự luận / matching */
.parchment-fallback-card {
  width: 100%;
  background: #ffffff;
  border: 2.5px solid #d97706;
  border-radius: 18px;
  padding: 12px;
  margin-bottom: 12px;
  max-height: 230px;
  overflow-y: auto;
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
}

/* HAI NÚT HÀNH ĐỘNG DƯỚI CÙNG */
.treasure-actions-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
}

/* Nút phụ: Khởi Quét Điểm Này (nâu) */
.btn-reset-selection {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: clamp(9px, 1.5vh, 14px) clamp(16px, 2.5vw, 22px);
  background: linear-gradient(180deg, #92400e 0%, #78350f 100%);
  border: 2px solid #b45309;
  border-bottom: 4px solid #451a03;
  border-radius: 999px;
  color: #fef3c7;
  font-size: clamp(0.9rem, 1.6vh, 1.05rem);
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.btn-reset-selection:hover:not(:disabled) {
  transform: translateY(-2px);
  background: linear-gradient(180deg, #b45309 0%, #92400e 100%);
}

.btn-reset-selection:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Nút chính cam: Mở rương! / Chặng tiếp theo */
.btn-main-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: clamp(160px, 24vw, 220px);
  padding: clamp(9px, 1.6vh, 14px) clamp(20px, 3.2vw, 32px);
  background: linear-gradient(180deg, #a1a1aa 0%, #71717a 100%);
  border: 2px solid #e4e4e7;
  border-bottom: 5px solid #52525b;
  border-radius: 999px;
  color: #ffffff;
  font-size: clamp(1.05rem, 1.8vh, 1.25rem);
  font-weight: 900;
  cursor: not-allowed;
  opacity: 0.65;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.btn-main--ready {
  background: linear-gradient(180deg, #fb923c 0%, #f97316 50%, #ea580c 100%);
  border-color: #fef08a;
  border-bottom-color: #9a3412;
  opacity: 1;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(234, 88, 12, 0.45);
}

.btn-main--ready:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(234, 88, 12, 0.55);
}

.btn-main--continue {
  background: linear-gradient(180deg, #34d399 0%, #10b981 50%, #059669 100%);
  border-color: #a7f3d0;
  border-bottom-color: #065f46;
  opacity: 1;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45);
}

.btn-main--continue:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(16, 185, 129, 0.55);
}

/* =====================================================================
   MÀN TỔNG KẾT: CHINH PHỤC KHO BÁU THÀNH CÔNG
   ===================================================================== */
.treasure-finish-modal {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.78);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 100;
}

.finish-parchment-card {
  background: linear-gradient(180deg, #fffbeb 0%, #fef3c7 50%, #fde68a 100%);
  border: 5px solid #d97706;
  border-radius: 32px;
  padding: 34px 28px;
  text-align: center;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
  animation: treasureFinishPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes treasureFinishPop {
  from { transform: scale(0.7) translateY(40px); opacity: 0; }
  to   { transform: scale(1) translateY(0); opacity: 1; }
}

.finish-chest-emojis {
  font-size: 3.2rem;
  margin-bottom: 10px;
}

.finish-heading {
  font-size: 1.6rem;
  font-weight: 900;
  color: #78350f;
  margin-bottom: 8px;
}

.finish-desc {
  font-size: 1.05rem;
  color: #451a03;
  line-height: 1.5;
  margin-bottom: 20px;
}

.finish-rewards-row {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 22px;
}

.reward-box {
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid #d97706;
  border-radius: 14px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.reward-val {
  font-size: 1.35rem;
  font-weight: 900;
  color: #78350f;
}

.reward-lbl {
  font-size: 0.75rem;
  color: #92400e;
  font-weight: 700;
}

.btn-submit-rewards {
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

.btn-submit-rewards:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(16, 185, 129, 0.5);
}

.treasure-modal-fade-enter-active { transition: opacity 0.4s ease; }
.treasure-modal-fade-enter-from   { opacity: 0; }

/* =====================================================================
   RESPONSIVE: 1920x1080, 1366x768, 1280x720, 768x1024, 375x667
   ===================================================================== */
@media (max-width: 768px) {
  .treasure-game {
    height: auto;
    min-height: calc(100dvh - 72px);
    max-height: none;
    overflow-y: auto;
  }

  .treasure-header {
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px 12px 4px;
  }

  .journey-pill {
    padding: 4px 10px;
  }

  .header-pill {
    padding: 4px 10px;
  }

  .parchment-chips-wrapper {
    padding: 0 10px;
  }

  /* Trên mobile: Hàng chip cuộn ngang mượt mà */
  .parchment-chips-board {
    flex-wrap: nowrap;
    overflow-x: auto;
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;
    padding: 6px 8px;
    max-height: none;
  }

  .question-step-chip {
    flex-shrink: 0;
  }

  .treasure-arena {
    grid-template-columns: 1fr;
    padding: 10px 12px 16px;
    gap: 12px;
    height: auto;
  }

  .treasure-chest-stage {
    padding-bottom: 0;
    height: 100px;
  }

  .chest-character-wrap {
    width: 100px;
  }

  .parchment-scroll-box {
    padding: 14px 16px;
    border-radius: 18px;
  }

  .scroll-tag-badge {
    top: -14px;
    padding: 2px 10px;
  }

  .treasure-options-grid {
    grid-template-columns: 1fr !important;
    gap: 8px;
  }

  .treasure-option-btn {
    padding: 8px 12px;
    min-height: 48px;
  }

  .treasure-actions-row {
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }

  .btn-reset-selection,
  .btn-main-action {
    width: 100%;
    min-width: 0;
  }
}

/* =====================================================================
   PREFERS-REDUCED-MOTION
   ===================================================================== */
.reduce-motion * {
  animation: none !important;
  transition: none !important;
}
</style>
