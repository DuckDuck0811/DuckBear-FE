<template>
  <StudentDashboardLayout>
    <v-container class="py-6 px-4 px-md-8" style="max-width: 960px">
      <PageHeader
        :title="t('practice.title')"
        :subtitle="t('practice.subtitle')"
      />

      <!-- AI Disclaimer -->
      <v-alert
        type="info"
        variant="tonal"
        density="compact"
        icon="mdi-information-outline"
        class="mb-5"
      >
        {{ t("practice.aiDisclaimer") }}
      </v-alert>

      <!-- Error Alert -->
      <v-alert
        v-if="errorMsg"
        type="warning"
        variant="tonal"
        closable
        class="mb-5"
        @click:close="errorMsg = ''"
      >
        {{ errorMsg }}
      </v-alert>

      <!-- Suggestions -->
      <v-card
        v-if="store.suggestions.length > 0"
        rounded="xl"
        border
        elevation="0"
        class="pa-4 mb-5"
      >
        <div class="d-flex align-center ga-2 mb-3">
          <v-icon color="amber-darken-2">mdi-lightbulb-on-outline</v-icon>
          <h2 class="text-subtitle-1 font-weight-bold">
            {{ t("practice.suggestionsTitle") }}
          </h2>
        </div>
        <div class="d-flex flex-wrap ga-2">
          <v-btn
            v-for="s in store.suggestions"
            :key="s.lessonId"
            variant="tonal"
            color="primary"
            rounded="lg"
            :disabled="store.generating"
            @click="startWithLesson(s.lessonId, 'WEAK')"
          >
            <span>{{ s.lessonTitle }}</span>
            <v-chip size="x-small" color="error" variant="flat" class="ml-2">
              {{ t("practice.weakBadge", { count: s.activeWrongCount }) }}
            </v-chip>
          </v-btn>
        </div>
      </v-card>

      <!-- Lesson Picker & Start -->
      <v-card rounded="xl" border elevation="0" class="pa-5 mb-5">
        <v-row align="center" dense>
          <v-col cols="12" md="7">
            <v-select
              v-model="selectedLessonId"
              :items="lessonOptions"
              item-title="label"
              item-value="id"
              :label="t('practice.lessonLabel')"
              variant="outlined"
              density="comfortable"
              hide-details
              :loading="loadingLessons"
              :disabled="store.generating"
            />
          </v-col>
          <v-col cols="12" sm="6" md="2">
            <v-select
              v-model="questionCount"
              :items="[5, 10]"
              :label="t('practice.countLabel')"
              variant="outlined"
              density="comfortable"
              hide-details
              :disabled="store.generating"
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-btn
              color="primary"
              size="large"
              block
              rounded="lg"
              :loading="store.generating"
              :disabled="!selectedLessonId"
              @click="startWithLesson(selectedLessonId, 'LESSON')"
            >
              <v-icon start>mdi-lightning-bolt</v-icon>
              {{ t("practice.startBtn") }}
            </v-btn>
          </v-col>
        </v-row>

        <div v-if="store.generating" class="mt-4 d-flex align-center ga-3 text-medium-emphasis">
          <v-progress-circular indeterminate size="20" width="2" color="primary" />
          <span>{{ t("practice.generating") }}</span>
        </div>
      </v-card>

      <!-- Recent Sessions -->
      <v-card
        v-if="store.recentSessions.length > 0"
        rounded="xl"
        border
        elevation="0"
        class="pa-4"
      >
        <h2 class="text-subtitle-1 font-weight-bold mb-3">
          {{ t("practice.recentTitle") }}
        </h2>
        <v-list density="compact" lines="two">
          <v-list-item
            v-for="s in store.recentSessions"
            :key="s.id"
            class="px-2 rounded-lg"
          >
            <template #prepend>
              <v-icon :color="s.status === 'DONE' ? 'success' : 'warning'">
                {{ s.status === "DONE" ? "mdi-check-circle" : "mdi-progress-clock" }}
              </v-icon>
            </template>
            <v-list-item-title class="font-weight-medium">
              {{ s.lesson?.title || `Lesson #${s.lessonId}` }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ s.lesson?.chapter?.title }} •
              {{ t("practice.scoreLabel", { correct: s.correctCount, total: s.totalQuestions }) }}
              <span v-if="s.xpAwarded > 0" class="text-success font-weight-bold ml-1">
                (+{{ s.xpAwarded }} XP)
              </span>
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card>
    </v-container>
  </StudentDashboardLayout>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import StudentDashboardLayout from "../../layouts/StudentDashboardLayout.vue";
import PageHeader from "../../components/shared/PageHeader.vue";
import { usePracticeStore } from "../../stores/practice";
import { api } from "../../services/api";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const store = usePracticeStore();

const lessonOptions = ref([]);
const loadingLessons = ref(false);
const selectedLessonId = ref(null);
const questionCount = ref(5);
const errorMsg = ref("");

async function loadAccessibleLessons() {
  loadingLessons.value = true;
  try {
    const books = await api("/books");
    const list = Array.isArray(books) ? books : books?.items || [];
    const opts = [];
    for (const b of list) {
      try {
        const detail = await api(`/books/${b.id}`);
        for (const ch of detail?.chapters || []) {
          for (const l of ch?.lessons || []) {
            opts.push({
              id: l.id,
              label: `${b.title} — ${ch.title}: ${l.title}`,
            });
          }
        }
      } catch {
        // skip inaccessible book
      }
    }
    lessonOptions.value = opts;

    const queryLessonId = Number(route.query.lessonId);
    if (queryLessonId && opts.some((o) => o.id === queryLessonId)) {
      selectedLessonId.value = queryLessonId;
    } else if (opts.length > 0 && !selectedLessonId.value) {
      selectedLessonId.value = opts[0].id;
    }
  } finally {
    loadingLessons.value = false;
  }
}

async function startWithLesson(lessonId, mode) {
  errorMsg.value = "";
  try {
    const session = await store.startSession(lessonId, mode, questionCount.value);
    router.push(`/student/practice/session/${session.sessionId}`);
  } catch (err) {
    const status = err?.status;
    if (status === 403) errorMsg.value = t("practice.error403");
    else if (status === 429) errorMsg.value = t("practice.error429");
    else if (status === 503) errorMsg.value = t("practice.error503");
    else errorMsg.value = err?.message || t("practice.error503");
  }
}

onMounted(() => {
  store.loadSuggestions();
  store.loadSessions();
  loadAccessibleLessons();
});
</script>
