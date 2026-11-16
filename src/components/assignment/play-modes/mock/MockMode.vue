<template>
  <div class="mock-mode">
    <!-- ── HEADER ── -->
    <div class="mock-header px-4 py-3">
      <div class="text-center">
        <div class="mock-title">THI THỬ THPT QUỐC GIA</div>
        <div class="mock-subtitle">Phiếu Trả Lời Trắc Nghiệm</div>
      </div>
      <div class="timer-box" :class="{ 'timer-warning': session.remainingSeconds.value <= 300 }">
        <v-icon size="18" class="mr-1">mdi-clock-outline</v-icon>
        {{ session.timeLabel.value }}
      </div>
    </div>

    <!-- ── PART TABS ── -->
    <v-tabs
      v-model="activeTab"
      bg-color="grey-darken-3"
      color="amber"
      align-tabs="center"
      density="compact"
    >
      <v-tab v-for="(part, pi) in parts" :key="pi" :value="pi">
        Phần {{ romanize(pi + 1) }}
        <v-chip size="x-small" class="ml-1" :color="partChipColor(pi)">
          {{ partAnsweredCount(pi) }}/{{ part.questions.length }}
        </v-chip>
      </v-tab>
    </v-tabs>

    <v-progress-linear
      :model-value="totalProgress"
      color="amber-darken-2"
      bg-color="grey-lighten-2"
      height="3"
    />

    <!-- ── PART CONTENT ── -->
    <v-tabs-window v-model="activeTab">
      <v-tabs-window-item v-for="(part, pi) in parts" :key="pi" :value="pi">
        <v-container class="pa-3">
          <div class="part-header mb-4">
            <span class="text-subtitle-1 font-weight-bold">
              Phần {{ romanize(pi + 1) }} — {{ part.questions.length }} câu
            </span>
          </div>

          <!-- Bubble answer sheet -->
          <v-card
            v-for="(q, qi) in part.questions"
            :key="q.id"
            class="bubble-row mb-2 pa-2"
            rounded="lg"
            :elevation="q.id === currentQuestion.id ? 3 : 1"
            :class="{ 'bubble-row--active': q.id === currentQuestion.id }"
            @click="gotoQuestion(part.startIndex + qi)"
          >
            <div class="d-flex align-center gap-2">
              <!-- Question number -->
              <div class="q-num">{{ part.startIndex + qi + 1 }}</div>

              <!-- Bubble options -->
              <div class="bubbles d-flex gap-2 flex-grow-1">
                <div
                  v-for="(opt, oi) in q.options.slice(0, 4)"
                  :key="opt.id"
                  class="bubble"
                  :class="{ 'bubble--filled': isSelected(q.id, opt.id) }"
                  @click.stop="bubbleSelect(q.id, opt.id)"
                >
                  {{ bubbleLabels[oi] }}
                </div>

                <!-- Free-text indicator for non-MCQ -->
                <div v-if="!q.options || q.options.length === 0" class="text-answer-indicator">
                  <v-icon size="14">mdi-pencil</v-icon>
                  {{ session.answers[q.id]?.answerText ? '✓' : '' }}
                </div>
              </div>

              <!-- Flag -->
              <v-btn
                icon
                size="x-small"
                variant="text"
                :color="flaggedSet.has(q.id) ? 'amber-darken-2' : 'grey-lighten-1'"
                @click.stop="toggleFlag(q.id)"
              >
                <v-icon size="14">mdi-flag</v-icon>
              </v-btn>
            </div>
          </v-card>
        </v-container>
      </v-tabs-window-item>
    </v-tabs-window>

    <!-- ── FOOTER ── -->
    <div class="mock-footer pa-3 d-flex justify-space-between align-center">
      <div class="text-body-2 text-grey-darken-1">
        Đã làm: <strong>{{ totalAnswered }}</strong> / {{ session.totalQuestions.value }}
      </div>
      <v-btn
        color="red-darken-3"
        rounded="lg"
        :loading="session.submitting.value"
        @click="confirmDialog = true"
      >
        <v-icon start>mdi-send</v-icon> Nộp bài
      </v-btn>
    </div>

    <!-- ── CONFIRM DIALOG ── -->
    <v-dialog v-model="confirmDialog" max-width="440" persistent>
      <v-card rounded="lg" class="submit-dialog">
        <div class="submit-dialog-header pa-5 text-center">
          <div class="text-h6 font-weight-bold">XÁC NHẬN NỘP BÀI</div>
          <div class="text-caption text-grey mt-1">THI THỬ THPT QUỐC GIA</div>
        </div>
        <v-divider />
        <v-card-text class="pa-5">
          <v-alert
            v-if="totalAnswered < session.totalQuestions.value"
            type="warning"
            density="compact"
            class="mb-4"
          >
            Bạn còn <strong>{{ session.totalQuestions.value - totalAnswered }}</strong> câu chưa trả lời.
          </v-alert>

          <div class="text-body-2 mb-2">
            Đã hoàn thành: <strong>{{ totalAnswered }}</strong> / {{ session.totalQuestions.value }} câu
          </div>
          <v-progress-linear
            :model-value="totalProgress"
            color="blue-darken-3"
            height="8"
            rounded
            class="mb-4"
          />

          <div class="text-body-2 text-grey-darken-1">
            ⚠️ Sau khi nộp bài, bạn sẽ <strong>không thể</strong> thay đổi đáp án.<br/>
            Hãy chắc chắn bạn đã kiểm tra kỹ trước khi xác nhận.
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-btn variant="outlined" color="grey-darken-1" @click="confirmDialog = false">
            Quay lại làm bài
          </v-btn>
          <v-spacer />
          <v-btn
            color="red-darken-3"
            :loading="session.submitting.value"
            @click="doSubmit"
          >
            ✅ Xác nhận nộp bài
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, ref, reactive } from 'vue'

const props = defineProps({
  session: { type: Object, required: true }
})

const bubbleLabels = ['A', 'B', 'C', 'D']
const PART_SIZE = Math.ceil(1 / 3 * 100) // roughly divide into 3 parts

// ── All questions ────────────────────────────────────────────
const allQuestions = computed(() => props.session.questions?.value ?? [])
const currentQuestion = computed(
  () => props.session.currentQuestionItem.value?.question ?? {}
)

// ── Parts: divide into 3 roughly equal parts ─────────────────
const parts = computed(() => {
  const qs = allQuestions.value
  const total = qs.length
  if (!total) return []

  const partCount = 3
  const baseSize = Math.floor(total / partCount)
  const remainder = total % partCount

  const result = []
  let idx = 0
  for (let i = 0; i < partCount; i++) {
    const size = baseSize + (i < remainder ? 1 : 0)
    if (size === 0) continue
    result.push({
      startIndex: idx,
      questions: qs.slice(idx, idx + size)
    })
    idx += size
  }
  return result
})

// ── Active tab ───────────────────────────────────────────────
const activeTab = ref(0)

function gotoQuestion(globalIndex) {
  props.session.goTo(globalIndex)
}

// ── Bubble selection ─────────────────────────────────────────
function isSelected(qId, optId) {
  return props.session.answers[qId]?.selectedOptionId === optId
}

function bubbleSelect(qId, optId) {
  const current = props.session.answers[qId]?.selectedOptionId
  // toggle: click same bubble deselects
  props.session.setAnswer(qId, {
    selectedOptionId: current === optId ? null : optId
  })
}

// ── Flag ─────────────────────────────────────────────────────
const flaggedSet = reactive(new Set())
function toggleFlag(qId) {
  if (flaggedSet.has(qId)) flaggedSet.delete(qId)
  else flaggedSet.add(qId)
}

// ── Progress helpers ─────────────────────────────────────────
const totalAnswered = computed(() =>
  allQuestions.value.filter(q => props.session.hasAnswer(q.id)).length
)
const totalProgress = computed(() => {
  const total = props.session.totalQuestions.value
  return total ? Math.round((totalAnswered.value / total) * 100) : 0
})

function partAnsweredCount(pi) {
  return parts.value[pi]?.questions.filter(q => props.session.hasAnswer(q.id)).length ?? 0
}
function partChipColor(pi) {
  const p = parts.value[pi]
  if (!p) return 'grey'
  const count = partAnsweredCount(pi)
  if (count === p.questions.length) return 'green'
  if (count > 0) return 'amber-darken-2'
  return 'grey'
}

// ── Roman numerals ───────────────────────────────────────────
function romanize(n) {
  const map = { I: 1, IV: 4, V: 5, IX: 9, X: 10 }
  let result = ''
  for (const [r, v] of Object.entries(map).reverse()) {
    while (n >= v) { result += r; n -= v }
  }
  return result
}

// ── Submit ───────────────────────────────────────────────────
const confirmDialog = ref(false)
function doSubmit() {
  confirmDialog.value = false
  props.session.submit()
}
</script>

<style scoped>
.mock-mode {
  min-height: 100vh;
  background: #fafafa;
  display: flex;
  flex-direction: column;
}

.mock-header {
  background: linear-gradient(135deg, #37474f, #263238);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 20;
}
.mock-title {
  color: #fff;
  font-weight: 800;
  font-size: 14px;
  letter-spacing: 1px;
}
.mock-subtitle {
  color: #90a4ae;
  font-size: 11px;
  letter-spacing: 0.5px;
}
.timer-box {
  display: flex;
  align-items: center;
  background: rgba(255,255,255,0.1);
  color: #fff;
  border-radius: 8px;
  padding: 4px 10px;
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 1px;
  white-space: nowrap;
}
.timer-warning {
  background: rgba(229,57,53,0.75) !important;
  animation: blink 1s step-start infinite;
}
@keyframes blink { 50% { opacity: 0.5; } }

.part-header {
  border-left: 4px solid #37474f;
  padding-left: 10px;
}

/* Bubble row */
.bubble-row {
  cursor: pointer;
  transition: all 0.15s;
  border: 2px solid transparent;
}
.bubble-row:hover {
  border-color: #90a4ae;
}
.bubble-row--active {
  border-color: #1565c0 !important;
  background: #e3f2fd !important;
}

.q-num {
  min-width: 28px;
  font-weight: 700;
  font-size: 12px;
  color: #37474f;
  text-align: right;
}

.bubbles {
  flex-wrap: nowrap;
}

.bubble {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #90a4ae;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #546e7a;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
  flex-shrink: 0;
}
.bubble:hover {
  border-color: #1565c0;
  color: #1565c0;
  background: #e3f2fd;
}
.bubble--filled {
  background: #1a237e !important;
  border-color: #1a237e !important;
  color: #fff !important;
}

.text-answer-indicator {
  font-size: 12px;
  color: #546e7a;
  display: flex;
  align-items: center;
  gap: 2px;
}

.mock-footer {
  position: sticky;
  bottom: 0;
  background: #fff;
  border-top: 1px solid #e0e0e0;
  z-index: 10;
}

.submit-dialog-header {
  background: linear-gradient(135deg, #37474f, #263238);
  color: #fff;
  border-radius: 8px 8px 0 0;
}

@media (max-width: 375px) {
  .mock-title { font-size: 12px; }
  .bubble { width: 26px; height: 26px; font-size: 10px; }
  .q-num { font-size: 11px; }
}
</style>
