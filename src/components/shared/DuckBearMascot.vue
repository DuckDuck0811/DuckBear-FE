<template>
  <div class="polar-mascot-wrapper d-inline-flex align-center justify-center" aria-hidden="true">
    <svg
      :width="size"
      :height="size"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="polar-mascot-svg"
    >
      <circle cx="50" cy="50" r="46" fill="#EAF6FF" />
      <path d="M18 83c3-13 15-20 32-20s29 7 32 20v8H18v-8Z" fill="#D8F0FA" />
      <path d="M25 82c4-9 13-14 25-14s21 5 25 14v9H25v-9Z" fill="#2F7CF6" />

      <!-- Polar bear ears and snow-white face -->
      <circle cx="28" cy="31" r="13" fill="#fff" stroke="#B8D9EA" stroke-width="2" />
      <circle cx="72" cy="31" r="13" fill="#fff" stroke="#B8D9EA" stroke-width="2" />
      <circle cx="28" cy="31" r="6" fill="#E8B9C5" />
      <circle cx="72" cy="31" r="6" fill="#E8B9C5" />
      <path d="M50 17c-21 0-34 14-34 35 0 19 13 32 34 32s34-13 34-32c0-21-13-35-34-35Z" fill="#fff" stroke="#B8D9EA" stroke-width="2" />

      <!-- Confident expression -->
      <path d="m31 41 10-3m18 0 10 3" stroke="#34495E" stroke-width="3" stroke-linecap="round" />
      <circle cx="38" cy="48" r="4" fill="#203748" />
      <circle cx="62" cy="48" r="4" fill="#203748" />
      <circle cx="39.5" cy="46.5" r="1.2" fill="#fff" />
      <circle cx="63.5" cy="46.5" r="1.2" fill="#fff" />

      <!-- Muzzle, nose, and smile -->
      <ellipse cx="50" cy="59" rx="15" ry="11" fill="#F1F8FC" />
      <path d="M45 55c2-3 8-3 10 0-.3 4-2.6 6-5 6s-4.7-2-5-6Z" fill="#263C4A" />
      <path d="M50 61v3m-5 0c2.5 3 7.5 3 10 0" stroke="#263C4A" stroke-width="1.8" stroke-linecap="round" />

      <!-- Graduation cap -->
      <g v-if="mood === 'greeting' || mood === 'celebrate'">
        <path d="m50 8 27 10-27 11-27-11L50 8Z" fill="#1F5FD0" stroke="#174CA8" stroke-width="1.5" />
        <path d="M38 23v8c7 5 17 5 24 0v-8" fill="#2F7CF6" />
        <path d="M77 18v12" stroke="#FFCA5C" stroke-width="2" />
        <circle cx="77" cy="32" r="2.5" fill="#FFCA5C" />
      </g>

      <!-- Reading glasses -->
      <g v-if="mood === 'reading'">
        <circle cx="38" cy="48" r="8" stroke="#2F7CF6" stroke-width="2.5" />
        <circle cx="62" cy="48" r="8" stroke="#2F7CF6" stroke-width="2.5" />
        <path d="M46 48h8" stroke="#2F7CF6" stroke-width="2.5" />
      </g>

      <!-- Open book -->
      <g v-if="mood === 'reading' || mood === 'greeting'">
        <path d="m31 75 18-4v17l-18 4V75Zm38 0-18-4v17l18 4V75Z" fill="#fff" stroke="#1F5FD0" stroke-width="1.5" stroke-linejoin="round" />
        <path d="M50 72v17" stroke="#9FC9F5" stroke-width="1.5" />
      </g>

      <!-- Snowflake for empty states -->
      <g v-if="mood === 'empty'" stroke="#54A9E8" stroke-width="2" stroke-linecap="round">
        <path d="M78 15v16m-7-12 14 8m0-8-14 8m7-11-3 3m3 9-3-3m3 3 3-3m-3-9 3 3" />
      </g>

      <!-- Celebration stars -->
      <g v-if="mood === 'celebrate'" fill="#FFCA5C">
        <path d="m19 25 2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5Zm63 4 1.5 3.5L87 34l-3.5 1.5L82 39l-1.5-3.5L77 34l3.5-1.5L82 29Z" />
      </g>
    </svg>
  </div>
</template>

<script setup>
defineProps({
  size: {
    type: [Number, String],
    default: 84,
  },
  mood: {
    type: String,
    default: "greeting",
  },
});
</script>

<style scoped>
.polar-mascot-wrapper {
  user-select: none;
}

.polar-mascot-svg {
  display: block;
}
</style>
