<template>
  <v-card
    class="empty-state-shub text-center pa-8 pa-md-12 mx-auto my-6"
    elevation="0"
  >
    <!-- Mascot DuckBear ngộ nghĩnh đang thắc mắc -->
    <div class="mascot-empty-wrapper mb-4 animate-float">
      <DuckBearMascot :size="110" mood="empty" />
    </div>

    <h2 class="empty-title text-h5 font-weight-black mb-2">
      {{ title }}
    </h2>
    <p class="empty-desc text-body-2 mb-6 mx-auto">
      {{ description }}
    </p>

    <v-btn
      v-if="actionText"
      color="primary"
      size="large"
      rounded="pill"
      class="btn-shub-primary px-8 font-weight-bold"
      :prepend-icon="actionIcon"
      @click="emit('action')"
    >
      {{ actionText }}
    </v-btn>
  </v-card>
</template>

<script setup>
import DuckBearMascot from "./DuckBearMascot.vue";

defineProps({
  title: {
    type: String,
    default: "Chưa có dữ liệu nào",
  },
  description: {
    type: String,
    default: "Hiện tại chưa có thông tin nào trong mục này.",
  },
  actionText: {
    type: String,
    default: "",
  },
  actionIcon: {
    type: String,
    default: "mdi-plus",
  },
});

const emit = defineEmits(["action"]);
</script>

<style scoped>
.empty-state-shub {
  background: #ffffff !important;
  border-radius: 24px !important;
  border: 1px solid #e4ecf7 !important;
  box-shadow: 0 8px 24px rgba(47, 124, 246, 0.06) !important;
  max-width: 580px;
}

.empty-title {
  color: #1d2939;
}

.empty-desc {
  color: #667085;
  max-width: 440px;
  line-height: 1.6;
}
</style>
