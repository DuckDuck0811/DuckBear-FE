<template>
  <v-container class="py-6" style="max-width: 900px">
    <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-5">
      <div>
        <h1 class="text-h5 font-weight-bold d-flex align-center ga-2">
          <v-icon color="amber-darken-2">mdi-trophy-outline</v-icon>
          <span>{{ t("gamification.leaderboard.title") }}</span>
        </h1>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
          {{ t("gamification.leaderboard.subtitle") }}
        </p>
      </div>

      <v-switch
        v-model="anonymous"
        color="primary"
        hide-details
        density="compact"
        :loading="savingAnon"
        :label="t('gamification.leaderboard.anonymous')"
        @update:model-value="onToggleAnonymous"
      />
    </div>

    <v-alert
      v-if="anonymous"
      type="info"
      variant="tonal"
      density="compact"
      class="mb-4"
    >
      {{ t("gamification.leaderboard.anonymousHint") }}
    </v-alert>

    <v-card v-if="loadingClasses" variant="outlined" rounded="lg" class="pa-6 text-center">
      <v-progress-circular indeterminate color="primary" />
    </v-card>

    <v-card v-else-if="classes.length === 0" variant="outlined" rounded="lg" class="pa-8 text-center">
      <v-icon size="48" color="grey">mdi-school-outline</v-icon>
      <div class="text-h6 mt-2">{{ t("gamification.leaderboard.noClassTitle") }}</div>
    </v-card>

    <template v-else>
      <v-select
        v-model="selectedClassId"
        :items="classes"
        item-title="name"
        item-value="id"
        :label="t('gamification.leaderboard.classSelect')"
        variant="outlined"
        density="comfortable"
        hide-details
        class="mb-4"
        style="max-width: 340px"
        @update:model-value="loadBoard"
      />

      <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
        {{ error }}
      </v-alert>

      <v-card v-if="loadingBoard" variant="outlined" rounded="lg" class="pa-6 text-center">
        <v-progress-circular indeterminate color="primary" />
      </v-card>

      <v-card
        v-else-if="items.length === 0"
        variant="outlined"
        rounded="lg"
        class="pa-8 text-center"
      >
        <v-icon size="48" color="amber-darken-1">mdi-trophy-broken</v-icon>
        <div class="text-h6 mt-2">{{ t("gamification.leaderboard.emptyTitle") }}</div>
        <div class="text-body-2 text-medium-emphasis mt-1">
          {{ t("gamification.leaderboard.emptyDesc") }}
        </div>
      </v-card>

      <v-card v-else variant="outlined" rounded="lg">
        <v-table density="comfortable">
          <thead>
            <tr>
              <th class="text-left" style="width: 72px">{{ t("gamification.leaderboard.rank") }}</th>
              <th class="text-left">{{ t("gamification.leaderboard.student") }}</th>
              <th class="text-center" style="width: 90px">{{ t("gamification.leaderboard.level") }}</th>
              <th class="text-right" style="width: 110px">{{ t("gamification.leaderboard.xpWeek") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, idx) in items"
              :key="`${row.rank}-${idx}`"
              :class="row.isMe ? 'bg-primary-lighten-5 font-weight-bold' : ''"
            >
              <td>
                <v-chip
                  v-if="row.rank <= 3"
                  size="small"
                  :color="rankColor(row.rank)"
                  variant="flat"
                  class="font-weight-bold"
                >
                  #{{ row.rank }}
                </v-chip>
                <span v-else>#{{ row.rank }}</span>
              </td>
              <td>
                <span>{{ row.displayName }}</span>
                <v-chip v-if="row.isMe" size="x-small" color="primary" variant="tonal" class="ml-2">
                  {{ t("gamification.leaderboard.you") }}
                </v-chip>
              </td>
              <td class="text-center">Lv {{ row.level }}</td>
              <td class="text-right font-weight-bold">{{ row.xpWeek }}</td>
            </tr>
          </tbody>
        </v-table>

        <template v-if="me && !meInTop10">
          <v-divider />
          <div class="pa-3 bg-primary-lighten-5 d-flex align-center justify-space-between">
            <div class="text-body-2 font-weight-bold">
              {{ t("gamification.leaderboard.yourPosition") }}: #{{ me.rank }} · {{ me.displayName }}
            </div>
            <div class="text-body-2 font-weight-bold">
              Lv {{ me.level }} · {{ me.xpWeek }} XP
            </div>
          </div>
        </template>
      </v-card>
    </template>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { api } from "../../services/api";
import { getLeaderboard, updateSettings } from "../../services/gamification";
import { useGamificationStore } from "../../stores/gamification";

const { t } = useI18n();
const gamificationStore = useGamificationStore();

const classes = ref([]);
const selectedClassId = ref(null);
const loadingClasses = ref(true);
const loadingBoard = ref(false);
const savingAnon = ref(false);
const error = ref("");
const items = ref([]);
const me = ref(null);
const anonymous = ref(false);

const meInTop10 = computed(() => items.value.some((r) => r.isMe));

function rankColor(rank) {
  if (rank === 1) return "amber-darken-1";
  if (rank === 2) return "blue-grey-lighten-1";
  if (rank === 3) return "deep-orange-lighten-1";
  return "grey";
}

async function loadClasses() {
  loadingClasses.value = true;
  try {
    const res = await api("/classes/mine");
    classes.value = Array.isArray(res) ? res : res?.items || [];
    if (classes.value.length > 0) {
      selectedClassId.value = classes.value[0].id;
      await loadBoard();
    }
  } catch (err) {
    error.value = err?.message || t("gamification.leaderboard.loadError");
  } finally {
    loadingClasses.value = false;
  }
}

async function loadBoard() {
  if (!selectedClassId.value) return;
  loadingBoard.value = true;
  error.value = "";
  try {
    const res = await getLeaderboard(selectedClassId.value);
    items.value = res?.items || [];
    me.value = res?.me || null;
  } catch (err) {
    error.value = err?.message || t("gamification.leaderboard.loadError");
  } finally {
    loadingBoard.value = false;
  }
}

async function onToggleAnonymous(val) {
  savingAnon.value = true;
  try {
    await updateSettings(Boolean(val));
    await gamificationStore.loadMe();
    await loadBoard();
  } catch (err) {
    error.value = err?.message || t("gamification.leaderboard.loadError");
  } finally {
    savingAnon.value = false;
  }
}

onMounted(async () => {
  await gamificationStore.loadMe();
  anonymous.value = Boolean(gamificationStore.me?.leaderboardAnonymous);
  await loadClasses();
});
</script>
