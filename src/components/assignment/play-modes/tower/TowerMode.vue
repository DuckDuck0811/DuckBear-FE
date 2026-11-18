<template>
  <div
    class="tower-game"
    :class="{ 'reduce-motion': game.prefersReducedMotion.value }"
  >
    <!-- ===== A3. HEADER NỔI: CÁC THẺ BO TRÒN BÁN TRONG SUỐT NỔI TRÊN CẢNH ===== -->
    <header class="tower-floating-header" role="banner">
      <!-- Thẻ 1: Tiến độ tháp (Trái) -->
      <div class="floating-pill floor-pill">
        <span class="castle-emoji" aria-hidden="true">🏰</span>
        <div class="pill-col">
          <span class="pill-caption">{{
            t("playModes.towerUI.headerCaption")
          }}</span>
          <strong class="pill-value">
            {{
              t("playModes.towerUI.floorLabel", {
                current: game.displayNum.value,
                total: game.totalQuestions.value,
              })
            }}
          </strong>
        </div>
      </div>

      <!-- Thẻ 2: Thanh tiến độ leo có cờ chạy (Giữa) -->
      <div class="floating-pill progress-pill" aria-label="Tiến độ tháp">
        <div class="progress-track-wrapper">
          <div
            class="progress-flag"
            :style="{
              left: `${Math.min(97, (game.displayNum.value / game.totalQuestions.value) * 100)}%`,
            }"
            aria-hidden="true"
          >
            🚩
          </div>
          <div class="progress-track">
            <div
              class="progress-fill"
              :style="{
                width: `${(game.displayNum.value / game.totalQuestions.value) * 100}%`,
              }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Thẻ 3: Sao vàng + Nút âm thanh (Phải) -->
      <div class="floating-pill stats-pill">
        <div class="star-group">
          <span aria-hidden="true" class="star-icon">⭐</span>
          <strong class="star-count">{{ game.stars.value }}</strong>
        </div>
        <SoundToggle
          :model-value="game.isSoundEnabled.value"
          @toggle="game.toggleSound()"
        />
      </div>
    </header>

    <!-- ===== ARENA CHÍNH: CẢNH THÁC/THÁP (TRÁI) & BẢNG CÂU HỎI ĐÈ LÊN CẢNH (PHẢI) ===== -->
    <main class="tower-arena">
      <!-- ── A2. KHU VỰC CẢNH TRÁI: THÁP Ở 25-35%, ĐỨNG TRƯỚC THÁC NƯỚC, KÉO TẬN ĐÁY ── -->
      <section
        class="tower-scene-layer"
        aria-label="Khu vực tháp đá và khủng long"
      >
        <!-- THÁP ĐÁ GHÉP ẢNH: Kéo xuống tận đáy, xếp tầng liền mạch -->
        <div
          class="tower-assembly-column"
          :class="{
            'tower-assembly-column--near-peak': isNearTowerPeak,
            'tower-assembly-column--far-from-peak': !isNearTowerPeak,
            'tower-assembly-column--one-past-floor':
              game.displayNum.value === 2,
            'tower-assembly-column--no-past-floor':
              game.displayNum.value === 1,
          }"
          aria-label="Tháp đá nhiều tầng"
        >
          <!-- Đỉnh tháp tower-top.png -->
          <div v-if="isNearTowerPeak" class="tower-top-cap">
            <GameSprite mode="tower" name="towerTop" class="tower-top-sprite">
              <svg viewBox="0 0 578 432" class="tower-top-fallback-svg">
                <line
                  x1="289"
                  y1="70"
                  x2="289"
                  y2="160"
                  stroke="#ca8a04"
                  stroke-width="6"
                  stroke-linecap="butt"
                />
                <polygon
                  points="289,75 380,115 289,155"
                  fill="#ef4444"
                  stroke="#b91c1c"
                  stroke-width="3"
                />
                <path
                  d="M180 230 Q289 150 398 230 L420 316 L158 316 Z"
                  fill="#64748b"
                  stroke="#334155"
                  stroke-width="6"
                />
              </svg>
            </GameSprite>
          </div>

          <!-- Các tầng tháp: Xếp chồng tower-floor.png (cửa sổ khoảng 5 tầng quanh tầng hiện tại) -->
          <TransitionGroup
            name="tower-floor"
            tag="div"
            class="tower-floors-stack"
            :class="{ 'tower-floors-stack--far-from-peak': !isNearTowerPeak }"
          >
            <div
              v-for="floorNum in visibleFloors"
              :key="floorNum"
              class="tower-floor-module"
              :class="{
                'floor--cleared': isTierCompleted(floorNum),
                'floor--current': isTierCurrent(floorNum),
                'floor--above-current': floorNum > game.displayNum.value,
                'floor--below-current': floorNum < game.displayNum.value,
                'floor--past-secondary':
                  floorNum < game.displayNum.value - 1,
                'floor--locked': isTierLocked(floorNum),
                'floor--celebrating': isTierJustCleared(floorNum),
              }"
            >
              <!-- Sprite tầng đá -->
              <GameSprite
                mode="tower"
                name="towerFloor"
                width="100%"
                class="tower-floor-sprite"
              >
                <svg viewBox="0 0 578 432" class="tower-floor-fallback-svg">
                  <path
                    d="M150 60 L428 60 L442 372 L136 372 Z"
                    fill="#64748b"
                    stroke="#334155"
                    stroke-width="6"
                  />
                  <path
                    d="M210 372 L210 190 Q289 120 368 190 L368 372 Z"
                    fill="#1e293b"
                  />
                  <rect
                    x="260"
                    y="220"
                    width="58"
                    height="46"
                    rx="8"
                    fill="#f59e0b"
                    stroke="#b45309"
                    stroke-width="4"
                  />
                </svg>
              </GameSprite>

              <!-- Overlay biểu tượng và nhãn tầng -->
              <div class="floor-overlay-container">
                <!-- Nhãn "Tầng n": Chip nhỏ cạnh trái, z-index cao -->
                <span
                  v-if="isTierCurrent(floorNum)"
                  class="floor-badge-pill pill--current-active"
                >
                  Tầng {{ floorNum }}
                </span>

                <!-- C1. Ô CỬA VÒM: Mỗi tầng đúng MỘT biểu tượng rõ nét -->
                <div class="floor-arch-status">
                  <!-- Tầng đã check: Ổ khóa mở + dấu ✓ xanh ngọc -->
                  <div
                    v-if="isTierCompleted(floorNum)"
                    class="status-marker marker-cleared"
                  >
                    <span class="marker-unlock">🔓</span>
                    <span class="marker-check">✓</span>
                  </div>

                  <!-- Tầng hiện tại: Viền sáng + Mũi tên chỉ lên SVG nhấp nháy nhẹ -->
                  <div
                    v-else-if="isTierCurrent(floorNum)"
                    class="status-marker marker-current"
                  >
                    <div class="current-halo-ring"></div>
                    <div class="current-up-arrow">
                      <svg
                        viewBox="0 0 24 24"
                        width="28"
                        height="28"
                        class="arrow-up-svg"
                      >
                        <path
                          d="M12 3 L3 13 H8 V21 H16 V13 H21 Z"
                          fill="#fef08a"
                          stroke="#b45309"
                          stroke-width="1.8"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </div>
                  </div>

                  <!-- C1. Tầng chưa tới: Hiện ổ khóa ĐÓNG ở giữa cửa vòm -->
                  <div v-else class="status-marker marker-locked">
                    <span class="marker-lock">🔒</span>
                  </div>
                </div>
                <span
                  v-if="isTierJustCleared(floorNum)"
                  class="floor-flying-star"
                  aria-hidden="true"
                >⭐</span>
              </div>
            </div>
          </TransitionGroup>
        </div>

        <!-- Lớp bọt nước chân thác (che mờ tầng dưới cùng chìm vào đáy) -->
        <div class="waterfall-mist-base" aria-hidden="true"></div>

        <!-- BỆ ĐÁ & KHỦNG LONG: ĐẶT TẠI ĐÁY-TRÁI -->
        <div class="dino-and-platform-group">
          <div class="dino-character-anchor">
            <div
              class="dino-character-motion-wrap"
              :class="heroMotionClass"
            >
              <GameSprite
                mode="tower"
                :src="heroPose.src"
                :flip="heroPose.flip"
                :alt="heroAltText"
                height="100%"
                class="dino-sprite"
                :class="`dino-sprite--${heroState}`"
              >
                <svg viewBox="0 0 323 432" class="dino-fallback-svg">
                  <circle
                    cx="160"
                    cy="180"
                    r="90"
                    fill="#22c55e"
                    stroke="#15803d"
                    stroke-width="8"
                  />
                  <circle cx="190" cy="165" r="16" fill="#0f172a" />
                  <circle cx="195" cy="160" r="6" fill="#ffffff" />
                  <ellipse
                    cx="160"
                    cy="280"
                    rx="95"
                    ry="85"
                    fill="#22c55e"
                    stroke="#15803d"
                    stroke-width="8"
                  />
                  <rect
                    x="70"
                    y="220"
                    width="60"
                    height="80"
                    rx="14"
                    fill="#84cc16"
                    stroke="#4d7c0f"
                    stroke-width="6"
                  />
                  <path
                    d="M120 220 Q170 240 210 220 L210 245 Q170 265 120 245 Z"
                    fill="#ef4444"
                  />
                </svg>
              </GameSprite>
            </div>
          </div>

          <!-- Dải bệ đá platform.png: Đáy-trái, mask mờ mép phải -->
          <div class="platform-strip-wrap" aria-hidden="true">
            <GameSprite
              mode="tower"
              name="platform"
              width="100%"
              height="100%"
              class="platform-sprite"
            >
              <svg
                viewBox="0 0 774 432"
                class="platform-fallback-svg"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 214 Q387 180 774 214 L774 432 L0 432 Z"
                  fill="#64748b"
                  stroke="#334155"
                  stroke-width="8"
                />
              </svg>
            </GameSprite>
          </div>
        </div>
      </section>

      <!-- ── A4. BẢNG CÂU HỎI & ĐÁP ÁN: ĐÈ LÊN CẢNH BÊN PHẢI (NỀN TRẮNG/KEM BÁN TRONG SUỐT) ── -->
      <section
        class="tower-quiz-panel"
        v-if="currentQuestionItem && !game.isComplete.value"
      >
        <!-- THẺ CÂU HỎI: Nền kem, viền xanh nhạt, bóng đổ mềm, tia sáng ✦ -->
        <div class="quiz-board">
          <span class="sparkle sparkle-tl" aria-hidden="true">✦</span>
          <span class="sparkle sparkle-br" aria-hidden="true">✦</span>

          <div class="quiz-board-header">
            <div class="quiz-board-badge">
              <span aria-hidden="true">📖</span>
              <span>{{
                t("playModes.towerUI.questionBadge", {
                  current: game.displayNum.value,
                  total: game.totalQuestions.value,
                })
              }}</span>
            </div>
          </div>

          <h2 class="quiz-question-text">
            {{ currentQuestionItem.question.content }}
          </h2>
        </div>

        <!-- A5, C2. CÁC ĐÁP ÁN: HUY HIỆU A/B/C/D 4 HÌNH DẠNG KHÁC NHAU CÓ BÓNG NỔI -->
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
              'ans--correct': getOptionStatus(option.id) === 'correct',
              'ans--wrong': getOptionStatus(option.id) === 'wrong',
              'ans--dimmed': getOptionStatus(option.id) === 'dimmed',
            }"
            :disabled="game.isChecking.value || isChecked"
            @click="onPick(option.id)"
          >
            <!-- A5. Huy hiệu A/B/C/D bo hình khác nhau có bóng nổi -->
            <div class="answer-pill" :class="`pill-${idx % 4}`">
              <span class="pill-letter">{{ getOptionLabel(idx) }}</span>
            </div>

            <!-- Nội dung chữ có độ tương phản cao -->
            <span class="answer-text">{{ option.content }}</span>

            <!-- C2. Biểu tượng kết quả sau khi check: đúng = ⭐, sai = ❌ -->
            <span
              v-if="
                getOptionStatus(option.id) !== 'normal' &&
                getOptionStatus(option.id) !== 'dimmed'
              "
              class="answer-feedback-icon"
              aria-hidden="true"
            >
              <span
                v-if="getOptionStatus(option.id) === 'correct'"
                class="icon-star"
                >⭐</span
              >
              <span v-else class="icon-wrong">❌</span>
            </span>
          </button>
        </div>

        <!-- MULTI_MCQ: Chọn nhiều đáp án -->
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
              'ans--correct': getOptionStatus(option.id) === 'correct',
              'ans--wrong': getOptionStatus(option.id) === 'wrong',
              'ans--dimmed': getOptionStatus(option.id) === 'dimmed',
            }"
            :disabled="game.isChecking.value || isChecked"
            @click="onToggleMulti(option.id)"
          >
            <div class="answer-pill" :class="`pill-${idx % 4}`">
              <span v-if="isOptionSelected(option.id)" class="pill-letter"
                >✓</span
              >
              <span v-else class="pill-letter">{{
                getOptionLabel(idx)
              }}</span>
            </div>
            <span class="answer-text">{{ option.content }}</span>
            <span
              v-if="
                getOptionStatus(option.id) !== 'normal' &&
                getOptionStatus(option.id) !== 'dimmed'
              "
              class="answer-feedback-icon"
              aria-hidden="true"
            >
              <span
                v-if="getOptionStatus(option.id) === 'correct'"
                class="icon-star"
                >⭐</span
              >
              <span v-else class="icon-wrong">❌</span>
            </span>
          </button>
        </div>

        <!-- Fallback cho dạng tự luận / điền khuyết / matching -->
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

        <!-- Thông báo lỗi mạng + nút thử lại -->
        <div
          v-if="game.networkError.value"
          class="network-error-banner"
          role="alert"
        >
          <span>⚠️ {{ game.networkError.value }}</span>
          <button type="button" class="retry-btn" @click="onConfirmClimb">
            🔄 {{ t("playModes.shared.retry") }}
          </button>
        </div>

        <!-- NÚT LEO THÁC 3D -->
        <div class="climb-action-wrap">
          <button
            type="button"
            class="btn-climb"
            :class="{ 'btn-climb--ready': canCommit || canContinue }"
            :disabled="!canCommit && !canContinue"
            @click="canContinue ? game.continueToNext() : onConfirmClimb()"
            :aria-label="
              t(
                canContinue
                  ? 'playModes.towerUI.actionClimbContinue'
                  : 'playModes.towerUI.actionClimb',
              )
            "
          >
            <span
              v-if="!canContinue"
              class="btn-climb-flag"
              aria-hidden="true"
            >🏁</span>
            <span class="btn-climb-text">
              {{
                game.isChecking.value
                  ? t("playModes.towerUI.checking")
                  : canContinue
                    ? t("playModes.towerUI.actionClimbContinue")
                    : t("playModes.towerUI.actionClimb")
              }}
            </span>
          </button>
        </div>
      </section>
    </main>

    <!-- ===== MÀN CHINH PHỤC ĐỈNH THÁC (KẾT QUẢ) ===== -->
    <Transition name="tower-finish-fade">
      <div
        v-if="game.isComplete.value"
        class="tower-peak-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Kết quả"
      >
        <div class="peak-card">
          <div class="peak-icons" aria-hidden="true">🏆 🚩 ✨</div>
          <h2 class="peak-heading">
            {{ t("playModes.towerUI.finishHeadline") }}
          </h2>
          <p class="peak-desc">
            {{
              t("playModes.towerUI.finishDesc", {
                total: game.totalQuestions.value,
                stars: game.stars.value,
              })
            }}
          </p>

          <div class="peak-stats">
            <div class="peak-stat">
              <span class="stat-num"
                >{{ game.stars.value }} / {{ game.totalQuestions.value }}</span
              >
              <span class="stat-lbl">Câu đúng ⭐</span>
            </div>
            <div class="peak-stat">
              <span class="stat-num">🔥 ×{{ game.maxCombo.value }}</span>
              <span class="stat-lbl"
                >{{ t("playModes.shared.combo") }} cao nhất</span
              >
            </div>
          </div>

          <button
            type="button"
            class="btn-submit-peak"
            :disabled="session.submitting.value"
            @click="session.submit()"
          >
            {{
              session.submitting.value
                ? t("playModes.towerUI.submitting")
                : t("playModes.towerUI.submitNow")
            }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import QuestionItem from "../../QuestionItem.vue";
import GameSprite from "../shared/GameSprite.vue";
import SoundToggle from "../shared/SoundToggle.vue";
import { useQuizGame } from "../composables/useQuizGame.js";
import { GAME_ASSETS } from "../assets.config.js";

const props = defineProps({
  session: { type: Object, required: true },
});

const { t } = useI18n();
const game = useQuizGame(props.session);

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// ─── Trạng thái local ───────────────────────────────────────────────────────
const heroState = ref("idle");
const heroMotionClass = ref("");
let heroPoseTimer = null;
const selectedId = ref(null); // MCQ single-select
const selectedIds = ref([]); // MULTI_MCQ multi-select

// ─── Computed từ session ────────────────────────────────────────────────────
const currentQuestionItem = computed(
  () => props.session.currentQuestionItem?.value,
);
const options = computed(
  () => currentQuestionItem.value?.question?.options || [],
);

const isMcqType = computed(() => {
  const tp = currentQuestionItem.value?.question?.type;
  return tp === "MCQ" || tp === "TRUE_FALSE";
});

const isMultiMcqType = computed(() => {
  return currentQuestionItem.value?.question?.type === "MULTI_MCQ";
});

const isChecked = computed(() => {
  const qId = currentQuestionItem.value?.question?.id;
  return (
    qId != null &&
    (props.session.checkedQuestions?.[String(qId)] != null ||
      game.checkedDetails?.value?.[qId] != null)
  );
});

const isNearTowerPeak = computed(
  () => game.totalQuestions.value - game.displayNum.value <= 3,
);

const canCommit = computed(() => {
  if (game.isChecking.value || isChecked.value) return false;
  if (isMcqType.value) return selectedId.value !== null;
  if (isMultiMcqType.value) return selectedIds.value.length > 0;
  const qId = currentQuestionItem.value?.question?.id;
  return qId != null && props.session.hasAnswer?.(qId);
});

const canContinue = computed(
  () => isChecked.value && !game.isChecking.value,
);

const heroPose = computed(() => GAME_ASSETS.tower.hero[heroState.value]);

const heroAltText = computed(() => {
  if (heroState.value === "happy")
    return "Khủng long vui mừng vì trả lời đúng";
  if (heroState.value === "sad") return "Khủng long buồn vì chưa qua được tầng";
  return "Khủng long đứng nhìn về tháp đá";
});

// ─── C2. XÁC ĐỊNH TRẠNG THÁI TỪNG ĐÁP ÁN SAU KHI CÓ KẾT QUẢ ─────────────────
// Đúng tô xanh + ⭐, người dùng chọn sai tô đỏ, còn lại mờ đi
function getOptionStatus(optId) {
  const qId = currentQuestionItem.value?.question?.id;
  if (!isChecked.value || !qId) return "normal";

  const checkInfo =
    game.checkedDetails?.value?.[qId] ||
    props.session.checkedQuestions?.[String(qId)];
  const isSelected = isOptionSelected(optId);
  const correctOptionIds = checkInfo?.correctOptionIds || [];

  // Đáp án đúng
  const isCorrectOption =
    correctOptionIds.includes(optId) ||
    (isSelected && checkInfo?.isCorrect === true);

  if (isCorrectOption) {
    return "correct";
  }
  if (isSelected && checkInfo?.isCorrect === false) {
    return "wrong";
  }
  return "dimmed";
}

// ─── CỬA SỔ HIỂN THỊ TẦNG THÁP (TẦNG HIỆN TẠI + 2 TRỞ XUỐNG CÁC TẦNG ĐÃ QUA) ─
const visibleFloors = computed(() => {
  const total = game.totalQuestions.value;
  const cur = game.displayNum.value;
  const topFloor = isNearTowerPeak.value
    ? total
    : Math.min(total, cur + 2);
  const bottomFloor = Math.max(1, cur - 2);

  const floors = [];
  for (let f = topFloor; f >= bottomFloor; f--) {
    floors.push(f);
  }
  return floors;
});

function getTierCheckInfo(floorNum) {
  const questionId =
    props.session.questions?.value?.[floorNum - 1]?.question?.id;
  if (questionId == null) return null;

  return (
    game.checkedDetails.value[questionId] ||
    props.session.checkedQuestions?.[String(questionId)] ||
    null
  );
}

function isTierCompleted(floorNum) {
  const questionId =
    props.session.questions?.value?.[floorNum - 1]?.question?.id;
  return (
    floorNum < game.displayNum.value ||
    (questionId != null &&
      props.session.checkedQuestions?.[String(questionId)] != null)
  );
}

function isTierJustCleared(floorNum) {
  return (
    isTierCurrent(floorNum) &&
    game.checkFeedback.value === "correct" &&
    getTierCheckInfo(floorNum)?.isCorrect === true
  );
}

function isTierCurrent(floorNum) {
  return floorNum === game.displayNum.value;
}

function isTierLocked(floorNum) {
  return !isTierCurrent(floorNum) && !isTierCompleted(floorNum);
}

// ─── Chọn đáp án ────────────────────────────────────────────────────────────
function onPick(optId) {
  if (game.isChecking.value || isChecked.value) return;
  game.playSfx("click");
  selectedId.value = optId;
}

function onToggleMulti(optId) {
  if (game.isChecking.value || isChecked.value) return;
  game.playSfx("click");
  const idx = selectedIds.value.indexOf(optId);
  if (idx >= 0) {
    selectedIds.value.splice(idx, 1);
  } else {
    selectedIds.value.push(optId);
  }
}

function isOptionSelected(optId) {
  if (isMcqType.value) return selectedId.value === optId;
  if (isMultiMcqType.value) return selectedIds.value.includes(optId);
  return false;
}

function onQuestionAnswered(questionId) {
  const ans = props.session.answers[questionId];
  if (ans) props.session.setAnswer(questionId, { ...ans });
}

function getOptionLabel(index) {
  return letters[index] || String(index + 1);
}

// ─── B4. COMMIT CÂU TRẢ LỜI & HIỆU ỨNG LEO THÁP ────────────────────────────
async function onConfirmClimb() {
  const q = currentQuestionItem.value?.question;
  if (!q || game.isChecking.value || isChecked.value) return;

  let patch;
  if (isMcqType.value && selectedId.value !== null) {
    patch = {
      selectedOptionId: selectedId.value,
      selectedOptionIds: [selectedId.value],
    };
  } else if (isMultiMcqType.value && selectedIds.value.length > 0) {
    patch = {
      selectedOptionId: selectedIds.value[0],
      selectedOptionIds: [...selectedIds.value],
    };
  }

  await game.submitAndCheck(q.id, patch, {
    delayNext: 1500,
    onResolved: (isCorrect) => {
      // Chỉ đổi tư thế sau khi checkQuestion trả kết quả
      clearTimeout(heroPoseTimer);
      heroState.value = isCorrect ? "happy" : "sad";
      heroMotionClass.value = isCorrect ? "dino--jumping" : "dino--shaking";
      if (isCorrect && props.session.isLastQuestion?.value) return;
      heroPoseTimer = setTimeout(() => {
        heroState.value = "idle";
        heroMotionClass.value = "";
      }, 1650);
    },
  });
}

// ─── Bàn phím ──────────────────────────────────────────────────────────────
function onKeydown(e) {
  if (game.isComplete.value || game.isChecking.value || isChecked.value) return;
  const opts = options.value;
  const key = e.key.toUpperCase();
  const idx = /^[1-9]$/.test(e.key)
    ? Number(e.key) - 1
    : /^[A-Z]$/.test(key)
      ? key.charCodeAt(0) - 65
      : undefined;

  if (idx !== undefined && opts[idx]) {
    if (isMcqType.value) onPick(opts[idx].id);
    else if (isMultiMcqType.value) onToggleMulti(opts[idx].id);
  }
  if (e.key === "Enter" && canCommit.value) {
    e.preventDefault();
    onConfirmClimb();
  }
}

// Chuyển sang câu mới: reset trạng thái về đứng chờ (hero-idle)
watch(
  () => props.session.currentIndex?.value,
  () => {
    clearTimeout(heroPoseTimer);
    selectedId.value = null;
    selectedIds.value = [];
    heroState.value = "idle";
    heroMotionClass.value = "";
  },
);

onMounted(() => {
  document.addEventListener("keydown", onKeydown);
});

onUnmounted(() => {
  clearTimeout(heroPoseTimer);
  document.removeEventListener("keydown", onKeydown);
});
</script>

<style scoped>
/* =====================================================================
   LEO THÁP — TOWER MODE (FULL-BLEED SCENIC REDESIGN)
   ===================================================================== */
.tower-game {
  /* Biến CSS điều khiển kích thước responsive */
  --tower-width: clamp(190px, 18.4vw, 247px);
  --platform-width: min(30%, 360px);

  position: relative;
  width: 100%;
  /* A6. Vừa đúng 1 màn hình trừ navbar, không phải cuộn */
  height: calc(100dvh - 100px);
  min-height: 0;
  max-height: calc(100dvh - 100px);
  box-sizing: border-box;
  overflow: hidden;
  border-radius: 28px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.22);

  /* A1. bg.png phủ KÍN toàn bộ khu vực game, không nằm trong hộp riêng, không có mảng xanh trơn */
  background-image: url("/assets/modes/tower/bg.png");
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center bottom;

  display: flex;
  flex-direction: column;
  user-select: none;
  font-family: inherit;
}

/* =====================================================================
   A3. HEADER NỔI: CÁC THẺ BO TRÒN NỀN TRẮNG BÁN TRONG SUỐT
   ===================================================================== */
.tower-floating-header {
  position: absolute;
  top: 16px;
  left: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  z-index: 30;
  pointer-events: none; /* Các thẻ con bật pointer-events */
}

.floating-pill {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 18px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(186, 230, 253, 0.9);
  border-radius: 999px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

/* Thẻ tầng bên trái */
.floor-pill {
  white-space: nowrap;
}

.castle-emoji {
  font-size: 1.6rem;
}

.pill-col {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}

.pill-caption {
  font-size: 0.65rem;
  font-weight: 800;
  color: #0369a1;
  letter-spacing: 0.5px;
}

.pill-value {
  font-size: 1.05rem;
  font-weight: 900;
  color: #0f172a;
}

/* Thẻ thanh tiến độ ở giữa */
.progress-pill {
  flex: 1;
  max-width: 440px;
  padding: 8px 16px;
}

.progress-track-wrapper {
  position: relative;
  width: 100%;
  height: 22px;
  display: flex;
  align-items: center;
}

.progress-track {
  width: 100%;
  height: 12px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.15);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #38bdf8, #0284c7);
  border-radius: 999px;
  transition: width 0.4s ease;
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.6);
}

.progress-flag {
  position: absolute;
  top: -8px;
  font-size: 1.25rem;
  transform: translateX(-50%);
  transition: left 0.4s ease;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  z-index: 2;
}

/* Thẻ sao và âm thanh bên phải */
.stats-pill {
  gap: 12px;
  border-color: rgba(252, 211, 77, 0.9);
  background: rgba(254, 252, 232, 0.92);
}

.star-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.star-icon {
  font-size: 1.35rem;
}

.star-count {
  font-size: 1.2rem;
  font-weight: 900;
  color: #b45309;
}

/* =====================================================================
   ARENA 2 KHU VỰC: CẢNH NỀN BÊN TRÁI & BẢNG CÂU HỎI BÊN PHẢI
   ===================================================================== */
.tower-arena {
  position: relative;
  flex: 1;
  display: grid;
  grid-template-columns: 1fr minmax(360px, 48%);
  gap: 24px;
  padding: 82px 24px 20px 24px;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
}

/* =====================================================================
   A2. CẢNH BÊN TRÁI: THÁP Ở KHOẢNG 25-35%, KÉO XUỐNG TẬN ĐÁY
   ===================================================================== */
/* Account for floor artwork and overlap so the current floor stays near 67.5%. */
.tower-scene-layer {
  container-type: size;
  --hero-height: 34cqh;
  --hero-max-height: 36cqh;
  --tower-current-center-from-bottom: clamp(226px, 21.86vw, 294px);
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: visible;
}

/* Cột tháp đá ghép ảnh: Đứng ở 30% chiều ngang (trong khoảng 25-35%) */
.tower-assembly-column {
  position: absolute;
  --tower-bottom-overflow: calc(
    var(--tower-current-center-from-bottom) - 32.5cqh
  );
  --tower-bottom-fade: 48px;
  left: 38%;
  transform: translateX(-50%);
  bottom: calc(0px - var(--tower-bottom-overflow));
  width: var(--tower-width);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 5;
  pointer-events: none;
}

.tower-assembly-column--one-past-floor {
  --tower-current-center-from-bottom: clamp(148px, 14.37vw, 193px);
}

.tower-assembly-column--no-past-floor {
  --tower-current-center-from-bottom: clamp(71px, 6.875vw, 92px);
}

.tower-top-cap {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: -35%;
  z-index: 6;
}

.tower-top-sprite {
  width: 100%;
  height: auto;
  transform: scaleX(1.09);
}

.tower-top-sprite :deep(img),
.tower-top-fallback-svg {
  width: 100%;
  height: auto;
  display: block;
}

.tower-floors-stack {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  row-gap: 0;
  -webkit-mask-image: linear-gradient(
    to bottom,
    #000 0%,
    #000 calc(100% - var(--tower-bottom-overflow) - var(--tower-bottom-fade)),
    transparent calc(100% - var(--tower-bottom-overflow))
  );
  mask-image: linear-gradient(
    to bottom,
    #000 0%,
    #000 calc(100% - var(--tower-bottom-overflow) - var(--tower-bottom-fade)),
    transparent calc(100% - var(--tower-bottom-overflow))
  );
}

.tower-floors-stack--far-from-peak {
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    #000 24%,
    #000 calc(100% - var(--tower-bottom-overflow) - var(--tower-bottom-fade)),
    transparent calc(100% - var(--tower-bottom-overflow))
  );
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    #000 24%,
    #000 calc(100% - var(--tower-bottom-overflow) - var(--tower-bottom-fade)),
    transparent calc(100% - var(--tower-bottom-overflow))
  );
}

.tower-floor-module {
  position: relative;
  width: 100%;
  flex: none;
  display: block;
}

.tower-floor-move {
  transition: transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tower-floor-enter-active,
.tower-floor-leave-active {
  transition: opacity 0.3s ease;
}

.tower-floor-enter-from,
.tower-floor-leave-to {
  opacity: 0;
}

.tower-floor-leave-active {
  position: absolute;
}

.tower-floor-module + .tower-floor-module {
  margin-top: -34%;
}

.tower-floor-sprite {
  width: 100%;
  height: auto;
  display: block !important;
}

.tower-floor-sprite :deep(img),
.tower-floor-fallback-svg {
  width: 100%;
  height: auto;
  display: block;
}

/* Overlay trên mỗi tầng */
.floor-overlay-container {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.floor-badge-pill {
  position: absolute;
  top: 10%;
  right: 0;
  max-width: none;
  overflow: visible;
  text-overflow: clip;
  background: rgba(15, 23, 42, 0.84);
  border: 1px solid rgba(255, 255, 255, 0.45);
  color: #f1f5f9;
  font-size: clamp(0.7rem, 0.85vw, 0.82rem);
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 999px;
  letter-spacing: 0.3px;
  white-space: nowrap;
  z-index: 25;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
}

.floor-badge-pill.pill--current-active {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border-color: #fef08a;
  color: #ffffff;
  font-weight: 900;
  font-size: 0.7rem;
  padding: 2px 9px;
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.85);
  transform: scale(1.05);
}

/* C1. Trạng thái cửa vòm đá: Đúng 1 biểu tượng duy nhất */
.floor-arch-status {
  position: absolute;
  top: 48%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 38%;
  height: 48%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.status-marker {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.marker-cleared {
  gap: 2px;
}

.floor--celebrating .tower-floor-sprite {
  filter: drop-shadow(0 0 18px rgba(250, 204, 21, 0.85));
}

.floor--celebrating .marker-cleared {
  padding: 4px;
  border-radius: 999px;
  background: rgba(253, 224, 71, 0.28);
  box-shadow: 0 0 18px rgba(250, 204, 21, 0.9);
}

.floor-flying-star {
  position: absolute;
  top: 44%;
  left: 50%;
  z-index: 20;
  font-size: clamp(1.1rem, 2.4vw, 1.6rem);
  filter: drop-shadow(0 0 8px rgba(250, 204, 21, 0.95));
  animation: floorStarFly 1.2s ease-out both;
}

@keyframes floorStarFly {
  0% {
    opacity: 0;
    transform: translate(-50%, 8px) scale(0.55);
  }
  20% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -48px) scale(1.25);
  }
}

.marker-unlock {
  font-size: 1.25rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

.marker-check {
  font-size: 1.4rem;
  font-weight: 900;
  color: #10b981;
  text-shadow:
    0 0 8px #34d399,
    0 2px 4px rgba(0, 0, 0, 0.8);
}

.marker-current {
  width: 100%;
  height: 100%;
}

.current-halo-ring {
  position: absolute;
  inset: -4px;
  border-radius: 18px 18px 4px 4px;
  border: 3px solid #fef08a;
  box-shadow:
    0 0 16px rgba(250, 204, 21, 0.95),
    inset 0 0 12px rgba(250, 204, 21, 0.5);
  animation: haloBlink 1.2s infinite alternate;
}

@keyframes haloBlink {
  from {
    opacity: 0.7;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1.02);
  }
}

.current-up-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  animation: arrowUpBob 0.8s ease-in-out infinite alternate;
  filter: drop-shadow(0 2px 6px rgba(245, 158, 11, 0.85));
  z-index: 6;
}

.arrow-up-svg {
  display: block;
}

@keyframes arrowUpBob {
  from {
    transform: translateY(3px);
  }
  to {
    transform: translateY(-4px);
  }
}

/* C1. Tầng chưa tới: Ổ khóa ĐÓNG ở giữa cửa vòm */
.marker-locked .marker-lock {
  font-size: 1.35rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.65));
}

/* Lớp bọt nước chân thác che mờ tầng thấp nhất */
.waterfall-mist-base {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 45%;
  height: 54px;
  background: radial-gradient(
    ellipse 70% 90% at 20% 35%,
    rgba(255, 255, 255, 0.18) 0%,
    rgba(255, 255, 255, 0.07) 40%,
    transparent 75%
  );
  pointer-events: none;
  z-index: 7;
}

/* Bệ đá và khủng long ở đáy-trái */
.dino-and-platform-group {
  position: absolute;
  bottom: 3%;
  left: 0;
  width: var(--platform-width);
  aspect-ratio: 774 / 432;
  z-index: auto;
  pointer-events: none;
}

/* The anchor stays on the platform while its child animates independently. */
.dino-character-anchor {
  position: absolute;
  bottom: 42%;
  left: 4%;
  height: var(--hero-height);
  max-height: var(--hero-max-height);
  z-index: 11;
  filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.35));
}

.dino-character-motion-wrap {
  position: relative;
  width: auto;
  height: 100%;
  max-height: var(--hero-max-height);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  transform-origin: center bottom;
}

.dino-sprite {
  height: 100%;
  width: auto;
  max-height: var(--hero-max-height);
  display: block;
}

.dino-sprite :deep(img) {
  height: 100%;
  width: auto;
  max-height: var(--hero-max-height);
  object-fit: contain;
  object-position: center bottom;
  display: block;
}

.dino-sprite--idle :deep(img) {
  transform: translateY(17.82%);
}

.dino-sprite--happy :deep(img) {
  transform: translateY(8.8%);
}

.dino-sprite--sad :deep(img) {
  transform: translateY(18.29%);
}

.dino-sprite :deep(.game-sprite-flip-container) {
  transition: none;
}

.dino-fallback-svg {
  height: 100%;
  width: auto;
}

/* B4. Animation nhảy khi đúng */
.dino--jumping {
  animation: dinoJumpShort 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes dinoJumpShort {
  0% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-15%) scale(1.05);
  }
  100% {
    transform: translateY(0) scale(1);
  }
}

/* B4. Animation rung khi sai */
.dino--shaking {
  animation: dinoShakeWrong 0.5s ease-in-out forwards;
}

@keyframes dinoShakeWrong {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-8px) rotate(-3deg);
  }
  75% {
    transform: translateX(8px) rotate(3deg);
  }
}

/* Dải bệ đá platform.png */
.platform-strip-wrap {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 4;
  -webkit-mask-image:
    linear-gradient(to right, #000 78%, transparent 100%),
    linear-gradient(to top, transparent 0%, #000 28%, #000 100%);
  -webkit-mask-composite: source-in;
  mask-image:
    linear-gradient(to right, #000 78%, transparent 100%),
    linear-gradient(to top, transparent 0%, #000 28%, #000 100%);
  mask-composite: intersect;
}

.platform-sprite {
  width: 100%;
  height: 100%;
  display: block;
}

.platform-sprite :deep(img),
.platform-fallback-svg {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

/* =====================================================================
   A4. BẢNG CÂU HỎI & ĐÁP ÁN: ĐÈ LÊN CẢNH (NỀN TRẮNG/KEM BÁN TRONG SUỐT)
   ===================================================================== */
.tower-quiz-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 14px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(14px);
  border: 2.5px solid rgba(186, 230, 253, 0.9);
  border-radius: 28px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.16);
  padding: 18px;
  min-height: 0;
  height: auto;
  max-height: calc(100% - 24px);
  align-self: center;
  box-sizing: border-box;
  overflow: hidden;
  z-index: 20;
}

/* THẺ CÂU HỎI NỀN KEM */
.quiz-board {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  background: linear-gradient(135deg, #ffffff 0%, #f8fcff 100%);
  border: 1px solid #dbeafe;
  border-left: 5px solid #38bdf8;
  border-radius: 16px;
  padding: 16px 20px;
  box-shadow: 0 5px 14px rgba(15, 23, 42, 0.06);
  margin-bottom: 0;
  flex: 0 1 auto;
  min-height: 0;
  max-height: 38%;
  overflow-y: auto;
  overscroll-behavior: contain;
}

/* Tia sáng ✦ cạnh thẻ câu hỏi */
.sparkle {
  display: none;
}

.sparkle-tl {
  top: -8px;
  left: -8px;
}
.sparkle-br {
  bottom: -8px;
  right: -8px;
  animation-delay: 1s;
}

@keyframes sparkleTwinkle {
  from {
    transform: scale(0.85) rotate(0deg);
    opacity: 0.7;
  }
  to {
    transform: scale(1.15) rotate(15deg);
    opacity: 1;
  }
}

.quiz-board-header {
  margin-bottom: 12px;
}

.quiz-board-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #eff8ff;
  border: 1px solid #bfdbfe;
  color: #0369a1;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 3px 12px;
  border-radius: 999px;
  box-shadow: none;
}

.quiz-question-text {
  font-size: clamp(1.2rem, 2.35vh, 1.65rem);
  font-weight: 750;
  color: #0f172a;
  line-height: 1.4;
  margin: 0;
  word-break: break-word;
  text-align: left;
}

/* =====================================================================
   A5, C2. CÁC ĐÁP ÁN: HUY HIỆU BO HÌNH KHÁC NHAU, BÓNG NỔI 3D
   ===================================================================== */
.answers-list {
  display: flex;
  flex-direction: column;
  gap: clamp(8px, 1.2vh, 12px);
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  justify-content: flex-start;
}

.answer-btn {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: clamp(8px, 1.3vh, 14px);
  min-height: clamp(48px, 6.2vh, 62px);
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid #e2e8f0;
  border-radius: 18px;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-align: left;
  box-sizing: border-box;
}

.answer-btn:hover:not(:disabled) {
  border-color: #38bdf8;
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(56, 189, 248, 0.22);
}

.answer-btn.ans--selected {
  border-color: #0284c7;
  background: #f0f9ff;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.25);
}

/* C2. Trạng thái sau kết quả */
.answer-btn.ans--correct {
  background: #dcfce7 !important;
  border-color: #22c55e !important;
  box-shadow:
    0 0 0 3px rgba(34, 197, 94, 0.35),
    0 6px 16px rgba(34, 197, 94, 0.2) !important;
}

.answer-btn.ans--wrong {
  background: #fee2e2 !important;
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.35) !important;
}

.answer-btn.ans--dimmed {
  opacity: 0.42 !important;
  filter: grayscale(0.5) !important;
  pointer-events: none !important;
}

/* A5. HUY HIỆU A/B/C/D BO HÌNH KHÁC NHAU CÓ BÓNG NỔI */
.answer-pill {
  width: clamp(38px, 4.5vh, 46px);
  height: clamp(38px, 4.5vh, 46px);
  min-width: clamp(38px, 4.5vh, 46px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.pill-letter {
  font-size: clamp(1.15rem, 2vh, 1.35rem);
  font-weight: 900;
  color: #ffffff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}

/* A: Squircle màu cam */
.pill-0 {
  background: linear-gradient(135deg, #fb923c, #ea580c);
  border-radius: 14px;
  box-shadow:
    0 4px 0 #9a3412,
    0 6px 12px rgba(234, 88, 12, 0.35);
}

/* B: Tròn hoàn hảo màu xanh dương */
.pill-1 {
  background: linear-gradient(135deg, #38bdf8, #0284c7);
  border-radius: 50%;
  box-shadow:
    0 4px 0 #0369a1,
    0 6px 12px rgba(2, 132, 199, 0.35);
}

/* C: Hình lá chéo màu xanh lá */
.pill-2 {
  background: linear-gradient(135deg, #4ade80, #16a34a);
  border-radius: 18px 6px 18px 6px;
  box-shadow:
    0 4px 0 #15803d,
    0 6px 12px rgba(22, 163, 74, 0.35);
}

/* D: Hình chéo đảo màu tím */
.pill-3 {
  background: linear-gradient(135deg, #c084fc, #9333ea);
  border-radius: 6px 18px 6px 18px;
  box-shadow:
    0 4px 0 #7e22ce,
    0 6px 12px rgba(147, 51, 234, 0.35);
}

.answer-text {
  flex: 1;
  min-width: 0;
  font-size: clamp(0.95rem, 1.6vh, 1.15rem);
  font-weight: 700;
  color: #1e293b;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.answer-feedback-icon {
  font-size: 1.4rem;
  flex-shrink: 0;
}

.icon-star {
  filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.8));
}

.fallback-card {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 12px;
  background: #ffffff;
  border-radius: 18px;
  border: 2px dashed #93c5fd;
}

/* Lỗi mạng */
.network-error-banner {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #fef2f2;
  border: 1.5px solid #fca5a5;
  color: #991b1b;
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 700;
  margin-top: 8px;
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

/* NÚT LEO THÁC */
.climb-action-wrap {
  margin-top: clamp(10px, 1.4vh, 16px);
  flex-shrink: 0;
}

.btn-climb {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: clamp(10px, 1.6vh, 16px);
  background: linear-gradient(180deg, #94a3b8, #64748b);
  border: none;
  border-bottom: 5px solid #475569;
  border-radius: 999px;
  color: #ffffff;
  font-size: clamp(1.05rem, 1.8vh, 1.25rem);
  font-weight: 900;
  cursor: not-allowed;
  opacity: 0.65;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-climb--ready {
  background: linear-gradient(180deg, #38bdf8, #0284c7);
  border-bottom-color: #0369a1;
  opacity: 1;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(2, 132, 199, 0.45);
}

.btn-climb--ready:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(2, 132, 199, 0.55);
}

.btn-climb--ready:active {
  transform: translateY(2px);
  border-bottom-width: 2px;
}

.btn-climb-flag {
  font-size: 1.35rem;
}

/* =====================================================================
   MÀN KẾT QUẢ ĐỈNH THÁP
   ===================================================================== */
.tower-peak-modal {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 100;
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
  from {
    transform: scale(0.7) translateY(40px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

.peak-icons {
  font-size: 3.5rem;
  margin-bottom: 12px;
}
.peak-heading {
  font-size: 1.65rem;
  font-weight: 900;
  color: #0369a1;
  margin-bottom: 10px;
}
.peak-desc {
  font-size: 1.1rem;
  color: #475569;
  line-height: 1.5;
  margin-bottom: 20px;
}

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

.stat-num {
  font-size: 1.5rem;
  font-weight: 900;
  color: #0f172a;
}
.stat-lbl {
  font-size: 0.82rem;
  color: #64748b;
  font-weight: 700;
}

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

.tower-finish-fade-enter-active {
  transition: opacity 0.4s ease;
}
.tower-finish-fade-enter-from {
  opacity: 0;
}

/* =====================================================================
   A7. RESPONSIVE: 768px & MOBILE 375px
   ===================================================================== */
@media (max-width: 768px) {
  .tower-game {
    height: calc(100dvh - 88px);
    min-height: 0;
    max-height: calc(100dvh - 88px);
    overflow: hidden;
    --tower-width: 155px;
  }

  .tower-floating-header {
    top: 10px;
    left: 10px;
    right: 10px;
    gap: 8px;
  }

  .floating-pill {
    padding: 5px 12px;
  }

  .progress-pill {
    display: none; /* Ẩn thanh tiến độ dài trên màn hình nhỏ để tránh chật */
  }

  .tower-arena {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(180px, 30%) minmax(0, 1fr);
    padding: 70px 10px 10px;
    gap: 8px;
    height: 100%;
    min-height: 0;
  }

  .tower-scene-layer {
    height: 100%;
    min-height: 0;
    --tower-current-center-from-bottom: 184px;
  }

  .tower-assembly-column {
    left: 43%;
  }

  .tower-assembly-column--near-peak {
    --tower-bottom-fade: 36px;
  }

  .tower-assembly-column--one-past-floor {
    --tower-current-center-from-bottom: 121px;
  }

  .tower-assembly-column--no-past-floor {
    --tower-current-center-from-bottom: 58px;
  }

  .tower-floor-module:nth-last-child(n + 4) {
    display: none;
  }

  .tower-assembly-column--near-peak .floor--above-current {
    display: none;
  }

  .tower-floor-module:first-child,
  .tower-floor-module:nth-last-child(3),
  .tower-assembly-column--near-peak .floor--current {
    margin-top: 0;
  }

  .tower-quiz-panel {
    height: 100%;
    max-height: 100%;
    min-height: 0;
    border-radius: 18px;
    padding: 12px;
    gap: 8px;
  }

  .quiz-board {
    max-height: 34%;
    padding: 12px 14px;
  }

  .quiz-board-header {
    margin-bottom: 6px;
  }

  .quiz-question-text {
    font-size: clamp(1rem, 2.1vh, 1.35rem);
  }

  .answers-list {
    gap: 10px;
  }

  .answer-btn {
    padding: 7px 10px;
    min-height: 44px;
    gap: 10px;
  }

  .answer-pill {
    width: 34px;
    height: 34px;
    min-width: 34px;
  }

  .answer-text {
    font-size: clamp(0.85rem, 1.7vh, 1rem);
  }

  .btn-climb {
    padding: 9px 16px;
  }
}

/* =====================================================================
   PREFERS-REDUCED-MOTION
   ===================================================================== */
.reduce-motion * {
  animation: none !important;
  transition: none !important;
}

.reduce-motion .current-up-arrow {
  animation: none !important;
}

.reduce-motion .current-halo-ring {
  animation: none !important;
}

.reduce-motion .sparkle {
  animation: none !important;
}

.reduce-motion .floor-flying-star {
  opacity: 1;
  transform: translate(-50%, 0);
}
</style>
