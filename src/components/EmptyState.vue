<script setup>
import EmptyStateCommon from './common/EmptyState.vue'
</script>

<template>
  <EmptyStateCommon v-bind="$attrs" @action="$emit('action')" />
</template>
