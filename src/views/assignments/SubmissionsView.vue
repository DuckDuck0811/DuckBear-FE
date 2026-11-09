<template>
  <v-layout class="submissions-page min-vh-100">
    <AppHeader />
    <TeacherSidebar />
    <v-main>
      <v-container class="submissions-container py-7 px-4 px-md-8">
        <header class="submissions-hero mb-6">
          <div class="submissions-hero-icon">
            <v-icon icon="mdi-cloud-upload-outline" size="28" />
          </div>
          <div>
            <div class="submissions-eyebrow">
              {{ t("assignmentHub.submissionsEyebrow") }}
            </div>
            <h1>{{ t("assignmentHub.submissionsTitle") }}</h1>
            <p>{{ t("assignmentHub.submissionsSubtitle") }}</p>
          </div>
        </header>

        <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{
          error
        }}</v-alert>

        <v-card class="submission-list-card" rounded="xl" variant="flat">
          <div class="submission-toolbar">
            <div>
              <h2>{{ t("assignmentHub.submissionsTitle") }}</h2>
              <p>
                {{
                  t("assignmentHub.submissionAssignmentCount", {
                    count: filteredAssignments.length,
                  })
                }}
              </p>
            </div>
            <v-text-field
              v-model="search"
              :placeholder="t('assignmentHub.assignmentSearch')"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              class="submission-search"
            />
          </div>

          <div v-if="loading" class="submission-state">
            <v-progress-circular indeterminate color="primary" />
          </div>
          <div
            v-else-if="!filteredAssignments.length"
            class="submission-state text-secondary"
          >
            <v-icon icon="mdi-inbox-arrow-down-outline" size="42" />
            <strong>{{
              search
                ? t("assignmentHub.noMatchingAssignments")
                : t("assignmentHub.noSubmittedAssignments")
            }}</strong>
          </div>
          <div v-else class="submission-assignments">
            <article
              v-for="assignment in pagedAssignments"
              :key="assignment.id"
              class="submission-assignment-row"
            >
              <div class="submission-assignment-icon">
                <v-icon icon="mdi-file-document-outline" />
              </div>
              <div class="submission-assignment-copy">
                <strong>{{ assignment.title }}</strong>
                <small
                  >{{ assignment.class?.name }} ·
                  {{ assignment._count?.questions || 0 }}
                  {{ t("assignmentHub.questions") }}</small
                >
              </div>
              <v-chip color="primary" variant="tonal" size="small">
                {{
                  t("assignmentHub.submissionCount", {
                    count: assignment._count?.attempts || 0,
                  })
                }}
              </v-chip>
              <v-btn
                :to="`/submissions/${assignment.id}`"
                color="primary"
                variant="tonal"
                rounded="pill"
                size="small"
                prepend-icon="mdi-clipboard-text-search-outline"
              >
                {{ t("assignmentHub.viewSubmissions") }}
              </v-btn>
            </article>
          </div>
          <ListPagination v-model="page" :total="filteredAssignments.length" />
        </v-card>
      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { api } from "../../services/api";
import AppHeader from "../../components/shared/AppHeader.vue";
import TeacherSidebar from "../../components/shared/TeacherSidebar.vue";
import ListPagination from "../../components/shared/ListPagination.vue";

const { t } = useI18n();
const assignments = ref([]);
const loading = ref(false);
const error = ref("");
const search = ref("");
const page = ref(1);
const pageSize = 10;

const filteredAssignments = computed(() => {
  const query = search.value.trim().toLocaleLowerCase();
  const submitted = assignments.value.filter(
    (assignment) => Number(assignment._count?.attempts) > 0,
  );
  return query
    ? submitted.filter((assignment) =>
        `${assignment.title} ${assignment.class?.name || ""}`
          .toLocaleLowerCase()
          .includes(query),
      )
    : submitted;
});
const pagedAssignments = computed(() =>
  filteredAssignments.value.slice(
    (page.value - 1) * pageSize,
    page.value * pageSize,
  ),
);

watch(search, () => {
  page.value = 1;
});
watch(
  () => Math.ceil(filteredAssignments.value.length / pageSize),
  (count) => {
    if (page.value > count) page.value = Math.max(1, count);
  },
);

onMounted(loadAssignments);

async function loadAssignments() {
  loading.value = true;
  error.value = "";
  try {
    assignments.value = await api("/assignments/mine");
  } catch (cause) {
    error.value = cause?.message || t("assignmentHub.submissionsLoadError");
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.submissions-page {
  background: #f4f8ff;
}
.submissions-container {
  max-width: 1160px;
}
.submissions-hero {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 22px 24px;
  border: 1px solid #e2ebf8;
  border-radius: 20px;
  background: linear-gradient(120deg, #fff, #eff6ff);
}
.submissions-hero-icon {
  display: grid;
  width: 52px;
  height: 52px;
  flex: none;
  place-items: center;
  border-radius: 15px;
  background: #e5efff;
  color: #347cf5;
}
.submissions-eyebrow {
  color: #347cf5;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.submissions-hero h1 {
  margin: 2px 0;
  color: #1e2c43;
  font-size: clamp(1.4rem, 3vw, 1.8rem);
}
.submissions-hero p {
  margin: 0;
  color: #75839a;
}
.submission-list-card {
  overflow: hidden;
  border: 1px solid #e3ebf7;
  background: #fff;
}
.submission-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 20px 22px;
  border-bottom: 1px solid #edf2f8;
}
.submission-toolbar h2 {
  margin: 0;
  color: #25354d;
  font-size: 1.08rem;
}
.submission-toolbar p {
  margin: 4px 0 0;
  color: #75839a;
  font-size: 0.85rem;
}
.submission-search {
  max-width: 320px;
}
.submission-assignments {
  padding: 0 22px;
}
.submission-assignment-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 14px;
  padding: 15px 2px;
  border-bottom: 1px solid #edf2f8;
}
.submission-assignment-row:last-child {
  border-bottom: 0;
}
.submission-assignment-icon {
  display: grid;
  width: 42px;
  height: 42px;
  flex: none;
  place-items: center;
  border-radius: 12px;
  background: #edf4ff;
  color: #347cf5;
}
.submission-assignment-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 4px;
}
.submission-assignment-copy strong,
.submission-assignment-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.submission-assignment-copy strong {
  color: #26364e;
}
.submission-assignment-copy small {
  color: #7b899e;
  font-size: 0.78rem;
}
.submission-state {
  display: flex;
  min-height: 220px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
}
@media (max-width: 700px) {
  .submission-toolbar {
    align-items: stretch;
    flex-direction: column;
  }
  .submission-search {
    max-width: none;
  }
  .submission-assignment-row {
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .submission-assignment-copy {
    min-width: calc(100% - 60px);
  }
  .submission-assignment-row > .v-btn {
    margin-left: auto;
  }
}
</style>
