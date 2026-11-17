<template>
  <div class="practice-mode">
    <!-- ── HEADER ── -->
    <v-app-bar flat color="teal-darken-2" class="practice-header">
      <v-toolbar-title class="font-weight-bold text-white">
        📚 Luyện Tập
      </v-toolbar-title>
      <v-spacer />
      <span class="text-white text-body-2 mr-3">
        Câu {{ currentIndex + 1 }} / {{ session.totalQuestions.value }}
      </span>
    </v-app-bar>

    <!-- ── PROGRESS BAR (câu số) ── -->
    <div class="question-nav px-2 pt-2 pb-1 d-flex flex-wrap gap-1">
      <v-btn
        v-for="(q, i) in session.questions.value"
        :key="q.id"
        size="x-small"
        :color="navColor(q.id)"
        :variant="i === currentIndex ? 'elevated' : 'tonal'"
        min-width="28"
        height="28"
        class="nav-btn"
        @click="session.goTo(i)"
        >{{ i + 1 }}</v-btn
      >
    </div>

    <!-- ── MAIN CONTENT ── -->
    <v-container fluid class="pa-3">
      <v-row>
        <!-- LEFT: question -->
        <v-col cols="12" md="7" class="d-flex flex-column">
          <v-card
            class="question-card flex-grow-1 mb-3"
            rounded="lg"
            elevation="2"
          >
            <v-card-text>
              <!-- Question text -->
              <div
                class="question-text text-body-1 mb-4"
                v-html="currentQuestion.content"
              />

              <!-- Options (MCQ) -->
              <template v-if="isMcq">
                <v-list class="pa-0" density="compact">
                  <v-list-item
                    v-for="opt in currentQuestion.options"
                    :key="opt.id"
                    rounded="lg"
                    class="option-item mb-2"
                    :class="optionClass(opt.id)"
                    @click="!checked && selectOption(opt.id)"
                  >
                    <template #prepend>
                      <v-icon size="18" class="mr-1">
                        {{ optionIcon(opt.id) }}
                      </v-icon>
                    </template>
                    <v-list-item-title>{{ opt.content }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </template>

              <!-- Non-MCQ fallback -->
              <template v-else>
                <QuestionItem
                  :item="session.currentQuestionItem.value"
                  @answered="onAnswered"
                />
              </template>
            </v-card-text>
          </v-card>

          <!-- Check button -->
          <v-btn
            v-if="!checked"
            color="teal-darken-2"
            :disabled="!session.hasAnswer(currentQuestion.id)"
            block
            rounded="lg"
            class="mb-3"
            @click="doCheck"
          >
            🔍 Kiểm tra ngay
          </v-btn>
        </v-col>

        <!-- RIGHT: explanation panel -->
        <v-col cols="12" md="5">
          <v-expand-transition>
            <v-card
              v-if="checked"
              class="explanation-card"
              :color="
                checkResult.isCorrect ? 'green-lighten-5' : 'red-lighten-5'
              "
              rounded="lg"
              elevation="2"
            >
              <v-card-title class="d-flex align-center gap-2 py-3">
                <v-icon
                  :color="
                    checkResult.isCorrect ? 'green-darken-2' : 'red-darken-2'
                  "
                >
                  {{
                    checkResult.isCorrect
                      ? "mdi-check-circle"
                      : "mdi-close-circle"
                  }}
                </v-icon>
                <span
                  :class="
                    checkResult.isCorrect
                      ? 'text-green-darken-2'
                      : 'text-red-darken-2'
                  "
                >
                  {{ checkResult.isCorrect ? "Chính xác! 🎉" : "Chưa đúng 😕" }}
                </span>
              </v-card-title>

              <v-divider />

              <v-card-text>
                <div v-if="checkResult.answerText" class="mb-3">
                  <div class="text-caption text-grey-darken-1 mb-1">
                    ĐÁP ÁN ĐÚNG
                  </div>
                  <div class="text-body-2 font-weight-medium">
                    {{ checkResult.answerText }}
                  </div>
                </div>

                <div v-if="checkResult.explanation">
                  <div class="text-caption text-grey-darken-1 mb-1">
                    GIẢI THÍCH
                  </div>
                  <div class="text-body-2" v-html="checkResult.explanation" />
                </div>
              </v-card-text>
            </v-card>
          </v-expand-transition>

          <!-- Placeholder when not checked yet -->
          <v-card
            v-if="!checked"
            class="explanation-placeholder"
            color="grey-lighten-4"
            rounded="lg"
            elevation="0"
          >
            <v-card-text class="text-center text-grey py-8">
              <v-icon size="40" class="mb-2">mdi-lightbulb-outline</v-icon>
              <div class="text-body-2">
                Nhấn "Kiểm tra ngay" để xem kết quả & giải thích
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- ── BOTTOM NAVIGATION ── -->
    <div class="bottom-nav pa-3 d-flex justify-space-between align-center">
      <v-btn
        variant="outlined"
        color="teal-darken-2"
        rounded="lg"
        :disabled="currentIndex === 0"
        @click="session.prev()"
      >
        <v-icon start>mdi-arrow-left</v-icon> Câu trước
      </v-btn>

      <template v-if="session.isLastQuestion.value">
        <v-btn
          color="teal-darken-2"
          rounded="lg"
          :loading="session.submitting.value"
          @click="session.submit()"
        >
          <v-icon start>mdi-send</v-icon> Nộp bài
        </v-btn>
      </template>
      <template v-else>
        <v-btn color="teal-darken-2" rounded="lg" @click="session.next()">
          Câu kế tiếp <v-icon end>mdi-arrow-right</v-icon>
        </v-btn>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import QuestionItem from "../../QuestionItem.vue";

const props = defineProps({
  session: { type: Object, required: true },
});

// ── Shortcuts ──────────────────────────────────────────────
const currentIndex = computed(() => props.session.currentIndex.value);
const currentQuestion = computed(
  () => props.session.currentQuestionItem.value?.question ?? {},
);
const isMcq = computed(() =>
  ["single_choice", "multiple_choice", "true_false"].includes(
    currentQuestion.value.type,
  ),
);

// ── Per-question state ──────────────────────────────────────
const checked = ref(false);
const checkResult = ref(null);

watch(currentIndex, () => {
  checked.value = false;
  checkResult.value = null;
});

// ── Answer handling ─────────────────────────────────────────
function selectOption(optId) {
  props.session.setAnswer(currentQuestion.value.id, {
    selectedOptionId: optId,
  });
}

function onAnswered(payload) {
  props.session.setAnswer(currentQuestion.value.id, payload);
}

// ── Check ───────────────────────────────────────────────────
async function doCheck() {
  const result = await props.session.checkQuestion(currentQuestion.value.id);
  checkResult.value = result;
  checked.value = true;
}

// ── Nav-dot color ───────────────────────────────────────────
const checkCache = {};

function navColor(qId) {
  const ans = props.session.answers[qId];
  if (!ans) return "grey-lighten-1";
  if (ans.status === "correct") return "green";
  if (ans.status === "incorrect") return "red";
  return "teal"; // answered but unchecked
}

// ── Option highlight ────────────────────────────────────────
function optionClass(optId) {
  const ans = props.session.answers[currentQuestion.value.id];
  const selected = ans?.selectedOptionId === optId;

  if (!checked.value) {
    return selected ? "option-selected" : "option-idle";
  }

  // After check
  const correctId = checkResult.value?.correctOptionId;
  if (optId === correctId) return "option-correct";
  if (selected) return "option-wrong";
  return "option-idle";
}

function optionIcon(optId) {
  const ans = props.session.answers[currentQuestion.value.id];
  const selected = ans?.selectedOptionId === optId;
  if (!checked.value)
    return selected ? "mdi-radiobox-marked" : "mdi-radiobox-blank";
  const correctId = checkResult.value?.correctOptionId;
  if (optId === correctId) return "mdi-check-circle";
  if (selected) return "mdi-close-circle";
  return "mdi-radiobox-blank";
}
</script>

<style scoped>
.practice-mode {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.practice-header {
  position: sticky;
  top: 0;
  z-index: 10;
}

.question-nav {
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  gap: 4px;
}

.nav-btn {
  font-size: 11px !important;
  padding: 0 !important;
}

.question-card {
  min-height: 260px;
}

.question-text {
  line-height: 1.7;
}

.option-item {
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}
.option-idle:hover {
  border-color: #00897b;
  background: #e0f2f1;
}
.option-selected {
  border-color: #00897b;
  background: #e0f2f1;
}
.option-correct {
  border-color: #43a047 !important;
  background: #e8f5e9 !important;
}
.option-wrong {
  border-color: #e53935 !important;
  background: #ffebee !important;
}

.explanation-card,
.explanation-placeholder {
  min-height: 200px;
}

.bottom-nav {
  position: sticky;
  bottom: 0;
  background: #fff;
  border-top: 1px solid #e0e0e0;
  z-index: 10;
}

@media (max-width: 375px) {
  .question-text {
    font-size: 14px;
  }
  .bottom-nav {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
