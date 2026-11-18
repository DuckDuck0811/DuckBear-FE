<template>
  <div class="game-sprite-wrapper" :style="wrapperStyle">
    <!-- Inner flip container: cách ly transform flip khỏi transform animation ở wrapper ngoài -->
    <div
      class="game-sprite-flip-container"
      :class="{ 'sprite--flipped': isFlipped }"
    >
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
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { GAME_ASSETS } from "../assets.config.js";

const props = defineProps({
  mode: { type: String, default: "" },
  name: { type: String, default: "" },
  src: { type: String, default: "" },
  alt: { type: String, default: "" },
  width: { type: [String, Number], default: "auto" },
  height: { type: [String, Number], default: "auto" },
  flip: { type: Boolean, default: null },
});

const isLoaded = ref(false);
const hasError = ref(false);

const assetEntry = computed(() => {
  if (props.mode && props.name && GAME_ASSETS[props.mode]) {
    return GAME_ASSETS[props.mode][props.name];
  }
  return null;
});

const resolvedSrc = computed(() => {
  if (props.src) return props.src;
  const entry = assetEntry.value;
  if (typeof entry === "string") return entry;
  if (entry && typeof entry === "object") return entry.src || "";
  return "";
});

const isFlipped = computed(() => {
  if (props.flip !== null) return props.flip;
  const entry = assetEntry.value;
  if (entry && typeof entry === "object" && entry.flip !== undefined) {
    return Boolean(entry.flip);
  }
  return false;
});

const wrapperStyle = computed(() => {
  const w = typeof props.width === "number" ? `${props.width}px` : props.width;
  const h =
    typeof props.height === "number" ? `${props.height}px` : props.height;
  return {
    width: w,
    height: h,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
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
  position: relative;
}

.game-sprite-flip-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: transform 0.2s ease;
}

.game-sprite-flip-container.sprite--flipped {
  transform: scaleX(-1);
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
