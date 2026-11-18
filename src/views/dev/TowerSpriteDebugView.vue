<template>
  <main class="sprite-debug">
    <header>
      <h1>Tower sprite direction check</h1>
      <p>Each pose should face right, toward the tower.</p>
    </header>

    <section class="pose-grid">
      <article v-for="pose in poses" :key="pose.key" class="pose-card">
        <h2>{{ pose.label }}</h2>
        <GameSprite
          :src="pose.asset.src"
          :flip="flips[pose.key]"
          :alt="`${pose.label} dinosaur facing the tower`"
          width="220"
          height="220"
          class="pose-sprite"
        />
        <p class="pose-meta">Configured flip: {{ pose.asset.flip }} · Preview: {{ flips[pose.key] }}</p>
        <p class="direction">→ hướng tháp</p>
        <button type="button" @click="toggleFlip(pose.key)">
          {{ flips[pose.key] ? "Tắt flip" : "Bật flip" }}
        </button>
      </article>
    </section>
  </main>
</template>

<script setup>
import { ref } from "vue";
import GameSprite from "../../components/assignment/play-modes/shared/GameSprite.vue";
import { GAME_ASSETS } from "../../components/assignment/play-modes/assets.config.js";

const poses = Object.entries(GAME_ASSETS.tower.hero).map(([key, asset]) => ({
  key,
  label: key[0].toUpperCase() + key.slice(1),
  asset,
}));

const flips = ref(Object.fromEntries(poses.map(({ key, asset }) => [key, asset.flip])));

function toggleFlip(key) {
  flips.value[key] = !flips.value[key];
}
</script>

<style scoped>
.sprite-debug {
  min-height: 100vh;
  padding: 24px;
  background: #e0f2fe;
  color: #0f172a;
  font-family: inherit;
}

header {
  margin: 0 auto 24px;
  max-width: 1200px;
}

h1 {
  margin: 0 0 6px;
  font-size: 1.8rem;
}

.pose-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.pose-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  border: 2px solid #7dd3fc;
  border-radius: 16px;
  background: #fff;
  text-align: center;
}

.pose-card h2 {
  margin: 0 0 8px;
}

.pose-sprite {
  max-width: 100%;
  max-height: 26vh;
}

.pose-meta {
  min-height: 2.5em;
  margin: 8px 0 4px;
  font-size: 0.82rem;
}

.direction {
  margin: 4px 0 12px;
  color: #0369a1;
  font-weight: 900;
}

button {
  padding: 8px 14px;
  border: 0;
  border-radius: 8px;
  background: #0284c7;
  color: #fff;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

@media (max-width: 900px) {
  .pose-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 480px) {
  .sprite-debug {
    padding: 16px;
  }

  .pose-grid {
    grid-template-columns: 1fr;
  }
}
</style>
