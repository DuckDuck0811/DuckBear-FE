<template>
  <div class="race-game" :class="{ 'reduce-motion': prefersReducedMotion }">
    <!-- TOP BAR HOẠT HÌNH: ĐỒNG HỒ, TIẾN ĐỘ & BẢNG XẾP HẠNG -->
    <header class="race-header">
      <!-- Đồng hồ bấm giờ tròn -->
      <div class="timer-badge">
        <div class="timer-dial">
          <span class="timer-icon">⏱️</span>
          <span class="timer-val">{{ session.timeLabel?.value || '00:15' }}</span>
        </div>
      </div>

      <!-- Khung câu hỏi ở giữa như bảng cờ đua xe -->
      <div class="question-banner-wrap" v-if="currentQuestionItem">
        <div class="flag-banner flag-left">🏁</div>
        <div class="question-billboard">
          <div class="billboard-pill">
            <span>Câu hỏi {{ displayNum }} / {{ totalQuestions }}</span>
          </div>
          <h2 class="question-text">
            {{ currentQuestionItem.question.content }}
          </h2>
        </div>
        <div class="flag-banner flag-right">🏁</div>
      </div>

      <!-- Bảng xếp hạng mini góc phải -->
      <div class="leaderboard-card">
        <div class="lb-title">
          <span>🏆</span>
          <span>Bảng xếp hạng</span>
        </div>
        <div class="lb-rows">
          <div class="lb-row lb-rank-1">
            <span class="rank-badge">1🥇</span>
            <span class="player-name">Em</span>
            <span class="player-score">{{ scoreDisplay }}</span>
          </div>
          <div class="lb-row">
            <span class="rank-badge">2</span>
            <span class="player-name">Siêu Tốc</span>
            <span class="player-score">{{ Math.max(20, scoreDisplay - 10) }}</span>
          </div>
          <div class="lb-row">
            <span class="rank-badge">3</span>
            <span class="player-name">Tia Chớp</span>
            <span class="player-score">{{ Math.max(10, scoreDisplay - 20) }}</span>
          </div>
        </div>
      </div>
    </header>

    <!-- TRƯỜNG ĐUA XE CHÍNH (RACE TRACK VIEWPORT) -->
    <main class="race-track-arena" v-if="currentQuestionItem && !isComplete">
      <!-- Khán đài và cây cối phía sau -->
      <div class="grandstand-backdrop" aria-hidden="true">
        <div class="audience-row">👥👥👥👥👥👥👥👥👥👥👥👥👥👥👥👥👥👥👥👥</div>
        <div class="fence-barrier"></div>
      </div>

      <!-- MẶT ĐƯỜNG ĐUA NHIỀU LÀN (MỖI LÀN = 1 ĐÁP ÁN) -->
      <div class="track-pavement" v-if="isMcqType">
        <!-- Vạch đích kẻ caro bên phải -->
        <div class="finish-line-strip" aria-hidden="true">
          <div class="finish-flag-pole">🏁</div>
          <div class="checker-pattern"></div>
        </div>

        <!-- Các làn xe ngang -->
        <div class="lanes-container">
          <div
            v-for="(option, idx) in options"
            :key="option.id"
            class="track-lane"
            :class="{
              'lane--active': selectedLaneId === option.id,
              'lane--boost': selectedLaneId === option.id && checkFeedback === 'correct',
              'lane--crash': selectedLaneId === option.id && checkFeedback === 'wrong',
            }"
            @click="selectLane(option.id)"
          >
            <!-- Khối nút đáp án 3D bên trái (A, B, C...) -->
            <button
              type="button"
              class="lane-button-3d"
              :class="`lane-color-${idx % 4}`"
              :disabled="isChecking || isChecked"
            >
              <span class="lane-letter">{{ letters[idx] }}</span>
              <span class="lane-answer-text">{{ option.content }}</span>
            </button>

            <!-- Khoảng chạy xe trên làn -->
            <div class="lane-road-space">
              <!-- Vạch kẻ đường đứt đoạn -->
              <div class="lane-divider-dash"></div>

              <!-- Chiếc siêu xe chạy trên làn -->
              <div
                class="race-car-actor"
                :class="{
                  'car--revving': selectedLaneId === option.id && !checkFeedback,
                  'car--boosted': selectedLaneId === option.id && checkFeedback === 'correct',
                  'car--crashed': selectedLaneId === option.id && checkFeedback === 'wrong',
                  'car--idle': selectedLaneId !== option.id,
                }"
              >
                <!-- Lửa / khói phản lực đuôi xe -->
                <div
                  class="car-exhaust-nitro"
                  v-if="selectedLaneId === option.id"
                  :class="`nitro-color-${idx % 4}`"
                ></div>

                <!-- SVG Siêu xe thể thao nhìn nghiêng ngang (Profile view như hình mẫu) -->
                <svg viewBox="0 0 200 80" width="165" height="65" class="car-svg">
                  <!-- Cánh gió sau (Spoiler) thể thao nổi bật -->
                  <path d="M16 28 L5 12 L30 12 L24 28 Z" :fill="carColors[idx % 4].spoiler" />

                  <!-- Đuôi xe & cản sau nhô cong -->
                  <path
                    d="M18 45 Q22 24 50 20 L120 20 Q160 25 185 42 Q196 50 195 58 L190 64 L12 64 Q9 54 18 45 Z"
                    :fill="carColors[idx % 4].body"
                    stroke="#0f172a"
                    stroke-width="3"
                  />

                  <!-- Mui xe & Khung kính chắn gió thể thao uốn lượn -->
                  <path
                    d="M60 24 L96 24 Q122 26 138 38 L52 38 Q55 28 60 24 Z"
                    fill="#0f172a"
                    opacity="0.9"
                  />
                  <!-- Kính hông sau -->
                  <path d="M35 36 L50 26 L50 38 L32 38 Z" fill="#1e293b" opacity="0.9" />

                  <!-- Sọc đua kép thể thao màu trắng trên nóc chạy dọc thân -->
                  <path d="M64 20 L180 40 L176 44 L60 23 Z" fill="#ffffff" opacity="0.9" />
                  <path d="M68 20 L184 40 L180 44 L64 23 Z" fill="#ffffff" opacity="0.5" />

                  <!-- Đèn pha trước vuốt nhọn siêu ngầu -->
                  <polygon points="184,44 195,50 186,54" fill="#fef08a" stroke="#ca8a04" stroke-width="1" />
                  <line x1="185" y1="48" x2="198" y2="51" stroke="#ffffff" stroke-width="2" />

                  <!-- Đèn hậu LED đỏ rực -->
                  <rect x="12" y="42" width="7" height="10" rx="3" fill="#ef4444" />

                  <!-- Hốc bánh xe sau & Bánh xe thể thao viền mâm 5 chấu -->
                  <circle cx="48" cy="64" r="17" fill="#0f172a" />
                  <circle cx="48" cy="64" r="11" fill="#cbd5e1" stroke="#475569" stroke-width="2" />
                  <circle cx="48" cy="64" r="5" fill="#0f172a" />

                  <!-- Hốc bánh xe trước & Bánh xe trước -->
                  <circle cx="152" cy="64" r="17" fill="#0f172a" />
                  <circle cx="152" cy="64" r="11" fill="#cbd5e1" stroke="#475569" stroke-width="2" />
                  <circle cx="152" cy="64" r="5" fill="#0f172a" />
                </svg>

                <!-- Vệt bánh xe / khói khi phóng -->
                <div class="skid-marks" v-if="selectedLaneId === option.id && checkFeedback === 'correct'"></div>
              </div>

              <!-- Tường chắn xuất hiện khi xe trả lời sai -->
              <div
                v-if="selectedLaneId === option.id && checkFeedback === 'wrong'"
                class="collision-wall"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        <!-- Rào chắn viền đường đua đỏ trắng dưới đáy -->
        <div class="curb-barrier-strip"></div>
      </div>

      <!-- Trường hợp câu dạng FILL / ESSAY / MATCHING -->
      <div v-else class="non-mcq-track-card">
        <QuestionItem
          :item="currentQuestionItem"
          :index="session.currentIndex.value"
          :answer="session.answers[currentQuestionItem.question.id] || {}"
          :level="1"
          mode="race"
          :disabled="isChecking || isChecked"
          @answered="onQuestionAnswered"
        />
        <div class="d-flex justify-center mt-4">
          <button
            type="button"
            class="btn-nitro-fire"
            :disabled="!session.hasAnswer(currentQuestionItem.question.id) || isChecking || isChecked"
            @click="onCommitAnswer"
          >
            🏎️ NHẤN GA PHÓNG TỚI!
          </button>
        </div>
      </div>

      <!-- FOOTER TIẾN ĐỘ CHẶNG ĐUA & NÚT LÁI XE (ACTION COMMIT) -->
      <footer class="race-bottom-bar" v-if="isMcqType">
        <!-- Vạch tiến độ cờ đích phía dưới -->
        <div class="lap-progress-container">
          <span class="lap-flag-icon">🏁</span>
          <div class="lap-track-bar">
            <div
              class="lap-track-fill"
              :style="{ width: `${(displayNum / totalQuestions) * 100}%` }"
            ></div>
          </div>
        </div>

        <!-- Nút Lái / Nhấn ga to tướng 3D rực lửa -->
        <button
          type="button"
          class="btn-nitro-fire"
          :class="{ 'btn-ready': selectedLaneId !== null && !isChecking && !isChecked }"
          :disabled="selectedLaneId === null || isChecking || isChecked"
          @click="onCommitAnswer"
        >
          <span class="btn-flame-icon">🔥</span>
          <span class="btn-text">
            {{ isChecking ? 'ĐANG PHÓNG...' : 'LÁI XE VƯỢT LÀN!' }}
          </span>
        </button>
      </footer>
    </main>

    <!-- MÀN VỀ ĐÍCH HOÀNH TRÁNG -->
    <Transition name="fade">
      <div v-if="isComplete" class="race-finish-modal">
        <div class="finish-card">
          <div class="finish-cups">🏆 🏁 🏎️</div>
          <h2 class="finish-headline">VỀ ĐÍCH XUẤT SẮC!</h2>
          <p class="finish-desc">
            Tay đua cừ khôi đã hoàn thành toàn bộ <strong>{{ totalQuestions }}</strong> chặng đua với điểm số <strong>{{ scoreDisplay }}</strong> điểm!
          </p>
          <button
            type="button"
            class="btn-nitro-fire btn-ready btn-submit-game"
            :disabled="session.submitting.value"
            @click="session.submit()"
          >
            {{ session.submitting.value ? 'ĐANG NỘP BÀI...' : '🏁 CÁN ĐÍCH & NỘP BÀI NGAY' }}
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

const letters = ['A', 'B', 'C', 'D'];

// Bảng màu cho 4 chiếc xe (Đỏ, Xanh dương, Xanh lá, Vàng cam)
const carColors = [
  { body: '#ef4444', spoiler: '#b91c1c' }, // Làn A: Đỏ
  { body: '#3b82f6', spoiler: '#1d4ed8' }, // Làn B: Xanh dương
  { body: '#22c55e', spoiler: '#15803d' }, // Làn C: Xanh lá
  { body: '#f59e0b', spoiler: '#b45309' }, // Làn D: Vàng cam
];

const selectedLaneId = ref(null);
const isChecking = ref(false);
const checkFeedback = ref(null); // 'correct' | 'wrong' | null
const score = ref(0);
const isComplete = ref(false);

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const currentQuestionItem = computed(() => props.session.currentQuestionItem?.value);
const totalQuestions = computed(() => props.session.totalQuestions?.value || 1);
const displayNum = computed(() => (props.session.currentIndex?.value || 0) + 1);

const isMcqType = computed(() => {
  const t = currentQuestionItem.value?.question?.type;
  return t === 'MCQ' || t === 'MULTI_MCQ' || t === 'TRUE_FALSE';
});

const options = computed(() => currentQuestionItem.value?.question?.options || []);

const isChecked = computed(() => {
  const qId = currentQuestionItem.value?.question?.id;
  return qId != null && props.session.checkedQuestions?.[String(qId)] != null;
});

const scoreDisplay = computed(() => {
  return score.value * 10;
});

function selectLane(optionId) {
  if (isChecking.value || isChecked.value) return;
  selectedLaneId.value = optionId;
}

function onQuestionAnswered(questionId) {
  const answer = props.session.answers[questionId];
  if (answer) props.session.setAnswer(questionId, { ...answer });
}

// Bàn phím điều khiển (Phím 1-4, A-D hoặc Mũi tên Lên/Xuống)
function onKeydown(e) {
  if (isComplete.value || isChecking.value || isChecked.value) return;
  const opts = options.value;
  const map = { '1': 0, '2': 1, '3': 2, '4': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3, 'A': 0, 'B': 1, 'C': 2, 'D': 3 };

  if (map[e.key] !== undefined && opts[map[e.key]]) {
    selectedLaneId.value = opts[map[e.key]].id;
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    const currIdx = opts.findIndex(o => o.id === selectedLaneId.value);
    const prevIdx = currIdx > 0 ? currIdx - 1 : opts.length - 1;
    if (opts[prevIdx]) selectedLaneId.value = opts[prevIdx].id;
  } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
    const currIdx = opts.findIndex(o => o.id === selectedLaneId.value);
    const nextIdx = currIdx < opts.length - 1 ? currIdx + 1 : 0;
    if (opts[nextIdx]) selectedLaneId.value = opts[nextIdx].id;
  } else if (e.key === 'Enter' && selectedLaneId.value !== null) {
    onCommitAnswer();
  }
}

async function onCommitAnswer() {
  const q = currentQuestionItem.value?.question;
  if (!q || isChecking.value || isChecked.value) return;
  if (isMcqType.value && selectedLaneId.value === null) return;

  isChecking.value = true;
  checkFeedback.value = null;

  if (isMcqType.value && selectedLaneId.value !== null) {
    props.session.setAnswer(q.id, { selectedOptionId: selectedLaneId.value });
  }

  try {
    const res = await props.session.checkQuestion(q.id);
    const correct = res?.isCorrect === true;

    if (correct) {
      checkFeedback.value = 'correct';
      score.value += 1;
    } else {
      checkFeedback.value = 'wrong';
    }

    // Sau khi phóng xe 1.3s: chuyển sang câu tiếp theo
    setTimeout(() => {
      checkFeedback.value = null;
      if (!props.session.isLastQuestion?.value) {
        props.session.next();
      } else {
        isComplete.value = true;
      }
    }, prefersReducedMotion ? 400 : 1300);

  } catch {
    setTimeout(() => {
      if (!props.session.isLastQuestion?.value) props.session.next();
      else isComplete.value = true;
    }, 400);
  } finally {
    isChecking.value = false;
  }
}

watch(() => props.session.currentIndex?.value, () => {
  selectedLaneId.value = null;
  checkFeedback.value = null;
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
    score.value = Object.values(checked).filter(c => c.isCorrect === true).length;
    if (firstUnansweredIndex < 0) {
      isComplete.value = true;
    }
  }
  return () => document.removeEventListener('keydown', onKeydown);
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

/* ================= HEADER: ĐỒNG HỒ, BANNER ĐỀ BÀI, LEADERBOARD ================= */
.race-header {
  display: grid;
  grid-template-columns: 140px 1fr 180px;
  align-items: center;
  gap: 16px;
  padding: 10px 20px;
  background: rgba(15, 23, 42, 0.35);
  backdrop-filter: blur(8px);
  border-bottom: 3px solid rgba(255, 255, 255, 0.2);
  z-index: 10;
}

/* ĐỒNG HỒ TRÒN */
.timer-badge {
  display: flex;
  align-items: center;
}

.timer-dial {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #0f172a;
  border: 3px solid #38bdf8;
  padding: 8px 16px;
  border-radius: 999px;
  box-shadow: 0 4px 14px rgba(56, 189, 248, 0.4);
}

.timer-icon {
  font-size: 1.5rem;
}

.timer-val {
  font-size: 1.3rem;
  font-weight: 900;
  color: #ffffff;
  font-variant-numeric: tabular-nums;
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
  font-size: 2.4rem;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
}

.question-billboard {
  background: #fffbeb;
  border: 4px solid #f59e0b;
  border-radius: 24px;
  padding: 14px 28px;
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
  font-size: 1.35rem;
  font-weight: 900;
  color: #1e293b;
  line-height: 1.45;
  margin: 0;
}

/* BẢNG XẾP HẠNG GÓC PHẢI */
.leaderboard-card {
  background: rgba(15, 23, 42, 0.85);
  border: 2px solid #38bdf8;
  border-radius: 16px;
  padding: 8px 12px;
  color: #ffffff;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.lb-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 900;
  color: #fcd34d;
  margin-bottom: 4px;
}

.lb-rows {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.lb-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.78rem;
  font-weight: 800;
  padding: 2px 4px;
  border-radius: 4px;
}

.lb-rank-1 {
  background: rgba(245, 158, 11, 0.25);
  color: #fef08a;
}

.player-score {
  font-weight: 900;
  color: #38bdf8;
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
  height: 38px;
  background: linear-gradient(180deg, #15803d 0%, #166534 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  position: relative;
}

.audience-row {
  font-size: 1rem;
  letter-spacing: 4px;
  opacity: 0.75;
  white-space: nowrap;
}

.fence-barrier {
  height: 6px;
  background: repeating-linear-gradient(90deg, #cbd5e1, #cbd5e1 12px, #475569 12px, #475569 24px);
}

/* MẶT ĐƯỜNG ĐUA */
.track-pavement {
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
  min-width: 260px;
  max-width: 380px;
  height: 68px;
  margin-left: 14px;
  border: none;
  border-radius: 16px;
  display: flex;
  align-items: center;
  padding: 0 20px;
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
  font-size: 2.2rem;
  font-weight: 900;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
  font-style: italic;
}

.lane-answer-text {
  font-size: 1.35rem;
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
  display: flex;
  align-items: center;
  position: relative;
  padding-left: 20px;
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
  --car-width: 165px;
  position: relative;
  display: flex;
  align-items: center;
  transform: translateX(20px);
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 3;
}

.car-svg {
  filter: drop-shadow(0 6px 8px rgba(0, 0, 0, 0.4));
}

/* Trạng thái xe nổ máy khi chọn */
.car--revving {
  transform: translateX(70px);
  animation: carVibrate 0.1s infinite alternate;
}

@keyframes carVibrate {
  from { transform: translateX(70px) translateY(-1px); }
  to { transform: translateX(70px) translateY(1px); }
}

/* Trạng thái xe TĂNG TỐC PHÓNG VÈO VỀ ĐÍCH KHI ĐÚNG */
.car--boosted {
  animation: nitroRocket 1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes nitroRocket {
  0% { left: 0; transform: translateX(70px); }
  30% { left: 0; transform: translateX(40px) scale(0.95); }
  100% { left: calc(100% - var(--car-width) - 100px); transform: translateX(70px) scale(1.05); }
}

/* Trạng thái xe va chạm khi SAI */
.car--crashed {
  animation: carHitWall 0.9s ease-in forwards;
}

@keyframes carHitWall {
  0% { left: 0; transform: translateX(70px); }
  75% { left: calc(100% - var(--car-width) - 100px); transform: translateX(70px); }
  86% { left: calc(100% - var(--car-width) - 100px); transform: translateX(82px) rotate(-8deg); }
  100% { left: calc(100% - var(--car-width) - 100px); transform: translateX(74px) rotate(6deg); }
}

/* KHÓI LỬA PHẢN LỰC ĐUÔI XE */
.car-exhaust-nitro {
  position: absolute;
  left: -40px;
  top: 50%;
  transform: translateY(-50%);
  width: 45px;
  height: 16px;
  border-radius: 999px 0 0 999px;
  filter: blur(2px);
  animation: nitroSpurt 0.15s infinite alternate;
}

@keyframes nitroSpurt {
  from { width: 35px; opacity: 0.8; }
  to { width: 50px; opacity: 1; }
}

.nitro-color-0 { background: linear-gradient(270deg, #ef4444, #f59e0b, transparent); }
.nitro-color-1 { background: linear-gradient(270deg, #3b82f6, #38bdf8, transparent); }
.nitro-color-2 { background: linear-gradient(270deg, #22c55e, #a3e635, transparent); }
.nitro-color-3 { background: linear-gradient(270deg, #f59e0b, #fef08a, transparent); }

/* Tường chắn ở cuối làn khi xe đâm trúng */
.collision-wall {
  position: absolute;
  right: 14px;
  top: 50%;
  width: 24px;
  height: 64px;
  transform: translateY(-50%);
  border: 2px solid #78350f;
  border-radius: 4px;
  background-color: #b45309;
  background-image:
    linear-gradient(90deg, transparent 48%, #78350f 49%, #78350f 53%, transparent 54%),
    linear-gradient(0deg, transparent 47%, #78350f 48%, #78350f 53%, transparent 54%);
  background-size: 18px 16px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
}

@keyframes popCone {
  from { transform: scale(0); }
  to { transform: scale(1); }
}

/* RÀO CHẮN VIỀN ĐỎ TRẮNG ĐÁY ĐƯỜNG ĐUA */
.curb-barrier-strip {
  height: 12px;
  background: repeating-linear-gradient(90deg, #ef4444, #ef4444 24px, #ffffff 24px, #ffffff 48px);
  border-top: 2px solid #000000;
}

/* DÀNH CHO CÂU DẠNG FILL / ESSAY */
.non-mcq-track-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 24px;
  margin: 12px 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  position: relative;
  scrollbar-gutter: stable;
}

.non-mcq-track-card > .d-flex {
  position: sticky;
  bottom: -24px;
  z-index: 2;
  padding: 12px 0 6px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0), #ffffff 35%);
}

/* ================= BOTTOM BAR: TIẾN ĐỘ & NÚT NHẤN GA ================= */
.race-bottom-bar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 14px 24px;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(10px);
  border-top: 3px solid rgba(255, 255, 255, 0.15);
}

.lap-progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  max-width: 450px;
}

.lap-flag-icon {
  font-size: 1.8rem;
}

.lap-track-bar {
  flex: 1;
  height: 16px;
  background: #334155;
  border-radius: 999px;
  border: 2px solid #64748b;
  overflow: hidden;
}

.lap-track-fill {
  height: 100%;
  background: linear-gradient(90deg, #f59e0b, #ef4444);
  border-radius: 999px;
  transition: width 0.4s ease;
}

/* NÚT NITRO CHỐT ĐÁP ÁN */
.btn-nitro-fire {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 36px;
  border-radius: 999px;
  background: linear-gradient(180deg, #64748b 0%, #475569 100%);
  border: none;
  border-bottom: 5px solid #334155;
  color: #ffffff;
  font-size: 1.35rem;
  font-weight: 900;
  cursor: not-allowed;
  opacity: 0.55;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.btn-nitro-fire.btn-ready {
  background: linear-gradient(180deg, #f97316 0%, #ea580c 100%);
  border-bottom: 5px solid #9a3412;
  opacity: 1;
  cursor: pointer;
  box-shadow: 0 10px 28px rgba(234, 88, 12, 0.5);
  animation: nitroPulse 1.5s infinite alternate;
}

@keyframes nitroPulse {
  from { transform: scale(1); }
  to { transform: scale(1.04); }
}

.btn-nitro-fire.btn-ready:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 14px 32px rgba(234, 88, 12, 0.6);
}

.btn-nitro-fire.btn-ready:active {
  transform: translateY(3px) scale(0.98);
  border-bottom-width: 2px;
}

.btn-flame-icon {
  font-size: 1.6rem;
}

/* ================= MÀN KẾT THÚC VỀ ĐÍCH ================= */
.race-finish-modal {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.finish-card {
  background: #ffffff;
  border: 5px solid #f59e0b;
  border-radius: 32px;
  padding: 40px 32px;
  text-align: center;
  max-width: 480px;
  width: 90%;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
}

.finish-cups {
  font-size: 3.5rem;
  margin-bottom: 12px;
}

.finish-headline {
  font-size: 1.8rem;
  font-weight: 900;
  color: #ea580c;
  margin-bottom: 12px;
}

.finish-desc {
  font-size: 1.15rem;
  color: #475569;
  line-height: 1.5;
  margin-bottom: 28px;
}

.btn-submit-game {
  width: 100%;
}

/* ================= RESPONSIVE CHO MOBILE (375PX & 414PX) ================= */
@media (max-width: 768px) {
  .race-header {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 10px 14px;
  }

  .leaderboard-card {
    display: none;
  }

  .timer-dial {
    padding: 6px 12px;
    font-size: 1rem;
  }

  .flag-banner {
    display: none;
  }

  .question-billboard {
    padding: 10px 14px;
  }

  .question-text {
    font-size: 1.15rem;
  }

  .lane-button-3d {
    width: 120px;
    min-width: 0;
    height: 52px;
    padding: 0 10px;
    gap: 8px;
  }

  .lane-letter {
    font-size: 1.6rem;
  }

  .lane-answer-text {
    font-size: 1.05rem;
  }

  .car-svg {
    width: 90px;
    height: 40px;
  }

  .race-car-actor {
    --car-width: 90px;
  }

  .race-bottom-bar {
    flex-direction: column;
    padding: 10px 14px;
  }

  .btn-nitro-fire {
    width: 100%;
    font-size: 1.15rem;
    padding: 14px 20px;
  }
}

/* REDUCED MOTION */
.reduce-motion * {
  animation: none !important;
  transition: none !important;
}
</style>
