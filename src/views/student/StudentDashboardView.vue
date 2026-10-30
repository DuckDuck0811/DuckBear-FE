<template>
  <v-layout
    class="student-dashboard min-vh-100"
    :class="`student-dashboard--${gradeStyle}`"
  >
    <AppHeader />
    <StudentSidebar />

    <v-main class="pb-16">
      <v-container class="py-8 px-4 px-md-8" style="max-width: 1240px">
        <v-card class="student-welcome pa-6 pa-md-8 mb-7" rounded="xl">
          <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-5">
            <div class="d-flex align-center ga-4">
              <v-avatar class="student-mascot" size="68">
                <v-icon icon="mdi-star-four-points" size="34" />
              </v-avatar>
              <div>
                <div class="text-overline student-eyebrow">{{ t('studentDashboard.eyebrow') }}</div>
                <h1 class="text-h4 font-weight-black mb-1">
                  {{ t('studentDashboard.greeting', { name: firstName }) }}
                </h1>
                <p class="text-body-1 text-secondary mb-0">
                  {{ t('studentDashboard.subtitle') }}
                </p>
              </div>
            </div>
            <v-chip v-if="gradeStyle !== 'neutral'" color="success" variant="tonal" prepend-icon="mdi-school-outline">
              {{ gradeStyleLabel }}
            </v-chip>
          </div>
        </v-card>

        <v-row class="mb-2">
          <v-col cols="12" lg="8">
            <div class="d-flex align-center justify-space-between ga-3 mb-4">
              <div>
                <h2 class="text-h5 font-weight-black mb-1">{{ t('studentDashboard.myClasses') }}</h2>
                <p class="text-body-2 text-secondary mb-0">{{ t('studentDashboard.classesSubtitle') }}</p>
              </div>
              <v-btn to="/classes" color="primary" variant="tonal" prepend-icon="mdi-key-plus">
                {{ t('studentDashboard.joinClass') }}
              </v-btn>
            </div>

            <v-progress-linear v-if="isLoading" indeterminate color="success" rounded class="mb-4" />
            <v-alert v-else-if="errorMessage" type="error" variant="tonal" class="mb-4">
              {{ errorMessage }}
              <template #append>
                <v-btn variant="text" @click="loadClasses">{{ t('studentDashboard.retry') }}</v-btn>
              </template>
            </v-alert>

            <v-row v-else-if="classes.length">
              <v-col v-for="schoolClass in classes" :key="schoolClass.id" cols="12" sm="6">
                <v-card to="/classes" class="student-class-card pa-5 h-100" rounded="xl">
                  <div class="d-flex align-center justify-space-between mb-4">
                    <v-avatar color="success" variant="tonal">
                      <v-icon icon="mdi-google-classroom" />
                    </v-avatar>
                    <v-chip color="success" variant="tonal" size="small">
                      {{ t('studentDashboard.grade', { grade: schoolClass.gradeLevel }) }}
                    </v-chip>
                  </div>
                  <h3 class="text-h6 font-weight-black mb-1">{{ schoolClass.name }}</h3>
                  <p class="text-body-2 text-secondary mb-4">{{ schoolClass.schoolYear }}</p>
                  <v-divider class="mb-3" />
                  <div class="d-flex align-center text-body-2 text-secondary ga-2">
                    <v-icon icon="mdi-account-tie-outline" size="18" />
                    {{ schoolClass.homeroomTeacher?.fullName || t('studentDashboard.teacherUnassigned') }}
                  </div>
                </v-card>
              </v-col>
            </v-row>

            <v-card v-else-if="!isLoading && !errorMessage" class="student-empty pa-7 text-center" rounded="xl">
              <v-avatar color="success" variant="tonal" size="64" class="mb-3">
                <v-icon icon="mdi-account-group-outline" size="32" />
              </v-avatar>
              <h3 class="text-h6 font-weight-black mb-2">{{ t('studentDashboard.noClassesTitle') }}</h3>
              <p class="text-body-2 text-secondary mb-5">{{ t('studentDashboard.noClassesBody') }}</p>
              <v-btn to="/classes" color="success" class="student-primary-btn" prepend-icon="mdi-key-plus">
                {{ t('studentDashboard.joinClass') }}
              </v-btn>
            </v-card>
          </v-col>

          <v-col cols="12" lg="4">
            <v-card class="student-side-card pa-5 mb-5" rounded="xl">
              <div class="d-flex align-center ga-3 mb-4">
                <v-avatar color="warning" variant="tonal">
                  <v-icon icon="mdi-inbox-clock-outline" />
                </v-avatar>
                <div>
                  <h2 class="text-h6 font-weight-black">{{ t('studentDashboard.myRequests') }}</h2>
                  <p class="text-caption text-secondary mb-0">{{ t('studentDashboard.requestSubtitle') }}</p>
                </div>
              </div>
              <v-list v-if="pendingRequests.length" density="compact" class="pa-0">
                <v-list-item v-for="request in pendingRequests" :key="request.id" class="px-0">
                  <v-list-item-title class="font-weight-bold">{{ request.class.name }}</v-list-item-title>
                  <v-list-item-subtitle>{{ t('studentDashboard.grade', { grade: request.class.gradeLevel }) }}</v-list-item-subtitle>
                  <template #append>
                    <v-chip size="x-small" color="warning" variant="tonal">{{ t('studentDashboard.pending') }}</v-chip>
                  </template>
                </v-list-item>
              </v-list>
              <div v-else class="text-body-2 text-secondary">{{ t('studentDashboard.noRequests') }}</div>
            </v-card>

            <v-card class="student-side-card pa-5" rounded="xl">
              <div class="d-flex align-center ga-3 mb-3">
                <v-avatar color="primary" variant="tonal">
                  <v-icon icon="mdi-bookshelf" />
                </v-avatar>
                <h2 class="text-h6 font-weight-black">{{ t('studentDashboard.learningMaterials') }}</h2>
              </div>
              <p class="text-body-2 text-secondary">{{ t('studentDashboard.materialsSubtitle') }}</p>
              <v-btn to="/" color="primary" variant="tonal" prepend-icon="mdi-arrow-right">
                {{ t('studentDashboard.exploreBooks') }}
              </v-btn>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { api } from "../../services/api";
import { useAuthStore } from "../../stores/auth";
import AppHeader from "../../components/shared/AppHeader.vue";
import StudentSidebar from "../../components/shared/StudentSidebar.vue";

const { t } = useI18n();
const authStore = useAuthStore();
const classes = ref([]);
const requests = ref([]);
const isLoading = ref(false);
const errorMessage = ref("");

const firstName = computed(() => {
  const name = authStore.user?.fullName?.trim();
  return name?.split(/\s+/).at(-1) || t("studentDashboard.studentFallback");
});

const pendingRequests = computed(() => requests.value.filter((request) => request.status === "PENDING"));

const gradeStyle = computed(() => {
  const bands = new Set(classes.value.map(({ gradeLevel }) => {
    if (gradeLevel >= 1 && gradeLevel <= 5) return "primary";
    if (gradeLevel >= 6 && gradeLevel <= 9) return "middle";
    if (gradeLevel >= 10 && gradeLevel <= 12) return "high";
    return "neutral";
  }));
  return bands.size === 1 ? [...bands][0] : "neutral";
});

const gradeStyleLabel = computed(() => t(`studentDashboard.gradeStyles.${gradeStyle.value}`));

async function loadClasses() {
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const result = await api("/classes/mine");
    classes.value = result.classes || [];
    requests.value = result.requests || [];
  } catch (error) {
    errorMessage.value = error.message || t("studentDashboard.loadError");
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadClasses);
</script>

<style scoped>
.student-dashboard {
  min-height: 100vh;
  background: #f4f8ff;
}

.student-welcome,
.student-class-card,
.student-side-card,
.student-empty {
  border: 1px solid #e4ecf7;
  box-shadow: 0 8px 24px rgba(47, 124, 246, 0.06);
}

.student-welcome {
  background: linear-gradient(120deg, #e7fbf5 0%, #f5fbff 100%);
}

.student-mascot {
  flex: none;
  color: #fff;
  background: linear-gradient(145deg, #39c9a7, #168c87);
  box-shadow: 0 8px 18px rgba(20, 125, 114, 0.2);
}

.student-eyebrow {
  color: #147d72;
  font-weight: 800;
}

.student-class-card {
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.student-class-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 28px rgba(20, 125, 114, 0.12);
}

.student-primary-btn {
  background: linear-gradient(135deg, #2bc48a, #168c87) !important;
  color: #fff !important;
}

.student-dashboard--primary .student-welcome {
  background: linear-gradient(120deg, #fff4d7 0%, #e8f8ff 100%);
}

.student-dashboard--middle .student-welcome {
  background: linear-gradient(120deg, #e1f8f3 0%, #eff5ff 100%);
}

.student-dashboard--high .student-welcome {
  background: linear-gradient(120deg, #edf2fa 0%, #f8faff 100%);
}

.student-dashboard--high .student-class-card:hover {
  transform: none;
}
</style>
