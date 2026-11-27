<template>
  <v-dialog v-model="model" max-width="640" scrollable>
    <v-card rounded="lg">
      <v-card-title class="d-flex align-center justify-space-between pa-4">
        <div class="d-flex align-center ga-2">
          <v-icon color="amber-darken-2">mdi-medal-outline</v-icon>
          <span class="text-h6 font-weight-bold">{{ t("gamification.badges.title") }}</span>
        </div>
        <v-btn icon="mdi-close" variant="text" size="small" @click="model = false" />
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-4">
        <v-row dense>
          <v-col
            v-for="badge in enrichedBadges"
            :key="badge.code"
            cols="12"
            sm="6"
          >
            <v-card
              variant="outlined"
              rounded="lg"
              class="pa-3 h-100"
              :class="badge.earned ? 'border-amber-lighten-2 bg-amber-lighten-5' : 'opacity-60'"
            >
              <div class="d-flex align-start ga-3">
                <v-avatar
                  :color="badge.earned ? 'amber-darken-1' : 'grey-lighten-2'"
                  size="44"
                  rounded="lg"
                >
                  <v-icon :color="badge.earned ? 'white' : 'grey-darken-1'">
                    {{ badge.icon || "mdi-medal-outline" }}
                  </v-icon>
                </v-avatar>
                <div class="flex-grow-1 min-w-0">
                  <div class="d-flex align-center justify-space-between ga-1">
                    <span class="text-subtitle-2 font-weight-bold text-truncate">
                      {{ isEn ? badge.nameEn : badge.nameVi }}
                    </span>
                    <v-chip
                      size="x-small"
                      :color="badge.earned ? 'success' : 'grey'"
                      variant="tonal"
                    >
                      {{ badge.earned ? t("gamification.badges.earned") : t("gamification.badges.notEarned") }}
                    </v-chip>
                  </div>
                  <div class="text-caption text-medium-emphasis mt-1">
                    {{ isEn ? badge.descEn : badge.descVi }}
                  </div>
                  <div v-if="badge.earned && badge.awardedAt" class="text-caption text-success mt-1">
                    {{ t("gamification.badges.earnedAt", { date: formatDate(badge.awardedAt) }) }}
                  </div>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  allBadges: { type: Array, default: () => [] },
  earnedBadges: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:modelValue"]);
const { t, locale } = useI18n();

const model = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const isEn = computed(() => String(locale.value).startsWith("en"));

const earnedMap = computed(() => {
  const m = new Map();
  for (const b of props.earnedBadges || []) {
    m.set(b.code, b.awardedAt);
  }
  return m;
});

const enrichedBadges = computed(() =>
  (props.allBadges || []).map((b) => ({
    ...b,
    earned: earnedMap.value.has(b.code),
    awardedAt: earnedMap.value.get(b.code) || null,
  })),
);

function formatDate(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString(isEn.value ? "en-US" : "vi-VN");
  } catch {
    return "";
  }
}
</script>
