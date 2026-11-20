<template>
  <div class="strength-meter-container my-1">
    <!-- 4 thanh vạch độ mạnh -->
    <div class="meter-bars" role="progressbar" :aria-valuenow="score" aria-valuemin="0" aria-valuemax="4">
      <div
        v-for="index in 4"
        :key="index"
        class="meter-segment"
        :style="{
          backgroundColor: index <= score ? color : '#E2E8F0',
        }"
      />
    </div>

    <!-- Nhãn chữ hiển thị độ mạnh -->
    <div class="meter-label-row d-flex align-center justify-space-between mt-1 text-caption">
      <span class="text-secondary-label">Độ mạnh mật khẩu:</span>
      <span
        class="font-weight-black strength-text"
        :style="{ color: color }"
      >
        {{ label }}
      </span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  score: {
    type: Number,
    default: 0,
  },
  label: {
    type: String,
    default: "Chưa nhập",
  },
  color: {
    type: String,
    default: "#CBD5E1",
  },
});
</script>

<style scoped>
.strength-meter-container {
  width: 100%;
}

.meter-bars {
  display: flex;
  gap: 6px;
  width: 100%;
  height: 6px;
  margin-top: 4px;
}

.meter-segment {
  flex: 1;
  height: 100%;
  border-radius: 4px;
  transition: background-color 0.25s ease, transform 0.2s ease;
}

.text-secondary-label {
  color: #64748B;
  font-size: 0.78rem;
}

.strength-text {
  font-size: 0.82rem;
  letter-spacing: 0.2px;
  transition: color 0.25s ease;
}
</style>
