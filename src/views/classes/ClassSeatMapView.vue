<template>
  <v-layout class="min-vh-100 class-seat-page">
    <AppHeader />
    <TeacherSidebar />

    <v-main class="pb-16">
      <v-container class="py-7 px-4 px-md-8" style="max-width: 1240px">
        <v-btn
          to="/classes"
          variant="text"
          color="primary"
          prepend-icon="mdi-arrow-left"
          class="mb-4"
        >
          {{ t('classSeatMap.back') }}
        </v-btn>

        <v-progress-linear v-if="isLoading" indeterminate color="primary" rounded class="mb-5" />
        <v-alert v-else-if="errorMessage" type="error" variant="tonal" class="mb-5">
          {{ errorMessage }}
          <template #append>
            <v-btn variant="text" @click="loadClass">{{ t('classSeatMap.retry') }}</v-btn>
          </template>
        </v-alert>

        <template v-if="schoolClass">
          <v-card class="class-seat-header mb-5" rounded="xl">
            <div class="class-summary">
              <div class="class-identity">
                <v-avatar color="primary" variant="tonal" rounded="xl" size="48">
                  <v-icon icon="mdi-google-classroom" size="26" />
                </v-avatar>
                <div>
                  <div class="text-overline text-primary font-weight-bold">
                    {{ t('classSeatMap.eyebrow') }}
                  </div>
                  <h1 class="class-title">{{ schoolClass.name }}</h1>
                  <p class="class-meta text-body-2 text-secondary mb-0">
                    {{ t('classSeatMap.grade', { grade: schoolClass.gradeLevel }) }}
                    · {{ schoolClass.schoolYear }}
                    <span v-if="schoolClass.homeroomTeacher?.fullName">
                      · {{ schoolClass.homeroomTeacher.fullName }}
                    </span>
                  </p>
                </div>
              </div>
              <v-chip color="primary" variant="tonal" prepend-icon="mdi-account-group-outline">
                {{ t('classSeatMap.studentCount', { count: schoolClass.studentCount }) }}
              </v-chip>
            </div>
          </v-card>

          <section class="seat-map-panel pa-4 pa-md-7" :aria-label="t('classSeatMap.aria')">
            <div class="class-board mb-8">
              <v-icon icon="mdi-human-male-board" class="mr-2" />
              {{ t('classSeatMap.board') }}
            </div>

            <div
              v-if="schoolClass.students.length"
              class="seat-grid"
              :class="{
                'seat-grid--medium': schoolClass.students.length >= 10 && schoolClass.students.length < 24,
                'seat-grid--compact': schoolClass.students.length >= 24,
              }"
            >
              <article
                v-for="(student, index) in schoolClass.students"
                :key="student.id"
                class="seat-item"
                :aria-label="t('classSeatMap.seatDescription', { seat: index + 1, name: student.fullName })"
              >
                <div class="desk-card">
                  <div class="student-name">{{ student.fullName }}</div>
                  <div class="joined-at">
                    <v-icon icon="mdi-clock-check-outline" size="14" />
                    <span>{{ formatJoinedAt(student.joinedAt) }}</span>
                  </div>
                </div>
                <div class="desk-front" aria-hidden="true" />
              </article>
            </div>

            <v-card v-else class="empty-seats pa-8 text-center" rounded="xl" variant="tonal">
              <v-icon icon="mdi-seat-outline" color="primary" size="48" class="mb-3" />
              <h2 class="text-h6 font-weight-black mb-2">{{ t('classSeatMap.emptyTitle') }}</h2>
              <p class="text-body-2 text-secondary mb-0">{{ t('classSeatMap.emptyBody') }}</p>
            </v-card>

          </section>
        </template>
      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { api } from "../../services/api";
import AppHeader from "../../components/shared/AppHeader.vue";
import TeacherSidebar from "../../components/shared/TeacherSidebar.vue";

const route = useRoute();
const { t, locale } = useI18n();
const schoolClass = ref(null);
const isLoading = ref(false);
const errorMessage = ref("");

async function loadClass() {
  isLoading.value = true;
  errorMessage.value = "";
  try {
    schoolClass.value = await api(`/classes/${encodeURIComponent(route.params.id)}`);
  } catch (error) {
    errorMessage.value = error.message || t("classSeatMap.loadError");
  } finally {
    isLoading.value = false;
  }
}

function formatJoinedAt(value) {
  if (!value) return t("classSeatMap.joinTimeUnknown");
  return new Intl.DateTimeFormat(locale.value, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

onMounted(loadClass);
</script>

<style scoped>
.class-seat-page {
  background: #f4f8ff;
}

.class-seat-header {
  padding: 16px 20px;
  border: 1px solid #e4ecf7;
  background: #fff;
  box-shadow: 0 6px 20px rgba(47, 124, 246, 0.05);
}

.class-summary,
.class-identity {
  display: flex;
  align-items: center;
}

.class-summary {
  justify-content: space-between;
  gap: 20px;
}

.class-identity {
  min-width: 0;
  gap: 14px;
}

.class-identity > div {
  min-width: 0;
}

.class-title {
  margin: 0;
  color: #172b4d;
  font-size: clamp(1.35rem, 2.5vw, 1.8rem);
  font-weight: 850;
  line-height: 1.15;
}

.class-meta {
  margin-top: 5px;
}

.seat-map-panel {
  min-height: 310px;
  border: 1px solid #dce8f7;
  border-radius: 22px;
  background: linear-gradient(180deg, #ffffff 0%, #f9fbff 100%);
  box-shadow: 0 12px 28px rgba(47, 124, 246, 0.07);
}

.class-board {
  display: flex;
  min-height: 50px;
  align-items: center;
  justify-content: center;
  border: 1px solid #b7d5f3;
  border-radius: 14px;
  background: linear-gradient(90deg, #e8f3ff 0%, #f6faff 50%, #e8f3ff 100%);
  color: #2167d8;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  box-shadow: inset 0 -3px 0 rgba(67, 137, 224, 0.08);
}

.seat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 264px));
  gap: 28px 20px;
  max-width: 1000px;
  margin: 0 auto;
  justify-content: center;
}

.seat-grid--medium {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 170px), 190px));
  max-width: 1080px;
  gap: 22px 16px;
}

.seat-grid--compact {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 140px), 150px));
  max-width: 1120px;
  gap: 20px 14px;
}

.seat-item {
  min-width: 0;
  text-align: center;
}

.desk-card {
  display: flex;
  min-height: 108px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  border: 1px solid #d7e7f8;
  border-radius: 15px;
  background: linear-gradient(145deg, #fff 10%, #f3f8ff 100%);
  box-shadow: 0 6px 16px rgba(47, 124, 246, 0.08);
  transition: transform 160ms ease, box-shadow 160ms ease;
}

.desk-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 9px 20px rgba(47, 124, 246, 0.12);
}

.student-name {
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #1d2939;
  font-size: 0.95rem;
  font-weight: 800;
}

.joined-at {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 8px;
  color: #667085;
  font-size: 0.72rem;
}

.desk-front {
  width: 74%;
  height: 7px;
  margin: 5px auto 0;
  border-radius: 0 0 6px 6px;
  background: #c9ddf4;
  box-shadow: 0 3px 0 #e8f1fb;
}

.seat-grid--compact .desk-card {
  min-height: 84px;
  padding: 10px 8px;
}

.seat-grid--medium .desk-card {
  min-height: 96px;
}

.seat-grid--medium .student-name {
  font-size: 0.9rem;
}

.seat-grid--medium .joined-at {
  font-size: 0.66rem;
}

.seat-grid--compact .student-name {
  font-size: 0.84rem;
}

.seat-grid--compact .joined-at {
  margin-top: 6px;
  font-size: 0.62rem;
}

.empty-seats {
  border: 1px dashed #c5d8ef;
  background: #f8fbff;
}

@media (max-width: 600px) {
  .class-seat-header {
    padding: 14px;
  }

  .class-summary {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }

  .class-identity {
    align-items: flex-start;
    gap: 10px;
  }

  .class-meta {
    font-size: 0.78rem;
  }

  .seat-map-panel {
    min-height: 260px;
    border-radius: 18px;
  }

  .seat-grid {
    gap: 20px 12px;
  }

  .seat-grid--compact {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 132px), 150px));
    gap: 16px 10px;
  }

  .seat-grid--medium {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 150px), 170px));
    gap: 18px 12px;
  }

  .desk-card {
    min-height: 100px;
    padding: 12px 10px;
  }

  .joined-at {
    font-size: 0.67rem;
  }

  .seat-grid--compact .joined-at {
    font-size: 0.58rem;
  }

  .seat-grid--medium .joined-at {
    font-size: 0.62rem;
  }

  .desk-front {
    width: 68%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .desk-card {
    transition: none;
  }

  .desk-card:hover {
    transform: none;
  }
}
</style>
