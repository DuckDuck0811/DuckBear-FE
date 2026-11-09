<template>
  <v-card class="student-welcome pa-6 pa-md-8 mb-7" rounded="xl">
    <div
      class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-5"
    >
      <div class="d-flex align-center ga-4">
        <v-avatar class="student-mascot" size="68">
          <v-icon icon="mdi-star-four-points" size="34" />
        </v-avatar>
        <div>
          <div class="text-overline student-eyebrow">
            {{ t("studentDashboard.eyebrow") }}
          </div>
          <h1 class="text-h4 font-weight-black mb-1">
            {{ t("studentDashboard.greeting", { name }) }}
          </h1>
          <p class="text-body-1 text-secondary mb-0">
            {{ t("studentDashboard.subtitle") }}
          </p>
        </div>
      </div>
      <v-chip
        v-if="gradeStyle !== 'neutral'"
        color="success"
        variant="tonal"
        prepend-icon="mdi-school-outline"
      >
        {{ gradeStyleLabel }}
      </v-chip>
    </div>
  </v-card>
</template>

<script setup>
import { useI18n } from "vue-i18n";

defineProps({
  name: { type: String, required: true },
  gradeStyle: { type: String, default: "neutral" },
  gradeStyleLabel: { type: String, default: "" },
});

const { t } = useI18n();
</script>

<style scoped>
.student-welcome {
  border: 1px solid #e4ecf7;
  background: linear-gradient(120deg, #e7fbf5 0%, #f5fbff 100%);
  box-shadow: 0 8px 24px rgba(47, 124, 246, 0.06);
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
</style>
