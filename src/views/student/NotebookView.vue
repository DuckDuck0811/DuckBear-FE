<template>
  <StudentDashboardLayout>
    <v-container class="py-8 px-4 px-md-8" style="max-width: 1120px">
      <PageHeader
        :eyebrow="t('notebook.eyebrow')"
        :title="t('notebook.title')"
        :subtitle="t('notebook.subtitle')"
      >
        <template #actions>
          <v-btn
            v-if="activeTab === 'due' && notebookStore.summary.dueToday > 0"
            color="primary"
            size="large"
            rounded="lg"
            prepend-icon="mdi-play-circle-outline"
            :to="'/student/notebook/review'"
          >
            {{ t("notebook.startReview", { count: notebookStore.summary.dueToday }) }}
          </v-btn>
        </template>
      </PageHeader>

      <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-5">
        <FilterChips v-model="activeTab" :items="tabItems" />
        <v-text-field
          v-model="unitFilter"
          :label="t('notebook.unitFilter')"
          type="number"
          min="1"
          clearable
          density="compact"
          variant="outlined"
          hide-details
          style="max-width: 220px"
          @update:model-value="onFilterChange"
        />
      </div>

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
        <div class="d-flex align-center justify-space-between flex-wrap ga-2">
          <span>{{ errorMessage }}</span>
          <v-btn size="small" variant="text" color="error" @click="loadItems">
            {{ t("notebook.retry") }}
          </v-btn>
        </div>
      </v-alert>

      <div v-if="loading" class="d-flex flex-column ga-3">
        <v-skeleton-loader v-for="n in 3" :key="n" type="article" rounded="xl" />
      </div>

      <EmptyState
        v-else-if="items.length === 0"
        :icon="emptyState.icon"
        :title="emptyState.title"
        :description="emptyState.description"
      />

      <div v-else class="d-flex flex-column ga-3">
        <v-card
          v-for="item in items"
          :key="item.id"
          rounded="xl"
          border
          elevation="0"
          class="pa-4"
        >
          <div class="d-flex flex-wrap align-start justify-space-between ga-3">
            <div class="flex-grow-1" style="min-width: 240px">
              <div class="d-flex align-center flex-wrap ga-2 mb-2">
                <v-chip size="small" color="primary" variant="tonal">
                  {{ item.question?.type }}
                </v-chip>
                <span
                  v-if="item.question?.lesson"
                  class="text-caption text-medium-emphasis"
                >
                  {{ item.question.lesson.chapter?.title }} · {{ item.question.lesson.title }}
                </span>
              </div>
              <div class="text-body-1 font-weight-medium">
                {{ truncate(item.question?.content) }}
              </div>
            </div>

            <div class="d-flex flex-column align-end ga-2">
              <div class="d-flex align-center ga-1" :aria-label="t('notebook.boxLabel', { box: item.box })">
                <span class="text-caption text-medium-emphasis mr-1">
                  {{ t("notebook.boxLabel", { box: item.box }) }}
                </span>
                <span
                  v-for="dot in 5"
                  :key="dot"
                  class="leitner-dot"
                  :class="{ 'leitner-dot-active': dot <= item.box }"
                />
              </div>
              <div class="d-flex align-center ga-2 text-caption text-medium-emphasis">
                <span>{{ t("notebook.wrongCount", { count: item.wrongCount }) }}</span>
                <span>·</span>
                <v-chip
                  size="x-small"
                  :color="isDue(item) ? 'warning' : 'default'"
                  variant="tonal"
                >
                  {{ formatNextReview(item) }}
                </v-chip>
              </div>
            </div>
          </div>
        </v-card>

        <ListPagination
          v-if="totalPages > 1"
          v-model:page="page"
          :length="totalPages"
          class="mt-4"
          @update:page="loadItems"
        />
      </div>
    </v-container>
  </StudentDashboardLayout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import StudentDashboardLayout from "../../layouts/StudentDashboardLayout.vue";
import PageHeader from "../../components/shared/PageHeader.vue";
import FilterChips from "../../components/shared/FilterChips.vue";
import EmptyState from "../../components/shared/EmptyState.vue";
import ListPagination from "../../components/shared/ListPagination.vue";
import { getNotebook } from "../../services/notebook";
import { useNotebookStore } from "../../stores/notebook";

const { t } = useI18n();
const notebookStore = useNotebookStore();

const activeTab = ref("due");
const unitFilter = ref("");
const page = ref(1);
const limit = 20;
const total = ref(0);
const items = ref([]);
const loading = ref(false);
const errorMessage = ref("");

const tabItems = computed(() => [
  {
    value: "due",
    label: `${t("notebook.tabs.due")} (${notebookStore.summary.dueToday})`,
  },
  {
    value: "active",
    label: `${t("notebook.tabs.active")} (${notebookStore.summary.active})`,
  },
  {
    value: "mastered",
    label: `${t("notebook.tabs.mastered")} (${notebookStore.summary.mastered})`,
  },
]);

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit)));

const emptyState = computed(() => {
  if (activeTab.value === "due") {
    return {
      icon: "mdi-check-decagram-outline",
      title: t("notebook.empty.dueTitle"),
      description: t("notebook.empty.dueDescription"),
    };
  }
  if (activeTab.value === "mastered") {
    return {
      icon: "mdi-trophy-outline",
      title: t("notebook.empty.masteredTitle"),
      description: t("notebook.empty.masteredDescription"),
    };
  }
  return {
    icon: "mdi-notebook-outline",
    title: t("notebook.empty.activeTitle"),
    description: t("notebook.empty.activeDescription"),
  };
});

function truncate(text = "", max = 160) {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}...`;
}

function isDue(item) {
  if (item.status === "MASTERED") return false;
  return new Date(item.nextReviewAt).getTime() <= Date.now();
}

function formatNextReview(item) {
  if (item.status === "MASTERED") return t("notebook.masteredBadge");
  const diffMs = new Date(item.nextReviewAt).getTime() - Date.now();
  if (diffMs <= 0) return t("notebook.dueNow");
  const days = Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
  return t("notebook.reviewInDays", { days });
}

function onFilterChange() {
  page.value = 1;
  loadItems();
}

async function loadItems() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const params = { page: page.value, limit };
    if (activeTab.value === "due") {
      params.due = true;
    } else if (activeTab.value === "active") {
      params.status = "ACTIVE";
    } else {
      params.status = "MASTERED";
    }
    const parsedUnit = Number(unitFilter.value);
    if (Number.isInteger(parsedUnit) && parsedUnit > 0) {
      params.unit = parsedUnit;
    }
    const data = await getNotebook(params);
    items.value = data.items || [];
    total.value = Number(data.total ?? 0);
  } catch (err) {
    errorMessage.value = err?.message || t("notebook.loadError");
  } finally {
    loading.value = false;
  }
}

watch(activeTab, () => {
  page.value = 1;
  loadItems();
});

onMounted(() => {
  notebookStore.loadSummary();
  loadItems();
});
</script>

<style scoped>
.leitner-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background-color: #dbe6f5;
  display: inline-block;
}
.leitner-dot-active {
  background-color: rgb(var(--v-theme-primary));
}
</style>
