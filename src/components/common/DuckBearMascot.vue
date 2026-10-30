<template>
  <div
    class="duckbear-mascot-wrapper d-inline-flex align-center justify-center"
  >
    <svg
      :width="size"
      :height="size"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="mascot-svg"
    >
      <!-- Hào quang tròn sau lưng -->
      <circle cx="50" cy="50" r="44" fill="#EBF3FF" />

      <!-- Tai gấu bên trái -->
      <circle cx="28" cy="28" r="12" fill="#FFC83D" />
      <circle cx="28" cy="28" r="7" fill="#FF9F43" />

      <!-- Tai gấu bên phải -->
      <circle cx="72" cy="28" r="12" fill="#FFC83D" />
      <circle cx="72" cy="28" r="7" fill="#FF9F43" />

      <!-- Đầu tròn của DuckBear -->
      <circle cx="50" cy="52" r="32" fill="#FFC83D" />

      <!-- Đôi mắt to tròn long lanh -->
      <circle cx="39" cy="46" r="4.5" fill="#1D2939" />
      <circle cx="40.5" cy="44.5" r="1.5" fill="#FFFFFF" />

      <circle cx="61" cy="46" r="4.5" fill="#1D2939" />
      <circle cx="62.5" cy="44.5" r="1.5" fill="#FFFFFF" />

      <!-- Đôi má hồng đào dễ thương -->
      <ellipse cx="32" cy="54" rx="4.5" ry="2.5" fill="#FF6B9A" opacity="0.6" />
      <ellipse cx="68" cy="54" rx="4.5" ry="2.5" fill="#FF6B9A" opacity="0.6" />

      <!-- Mỏ vịt cam đặc trưng của DuckBear -->
      <path d="M40 54 C40 50 60 50 60 54 C60 62 40 62 40 54 Z" fill="#FF9F43" />
      <!-- Miệng cười mỉm nhỏ -->
      <path
        d="M46 58 C48 60 52 60 54 58"
        stroke="#E07A18"
        stroke-width="1.5"
        stroke-linecap="round"
      />

      <!-- Phụ kiện: Mũ cử nhân học thuật màu xanh SHub -->
      <g v-if="mood === 'greeting' || mood === 'celebrate'">
        <polygon points="50,14 74,23 50,32 26,23" fill="#2F7CF6" />
        <rect x="42" y="27" width="16" height="8" rx="2" fill="#1F5FD0" />
        <!-- Tua rua vàng -->
        <circle cx="50" cy="23" r="2" fill="#FFC83D" />
        <path
          d="M50 23 Q60 26 62 33"
          stroke="#FF9F43"
          stroke-width="1.8"
          stroke-linecap="round"
        />
        <circle cx="62" cy="34" r="1.5" fill="#FF9F43" />
      </g>

      <!-- Phụ kiện: Kính tròn học sinh trí thức khi reading -->
      <g v-if="mood === 'reading'">
        <circle
          cx="39"
          cy="46"
          r="8"
          stroke="#2F7CF6"
          stroke-width="2"
          fill="none"
        />
        <circle
          cx="61"
          cy="46"
          r="8"
          stroke="#2F7CF6"
          stroke-width="2"
          fill="none"
        />
        <line
          x1="47"
          y1="46"
          x2="53"
          y2="46"
          stroke="#2F7CF6"
          stroke-width="2"
        />
      </g>

      <!-- Hai tay cầm sách phía trước -->
      <g v-if="mood === 'reading' || mood === 'greeting'">
        <!-- Quyển sách mở màu xanh mint & xanh dương -->
        <path d="M34 76 L50 72 L66 76 L66 88 L50 84 L34 88 Z" fill="#2BC48A" />
        <path d="M35 77 L49 73 L49 84 L35 87 Z" fill="#FFFFFF" />
        <path d="M65 77 L51 73 L51 84 L65 87 Z" fill="#F4F8FF" />
        <!-- Tay gấu ôm sách -->
        <circle cx="32" cy="80" r="5" fill="#FFC83D" />
        <circle cx="68" cy="80" r="5" fill="#FFC83D" />
      </g>

      <!-- Cảm xúc ngơ ngác khi empty -->
      <g v-if="mood === 'empty'">
        <!-- Biểu tượng dấu hỏi chấm tròn bay lơ lửng -->
        <circle cx="74" cy="22" r="9" fill="#FF6B9A" />
        <text
          x="74"
          y="27"
          font-size="12"
          font-weight="bold"
          fill="#FFFFFF"
          text-anchor="middle"
        >
          ?
        </text>
      </g>

      <!-- Cảm xúc vui mừng celebrate -->
      <g v-if="mood === 'celebrate'">
        <!-- Ngôi sao nhỏ lấp lánh -->
        <polygon
          points="18,18 20,23 25,24 21,27 22,32 18,29 14,32 15,27 11,24 16,23"
          fill="#FFC83D"
        />
        <polygon
          points="82,24 83,27 86,28 84,30 84,33 82,31 80,33 80,30 78,28 81,27"
          fill="#FF6B9A"
        />
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
    default: "greeting", // 'greeting' | 'reading' | 'empty' | 'celebrate'
  },
});
</script>

<style scoped>
.duckbear-mascot-wrapper {
  user-select: none;
}
.mascot-svg {
  display: block;
}
</style>
