<template>
  <StudentDashboardLayout>
    <v-container fluid class="student-schedule-page px-4 py-4 px-md-6">
      <StudentScheduleToolbar
        :view-mode="schedule.viewMode.value"
        :range-label="rangeLabel"
        @update:view-mode="schedule.setViewMode"
        @previous="schedule.movePeriod(-1)"
        @next="schedule.movePeriod(1)"
        @today="schedule.goToToday"
      />
      <StudentScheduleClassFilter
        :classes="schedule.classOptions.value"
        :selected-class-id="schedule.selectedClassId.value"
        @update:selected-class-id="schedule.selectedClassId.value = $event"
      />
      <StudentScheduleLegend />

      <v-alert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        class="mb-3"
        role="alert"
      >
        <div class="d-flex align-center justify-space-between ga-3">
          <span>{{ errorMessage }}</span>
          <v-btn variant="text" @click="loadSchedule">{{
            t("schedule.retry")
          }}</v-btn>
        </div>
      </v-alert>
      <v-progress-linear
        v-if="loading"
        indeterminate
        color="primary"
        rounded
        class="mb-3"
      />

      <section
        v-if="!loading && !errorMessage"
        class="student-schedule-content"
      >
        <div class="student-calendar-desktop">
          <StudentScheduleCalendar
            :mode="schedule.viewMode.value"
            :days="schedule.calendarDays.value"
            @open-event="openEvent"
          />
        </div>
        <div class="student-calendar-mobile">
          <StudentScheduleDayList
            :mode="schedule.viewMode.value"
            :days="schedule.calendarDays.value"
            @open-event="openEvent"
          />
        </div>
        <StudentUpcomingDue
          :items="schedule.upcoming.value"
          @open-event="openEvent"
        />
      </section>
    </v-container>
  </StudentDashboardLayout>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { api } from "../../services/api";
import { useStudentSchedule } from "../../composables/useStudentSchedule";
import StudentDashboardLayout from "../../layouts/StudentDashboardLayout.vue";
import StudentScheduleToolbar from "../../components/schedule/StudentScheduleToolbar.vue";
import StudentScheduleClassFilter from "../../components/schedule/StudentScheduleClassFilter.vue";
import StudentScheduleLegend from "../../components/schedule/StudentScheduleLegend.vue";
import StudentScheduleCalendar from "../../components/schedule/StudentScheduleCalendar.vue";
import StudentScheduleDayList from "../../components/schedule/StudentScheduleDayList.vue";
import StudentUpcomingDue from "../../components/schedule/StudentUpcomingDue.vue";

const { t, locale } = useI18n();
const router = useRouter();
const assignments = ref([]);
const manualAssignments = ref([]);
const classes = ref([]);
const loading = ref(true);
const errorMessage = ref("");
const schedule = useStudentSchedule({
  assignments,
  manualAssignments,
  classes,
});

const rangeLabel = computed(() => {
  if (schedule.viewMode.value === "month") {
    return new Intl.DateTimeFormat(locale.value === "vi" ? "vi-VN" : "en-US", {
      month: "long",
      year: "numeric",
    }).format(schedule.anchorDate.value);
  }
  const first = schedule.calendarDays.value[0]?.date;
  const last = schedule.calendarDays.value.at(-1)?.date;
  if (!first || !last) return "";
  const shortDate = (date) =>
    new Intl.DateTimeFormat(locale.value === "vi" ? "vi-VN" : "en-US", {
      day: "numeric",
      month: "numeric",
    }).format(date);
  return t("schedule.weekOf", {
    start: shortDate(first),
    end: shortDate(last),
  });
});

async function loadSchedule() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const [quizResult, manualResult, classResult] = await Promise.all([
      api("/assignments/mine"),
      api("/classes/manual-assignments/mine"),
      api("/classes/mine"),
    ]);
    assignments.value = Array.isArray(quizResult) ? quizResult : [];
    manualAssignments.value = Array.isArray(manualResult) ? manualResult : [];
    classes.value = classResult?.classes || [];
  } catch (error) {
    errorMessage.value = error?.message || t("schedule.loadError");
  } finally {
    loading.value = false;
  }
}

function openEvent(event) {
  if (event.type === "manual") {
    const classId = event.classId || event.class?.id;
    if (classId) {
      return router.push(
        `/classes/${classId}/manual-assignments?assignment=${event.manualAssignmentId}`,
      );
    }
    return router.push("/manual-assignments");
  }
  return router.push(`/assignments/${event.id}/do`);
}

onMounted(loadSchedule);
</script>

<style scoped>
.student-schedule-page {
  width: 100%;
  max-width: 1440px;
  margin-inline: auto;
}
.student-schedule-content {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) minmax(270px, 0.9fr);
  align-items: start;
  gap: 16px;
}
.student-calendar-mobile {
  display: none;
}
@media (max-width: 1023.98px) {
  .student-schedule-content {
    grid-template-columns: minmax(0, 1fr);
  }
  .student-calendar-desktop {
    display: none;
  }
  .student-calendar-mobile {
    display: block;
  }
}
</style>
