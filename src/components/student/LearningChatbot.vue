<template>
  <div class="learning-chatbot">
    <v-btn
      v-if="!open"
      class="chatbot-launcher"
      color="primary"
      icon="mdi-chat-processing-outline"
      size="large"
      elevation="8"
      aria-label="Mở trợ lý học tập"
      @click="open = true"
    />

    <v-card v-else class="chatbot-panel" rounded="xl" elevation="16" role="dialog" aria-label="Trợ lý học tập DuckBear">
      <header class="chatbot-header">
        <v-avatar color="white" variant="tonal" size="40">
          <v-icon icon="mdi-robot-happy-outline" color="white" />
        </v-avatar>
        <div class="flex-grow-1">
          <div class="font-weight-bold">Trợ lý học tập</div>
          <div class="text-caption chatbot-subtitle">Hỏi bài, nhận gợi ý từng bước</div>
        </div>
        <v-btn icon="mdi-minus" variant="text" color="white" size="small" aria-label="Thu nhỏ" @click="open = false" />
      </header>

      <div ref="messageList" class="chatbot-messages" aria-live="polite">
        <div v-if="!messages.length" class="chatbot-welcome">
          <v-icon icon="mdi-lightbulb-on-outline" size="34" color="primary" class="mb-2" />
          <div class="font-weight-bold mb-1">Chào {{ auth.user?.fullName || 'bạn' }}!</div>
          <div class="text-body-2 text-medium-emphasis">Mình có thể giải thích khái niệm hoặc gợi ý cách bắt đầu bài tập.</div>
          <div class="d-flex flex-wrap justify-center ga-2 mt-4">
            <v-chip
              v-for="prompt in suggestions"
              :key="prompt"
              size="small"
              variant="tonal"
              color="primary"
              :disabled="busy"
              @click="send(prompt)"
            >{{ prompt }}</v-chip>
          </div>
        </div>

        <div
          v-for="(message, index) in messages"
          :key="index"
          class="chat-line"
          :class="message.role === 'user' ? 'chat-line-user' : 'chat-line-assistant'"
        >
          <div v-if="message.matchedQuestion" class="chat-context-label">
            Đang phân tích câu trong bài: {{ message.matchedQuestion.assignmentTitle }}
          </div>
          <div class="chat-bubble" :class="message.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'">
            {{ message.role === "assistant" ? readableAnswer(message.content) : message.content }}
          </div>
          <div v-if="message.sources?.length" class="chat-sources">
            Nguồn:
            <span v-for="source in message.sources" :key="`${source.bookTitle}-${source.chapterTitle}-${source.title}`">
              {{ [source.bookTitle, source.chapterTitle, source.title].filter(Boolean).join(" · ") }}
            </span>
          </div>
        </div>
        <div v-if="busy" class="chat-line chat-line-assistant">
          <div class="chat-bubble chat-bubble-assistant">
            <v-progress-circular indeterminate size="16" width="2" color="primary" class="mr-2" />Đang nghĩ...
          </div>
        </div>
      </div>

      <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mx-3 mb-2">{{ error }}</v-alert>

      <v-form class="chatbot-composer" @submit.prevent="send()">
        <v-textarea
          v-model="draft"
          placeholder="Nhập câu hỏi của bạn..."
          rows="1"
          auto-grow
          max-rows="4"
          maxlength="1500"
          hide-details
          variant="outlined"
          rounded="lg"
          density="compact"
          :disabled="busy"
        />
        <v-btn
          type="submit"
          color="primary"
          icon="mdi-send"
          :loading="busy"
          :disabled="!draft.trim() || busy"
          aria-label="Gửi câu hỏi"
        />
      </v-form>
      <div class="chatbot-note">Câu hỏi và trả lời được lưu trong nhật ký. AI có thể sai; hãy kiểm tra lại kiến thức quan trọng.</div>
    </v-card>
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from "vue";
import { useAuthStore } from "../../stores/auth";
import { api } from "../../services/api";

const auth = useAuthStore();
const open = ref(false);
const busy = ref(false);
const draft = ref("");
const error = ref("");
const messages = ref([]);
const messageList = ref(null);
const suggestions = ["Giải thích phân số", "Gợi ý cách giải phương trình", "Giúp mình bắt đầu bài tập"];

function readableAnswer(value) {
  return value
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "$1/$2")
    .replace(/\\([*_#>|`()\-])/g, "$1")
    .replace(/&#x20;|&nbsp;/gi, " ")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/gs, "$1")
    .replace(/__(.*?)__/gs, "$1")
    .replace(/^\s*[-*_]{3,}\s*$/gm, "")
    .replace(/^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*$/gm, "")
    .replace(/\s*\|\s*/g, " · ")
    .replace(/^\s*·\s*|\s*·\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function send(text = draft.value) {
  const content = text.trim();
  if (!content || busy.value) return;
  const history = messages.value
    .slice(-8)
    .map(({ role, content }) => ({ role, content }));
  messages.value.push({ role: "user", content });
  draft.value = "";
  error.value = "";
  busy.value = true;
  await scrollToLatest();
  try {
    const result = await api("/chatbot/ask", {
      method: "POST",
      body: { message: content, history },
    });
    messages.value.push({
      role: "assistant",
      content: result.answer,
      matchedQuestion: result.matchedQuestion,
      sources: result.sources || [],
    });
  } catch (err) {
    error.value =
      err.status === 403
        ? "Trợ lý tạm tắt khi em đang làm bài. Hãy nộp bài xong rồi hỏi lại nhé."
        : err.message || "Chưa gửi được câu hỏi. Thử lại nhé.";
    draft.value = content;
  } finally {
    busy.value = false;
    await scrollToLatest();
  }
}

async function scrollToLatest() {
  await nextTick();
  if (messageList.value) messageList.value.scrollTop = messageList.value.scrollHeight;
}

watch(
  () => auth.user?.id,
  () => {
    messages.value = [];
    draft.value = "";
    error.value = "";
    open.value = false;
  },
);
</script>

<style scoped>
.learning-chatbot {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 2000;
}

.chatbot-launcher {
  width: 58px;
  height: 58px;
}

.chatbot-panel {
  display: flex;
  width: min(390px, calc(100vw - 32px));
  height: min(620px, calc(100dvh - 120px));
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #dce9f4;
}

.chatbot-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: linear-gradient(135deg, #287db0, #2167d8);
  color: white;
}

.chatbot-subtitle {
  color: rgba(255, 255, 255, 0.82);
}

.chatbot-messages {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  padding: 16px 12px;
  background: #f7faff;
}

.chatbot-welcome {
  max-width: 320px;
  margin: auto;
  text-align: center;
}

.chat-line {
  display: flex;
  flex-direction: column;
}

.chat-line-user {
  align-items: flex-end;
}

.chat-line-assistant {
  align-items: flex-start;
}

.chat-bubble {
  max-width: 88%;
  padding: 10px 13px;
  border-radius: 16px;
  font-size: 0.92rem;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.chat-bubble-user {
  border-bottom-right-radius: 5px;
  background: #2877e8;
  color: white;
}

.chat-bubble-assistant {
  display: flex;
  align-items: center;
  border: 1px solid #e3ebf5;
  border-bottom-left-radius: 5px;
  background: white;
  color: #24364b;
}

.chat-context-label {
  margin: 0 0 5px 4px;
  color: #477190;
  font-size: 0.7rem;
  font-weight: 700;
}

.chat-sources {
  margin: 5px 4px 0;
  color: #718198;
  font-size: 0.68rem;
}

.chat-sources span {
  display: block;
}

.chatbot-composer {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 10px 12px 6px;
  background: white;
}

.chatbot-composer :deep(.v-input) {
  flex: 1;
}

.chatbot-note {
  padding: 0 12px 10px;
  background: white;
  color: #8390a1;
  font-size: 0.68rem;
  text-align: center;
}

@media (max-width: 600px) {
  .learning-chatbot {
    right: 12px;
    bottom: 12px;
  }

  .chatbot-panel {
    height: min(620px, calc(100dvh - 92px));
  }
}
</style>
