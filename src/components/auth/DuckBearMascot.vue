<template>
  <div
    class="mascot-circle-wrapper"
    :class="[`mascot--${mood}`]"
    role="img"
    :aria-label="`Mascot DuckBear (${mood})`"
  >
    <svg
      viewBox="0 0 120 120"
      width="100%"
      height="100%"
      class="mascot-svg"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <!-- Bóng đổ mềm cho mỏ vịt -->
        <filter id="billShadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#8C531B" flood-opacity="0.18" />
        </filter>
        <!-- Gradient cho đầu gấu -->
        <linearGradient id="bearFurGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#D79966" />
          <stop offset="100%" stop-color="#BA7B49" />
        </linearGradient>
      </defs>

      <!-- Tai gấu trái -->
      <g class="ear ear-left">
        <circle cx="28" cy="30" r="16" fill="url(#bearFurGrad)" />
        <circle cx="28" cy="30" r="9" fill="#FCE4C8" />
      </g>

      <!-- Tai gấu phải -->
      <g class="ear ear-right">
        <circle cx="92" cy="30" r="16" fill="url(#bearFurGrad)" />
        <circle cx="92" cy="30" r="9" fill="#FCE4C8" />
      </g>

      <!-- Chỏm lông vàng dễ thương trên đầu -->
      <path
        d="M 54 18 C 52 10, 60 7, 62 13 C 65 7, 72 11, 68 18 Z"
        fill="#FFD166"
      />

      <!-- Đầu gấu nâu tròn -->
      <circle cx="60" cy="62" r="42" fill="url(#bearFurGrad)" />

      <!-- Má hồng tròn hai bên -->
      <circle cx="33" cy="68" r="7" fill="#F9A8A8" opacity="0.75" />
      <circle cx="87" cy="68" r="7" fill="#F9A8A8" opacity="0.75" />

      <!-- Mõm kem tròn -->
      <ellipse cx="60" cy="71" rx="23" ry="17" fill="#FFF3E0" />

      <!-- MẮT & BIỂU CẢM THEO MOOD -->

      <!-- 1. Normal mood (Mắt mở to long lanh) -->
      <g v-if="mood === 'normal'" class="eyes-normal">
        <circle cx="43" cy="55" r="5" fill="#2D2118" />
        <circle cx="41.5" cy="53.5" r="1.8" fill="#FFFFFF" />
        <circle cx="44.5" cy="56" r="0.8" fill="#FFFFFF" />

        <circle cx="77" cy="55" r="5" fill="#2D2118" />
        <circle cx="75.5" cy="53.5" r="1.8" fill="#FFFFFF" />
        <circle cx="78.5" cy="56" r="0.8" fill="#FFFFFF" />
      </g>

      <!-- 2. Typing mood (Mắt nhìn xuống tập trung) -->
      <g v-else-if="mood === 'typing'" class="eyes-typing">
        <circle cx="43" cy="57" r="4.8" fill="#2D2118" />
        <circle cx="42" cy="58" r="1.6" fill="#FFFFFF" />

        <circle cx="77" cy="57" r="4.8" fill="#2D2118" />
        <circle cx="76" cy="58" r="1.6" fill="#FFFFFF" />

        <!-- Lông mày hơi nhướng nhẹ tập trung -->
        <path d="M 39 49 Q 44 47 48 50" stroke="#7A4B23" stroke-width="2" stroke-linecap="round" fill="none" />
        <path d="M 81 49 Q 76 47 72 50" stroke="#7A4B23" stroke-width="2" stroke-linecap="round" fill="none" />
      </g>

      <!-- 3. Success mood (Mắt cười tít ^_^) -->
      <g v-else-if="mood === 'success'" class="eyes-success">
        <path d="M 38 56 Q 44 48 50 56" stroke="#2D2118" stroke-width="3" stroke-linecap="round" fill="none" />
        <path d="M 70 56 Q 76 48 82 56" stroke="#2D2118" stroke-width="3" stroke-linecap="round" fill="none" />
        <!-- Tia sao lấp lánh cạnh má -->
        <path d="M 23 58 L 26 58 M 24.5 56.5 L 24.5 59.5" stroke="#FFB84D" stroke-width="1.8" stroke-linecap="round" />
        <path d="M 97 58 L 94 58 M 95.5 56.5 L 95.5 59.5" stroke="#FFB84D" stroke-width="1.8" stroke-linecap="round" />
      </g>

      <!-- 4. Error mood (Mắt ủ rũ buồn bã) -->
      <g v-else class="eyes-error">
        <ellipse cx="43" cy="56" rx="4.5" ry="5" fill="#2D2118" />
        <circle cx="42" cy="54" r="1.5" fill="#FFFFFF" />

        <ellipse cx="77" cy="56" rx="4.5" ry="5" fill="#2D2118" />
        <circle cx="78" cy="54" r="1.5" fill="#FFFFFF" />

        <!-- Lông mày cụp buồn -->
        <path d="M 38 48 Q 43 51 47 50" stroke="#7A4B23" stroke-width="2.2" stroke-linecap="round" fill="none" />
        <path d="M 82 48 Q 77 51 73 50" stroke="#7A4B23" stroke-width="2.2" stroke-linecap="round" fill="none" />
      </g>

      <!-- MỎ VỊT VÀNG CAM #FFB84D -->
      <g class="duck-bill" filter="url(#billShadow)">
        <!-- Mỏ trên phồng tròn mềm mại -->
        <path
          d="M 45 68 C 45 62, 75 62, 75 68 C 76 74, 69 77, 60 77 C 51 77, 44 74, 45 68 Z"
          fill="#FFB84D"
        />
        <!-- Chi tiết hai lỗ mũi nhỏ xinh -->
        <circle cx="56" cy="67" r="1.2" fill="#C97B1A" />
        <circle cx="64" cy="67" r="1.2" fill="#C97B1A" />

        <!-- Khóe miệng thay đổi theo mood -->
        <path
          v-if="mood === 'success'"
          d="M 52 74 Q 60 81 68 74"
          stroke="#C97B1A"
          stroke-width="2"
          stroke-linecap="round"
          fill="#D93F3F"
        />
        <path
          v-else-if="mood === 'error'"
          d="M 53 76 Q 60 72 67 76"
          stroke="#C97B1A"
          stroke-width="1.8"
          stroke-linecap="round"
          fill="none"
        />
        <path
          v-else
          d="M 53 74 Q 60 78 67 74"
          stroke="#C97B1A"
          stroke-width="1.8"
          stroke-linecap="round"
          fill="none"
        />
      </g>
    </svg>
  </div>
</template>

<script setup>
defineProps({
  mood: {
    type: String,
    default: "normal",
    validator: (val) => ["normal", "typing", "success", "error"].includes(val),
  },
});
</script>

<style scoped>
.mascot-circle-wrapper {
  width: 112px;
  height: 112px;
  border-radius: 50%;
  background: #ffffff;
  padding: 8px;
  box-shadow: 0 10px 24px -6px rgba(34, 112, 143, 0.22),
              0 2px 8px rgba(0, 0, 0, 0.06);
  border: 4px solid #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: visible;
  user-select: none;
}

.mascot-svg {
  display: block;
  overflow: visible;
}

/* Animations theo biểu cảm */
.mascot--typing {
  transform: translateY(2px) scale(0.98);
}

.mascot--success {
  transform: translateY(-4px) scale(1.06);
  box-shadow: 0 14px 28px -6px rgba(46, 158, 107, 0.28),
              0 2px 10px rgba(0, 0, 0, 0.08);
}

.mascot--error {
  transform: translateY(2px) rotate(-3deg);
  box-shadow: 0 12px 26px -6px rgba(217, 63, 63, 0.25),
              0 2px 8px rgba(0, 0, 0, 0.08);
}

@media (prefers-reduced-motion: reduce) {
  .mascot-circle-wrapper {
    transition: none !important;
    transform: none !important;
  }
}
</style>
