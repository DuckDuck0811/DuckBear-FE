<template>
  <div class="race-game" :class="{ 'reduce-motion': game.prefersReducedMotion.value }">
    <!-- TOP BAR HOẠT HÌNH: ĐỒNG HỒ, TIẾN ĐỘ & BẢNG THÀNH TÍCH TAY ĐUA -->
    <header class="race-header">
      <!-- Đồng hồ bấm giờ / đếm ngược góc trái -->
      <div class="race-timer-widget" aria-label="Đồng hồ chặng đua">
        <span class="timer-icon">⏱️</span>
        <span class="timer-digits">{{ timerDisplay }}</span>
      </div>

      <!-- Khung câu hỏi ở giữa như bảng cờ trường đua lớn -->
      <div class="question-banner-wrap" v-if="currentQuestionItem">
        <div class="flag-banner flag-left" aria-hidden="true">🏁</div>
        <div class="question-billboard">
          <div class="billboard-pill">
            <span>{{ t('playModes.shared.questionNumber', { current: game.displayNum.value, total: game.totalQuestions.value }) }}</span>
          </div>
          <h2 class="question-text">
            {{ currentQuestionItem.question.content }}
          </h2>
        </div>
        <div class="flag-banner flag-right" aria-hidden="true">🏁</div>
      </div>

      <!-- Bảng thành tích học sinh & nút âm thanh góc phải (không dùng tên ảo) -->
      <div class="race-profile-widget">
        <div class="leaderboard-card">
          <div class="leaderboard-title">
            <span>🏆 {{ t('playModes.raceUI.leaderboardTitle') }}</span>
          </div>
          <div class="leaderboard-row">
            <span class="rank-badge">🥇</span>
            <span class="player-name">{{ studentName }}</span>
            <span class="player-score">⭐ {{ game.stars.value }}</span>
          </div>
          <div class="leaderboard-row combo-row">
            <span class="combo-icon">🔥</span>
            <span class="combo-label">{{ t('playModes.shared.combo') }}:</span>
            <span class="combo-val">{{ game.combo.value }}</span>
          </div>
        </div>

        <SoundToggle
          :model-value="game.isSoundEnabled.value"
          @toggle="game.toggleSound()"
        />
      </div>
    </header>

    <!-- TRƯỜNG ĐUA XE CHÍNH (RACE TRACK VIEWPORT) -->
    <main class="race-track-arena" v-if="currentQuestionItem && !game.isComplete.value">
      <!-- Khán đài và cây cối phía sau -->
      <div class="grandstand-backdrop" :class="{ 'grandstand--correct': game.checkFeedback.value === 'correct' }" aria-hidden="true">
        <div
          v-for="row in spectatorRows"
          :key="row"
          class="audience-row"
          :class="row === 0 ? 'audience-row--back' : 'audience-row--front'"
        >
          <svg
            v-for="(spectator, index) in spectators"
            :key="spectator.id"
            class="spectator"
            :class="{ 'spectator--wave': (index + row) % 4 === 0 }"
            :style="{
              '--shirt-color': spectator.shirt,
              '--hair-color': spectator.hair,
              '--skin-color': spectator.skin,
              '--animation-delay': spectator.delay,
              width: `${spectator.sizes[row]}px`,
            }"
            viewBox="0 0 28 36"
            focusable="false"
          >
            <path class="spectator-arm spectator-arm--left" d="M8 22 3 27" />
            <path class="spectator-arm spectator-arm--right" d="M20 22 25 27" />
            <path class="spectator-body" d="M5 33a9 9 0 0 1 18 0z" />
            <circle class="spectator-head" cx="14" cy="11" r="6" />
            <path class="spectator-hair" d="M8 11a6 6 0 0 1 12 0V8a6 6 0 0 0-12 0z" />
          </svg>
        </div>
        <div class="fence-barrier"></div>
      </div>

      <!-- MẶT ĐƯỜNG ĐUA NHIỀU LÀN (MỖI LÀN = 1 ĐÁP ÁN TRẮC NGHIỆM) -->
      <div class="track-pavement" v-if="isMcqType">
        <!-- Vạch đích kẻ caro bên phải -->
        <div class="finish-line-strip" aria-hidden="true">
          <GameSprite mode="race" name="finishFlag" width="32" height="32">
            <div class="finish-flag-pole">🏁</div>
          </GameSprite>
          <div class="checker-pattern"></div>
        </div>

        <!-- Các làn xe ngang (linh hoạt 2 đến 4 làn tùy số đáp án) -->
        <div class="lanes-container">
          <div
            v-for="(option, idx) in options"
            :key="option.id"
            class="track-lane"
            :class="{
              'lane--active': selectedLaneId === option.id,
              'lane--boost': selectedLaneId === option.id && game.checkFeedback.value === 'correct',
              'lane--crash': selectedLaneId === option.id && game.checkFeedback.value === 'wrong',
            }"
            @click="selectLane(option.id)"
          >
            <!-- Khối nút đáp án 3D bên trái (A, B, C...) -->
            <button
              type="button"
              class="lane-button-3d"
              :class="`lane-color-${idx % 4}`"
              :disabled="game.isChecking.value || isChecked"
            >
              <span class="lane-letter">{{ letters[idx] }}</span>
              <span class="lane-answer-text">{{ option.content }}</span>
            </button>

            <!-- Khoảng chạy xe trên làn -->
            <div class="lane-road-space">
              <!-- Vạch kẻ đường đứt đoạn -->
              <div class="lane-divider-dash"></div>

              <!-- Chiếc siêu xe chạy trên làn: Dùng <GameSprite> với Fallback SVG thể thao -->
              <div
                class="race-car-actor"
                :class="{
                  'car--revving': selectedLaneId === option.id && !game.checkFeedback.value,
                  'car--boosted': selectedLaneId === option.id && game.checkFeedback.value === 'correct',
                  'car--crashed': selectedLaneId === option.id && game.checkFeedback.value === 'wrong',
                  'car--idle': selectedLaneId !== option.id,
                }"
              >
                <!-- Lửa / khói phản lực đuôi xe -->
                <div
                  class="car-exhaust-nitro"
                  v-if="selectedLaneId === option.id"
                  :class="`nitro-color-${idx % 4}`"
                ></div>

                <!-- Sprite xe đua (ảnh thật nếu có, hoặc SVG fallback siêu xe sắc nét) -->
                <GameSprite
                  mode="race"
                  :name="carAssetNames[idx % 4]"
                  width="100%"
                  height="100%"
                  :alt="`Xe đua ${letters[idx]}`"
                >
                  <svg viewBox="0 0 200 70" width="100%" height="100%" class="car-svg">
                    <defs>
                      <linearGradient :id="`car-body-${idx}`" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" :stop-color="carColors[idx % 4].highlight" />
                        <stop offset="45%" :stop-color="carColors[idx % 4].body" />
                        <stop offset="100%" :stop-color="carColors[idx % 4].shadow" />
                      </linearGradient>
                      <linearGradient :id="`car-glass-${idx}`" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.9" />
                        <stop offset="60%" stop-color="#0f172a" stop-opacity="0.95" />
                        <stop offset="100%" stop-color="#1e293b" stop-opacity="0.9" />
                      </linearGradient>
                      <radialGradient :id="`car-rim-${idx}`" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stop-color="#ffffff" />
                        <stop offset="60%" stop-color="#94a3b8" />
                        <stop offset="100%" stop-color="#334155" />
                      </radialGradient>
                    </defs>

                    <!-- Đổ bóng gầm xe xuống mặt đường -->
                    <ellipse cx="100" cy="62" rx="88" ry="6" fill="#000000" opacity="0.2" />

                    <!-- Cánh gió thể thao phía sau (Spoiler) -->
                    <path d="M10 26 L24 26 L22 35 L12 35 Z" :fill="carColors[idx % 4].spoiler" />
                    <rect x="18" y="32" width="5" height="12" :fill="carColors[idx % 4].shadow" />
                    <rect x="8" y="32" width="5" height="12" :fill="carColors[idx % 4].shadow" />

                    <!-- Thân chính xe thể thao khí động học -->
                    <path
                      d="M20 46 
                         C20 43, 22 41, 26 40 
                         L60 38 
                         C72 26, 92 14, 126 14 
                         L154 26 
                         C166 32, 182 38, 192 44 
                         C197 47, 198 52, 195 56 
                         L190 58 
                         C188 58, 185 58, 182 58 
                         C180 50, 168 44, 154 44 
                         C140 44, 128 50, 126 58 
                         L72 58 
                         C70 50, 58 44, 44 44 
                         C30 44, 18 50, 16 58 
                         L12 56 
                         C10 52, 12 47, 20 46 Z"
                      :fill="`url(#car-body-${idx})`"
                    />

                    <!-- Kính lái và kính hông xe khí động học -->
                    <path
                      d="M74 36 
                         L118 20 
                         C132 20, 145 26, 152 36 
                         Z"
                      :fill="`url(#car-glass-${idx})`"
                      opacity="0.9"
                    />

                    <!-- Sọc đua thể thao trắng (Racing Stripe) -->
                    <path d="M72 16 Q100 17 122 22 L168 34 Q154 30 118 20 Z" fill="#ffffff" opacity="0.85" />
                    <path d="M68 38 Q110 37 168 44" stroke="#ffffff" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.45" />

                    <!-- Đèn pha trước công nghệ LED -->
                    <path d="M178 38 Q190 42 193 45 L182 46 Z" fill="#fef08a" stroke="#eab308" stroke-width="1" />
                    <ellipse cx="187" cy="42" rx="4" ry="2" fill="#ffffff" />

                    <!-- Đèn hậu LED đỏ -->
                    <path d="M12 40 Q14 36 18 36 L17 44 Q13 44 12 40 Z" fill="#ef4444" stroke="#b91c1c" stroke-width="1" />

                    <!-- BÁNH XE SAU (Lốp cao su + Mâm đúc 5 chấu) -->
                    <circle cx="48" cy="55" r="14" fill="#1e293b" stroke="#0f172a" stroke-width="2.5" />
                    <circle cx="48" cy="55" r="9" :fill="`url(#car-rim-${idx})`" />
                    <circle cx="48" cy="55" r="4" fill="#0f172a" />
                    <circle cx="48" cy="52" r="0.9" fill="#ffffff" />
                    <circle cx="51" cy="55" r="0.9" fill="#ffffff" />
                    <circle cx="45" cy="55" r="0.9" fill="#ffffff" />

                    <!-- BÁNH XE TRƯỚC (Lốp cao su + Mâm đúc 5 chấu) -->
                    <circle cx="150" cy="55" r="14" fill="#1e293b" stroke="#0f172a" stroke-width="2.5" />
                    <circle cx="150" cy="55" r="9" :fill="`url(#car-rim-${idx})`" />
                    <circle cx="150" cy="55" r="4" fill="#0f172a" />
                    <circle cx="150" cy="52" r="0.9" fill="#ffffff" />
                    <circle cx="153" cy="55" r="0.9" fill="#ffffff" />
                    <circle cx="147" cy="55" r="0.9" fill="#ffffff" />
                  </svg>
                </GameSprite>

                <!-- Vệt bánh xe / khói khi phóng -->
                <div class="skid-marks" v-if="selectedLaneId === option.id && game.checkFeedback.value === 'correct'"></div>
              </div>

              <!-- Tường chắn an toàn xuất hiện khi trả lời sai -->
              <div
                v-if="selectedLaneId === option.id && game.checkFeedback.value === 'wrong'"
                class="collision-wall"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        <!-- Rào chắn viền đường đua đỏ trắng dưới đáy -->
        <div class="curb-barrier-strip"></div>
      </div>

      <!-- Trường hợp câu dạng FILL / ESSAY / MATCHING: Fallback về QuestionItem chuẩn -->
      <div v-else class="non-mcq-track-card">
        <QuestionItem
          :item="currentQuestionItem"
          :index="session.currentIndex.value"
          :answer="session.answers[currentQuestionItem.question.id] || {}"
          :level="1"
          mode="race"
          :disabled="game.isChecking.value || isChecked"
          @answered="onQuestionAnswered"
        />
        <div class="d-flex justify-center mt-4">
          <button
            type="button"
            class="btn-nitro-fire"
            :disabled="!session.hasAnswer(currentQuestionItem.question.id) || game.isChecking.value || isChecked"
            @click="onCommitAnswer"
          >
            {{ t('playModes.raceUI.actionNitro') }}
          </button>
        </div>
      </div>

      <!-- THÔNG BÁO LỖI MẠNG & THỬ LẠI (NẾU CÓ) -->
      <div v-if="game.networkError.value" class="network-retry-banner">
        <span>⚠️ {{ game.networkError.value }}</span>
        <button type="button" class="btn-retry" @click="onCommitAnswer">
          🔄 {{ t('playModes.shared.retry') }}
        </button>
      </div>

      <!-- FOOTER TIẾN ĐỘ CHẶNG ĐUA & NÚT LÁI XE (ACTION COMMIT) -->
      <footer class="race-bottom-bar" v-if="isMcqType">
        <!-- Vạch tiến độ cờ đích phía dưới -->
        <div class="lap-progress-container">
          <span class="lap-flag-icon">🏁</span>
          <div class="lap-track-bar">
            <div
              class="lap-track-fill"
              :style="{ width: `${(game.displayNum.value / game.totalQuestions.value) * 100}%` }"
            ></div>
          </div>
        </div>

        <!-- Nút Lái / Nhấn ga to tướng 3D rực lửa -->
        <button
          type="button"
          class="btn-nitro-fire"
          :class="{ 'btn-ready': selectedLaneId !== null && !game.isChecking.value && !isChecked }"
          :disabled="selectedLaneId === null || game.isChecking.value || isChecked"
          @click="onCommitAnswer"
        >
          <span class="btn-flame-icon">🔥</span>
          <span class="btn-text">
            {{ game.isChecking.value ? t('playModes.raceUI.checking') : t('playModes.raceUI.actionDrive') }}
          </span>
        </button>
      </footer>
    </main>

    <!-- MÀN VỀ ĐÍCH HOÀNH TRÁNG -->
    <Transition name="fade">
      <div v-if="game.isComplete.value" class="race-finish-modal">
        <div class="finish-card">
          <div class="finish-cups">🏆 🏁 🏎️</div>
          <h2 class="finish-headline">{{ t('playModes.raceUI.finishHeadline') }}</h2>
          <p class="finish-desc">
            {{ t('playModes.raceUI.finishDesc', { total: game.totalQuestions.value, score: game.scoreDisplay.value }) }}
          </p>
          <div class="finish-stats">
            <div class="finish-stat-box">
              <span class="stat-num">{{ game.stars.value }} / {{ game.totalQuestions.value }}</span>
              <span class="stat-lbl">{{ t('playModes.shared.stars') }} đúng</span>
            </div>
            <div class="finish-stat-box">
              <span class="stat-num">🔥 x{{ game.maxCombo.value }}</span>
              <span class="stat-lbl">{{ t('playModes.raceUI.bestCombo') }}</span>
            </div>
          </div>
          <button
            type="button"
            class="btn-nitro-fire btn-ready btn-submit-game"
            :disabled="session.submitting.value"
            @click="session.submit()"
          >
            {{ session.submitting.value ? t('playModes.raceUI.submitting') : t('playModes.raceUI.submitNow') }}
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
const carAssetNames = ['carRed', 'carBlue', 'carGreen', 'carOrange'];
const spectatorRows = [0, 1];
const spectatorShirts = ['#f87171', '#60a5fa', '#facc15', '#c084fc', '#34d399', '#fb923c'];
const spectatorHair = ['#422006', '#1f2937', '#7c2d12', '#111827', '#713f12'];
const spectatorSkin = ['#f3c9a5', '#d99b72', '#f1b98e', '#b97854'];
const spectators = Array.from({ length: 28 }, (_, id) => ({
  id,
  shirt: spectatorShirts[id % spectatorShirts.length],
  hair: spectatorHair[(id * 3) % spectatorHair.length],
  skin: spectatorSkin[(id * 2) % spectatorSkin.length],
  delay: `${-((id * 0.17) % 1.8)}s`,
  sizes: [18, 20, 22, 24].map((size, row) => Math.round(size * (row === 0 ? 0.8 : 1))),
}));

// Bảng màu gradient cho các xe fallback (Đỏ, Xanh dương, Xanh lá, Vàng cam)
const carColors = [
  { body: '#ef4444', highlight: '#fca5a5', shadow: '#991b1b', spoiler: '#b91c1c' },
  { body: '#2563eb', highlight: '#93c5fd', shadow: '#1e3a8a', spoiler: '#1d4ed8' },
  { body: '#16a34a', highlight: '#86efac', shadow: '#14532d', spoiler: '#15803d' },
  { body: '#f59e0b', highlight: '#fde68a', shadow: '#b45309', spoiler: '#d97706' },
];

const selectedLaneId = ref(null);

const currentQuestionItem = computed(() => props.session.currentQuestionItem?.value);
const options = computed(() => currentQuestionItem.value?.question?.options || []);

const isMcqType = computed(() => {
  const tp = currentQuestionItem.value?.question?.type;
  return tp === 'MCQ' || tp === 'MULTI_MCQ' || tp === 'TRUE_FALSE';
});

const isChecked = computed(() => {
  const qId = currentQuestionItem.value?.question?.id;
  return qId != null && props.session.checkedQuestions?.[String(qId)] != null;
});

const timerDisplay = computed(() => {
  return props.session.timeLabel?.value || '00:15';
});

const studentName = computed(() => {
  return props.session.studentName?.value || 'Em';
});

function selectLane(optionId) {
  if (game.isChecking.value || isChecked.value) return;
  game.playSfx('click');
  selectedLaneId.value = optionId;
}

function onQuestionAnswered(questionId) {
  const answer = props.session.answers[questionId];
  if (answer) props.session.setAnswer(questionId, { ...answer });
}

async function onCommitAnswer() {
  const q = currentQuestionItem.value?.question;
  if (!q || game.isChecking.value || isChecked.value) return;
  if (isMcqType.value && selectedLaneId.value === null) return;

  const patch = isMcqType.value && selectedLaneId.value !== null
    ? { selectedOptionId: selectedLaneId.value, selectedOptionIds: [selectedLaneId.value] }
    : undefined;

  await game.submitAndCheck(q.id, patch, {
    delayNext: 1250,
  });
}

// Điều khiển bàn phím (1-4, A-D, Mũi tên Lên/Xuống, Enter)
function onKeydown(e) {
  if (game.isComplete.value || game.isChecking.value || isChecked.value) return;
  const opts = options.value;
  const map = { '1': 0, '2': 1, '3': 2, '4': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3, 'A': 0, 'B': 1, 'C': 2, 'D': 3 };

  if (map[e.key] !== undefined && opts[map[e.key]]) {
    selectLane(opts[map[e.key]].id);
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    const currIdx = opts.findIndex(o => o.id === selectedLaneId.value);
    const prevIdx = currIdx > 0 ? currIdx - 1 : opts.length - 1;
    if (opts[prevIdx]) selectLane(opts[prevIdx].id);
  } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
    const currIdx = opts.findIndex(o => o.id === selectedLaneId.value);
    const nextIdx = currIdx < opts.length - 1 ? currIdx + 1 : 0;
    if (opts[nextIdx]) selectLane(opts[nextIdx].id);
  } else if (e.key === 'Enter' && selectedLaneId.value !== null) {
    onCommitAnswer();
  }
}

watch(() => props.session.currentIndex?.value, () => {
  selectedLaneId.value = null;
});

onMounted(() => {
  document.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
/* ================= TỔNG THỂ TOÀN BỘ MINI-GAME RACE ================= */
.race-game {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: min(740px, calc(100vh - 120px));
  max-height: calc(100vh - 120px);
  min-height: min(580px, calc(100vh - 120px));
  background: linear-gradient(180deg, #38bdf8 0%, #60a5fa 35%, #475569 35%, #1e293b 100%);
  border: 4px solid #0284c7;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(2, 132, 199, 0.3);
  position: relative;
  user-select: none;
  font-family: inherit;
}

/* ================= HEADER: ĐỒNG HỒ, BANNER ĐỀ BÀI, PROFILE ================= */
.race-header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 16px;
  padding: 10px 20px;
  background: rgba(15, 23, 42, 0.35);
  backdrop-filter: blur(8px);
  border-bottom: 3px solid rgba(255, 255, 255, 0.2);
  z-index: 10;
}

/* ĐỒNG HỒ BẤM GIỜ */
.race-timer-widget {
  background: #0f172a;
  border: 3px solid #38bdf8;
  border-radius: 999px;
  padding: 6px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.4), inset 0 2px 4px rgba(0, 0, 0, 0.5);
}

.timer-icon {
  font-size: 1.25rem;
}

.timer-digits {
  font-size: 1.25rem;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: 1px;
}

/* BANNER ĐỀ BÀI CỜ VẠCH ĐÍCH */
.question-banner-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
}

.flag-banner {
  font-size: 2.2rem;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
}

.question-billboard {
  background: #fffbeb;
  border: 4px solid #f59e0b;
  border-radius: 24px;
  padding: 12px 24px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25), inset 0 2px 0 #ffffff;
  text-align: center;
  max-width: 620px;
  width: 100%;
}

.billboard-pill {
  display: inline-block;
  background: #f97316;
  color: #ffffff;
  font-weight: 900;
  font-size: 0.82rem;
  padding: 3px 16px;
  border-radius: 999px;
  border: 2px solid #ea580c;
  margin-bottom: 6px;
  letter-spacing: 0.5px;
}

.question-text {
  font-size: 1.28rem;
  font-weight: 900;
  color: #1e293b;
  line-height: 1.4;
  margin: 0;
}

/* PROFILE / LEADERBOARD HỌC SINH */
.race-profile-widget {
  display: flex;
  align-items: center;
  gap: 12px;
}

.leaderboard-card {
  background: #0f172a;
  border: 3px solid #f59e0b;
  border-radius: 16px;
  padding: 6px 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 140px;
}

.leaderboard-title {
  font-size: 0.78rem;
  font-weight: 900;
  color: #fef08a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(245, 158, 11, 0.4);
  padding-bottom: 2px;
}

.leaderboard-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.88rem;
  color: #ffffff;
}

.player-name {
  font-weight: 700;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-score {
  margin-left: auto;
  font-weight: 900;
  color: #fde047;
}

.combo-row {
  font-size: 0.82rem;
  color: #fb923c;
}

.combo-val {
  font-weight: 900;
  color: #ffedd5;
}

/* ================= TRƯỜNG ĐUA CHÍNH (ARENA) ================= */
.race-track-arena {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  position: relative;
}

/* Khán đài phía sau */
.grandstand-backdrop {
  height: 58px;
  background: linear-gradient(180deg, #15803d 0%, #166534 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.audience-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: clamp(2px, 0.8vw, 10px);
  flex: 1;
  min-width: 0;
  padding: 0 8px;
}

.audience-row--back {
  opacity: 0.68;
  transform: translateX(8px);
}

.spectator {
  flex: 0 1 auto;
  max-width: 24px;
  overflow: visible;
  animation: spectatorBob 2.2s ease-in-out var(--animation-delay) infinite;
}

.spectator-body {
  fill: var(--shirt-color);
}

.spectator-head {
  fill: var(--skin-color);
}

.spectator-hair {
  fill: var(--hair-color);
}

.spectator-arm {
  fill: none;
  stroke: var(--shirt-color);
  stroke-width: 3;
  stroke-linecap: round;
}

.spectator-arm--right {
  transform-box: view-box;
  transform-origin: 20px 22px;
}

.spectator--wave .spectator-arm--right {
  animation: spectatorWave 1.4s ease-in-out var(--animation-delay) infinite;
}

.grandstand--correct .spectator {
  animation-name: spectatorCelebrate;
  animation-duration: 0.32s;
}

@keyframes spectatorBob {
  0%, 100% { transform: translateY(2px); }
  50% { transform: translateY(-2px); }
}

@keyframes spectatorCelebrate {
  0%, 100% { transform: translateY(2px); }
  50% { transform: translateY(-7px); }
}

@keyframes spectatorWave {
  0%, 100% { transform: rotate(0); }
  50% { transform: rotate(-45deg); }
}

.fence-barrier {
  height: 6px;
  background: repeating-linear-gradient(90deg, #cbd5e1, #cbd5e1 12px, #475569 12px, #475569 24px);
}

/* MẶT ĐƯỜNG ĐUA */
.track-pavement {
  --car-scale: 2.2;
  background: #334155;
  border-top: 5px solid #e2e8f0;
  border-bottom: 5px solid #e2e8f0;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

/* Vạch đích kẻ caro bên phải */
.finish-line-strip {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 40px;
  width: 32px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.finish-flag-pole {
  font-size: 1.8rem;
  position: absolute;
  top: -12px;
  right: -8px;
  animation: flagWave 1s ease-in-out infinite alternate;
}

@keyframes flagWave {
  from { transform: rotate(-8deg); }
  to { transform: rotate(8deg); }
}

.checker-pattern {
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    45deg,
    #ffffff,
    #ffffff 8px,
    #0f172a 8px,
    #0f172a 16px
  );
  border-left: 3px solid #ffffff;
  border-right: 3px solid #ffffff;
  box-shadow: 0 0 12px rgba(255, 255, 255, 0.4);
}

/* CONTAINER CÁC LÀN ĐUA */
.lanes-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.track-lane {
  display: flex;
  align-items: center;
  flex: 1 1 84px;
  min-height: 56px;
  border-bottom: 2px dashed rgba(255, 255, 255, 0.35);
  position: relative;
  cursor: pointer;
  transition: background 0.2s ease;
}

.track-lane:last-child {
  border-bottom: none;
}

.track-lane:hover {
  background: rgba(255, 255, 255, 0.05);
}

.lane--active {
  background: rgba(56, 189, 248, 0.15) !important;
}

/* NÚT ĐÁP ÁN 3D BÊN TRÁI */
.lane-button-3d {
  min-width: 250px;
  max-width: 360px;
  height: 66px;
  margin-left: 14px;
  border: none;
  border-radius: 16px;
  display: flex;
  align-items: center;
  padding: 0 18px;
  gap: 14px;
  cursor: pointer;
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.35), 0 10px 18px rgba(0, 0, 0, 0.2);
  transition: all 0.15s ease;
  z-index: 4;
}

.lane-button-3d:active {
  transform: translateY(3px);
  box-shadow: 0 3px 0 rgba(0, 0, 0, 0.35);
}

/* 4 MÀU NÚT CHO 4 LÀN */
.lane-color-0 {
  background: linear-gradient(180deg, #f87171 0%, #ef4444 100%);
  border-top: 2px solid #fca5a5;
}
.lane-color-1 {
  background: linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%);
  border-top: 2px solid #93c5fd;
}
.lane-color-2 {
  background: linear-gradient(180deg, #4ade80 0%, #22c55e 100%);
  border-top: 2px solid #86efac;
}
.lane-color-3 {
  background: linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%);
  border-top: 2px solid #fde68a;
}

.lane-letter {
  font-size: 2.1rem;
  font-weight: 900;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
  font-style: italic;
}

.lane-answer-text {
  font-size: 1.3rem;
  font-weight: 900;
  color: #ffffff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  flex: 1;
  text-align: left;
}

/* KHOẢNG ĐƯỜNG CHẠY XE */
.lane-road-space {
  flex: 1;
  height: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  position: relative;
  padding-left: 8px;
  overflow: hidden;
}

.lane-divider-dash {
  position: absolute;
  top: 50%;
  left: 0;
  right: 80px;
  height: 3px;
  background: repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(255, 255, 255, 0.4) 30px, rgba(255, 255, 255, 0.4) 60px);
  pointer-events: none;
}

/* DIỄN VIÊN XE ĐUA */
.race-car-actor {
  position: absolute;
  left: -60px;
  display: flex;
  align-items: center;
  flex: none;
  width: 22%;
  max-width: 22%;
  height: 80%;
  min-width: 0;
  transform: scale(var(--car-scale));
  transform-origin: left center;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 3;
}

.race-car-actor :deep(.game-sprite-wrapper) {
  width: 100% !important;
  height: 100% !important;
  justify-content: flex-start !important;
  max-width: 100%;
  overflow: visible;
}

.race-car-actor :deep(.game-sprite-img),
.car-svg {
  display: block;
  width: auto;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 3px 4px rgba(0, 0, 0, 0.28));
}

/* Trạng thái xe nổ máy khi chọn */
.car--revving {
  transform: translateX(25%) scale(var(--car-scale));
  animation: carVibrate 0.1s infinite alternate;
}

@keyframes carVibrate {
  from { transform: translateX(25%) translateY(-1px) scale(var(--car-scale)); }
  to { transform: translateX(25%) translateY(1px) scale(var(--car-scale)); }
}

/* Trạng thái xe TĂNG TỐC PHÓNG VÈO VỀ ĐÍCH KHI ĐÚNG */
.car--boosted {
  animation: nitroRocket 1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes nitroRocket {
  0% { transform: translateX(25%) scale(var(--car-scale)); }
  25% { transform: translateX(20%) scale(var(--car-scale)); }
  60% { transform: translateX(160%) scale(var(--car-scale)); }
  100% { transform: translateX(300%) scale(var(--car-scale)); }
}

/* Trạng thái xe ĐÂM CHƯỚNG NGẠI VẬT KHI SAI */
.car--crashed {
  animation: crashBump 0.8s ease-out forwards;
}

@keyframes crashBump {
  0% { transform: translateX(25%) scale(var(--car-scale)); }
  35% { transform: translateX(70%) scale(var(--car-scale)); }
  50% { transform: translateX(60%) rotate(-6deg) scale(var(--car-scale)); }
  75% { transform: translateX(62%) rotate(3deg) scale(var(--car-scale)); }
  100% { transform: translateX(60%) rotate(0deg) scale(var(--car-scale)); }
}

/* Lửa / khói phụt đuôi xe */
.car-exhaust-nitro {
  position: absolute;
  left: 4%;
  top: 50%;
  transform: translateY(-50%);
  transform-origin: right center;
  width: 18%;
  height: 35%;
  clip-path: polygon(0 50%, 18% 20%, 38% 5%, 31% 32%, 67% 12%, 58% 39%, 100% 50%, 58% 61%, 68% 89%, 34% 70%, 18% 96%);
  background: linear-gradient(90deg, #ef4444 0%, #f97316 30%, #facc15 72%, #fff7cc 100%);
  animation: nitroFlicker 0.08s infinite alternate;
  filter: drop-shadow(0 0 3px rgba(249, 115, 22, 0.7));
  pointer-events: none;
}

.car-exhaust-nitro::after {
  content: "";
  position: absolute;
  inset: 32% 0;
  clip-path: polygon(0 50%, 30% 0, 100% 50%, 30% 100%);
  background: linear-gradient(90deg, #fb923c, #fef3c7);
  opacity: 0.9;
}

@keyframes nitroFlicker {
  from { opacity: 0.8; transform: translateY(-50%) scaleX(0.9); }
  to { opacity: 1; transform: translateY(-50%) scaleX(1.08); }
}

/* Tường chắn va chạm khi sai */
.collision-wall {
  position: absolute;
  left: 330px;
  top: 15%;
  bottom: 15%;
  width: 22px;
  background: repeating-linear-gradient(45deg, #ef4444, #ef4444 6px, #ffffff 6px, #ffffff 12px);
  border: 2px solid #b91c1c;
  border-radius: 6px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
  animation: wallPop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes wallPop {
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
}

/* Rào chắn viền đáy đỏ trắng */
.curb-barrier-strip {
  height: 14px;
  background: repeating-linear-gradient(90deg, #ef4444, #ef4444 24px, #ffffff 24px, #ffffff 48px);
  border-top: 2px solid #b91c1c;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* THÔNG BÁO LỖI MẠNG */
.network-retry-banner {
  background: #fef2f2;
  border: 2px solid #ef4444;
  border-radius: 12px;
  padding: 8px 16px;
  margin: 10px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #991b1b;
  font-weight: 700;
  font-size: 0.95rem;
}

.btn-retry {
  background: #ef4444;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 6px 14px;
  font-weight: 900;
  cursor: pointer;
}

/* ================= FOOTER: TIẾN ĐỘ & NÚT LÁI XE ================= */
.race-bottom-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 12px 24px;
  background: #0f172a;
  border-top: 3px solid rgba(255, 255, 255, 0.15);
  z-index: 10;
}

.lap-progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  max-width: 480px;
}

.lap-flag-icon {
  font-size: 1.8rem;
}

.lap-track-bar {
  flex: 1;
  height: 18px;
  background: #334155;
  border-radius: 999px;
  border: 2px solid #475569;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4);
}

.lap-track-fill {
  height: 100%;
  background: linear-gradient(90deg, #f97316 0%, #eab308 100%);
  border-radius: 999px;
  transition: width 0.4s ease;
  box-shadow: 0 0 10px rgba(249, 115, 22, 0.6);
}

/* Nút Nhấn Ga 3D to tướng */
.btn-nitro-fire {
  background: linear-gradient(180deg, #94a3b8 0%, #64748b 100%);
  border: none;
  border-radius: 999px;
  padding: 12px 36px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #cbd5e1;
  font-size: 1.25rem;
  font-weight: 900;
  cursor: not-allowed;
  box-shadow: 0 6px 0 #475569, 0 10px 20px rgba(0, 0, 0, 0.3);
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.btn-ready {
  background: linear-gradient(180deg, #fb923c 0%, #ea580c 100%) !important;
  color: #ffffff !important;
  cursor: pointer !important;
  box-shadow: 0 6px 0 #c2410c, 0 12px 24px rgba(234, 88, 12, 0.4) !important;
  animation: readyPulse 1.2s infinite alternate;
}

.btn-ready:hover {
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 8px 0 #c2410c, 0 16px 28px rgba(234, 88, 12, 0.5) !important;
}

.btn-ready:active {
  transform: translateY(4px) scale(0.98);
  box-shadow: 0 2px 0 #c2410c !important;
}

@keyframes readyPulse {
  from { filter: brightness(1); }
  to { filter: brightness(1.15); }
}

.btn-flame-icon {
  font-size: 1.5rem;
}

/* ================= TRƯỜNG HỢP CÂU HỎI NON-MCQ ================= */
.non-mcq-track-card {
  padding: 24px;
  background: #ffffff;
  border-radius: 20px;
  margin: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  max-width: 800px;
  align-self: center;
  width: 100%;
}

/* ================= MÀN HÌNH VỀ ĐÍCH ================= */
.race-finish-modal {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 20px;
}

.finish-card {
  background: #ffffff;
  border: 5px solid #f59e0b;
  border-radius: 32px;
  padding: 36px 32px;
  max-width: 520px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: cardEntrance 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes cardEntrance {
  from { transform: scale(0.7) translateY(40px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}

.finish-cups {
  font-size: 3.5rem;
  margin-bottom: 12px;
}

.finish-headline {
  font-size: 2rem;
  font-weight: 900;
  color: #ea580c;
  margin-bottom: 12px;
}

.finish-desc {
  font-size: 1.15rem;
  color: #334155;
  line-height: 1.5;
  margin-bottom: 20px;
}

.finish-stats {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 24px;
}

.finish-stat-box {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 12px 20px;
  display: flex;
  flex-direction: column;
}

.stat-num {
  font-size: 1.6rem;
  font-weight: 900;
  color: #0f172a;
}

.stat-lbl {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 700;
}

.btn-submit-game {
  width: 100%;
  justify-content: center;
}

/* ================= PREFERS-REDUCED-MOTION ================= */
.reduce-motion * {
  animation: none !important;
  transition: none !important;
}

/* ================= RESPONSIVE ================= */
@media (max-width: 768px) {
  .race-header {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 8px 12px;
  }
  .race-timer-widget {
    display: none;
  }
  .race-profile-widget {
    justify-content: space-between;
    width: 100%;
  }
  .lane-button-3d {
    min-width: 160px;
    max-width: 220px;
    height: 52px;
    padding: 0 12px;
    gap: 8px;
  }
  .lane-letter {
    font-size: 1.6rem;
  }
  .lane-answer-text {
    font-size: 1rem;
  }
  .btn-nitro-fire {
    padding: 10px 20px;
    font-size: 1rem;
  }
}

@media (max-width: 600px) {
  .grandstand-backdrop {
    height: 52px;
  }

  .spectator:nth-child(n + 13) {
    display: none;
  }
}

@media (min-width: 601px) and (max-width: 900px) {
  .spectator:nth-child(n + 21) {
    display: none;
  }
}
</style>
