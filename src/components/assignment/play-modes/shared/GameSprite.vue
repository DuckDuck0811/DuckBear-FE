<template>
  <div class="game-sprite-wrapper" :style="wrapperStyle">
    <!-- Ảnh thật (nếu có trong public/assets/modes/...) -->
    <img
      v-if="resolvedSrc && !hasError"
      v-show="isLoaded"
      :src="resolvedSrc"
      :alt="alt"
      class="game-sprite-img"
      @load="handleLoad"
      @error="handleError"
    />
    <!-- Fallback SVG / CSS khi chưa có file ảnh thật -->
    <div v-show="!isLoaded || hasError" class="game-sprite-fallback">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { GAME_ASSETS } from '../assets.config.js';

const props = defineProps({
  mode: { type: String, default: '' },
  name: { type: String, default: '' },
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  width: { type: [String, Number], default: 'auto' },
  height: { type: [String, Number], default: 'auto' },
});

const isLoaded = ref(false);
const hasError = ref(false);

const resolvedSrc = computed(() => {
  if (props.src) return props.src;
  if (props.mode && props.name && GAME_ASSETS[props.mode]) {
    return GAME_ASSETS[props.mode][props.name] || '';
  }
  return '';
});

const wrapperStyle = computed(() => {
  const w = typeof props.width === 'number' ? `${props.width}px` : props.width;
  const h = typeof props.height === 'number' ? `${props.height}px` : props.height;
  return {
    width: w,
    height: h,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  };
});

function handleLoad() {
  isLoaded.value = true;
  hasError.value = false;
}

function handleError() {
  hasError.value = true;
  isLoaded.value = false;
}

watch(resolvedSrc, () => {
  isLoaded.value = false;
  hasError.value = false;
});
</script>

<style scoped>
.game-sprite-wrapper {
  overflow: visible;
}

.game-sprite-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  pointer-events: none;
  user-select: none;
}

.game-sprite-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
