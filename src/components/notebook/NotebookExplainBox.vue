<template>
  <v-card v-if="loading || error || data" rounded="lg" border variant="tonal" color="primary" class="pa-4 mt-3">
    <div v-if="loading" class="d-flex align-center ga-3">
      <v-progress-circular indeterminate size="20" width="2" color="primary" />
      <span class="text-body-2">{{ t("notebook.explain.loading") }}</span>
    </div>

    <v-alert v-else-if="error" type="warning" variant="tonal" density="compact">
      <div class="d-flex align-center justify-space-between flex-wrap ga-2">
        <span>{{ error }}</span>
        <v-btn v-if="canRetry" size="small" variant="text" color="primary" @click="$emit('retry')">
          {{ t("notebook.retry") }}
        </v-btn>
      </div>
    </v-alert>

    <div v-else-if="data" class="text-body-2 text-high-emphasis">
      <div class="explain-text">{{ data.explanation }}</div>

      <div v-if="data.sources?.length" class="d-flex flex-wrap ga-2 mt-3">
        <v-chip
          v-for="(src, idx) in data.sources"
          :key="idx"
          size="x-small"
          variant="outlined"
          color="primary"
          prepend-icon="mdi-book-open-variant"
        >
          {{ t("notebook.explain.sourcePrefix") }} {{ src.title }}
        </v-chip>
      </div>

      <div class="text-caption text-medium-emphasis mt-2">
        {{ t("notebook.explain.disclaimer") }}
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { useI18n } from "vue-i18n";

defineProps({
  loading: { type: Boolean, default: false },
  error: { type: String, default: "" },
  canRetry: { type: Boolean, default: false },
  data: { type: Object, default: null },
});

defineEmits(["retry"]);
const { t } = useI18n();
</script>

<style scoped>
.explain-text {
  white-space: pre-line;
  line-height: 1.6;
}
</style>
