<script setup>
defineProps({
  tag: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: 'mdi-book-open-variant',
  },
})
</script>

<template>
  <v-card
    class="page-header-banner pa-5 pa-md-7 mb-6"
    color="transparent"
    elevation="0"
  >
    <div class="d-flex flex-column flex-md-row align-start align-md-center justify-space-between ga-4">
      <div class="d-flex align-start ga-4">
        <div class="header-icon-box d-flex align-center justify-center">
          <v-icon :icon="icon" color="primary" size="30" />
        </div>

        <div>
          <v-chip
            v-if="tag"
            color="primary"
            size="x-small"
            variant="tonal"
            class="font-weight-black mb-2"
          >
            {{ tag }}
          </v-chip>
          <h1 class="header-title font-weight-black text-h4 mb-1">
            {{ title }}
          </h1>
          <p v-if="subtitle" class="header-subtitle text-body-2 mb-0">
            {{ subtitle }}
          </p>
        </div>
      </div>

      <!-- Vùng Nút Hành Động (Align thẳng hàng với flex) -->
      <div v-if="$slots.actions" class="d-flex flex-wrap align-center ga-3 w-100 w-md-auto justify-start justify-md-end mt-2 mt-md-0">
        <slot name="actions" />
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.page-header-banner {
  background: linear-gradient(135deg, #EAF2FF 0%, #F5F9FF 100%) !important;
  border-radius: 20px !important;
  border: 1px solid #DCE7F7 !important;
}

.header-icon-box {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: #FFFFFF;
  border: 1px solid #DCE7F7;
  box-shadow: 0 4px 12px rgba(47, 124, 246, 0.1);
  flex-shrink: 0;
}

.header-title {
  color: #1D2939;
  line-height: 1.25;
}

.header-subtitle {
  color: #667085;
  line-height: 1.5;
  max-width: 680px;
}
</style>

