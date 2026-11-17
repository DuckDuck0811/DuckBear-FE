<template>
  <div class="fruit-game" :class="{ 'reduce-motion': prefersReducedMotion }">
    <!-- TOP BAR TRÊN CÙNG: CÂY THỬ THÁCH, CỜ ĐÍCH & SAO VÀNG -->
    <header class="tree-header">
      <!-- Cột trái: Huy hiệu gỗ Cây Thử Thách X / N -->
      <div class="tree-progress-badge">
        <span class="tree-mini-icon">🌳</span>
        <div class="tree-badge-text">
          <span class="tree-caption">Cây Thử Thách</span>
          <strong class="tree-fraction">{{ displayQ }} / {{ totalQ }}</strong>
        </div>
      </div>

      <!-- Giữa: Cờ ca rô Đích trên ngọn cây -->
      <div class="tree-finish-flag-node">
        <span class="flag-icon">🏁</span>
        <div class="wood-flag-sign">Đích</div>
      </div>

      <!-- Phải: Ngôi sao vàng 3D kèm số sao -->
      <div class="tree-star-pill">
        <span class="star-3d">⭐</span>
        <strong class="star-number">{{ stars }}</strong>
      </div>
    </header>

    <!-- SÂN KHẤU CÂY CỔ THỤ KHỔNG LỒ & BẢNG GỖ CÂU HỎI -->
    <main class="tree-arena">
      <!-- CÂY CỔ THỤ LÀM TRUNG TÂM -->
      <div class="tree-trunk-centerpiece">
        <!-- Tán lá xanh xum xuê đỉnh cây -->
        <div class="tree-foliage-crown" aria-hidden="true">
          <div class="leaf-cluster cluster-1"></div>
          <div class="leaf-cluster cluster-2"></div>
          <div class="leaf-cluster cluster-3"></div>
        </div>

        <!-- Thân cây gỗ to đồ sộ -->
        <div class="trunk-bark-pillar"></div>

        <!-- DÂY THỪNG VÀ CHÚ SÓC NÂU ĐEO BALO LEO CÂY BÊN TRÁI -->
        <div
          class="squirrel-climber-zone"
          :class="{
            'squirrel--jump': heroAnim === 'jump',
            'squirrel--shake': heroAnim === 'shake',
          }"
        >
          <!-- Dây thừng bện xoắn treo từ ngọn cây xuống cành gỗ -->
          <div class="climbing-rope"></div>

          <!-- Chú sóc nâu quàng khăn đỏ đeo balo xanh bám dây leo (SVG chuẩn theo ảnh mẫu) -->
          <div class="squirrel-actor">
            <svg viewBox="0 0 140 130" width="130" height="120" class="squirrel-svg">
              <defs>
                <!-- Gradient đuôi sóc bông xù -->
                <radialGradient id="squirrel-tail-grad" cx="40%" cy="40%" r="60%">
                  <stop offset="0%" stop-color="#f59e0b" />
                  <stop offset="40%" stop-color="#d97706" />
                  <stop offset="100%" stop-color="#92400e" />
                </radialGradient>
                <!-- Gradient thân sóc -->
                <linearGradient id="squirrel-body-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#f59e0b" />
                  <stop offset="60%" stop-color="#d97706" />
                  <stop offset="100%" stop-color="#b45309" />
                </linearGradient>
              </defs>

              <!-- Đuôi sóc xù to khổng lồ cuộn ngược phía sau -->
              <path
                d="M50 100 Q15 105 8 75 Q0 35 30 18 Q55 5 70 30 Q78 45 68 65 Q60 80 50 100 Z"
                fill="url(#squirrel-tail-grad)"
                stroke="#78350f"
                stroke-width="3"
              />
              <path
                d="M25 45 Q35 25 50 24 Q65 30 58 50"
                stroke="#fef3c7"
                stroke-width="3"
                fill="none"
                opacity="0.6"
              />

              <!-- Balo thám hiểm xanh dương trên lưng -->
              <rect x="52" y="52" width="22" height="26" rx="6" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2.5" />
              <rect x="56" y="58" width="14" height="6" rx="2" fill="#93c5fd" />
              <line x1="56" y1="52" x2="56" y2="78" stroke="#1d4ed8" stroke-width="2" />

              <!-- Thân sóc tròn mập mạp bám dây -->
              <ellipse cx="78" cy="74" rx="25" ry="24" fill="url(#squirrel-body-grad)" stroke="#78350f" stroke-width="3" />
              <!-- Bụng kem trắng sáng -->
              <ellipse cx="86" cy="76" rx="15" ry="16" fill="#fef3c7" />

              <!-- Chân sau bám chặt dây thừng -->
              <ellipse cx="68" cy="98" rx="10" ry="7" fill="#d97706" stroke="#78350f" stroke-width="2" />
              <ellipse cx="94" cy="98" rx="10" ry="7" fill="#d97706" stroke="#78350f" stroke-width="2" />

              <!-- Đầu sóc tròn cute hướng lên ngọn cây -->
              <circle cx="92" cy="42" r="22" fill="url(#squirrel-body-grad)" stroke="#78350f" stroke-width="3" />
              <!-- Má trắng phúng phính -->
              <ellipse cx="98" cy="48" rx="14" ry="11" fill="#fef3c7" />
              <!-- Má hồng bẽn lẽn -->
              <ellipse cx="88" cy="48" rx="3.5" ry="2" fill="#f43f5e" opacity="0.6" />
              <ellipse cx="106" cy="48" rx="3.5" ry="2" fill="#f43f5e" opacity="0.6" />

              <!-- Tai sóc nhọn nhỏ -->
              <polygon points="84,24 92,10 98,24" fill="#d97706" stroke="#78350f" stroke-width="2" />
              <polygon points="87,22 92,14 95,22" fill="#fed7aa" />

              <!-- Mắt to tròn long lanh hoạt hình -->
              <ellipse cx="100" cy="38" rx="6" ry="7" fill="#0f172a" />
              <circle cx="102" cy="36" r="2.2" fill="#ffffff" />
              <circle cx="98" cy="40" r="1" fill="#ffffff" />

              <!-- Mũi nhỏ & Miệng cười tít -->
              <circle cx="108" cy="45" r="2" fill="#78350f" />
              <path d="M104 48 Q108 52 112 48" stroke="#78350f" stroke-width="2" fill="none" stroke-linecap="round" />

              <!-- Khăn quàng đỏ rực thể thao quanh trán / cổ -->
              <path d="M74 34 Q92 24 108 34 L106 40 Q90 32 76 40 Z" fill="#ef4444" stroke="#991b1b" stroke-width="2" />
              <path d="M72 36 Q60 38 52 48 Q64 48 74 42 Z" fill="#ef4444" stroke="#991b1b" stroke-width="2" />

              <!-- Tay trước ôm chặt sợi dây thừng -->
              <ellipse cx="110" cy="52" rx="7" ry="5" fill="#f59e0b" stroke="#78350f" stroke-width="2" />
              <ellipse cx="108" cy="62" rx="7" ry="5" fill="#f59e0b" stroke="#78350f" stroke-width="2" />
            </svg>
          </div>

          <!-- Bệ cành cây gỗ nơi xuất phát phía dưới -->
          <div class="tree-perch-branch"></div>
        </div>

        <!-- BẢNG GỖ CÂU HỎI TREO TRÊN THÂN CÂY (Chính giữa) -->
        <div class="wood-stage-interactive" v-if="currentQuestionItem && !reachedTop">
          <!-- BẢNG GỖ ĐỀ BÀI LỚN CÓ QUẢ HẠT DẺ ĐÍNH TRÊN ĐỈNH -->
          <div class="wood-question-plank">
            <!-- Quả hạt dẻ trang trí trên đỉnh bảng -->
            <div class="acorn-crest">
              <span class="acorn-emoji">🌰</span>
            </div>
            <!-- Đinh tán 4 góc bảng gỗ -->
            <div class="wood-screw screw-tl"></div>
            <div class="wood-screw screw-tr"></div>
            <div class="wood-screw screw-bl"></div>
            <div class="wood-screw screw-br"></div>

            <h2 class="wood-question-text">
              {{ currentQuestionItem.question.content }}
            </h2>
          </div>

          <!-- LƯỚI CÁC CÀNH GỖ ĐÁP ÁN (2 CỘT x 2 HÀNG NHƯ HÌNH MẪU) -->
          <div v-if="isMcqType" class="wood-answers-grid">
            <button
              v-for="(option, idx) in options"
              :key="option.id"
              type="button"
              class="wood-branch-card"
              :class="{
                'branch--selected': localSelected === option.id,
                'branch--correct': checkFeedback === 'correct' && localSelected === option.id,
                'branch--wrong': checkFeedback === 'wrong' && localSelected === option.id,
                'branch--disabled': isChecking || isChecked,
              }"
              :disabled="isChecking || isChecked"
              @click="onPickBranch(option.id)"
            >
              <!-- Lá cây xanh mọc viền bên hông cành gỗ -->
              <span class="wood-sprout-leaf leaf-left">🌿</span>
              <span class="wood-sprout-leaf leaf-right">🌿</span>

              <!-- Huy hiệu Quả Táo Đỏ viền chữ cái A, B, C, D chuẩn ảnh -->
              <div class="apple-fruit-badge">
                <span class="apple-icon">🍎</span>
                <span class="apple-letter">{{ letters[idx] }}</span>
              </div>

              <!-- Nội dung đáp án chữ to đậm trên nền thớ gỗ -->
              <span class="branch-content-text">{{ option.content }}</span>

              <!-- Biểu tượng đúng sai -->
              <span class="branch-status-icon" v-if="localSelected === option.id && checkFeedback">
                <span v-if="checkFeedback === 'correct'">⭐</span>
                <span v-else-if="checkFeedback === 'wrong'">💨</span>
              </span>
            </button>
          </div>

          <!-- DÀNH CHO CÂU ĐIỀN KHUYẾT / TỰ LUẬN / MATCHING -->
          <div v-else class="wood-mission-task-card">
            <QuestionItem
              :item="currentQuestionItem"
              :index="session.currentIndex.value"
              :answer="session.answers[currentQuestionItem.question.id] || {}"
              :level="1"
              mode="fruit"
              :disabled="isChecking"
              @answered="() => {}"
            />
          </div>

          <!-- NÚT "HÁI QUẢ!" TO ĐẸP PHÍA DƯỚI -->
          <div class="wood-action-bar">
            <button
              type="button"
              class="btn-harvest-apple"
              :class="{ 'btn-harvest--ready': localSelected !== null && !isChecking && !isChecked }"
              :disabled="localSelected === null || isChecking || isChecked"
              @click="onConfirmHarvest"
            >
              <span class="harvest-icon">🧺</span>
              <span class="harvest-text">
                {{ isChecking ? 'ĐANG TRÈO...' : 'HÁI QUẢ NGAY!' }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- MÀN CHINH PHỤC NGỌN CÂY HOÀN THÀNH BÀI -->
    <Transition name="fade">
      <div v-if="reachedTop" class="top-congrats-modal">
        <div class="top-congrats-card">
          <div class="congrats-emojis">🌟 🧺 🍎</div>
          <h2 class="congrats-heading">CHINH PHỤC NGỌN CÂY THÀNH CÔNG!</h2>
          <p class="congrats-sub">
            Chú Sóc Nâu đã trèo lên tận ngọn cây và thu hoạch được <strong>{{ stars }}</strong> ngôi sao rực rỡ!
          </p>
          <button
            type="button"
            class="btn-harvest-apple btn-harvest--ready btn-submit-harvest"
            :disabled="session.submitting.value"
            @click="session.submit()"
          >
            {{ session.submitting.value ? 'ĐANG NỘP BÀI...' : '🎉 NỘP BÀI THU HOẠCH' }}
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
const heroAnim = ref('idle');
const isChecking = ref(false);
const checkFeedback = ref(null);
const reachedTop = ref(false);
const localSelected = ref(null);

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const totalQ = computed(() => props.session.totalQuestions?.value || 1);
const currentQuestionItem = computed(() => props.session.currentQuestionItem?.value);
const displayQ = computed(() => (props.session.currentIndex?.value || 0) + 1);

const isMcqType = computed(() => {
  const t = currentQuestionItem.value?.question?.type;
  return t === 'MCQ' || t === 'MULTI_MCQ' || t === 'TRUE_FALSE';
});

const options = computed(() => currentQuestionItem.value?.question?.options || []);

const isChecked = computed(() => {
  const qId = currentQuestionItem.value?.question?.id;
  return qId != null && props.session.checkedQuestions?.[String(qId)] != null;
});

function onPickBranch(optionId) {
  if (isChecking.value || isChecked.value) return;
  localSelected.value = optionId;
}

function onKeydown(e) {
  if (reachedTop.value || isChecking.value || isChecked.value) return;
  if (!currentQuestionItem.value) return;
  const opts = options.value;
  const map = { '1': 0, '2': 1, '3': 2, '4': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3, 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
  const idx = map[e.key];
  if (idx !== undefined && opts[idx]) {
    localSelected.value = opts[idx].id;
  }
  if (e.key === 'Enter' && localSelected.value !== null) {
    onConfirmHarvest();
  }
}

async function onConfirmHarvest() {
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
      stars.value += 1;
      heroAnim.value = 'jump';
    } else {
      checkFeedback.value = 'wrong';
      heroAnim.value = 'shake';
    }

    setTimeout(() => {
      checkFeedback.value = null;
      heroAnim.value = 'idle';
      if (!props.session.isLastQuestion?.value) {
        props.session.next();
      } else {
        reachedTop.value = true;
      }
    }, prefersReducedMotion ? 400 : 1300);

  } catch {
    heroAnim.value = 'idle';
    setTimeout(() => {
      if (!props.session.isLastQuestion?.value) props.session.next();
      else reachedTop.value = true;
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
  if (checkedCount > 0) {
    stars.value = Object.values(checked).filter(c => c.isCorrect === true).length;
    if (checkedCount >= (props.session.totalQuestions?.value || 1)) {
      reachedTop.value = true;
    }
  }
  return () => document.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
/* ================= TỔNG THỂ KHUNG MINI-GAME HÁI QUẢ ================= */
.fruit-game {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 600px;
  background: linear-gradient(180deg, #60a5fa 0%, #93c5fd 35%, #bbf7d0 70%, #86efac 100%);
  border: 4px solid #16a34a;
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 16px 40px rgba(22, 163, 74, 0.25);
  position: relative;
  font-family: inherit;
  user-select: none;
}

/* ================= HEADER TOP BAR ================= */
.tree-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 3.5px solid #86efac;
  z-index: 20;
}

/* HUY HIỆU CÂY THỬ THÁCH X / N BÊN TRÁI */
.tree-progress-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(180deg, #fef3c7 0%, #fde68a 100%);
  border: 2.5px solid #d97706;
  border-radius: 999px;
  padding: 6px 18px;
  box-shadow: 0 4px 10px rgba(217, 119, 6, 0.2);
}

.tree-mini-icon {
  font-size: 1.8rem;
}

.tree-badge-text {
  display: flex;
  flex-direction: column;
}

.tree-caption {
  font-size: 0.72rem;
  font-weight: 800;
  color: #92400e;
  letter-spacing: 0.5px;
}

.tree-fraction {
  font-size: 1.25rem;
  font-weight: 900;
  color: #78350f;
}

/* BIỂN CỜ ĐÍCH Ở GIỮA */
.tree-finish-flag-node {
  display: flex;
  align-items: center;
  gap: 8px;
}

.flag-icon {
  font-size: 2rem;
  animation: flagWave 1.2s ease-in-out infinite alternate;
}

@keyframes flagWave {
  from { transform: rotate(-6deg); }
  to { transform: rotate(6deg); }
}

.wood-flag-sign {
  background: linear-gradient(180deg, #fef3c7 0%, #fed7aa 100%);
  border: 2.5px solid #d97706;
  border-radius: 12px;
  padding: 4px 14px;
  font-size: 1.15rem;
  font-weight: 900;
  color: #78350f;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* NGÔI SAO VÀNG 3D BÊN PHẢI */
.tree-star-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(180deg, #f59e0b 0%, #d97706 100%);
  border: 2.5px solid #b45309;
  border-radius: 999px;
  padding: 6px 18px;
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.35);
  color: #ffffff;
}

.star-3d {
  font-size: 1.6rem;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
}

.star-number {
  font-size: 1.35rem;
  font-weight: 900;
}

/* ================= TRƯỜNG CÂY CHÍNH (MAIN ARENA) ================= */
.tree-arena {
  display: flex;
  flex: 1;
  position: relative;
  align-items: center;
  justify-content: center;
  padding: 16px 20px;
}

/* THÂN CÂY CỔ THỤ NẰM GIỮA */
.tree-trunk-centerpiece {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 980px;
  position: relative;
}

/* TÁN LÁ XANH RẬM RẠP TRÊN ĐỈNH */
.tree-foliage-crown {
  position: absolute;
  top: -40px;
  left: 0;
  right: 0;
  height: 90px;
  display: flex;
  justify-content: center;
  gap: 30px;
  pointer-events: none;
  z-index: 5;
}

.leaf-cluster {
  width: 140px;
  height: 70px;
  background: #22c55e;
  border-radius: 999px;
  box-shadow: 0 8px 16px rgba(21, 128, 61, 0.3);
}
.cluster-1 { transform: rotate(-8deg); background: #16a34a; }
.cluster-2 { width: 180px; height: 85px; background: #22c55e; }
.cluster-3 { transform: rotate(8deg); background: #15803d; }

/* TRỤ VỎ CÂY GỖ ĐỒ SỘ PHÍA SAU BẢNG */
.trunk-bark-pillar {
  position: absolute;
  top: 10px;
  bottom: 0;
  width: 280px;
  background: linear-gradient(90deg, #92400e 0%, #b45309 30%, #d97706 50%, #b45309 70%, #78350f 100%);
  border-radius: 36px 36px 0 0;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.35);
  z-index: 2;
}

/* ================= KHU VỰC SÓC NÂU BÊN TRÁI ================= */
.squirrel-climber-zone {
  position: absolute;
  left: 0;
  bottom: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 10;
}

/* Sợi dây thừng bện */
.climbing-rope {
  position: absolute;
  top: -240px;
  bottom: 0;
  width: 10px;
  background: repeating-linear-gradient(45deg, #d97706, #d97706 8px, #78350f 8px, #78350f 16px);
  border-radius: 5px;
  box-shadow: 2px 4px 6px rgba(0,0,0,0.25);
  z-index: 8;
}

.squirrel-actor {
  position: relative;
  z-index: 12;
  filter: drop-shadow(0 8px 14px rgba(0, 0, 0, 0.25));
  animation: squirrelBreathe 2s ease-in-out infinite alternate;
}

@keyframes squirrelBreathe {
  from { transform: translateY(0); }
  to { transform: translateY(-8px); }
}

.squirrel--jump .squirrel-actor {
  animation: squirrelClimbUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes squirrelClimbUp {
  0% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-45px) scale(1.1) rotate(6deg); }
  100% { transform: translateY(0) scale(1); }
}

.squirrel--shake .squirrel-actor {
  animation: squirrelShake 0.5s ease-in-out;
}

@keyframes squirrelShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px) rotate(-4deg); }
  75% { transform: translateX(8px) rotate(4deg); }
}

.tree-perch-branch {
  width: 120px;
  height: 28px;
  background: linear-gradient(180deg, #b45309 0%, #78350f 100%);
  border: 3px solid #57534e;
  border-radius: 14px 14px 0 0;
  margin-top: -10px;
  z-index: 9;
}

/* ================= SÂN KHẤU TƯƠNG TÁC GỖ CHÍNH GIỮA ================= */
.wood-stage-interactive {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
  max-width: 680px;
  margin-left: 110px;
}

/* BẢNG GỖ ĐỀ BÀI LỚN */
.wood-question-plank {
  position: relative;
  width: 100%;
  background: linear-gradient(180deg, #fef3c7 0%, #fed7aa 60%, #fde68a 100%);
  border: 4.5px solid #b45309;
  border-radius: 28px;
  padding: 22px 32px 18px;
  box-shadow: 0 12px 28px rgba(120, 53, 15, 0.3), inset 0 2px 0 #ffffff;
  text-align: center;
}

/* Quả hạt dẻ đính trên nóc */
.acorn-crest {
  position: absolute;
  top: -24px;
  left: 50%;
  transform: translateX(-50%);
  background: #fef3c7;
  border: 3px solid #b45309;
  border-radius: 50%;
  width: 46px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.acorn-emoji {
  font-size: 1.6rem;
}

/* 4 Đinh tán tròn 4 góc bảng gỗ */
.wood-screw {
  position: absolute;
  width: 10px;
  height: 10px;
  background: #78350f;
  border-radius: 50%;
  border: 1px solid #451a03;
}
.screw-tl { top: 10px; left: 12px; }
.screw-tr { top: 10px; right: 12px; }
.screw-bl { bottom: 10px; left: 12px; }
.screw-br { bottom: 10px; right: 12px; }

.wood-question-text {
  font-size: 1.45rem;
  font-weight: 900;
  color: #451a03;
  line-height: 1.45;
  margin: 0;
}

/* LƯỚI 2 CỘT x 2 HÀNG CÁC CÀNH GỖ ĐÁP ÁN */
.wood-answers-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px 20px;
  width: 100%;
}

/* MỖI CÀNH GỖ ĐÁP ÁN */
.wood-branch-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(180deg, #fffbeb 0%, #fef3c7 60%, #fed7aa 100%);
  border: 3.5px solid #b45309;
  border-radius: 999px;
  padding: 8px 18px 8px 8px;
  cursor: pointer;
  box-shadow: 0 6px 14px rgba(120, 53, 15, 0.2);
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-align: left;
  position: relative;
  outline: none;
}

.wood-branch-card:hover:not(:disabled) {
  transform: translateY(-3px) scale(1.02);
  border-color: #d97706;
  background: #ffffff;
  box-shadow: 0 10px 20px rgba(217, 119, 6, 0.35);
}

.wood-branch-card:active:not(:disabled) {
  transform: scale(0.98);
}

/* Mầm lá xanh 2 bên cành gỗ */
.wood-sprout-leaf {
  position: absolute;
  font-size: 1rem;
  pointer-events: none;
}
.leaf-left { top: -8px; left: 14px; transform: rotate(-20deg); }
.leaf-right { bottom: -8px; right: 20px; transform: rotate(15deg); }

/* HUY HIỆU QUẢ TÁO ĐỎ CHỨA CHỮ CÁI A, B, C, D */
.apple-fruit-badge {
  position: relative;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.apple-icon {
  font-size: 2.8rem;
  filter: drop-shadow(0 3px 5px rgba(0,0,0,0.2));
}

.apple-letter {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -35%);
  font-size: 1.4rem;
  font-weight: 900;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
  pointer-events: none;
}

.branch-content-text {
  flex: 1;
  font-size: 1.25rem;
  font-weight: 900;
  color: #451a03;
  line-height: 1.35;
}

.branch-status-icon {
  font-size: 1.6rem;
}

/* TRẠNG THÁI CHỌN CÀNH */
.branch--selected {
  border-color: #ea580c !important;
  background: #ffedd5 !important;
  box-shadow: 0 8px 24px rgba(234, 88, 12, 0.4) !important;
  transform: translateY(-3px) scale(1.02) !important;
}

.branch--correct {
  border-color: #16a34a !important;
  background: #dcfce7 !important;
  box-shadow: 0 0 24px rgba(22, 163, 74, 0.5) !important;
}

.branch--wrong {
  border-color: #dc2626 !important;
  background: #fee2e2 !important;
  animation: branchShake 0.4s ease;
}

@keyframes branchShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}

.branch--disabled {
  opacity: 0.85;
  cursor: default;
}

/* DÀNH CHO DẠNG CÂU ĐẶC BIỆT */
.wood-mission-task-card {
  width: 100%;
  background: #ffffff;
  border: 3.5px solid #b45309;
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.1);
}

/* NÚT "HÁI QUẢ!" DƯỚI ĐÁY */
.wood-action-bar {
  display: flex;
  justify-content: center;
  margin-top: 4px;
}

.btn-harvest-apple {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 14px 40px;
  border-radius: 999px;
  background: linear-gradient(180deg, #94a3b8 0%, #64748b 100%);
  border: none;
  border-bottom: 5px solid #475569;
  color: #ffffff;
  font-size: 1.35rem;
  font-weight: 900;
  cursor: not-allowed;
  opacity: 0.6;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.btn-harvest-apple.btn-harvest--ready {
  background: linear-gradient(180deg, #ea580c 0%, #c2410c 100%);
  border-bottom: 5px solid #7c2d12;
  opacity: 1;
  cursor: pointer;
  box-shadow: 0 10px 26px rgba(194, 65, 12, 0.45);
  animation: harvestPulse 1.5s infinite alternate;
}

@keyframes harvestPulse {
  from { transform: scale(1); }
  to { transform: scale(1.04); }
}

.btn-harvest-apple.btn-harvest--ready:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 14px 30px rgba(194, 65, 12, 0.55);
}

.btn-harvest-apple.btn-harvest--ready:active {
  transform: translateY(3px) scale(0.98);
  border-bottom-width: 2px;
}

.harvest-icon {
  font-size: 1.6rem;
}

/* ================= MÀN KẾT THÚC ================= */
.top-congrats-modal {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.top-congrats-card {
  background: #ffffff;
  border: 5px solid #d97706;
  border-radius: 32px;
  padding: 36px 30px;
  text-align: center;
  max-width: 440px;
  width: 90%;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
}

.congrats-emojis {
  font-size: 3.5rem;
  margin-bottom: 12px;
}

.congrats-heading {
  font-size: 1.6rem;
  font-weight: 900;
  color: #78350f;
  margin-bottom: 10px;
}

.congrats-sub {
  font-size: 1.1rem;
  color: #475569;
  line-height: 1.5;
  margin-bottom: 24px;
}

.btn-submit-harvest {
  width: 100%;
}

/* ================= RESPONSIVE MOBILE ================= */
@media (max-width: 768px) {
  .tree-header {
    padding: 10px 14px;
  }

  .tree-finish-flag-node {
    display: none;
  }

  .tree-arena {
    padding: 10px;
  }

  .trunk-bark-pillar {
    display: none;
  }

  .squirrel-climber-zone {
    display: none;
  }

  .wood-stage-interactive {
    margin-left: 0;
  }

  .wood-answers-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .wood-question-text {
    font-size: 1.2rem;
  }

  .branch-content-text {
    font-size: 1.1rem;
  }

  .btn-harvest-apple {
    font-size: 1.15rem;
    padding: 12px 24px;
  }
}

/* REDUCED MOTION */
.reduce-motion * {
  animation: none !important;
  transition: none !important;
}
</style>
