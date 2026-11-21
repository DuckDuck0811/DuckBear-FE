<template>
  <div
    class="mascot-circle-wrapper"
    :class="[`mascot--${mood}`]"
    role="img"
    :aria-label="`Mascot Gấu Trắng DuckBear (${mood})`"
  >
    <svg
      viewBox="0 0 120 120"
      width="100%"
      height="100%"
      class="mascot-svg"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <!-- Bóng đổ mềm cho chi tiết -->
        <filter id="softShadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#1A4A6E" flood-opacity="0.12" />
        </filter>
        <!-- Gradient nền tai trong -->
        <linearGradient id="innerEarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FFCCD5" />
          <stop offset="100%" stop-color="#FFA8BA" />
        </linearGradient>
        <!-- Gradient gấu trắng tuyết với đổ bóng nhẹ phía dưới -->
        <linearGradient id="polarFurGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FFFFFF" />
          <stop offset="85%" stop-color="#FFFFFF" />
          <stop offset="100%" stop-color="#E8F1F8" />
        </linearGradient>
      </defs>

      <!-- Áo len xanh dương thương hiệu DuckBear ở phía dưới -->
      <path
        d="M 22 108 C 24 92, 38 88, 60 88 C 82 88, 96 92, 98 108 C 98 116, 22 116, 22 108 Z"
        fill="#2F7BF5"
      />
      <!-- Cổ áo viền trắng xinh xắn -->
      <path
        d="M 44 91 C 52 97, 68 97, 76 91"
        stroke="#FFFFFF"
        stroke-width="3"
        stroke-linecap="round"
        fill="none"
      />

      <!-- Tai gấu trắng trái -->
      <g class="ear ear-left">
        <circle cx="31" cy="33" r="15" fill="url(#polarFurGrad)" stroke="#C8DFED" stroke-width="2" />
        <circle cx="31" cy="33" r="8.5" fill="url(#innerEarGrad)" />
      </g>

      <!-- Tai gấu trắng phải -->
      <g class="ear ear-right">
        <circle cx="89" cy="33" r="15" fill="url(#polarFurGrad)" stroke="#C8DFED" stroke-width="2" />
        <circle cx="89" cy="33" r="8.5" fill="url(#innerEarGrad)" />
      </g>

      <!-- Đầu gấu trắng tuyết tròn bầu bĩnh -->
      <circle
        cx="60"
        cy="64"
        r="39"
        fill="url(#polarFurGrad)"
        stroke="#C8DFED"
        stroke-width="2"
      />

      <!-- Chỏm tóc / vương miện nhỏ màu vàng cam năng động trên đỉnh đầu -->
      <path
        d="M 55 24 C 53 16, 61 14, 62 19 C 65 13, 72 17, 68 24 Z"
        fill="#FFB84D"
      />

      <!-- Má hồng tròn xinh 2 bên -->
      <circle cx="35" cy="71" r="7.5" fill="#FF8E9E" opacity="0.65" />
      <circle cx="85" cy="71" r="7.5" fill="#FF8E9E" opacity="0.65" />

      <!-- Vùng mõm gấu trắng tuyết -->
      <ellipse
        cx="60"
        cy="74"
        rx="18"
        ry="13"
        fill="#F4F9FD"
        stroke="#D5E6F3"
        stroke-width="1.5"
      />

      <!-- MŨI GẤU NHỎ XINH MÀU THAN NAVY -->
      <path
        d="M 55 69 C 55 67, 65 67, 65 69 C 65 72, 61 74, 60 74 C 59 74, 55 72, 55 69 Z"
        fill="#1E293B"
      />
      <!-- Đốm sáng trên mũi -->
      <ellipse cx="58" cy="68.5" rx="1.5" ry="0.8" fill="#FFFFFF" opacity="0.8" />

      <!-- MẮT & KHÓE MIỆNG THEO BIỂU CẢM (MOOD) -->

      <!-- 1. Normal mood: Mắt to tròn long lanh, miệng mỉm cười chúm chím -->
      <g v-if="mood === 'normal'" class="eyes-normal">
        <!-- Mắt trái -->
        <circle cx="43" cy="56" r="5" fill="#1E293B" />
        <circle cx="41.5" cy="54.5" r="1.8" fill="#FFFFFF" />
        <circle cx="44.5" cy="57" r="0.8" fill="#FFFFFF" />

        <!-- Mắt phải -->
        <circle cx="77" cy="56" r="5" fill="#1E293B" />
        <circle cx="75.5" cy="54.5" r="1.8" fill="#FFFFFF" />
        <circle cx="78.5" cy="57" r="0.8" fill="#FFFFFF" />

        <!-- Khóe miệng chúm chím dễ thương (chữ w nhẹ) -->
        <path
          d="M 54 75 Q 57 78 60 75 Q 63 78 66 75"
          stroke="#1E293B"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          fill="none"
        />
      </g>

      <!-- 2. Typing mood: Mắt nhìn xuống chăm chú, miệng tròn "o" tập trung -->
      <g v-else-if="mood === 'typing'" class="eyes-typing">
        <!-- Mắt liếc xuống -->
        <circle cx="43" cy="58" r="4.8" fill="#1E293B" />
        <circle cx="42" cy="59.2" r="1.6" fill="#FFFFFF" />

        <circle cx="77" cy="58" r="4.8" fill="#1E293B" />
        <circle cx="76" cy="59.2" r="1.6" fill="#FFFFFF" />

        <!-- Lông mày tập trung nhẹ -->
        <path d="M 39 49 Q 44 47 48 50" stroke="#7A93A6" stroke-width="2" stroke-linecap="round" fill="none" />
        <path d="M 81 49 Q 76 47 72 50" stroke="#7A93A6" stroke-width="2" stroke-linecap="round" fill="none" />

        <!-- Miệng chữ "o" nhỏ -->
        <ellipse cx="60" cy="76" rx="2.5" ry="3" fill="#1E293B" />
      </g>

      <!-- 3. Success mood: Mắt cười híp tít ^_^, miệng cười tươi, sao lấp lánh -->
      <g v-else-if="mood === 'success'" class="eyes-success">
        <path d="M 38 57 Q 44 49 50 57" stroke="#1E293B" stroke-width="3" stroke-linecap="round" fill="none" />
        <path d="M 70 57 Q 76 49 82 57" stroke="#1E293B" stroke-width="3" stroke-linecap="round" fill="none" />

        <!-- Miệng cười tươi hé lưỡi xinh -->
        <path
          d="M 53 74 Q 60 83 67 74 Z"
          fill="#E65959"
          stroke="#1E293B"
          stroke-width="1.8"
          stroke-linejoin="round"
        />

        <!-- Tia sao vàng lấp lánh hai bên -->
        <path d="M 23 58 L 27 58 M 25 56 L 25 60" stroke="#FFB84D" stroke-width="2" stroke-linecap="round" />
        <path d="M 97 58 L 93 58 M 95 56 L 95 60" stroke="#FFB84D" stroke-width="2" stroke-linecap="round" />
      </g>

      <!-- 4. Error mood: Mắt cụp buồn rưng rưng, khóe miệng mếu, giọt mồ hôi nhỏ -->
      <g v-else class="eyes-error">
        <!-- Mắt to buồn rưng rưng -->
        <circle cx="43" cy="57" r="4.8" fill="#1E293B" />
        <circle cx="41.5" cy="55.5" r="1.8" fill="#FFFFFF" />
        <circle cx="43.5" cy="58.5" r="0.8" fill="#FFFFFF" />

        <circle cx="77" cy="57" r="4.8" fill="#1E293B" />
        <circle cx="75.5" cy="55.5" r="1.8" fill="#FFFFFF" />
        <circle cx="77.5" cy="58.5" r="0.8" fill="#FFFFFF" />

        <!-- Lông mày cụp buồn -->
        <path d="M 38 49 Q 43 52 47 51" stroke="#7A93A6" stroke-width="2.2" stroke-linecap="round" fill="none" />
        <path d="M 82 49 Q 77 52 73 51" stroke="#7A93A6" stroke-width="2.2" stroke-linecap="round" fill="none" />

        <!-- Khóe miệng mếu cong xuống -->
        <path
          d="M 54 78 Q 60 74 66 78"
          stroke="#1E293B"
          stroke-width="2"
          stroke-linecap="round"
          fill="none"
        />

        <!-- Giọt mồ hôi nhỏ màu xanh lơ ở thái dương -->
        <path
          d="M 91 50 C 91 47, 94 44, 94 44 C 94 44, 97 47, 97 50 C 97 52, 94.5 53, 94 53 C 93.5 53, 91 52, 91 50 Z"
          fill="#60A5FA"
          opacity="0.9"
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
  background: linear-gradient(145deg, #EDF6FC 0%, #E3EDF8 100%);
  padding: 6px;
  box-shadow: 0 10px 24px -6px rgba(34, 112, 143, 0.22),
              0 2px 8px rgba(0, 0, 0, 0.05);
  border: 4px solid #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
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
