<template>
  <div class="exam-mode">
    <!-- ── STICKY HEADER ── -->
    <div class="exam-header px-4 py-2 d-flex align-center justify-space-between">
      <div class="d-flex align-center gap-2">
        <v-icon color="white">mdi-school</v-icon>
        <span class="text-white font-weight-bold text-h6">Phòng Thi</span>
      </div>

      <div class="timer-chip" :class="{ 'timer-warning': session.remainingSeconds.value <= 60 }">
        <v-icon size="16" class="mr-1">mdi-timer-outline</v-icon>
        {{ session.timeLabel.value }}
      </div>

      <v-btn icon variant="text" color="white" class="d-md-none" @click="navSheet = true">
        <v-icon>mdi-view-grid</v-icon>
      </v-btn>
    </div>

    <v-progress-linear
      :model-value="progress"
      color="amber"
      bg-color="blue-darken-4"
      height="4"
    />

    <!-- ── MAIN ── -->
    <v-container fluid class="pa-3">
      <v-row>
        <!-- QUESTION column -->
        <v-col cols="12" md="8">
          <v-card class="question-card" rounded="lg" elevation="2">
            <v-card-title class="exam-q-title py-3 px-4">
              Câu {{ currentIndex + 1 }}
              <v-chip v-if="isFlagged" color="amber-darken-2" size="x-small" class="ml-2">
                🚩 Đã đánh dấu
              </v-chip>
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-4">
              <div class="question-text mb-4" v-html="currentQuestion.content" />

              <template v-if="isMcq">
                <v-list class="pa-0" density="compact">
                  <v-list-item
                    v-for="(opt, oi) in currentQuestion.options"
                    :key="opt.id"
                    rounded="lg"
                    class="option-item mb-2"
                    :class="{ 'option-selected': selectedId === opt.id }"
                    @click="selectOption(opt.id)"
                  >
                    <template #prepend>
                      <span class="option-label">{{ optLabels[oi] }}</span>
                    </template>
                    <v-list-item-title>{{ opt.content }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </template>

              <template v-else>
                <QuestionItem
                  :item="session.currentQuestionItem.value"
                  @answered="onAnswered"
                />
              </template>
            </v-card-text>
          </v-card>

          <!-- Nav actions -->
          <div class="d-flex justify-space-between align-center mt-3">
            <div class="d-flex gap-2">
              <v-btn
                variant="outlined"
                color="blue-darken-3"
                :disabled="currentIndex === 0"
                rounded="lg"
                @click="session.prev()"
              >
                <v-icon start>mdi-arrow-left</v-icon> Trước
              </v-btn>
              <v-btn
                v-if="!session.isLastQuestion.value"
                color="blue-darken-3"
                rounded="lg"
                @click="session.next()"
              >
                Tiếp <v-icon end>mdi-arrow-right</v-icon>
              </v-btn>
            </div>

            <div class="d-flex gap-2">
              <v-btn
                :color="isFlagged ? 'amber-darken-2' : 'grey'"
                variant="tonal"
                size="small"
                rounded="lg"
                @click="toggleFlag"
              >🚩</v-btn>

              <v-btn
                color="red-darken-2"
                rounded="lg"
                :loading="session.submitting.value"
                @click="confirmDialog = true"
              >
                <v-icon start>mdi-send</v-icon> Nộp bài
              </v-btn>
            </div>
          </div>
        </v-col>

        <!-- SIDEBAR: question grid (desktop) -->
        <v-col cols="12" md="4" class="d-none d-md-flex flex-column">
          <v-card rounded="lg" elevation="2" class="pa-3">
            <div class="text-subtitle-2 font-weight-bold mb-2">Danh sách câu</div>
            <div class="q-grid">
              <v-btn
                v-for="(q, i) in allQuestions"
                :key="q.id"
                :color="gridColor(q.id, i)"
                size="small"
                :variant="i === currentIndex ? 'elevated' : 'tonal'"
                min-width="36"
                height="36"
                class="q-cell"
                @click="session.goTo(i)"
              >
                {{ i + 1 }}
                <span v-if="flaggedSet.has(q.id)" class="flag-dot">🚩</span>
              </v-btn>
            </div>

            <!-- Legend -->
            <div class="legend mt-3 d-flex flex-wrap gap-2">
              <div class="legend-item"><span class="dot primary"></span> Đang làm</div>
              <div class="legend-item"><span class="dot success"></span> Đã trả lời</div>
              <div class="legend-item"><span class="dot amber"></span> Có cờ</div>
              <div class="legend-item"><span class="dot grey"></span> Chưa làm</div>
            </div>
          </v-card>

          <!-- Summary -->
          <v-card rounded="lg" elevation="1" class="pa-3 mt-3">
            <div class="text-body-2">
              Đã làm: <strong>{{ answeredCount }}</strong> / {{ session.totalQuestions.value }}
            </div>
            <v-progress-linear
              :model-value="progress"
              color="blue-darken-3"
              bg-color="grey-lighten-2"
              height="6"
              rounded
              class="mt-2"
            />
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- ── MOBILE BOTTOM SHEET ── -->
    <v-bottom-sheet v-model="navSheet" max-height="60vh">
      <v-card rounded="t-xl" class="pa-4">
        <div class="text-subtitle-1 font-weight-bold mb-3">Danh sách câu hỏi</div>
        <div class="q-grid">
          <v-btn
            v-for="(q, i) in allQuestions"
            :key="q.id"
            :color="gridColor(q.id, i)"
            size="small"
            :variant="i === currentIndex ? 'elevated' : 'tonal'"
            min-width="36"
            height="36"
            class="q-cell"
            @click="goMobile(i)"
          >
            {{ i + 1 }}
            <span v-if="flaggedSet.has(q.id)" class="flag-dot">🚩</span>
          </v-btn>
        </div>
      </v-card>
    </v-bottom-sheet>

    <!-- ── CONFIRM DIALOG ── -->
    <v-dialog v-model="confirmDialog" max-width="420">
      <v-card rounded="lg">
        <v-card-title class="text-h6 font-weight-bold pt-5 px-5">Xác nhận nộp bài</v-card-title>
        <v-card-text class="px-5">
          <div class="mb-2">
            Bạn đã trả lời <strong>{{ answeredCount }}</strong> / {{ session.totalQuestions.value }} câu.
          </div>
          <div v-if="answeredCount < session.totalQuestions.value" class="text-red-darken-2 text-body-2">
            ⚠️ Còn {{ session.totalQuestions.value - answeredCount }} câu chưa trả lời.
          </div>
          <div class="text-body-2 mt-2 text-grey-darken-1">
            Sau khi nộp bạn không thể thay đổi đáp án.
          </div>
        </v-card-text>
        <v-card-actions class="pb-4 px-4">
          <v-spacer />
          <v-btn variant="text" @click="confirmDialog = false">Tiếp tục làm</v-btn>
          <v-btn color="red-darken-2" :loading="session.submitting.value" @click="doSubmit">
            Nộp bài
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, ref, reactive } from 'vue'
import QuestionItem from '../../QuestionItem.vue'

const props = defineProps({
  session: { type: Object, required: true }
})

const currentIndex = computed(() => props.session.currentIndex.value)
const currentQuestion = computed(
  () => props.session.currentQuestionItem.value?.question ?? {}
)
const allQuestions = computed(() => props.session.questions?.value ?? [])
const isMcq = computed(() =>
  ['single_choice', 'multiple_choice', 'true_false'].includes(currentQuestion.value.type)
)
const selectedId = computed(
  () => props.session.answers[currentQuestion.value.id]?.selectedOptionId
)
const optLabels = ['A', 'B', 'C', 'D', 'E']

const answeredCount = computed(() =>
  allQuestions.value.filter(q => props.session.hasAnswer(q.id)).length
)
const progress = computed(() => {
  const total = props.session.totalQuestions.value
  return total ? Math.round((answeredCount.value / total) * 100) : 0
})

// Flag
const flaggedSet = reactive(new Set())
const isFlagged = computed(() => flaggedSet.has(currentQuestion.value.id))
function toggleFlag() {
  const qId = currentQuestion.value.id
  if (flaggedSet.has(qId)) flaggedSet.delete(qId)
  else flaggedSet.add(qId)
}

// Grid color
function gridColor(qId, i) {
  if (i === currentIndex.value) return 'blue-darken-3'
  if (flaggedSet.has(qId)) return 'amber-darken-2'
  if (props.session.hasAnswer(qId)) return 'green-darken-1'
  return 'grey-lighten-1'
}

// Navigation
const navSheet = ref(false)
function goMobile(i) {
  props.session.goTo(i)
  navSheet.value = false
}

// Answer
function selectOption(optId) {
  props.session.setAnswer(currentQuestion.value.id, { selectedOptionId: optId })
}
function onAnswered(payload) {
  props.session.setAnswer(currentQuestion.value.id, payload)
}

// Submit
const confirmDialog = ref(false)
function doSubmit() {
  confirmDialog.value = false
  props.session.submit()
}
</script>

<style scoped>
.exam-mode {
  min-height: 100vh;
  background: #e3f2fd;
  display: flex;
  flex-direction: column;
}

.exam-header {
  background: linear-gradient(135deg, #1565c0, #0d47a1);
  position: sticky;
  top: 0;
  z-index: 20;
}

.timer-chip {
  display: flex;
  align-items: center;
  background: rgba(255,255,255,0.15);
  color: #fff;
  border-radius: 20px;
  padding: 4px 12px;
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 1px;
  transition: background 0.3s;
}
.timer-warning {
  background: rgba(229, 57, 53, 0.8) !important;
  animation: blink 1s step-start infinite;
}
@keyframes blink { 50% { opacity: 0.5; } }

.question-card { min-height: 280px; }
.exam-q-title {
  background: #f5f5f5;
  font-weight: 700;
  font-size: 15px;
}
.question-text { font-size: 15px; line-height: 1.7; }

.option-item {
  border: 2px solid #e0e0e0;
  cursor: pointer;
  transition: all 0.15s;
}
.option-item:hover { border-color: #1565c0; background: #e3f2fd; }
.option-selected { border-color: #1565c0 !important; background: #bbdefb !important; }
.option-label { font-weight: 700; color: #1565c0; min-width: 20px; margin-right: 8px; }

.q-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.q-cell {
  position: relative;
  font-size: 12px !important;
  padding: 0 !important;
}
.flag-dot {
  position: absolute;
  top: -4px;
  right: -4px;
  font-size: 9px;
}

.legend { font-size: 11px; }
.legend-item { display: flex; align-items: center; gap: 4px; }
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
.dot.primary { background: #1565c0; }
.dot.success { background: #2e7d32; }
.dot.amber { background: #f9a825; }
.dot.grey { background: #bdbdbd; }

@media (max-width: 375px) {
  .question-text { font-size: 13px; }
}
</style>
