<template>
  <v-row class="mb-2">
    <v-col cols="12" lg="8">
      <div class="d-flex align-center justify-space-between ga-3 mb-4">
        <div>
          <h2 class="text-h5 font-weight-black mb-1">
            {{ t("studentDashboard.myClasses") }}
          </h2>
          <p class="text-body-2 text-secondary mb-0">
            {{ t("studentDashboard.classesSubtitle") }}
          </p>
        </div>
        <v-btn
          to="/classes"
          color="primary"
          variant="tonal"
          prepend-icon="mdi-key-plus"
        >
          {{ t("studentDashboard.joinClass") }}
        </v-btn>
      </div>

      <v-progress-linear
        v-if="isLoading"
        indeterminate
        color="success"
        rounded
        class="mb-4"
      />
      <v-alert
        v-else-if="errorMessage"
        type="error"
        variant="tonal"
        class="mb-4"
      >
        {{ errorMessage }}
        <template #append>
          <v-btn variant="text" @click="$emit('retry')">{{
            t("studentDashboard.retry")
          }}</v-btn>
        </template>
      </v-alert>

      <v-row v-else-if="classes.length">
        <v-col
          v-for="schoolClass in pagedClasses"
          :key="schoolClass.id"
          cols="12"
          sm="6"
        >
          <v-card
            to="/classes"
            class="student-class-card pa-5 h-100"
            rounded="xl"
          >
            <div class="d-flex align-center justify-space-between mb-4">
              <v-avatar color="success" variant="tonal"
                ><v-icon icon="mdi-google-classroom"
              /></v-avatar>
              <v-chip color="success" variant="tonal" size="small">
                {{
                  t("studentDashboard.grade", { grade: schoolClass.gradeLevel })
                }}
              </v-chip>
            </div>
            <h3 class="text-h6 font-weight-black mb-1">
              {{ schoolClass.name }}
            </h3>
            <p class="text-body-2 text-secondary mb-4">
              {{ schoolClass.schoolYear }}
            </p>
            <v-divider class="mb-3" />
            <div class="d-flex align-center text-body-2 text-secondary ga-2">
              <v-icon icon="mdi-account-tie-outline" size="18" />
              {{
                schoolClass.homeroomTeacher?.fullName ||
                t("studentDashboard.teacherUnassigned")
              }}
            </div>
          </v-card>
        </v-col>
        <v-col cols="12"
          ><ListPagination v-model="classesPage" :total="classes.length"
        /></v-col>
      </v-row>

      <v-card
        v-else-if="!isLoading"
        class="student-empty pa-7 text-center"
        rounded="xl"
      >
        <v-avatar color="success" variant="tonal" size="64" class="mb-3">
          <v-icon icon="mdi-account-group-outline" size="32" />
        </v-avatar>
        <h3 class="text-h6 font-weight-black mb-2">
          {{ t("studentDashboard.noClassesTitle") }}
        </h3>
        <p class="text-body-2 text-secondary mb-5">
          {{ t("studentDashboard.noClassesBody") }}
        </p>
        <v-btn
          to="/classes"
          color="success"
          class="student-primary-btn"
          prepend-icon="mdi-key-plus"
        >
          {{ t("studentDashboard.joinClass") }}
        </v-btn>
      </v-card>
    </v-col>

    <v-col cols="12" lg="4">
      <v-card class="student-side-card pa-5 mb-5" rounded="xl">
        <div class="d-flex align-center ga-3 mb-4">
          <v-avatar color="warning" variant="tonal"
            ><v-icon icon="mdi-inbox-clock-outline"
          /></v-avatar>
          <div>
            <h2 class="text-h6 font-weight-black">
              {{ t("studentDashboard.myRequests") }}
            </h2>
            <p class="text-caption text-secondary mb-0">
              {{ t("studentDashboard.requestSubtitle") }}
            </p>
          </div>
        </div>
        <div v-if="pendingRequests.length">
          <v-list density="compact" class="pa-0">
            <v-list-item
              v-for="request in pagedRequests"
              :key="request.id"
              class="px-0"
            >
              <v-list-item-title class="font-weight-bold">{{
                request.class.name
              }}</v-list-item-title>
              <v-list-item-subtitle>{{
                t("studentDashboard.grade", { grade: request.class.gradeLevel })
              }}</v-list-item-subtitle>
              <template #append>
                <v-chip size="x-small" color="warning" variant="tonal">{{
                  t("studentDashboard.pending")
                }}</v-chip>
              </template>
            </v-list-item>
          </v-list>
          <ListPagination
            v-model="requestsPage"
            :total="pendingRequests.length"
          />
        </div>
        <div v-else class="text-body-2 text-secondary">
          {{ t("studentDashboard.noRequests") }}
        </div>
      </v-card>

      <v-card class="student-side-card pa-5" rounded="xl">
        <div class="d-flex align-center ga-3 mb-3">
          <v-avatar color="primary" variant="tonal"
            ><v-icon icon="mdi-bookshelf"
          /></v-avatar>
          <h2 class="text-h6 font-weight-black">
            {{ t("studentDashboard.learningMaterials") }}
          </h2>
        </div>
        <p class="text-body-2 text-secondary">
          {{ t("studentDashboard.materialsSubtitle") }}
        </p>
        <v-btn
          to="/"
          color="primary"
          variant="tonal"
          prepend-icon="mdi-arrow-right"
        >
          {{ t("studentDashboard.exploreBooks") }}
        </v-btn>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import ListPagination from "../shared/ListPagination.vue";

const props = defineProps({
  classes: { type: Array, default: () => [] },
  pendingRequests: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  errorMessage: { type: String, default: "" },
});

defineEmits(["retry"]);
const { t } = useI18n();
const classesPage = ref(1);
const requestsPage = ref(1);
const pageSize = 10;
const pagedClasses = computed(() =>
  props.classes.slice(
    (classesPage.value - 1) * pageSize,
    classesPage.value * pageSize,
  ),
);
const pagedRequests = computed(() =>
  props.pendingRequests.slice(
    (requestsPage.value - 1) * pageSize,
    requestsPage.value * pageSize,
  ),
);
watch(
  () => Math.ceil(props.classes.length / pageSize),
  (count) => {
    if (classesPage.value > count) classesPage.value = Math.max(1, count);
  },
);
watch(
  () => Math.ceil(props.pendingRequests.length / pageSize),
  (count) => {
    if (requestsPage.value > count) requestsPage.value = Math.max(1, count);
  },
);
</script>

<style scoped>
.student-class-card,
.student-side-card,
.student-empty {
  border: 1px solid #e4ecf7;
  box-shadow: 0 8px 24px rgba(47, 124, 246, 0.06);
}

.student-class-card {
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.student-class-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 28px rgba(20, 125, 114, 0.12);
}

.student-primary-btn {
  background: linear-gradient(135deg, #2bc48a, #168c87) !important;
  color: #fff !important;
}
</style>
