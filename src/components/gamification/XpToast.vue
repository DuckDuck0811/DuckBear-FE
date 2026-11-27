<template>
  <v-snackbar
    v-model="visible"
    :timeout="3000"
    location="bottom end"
    :color="toastColor"
    rounded="pill"
    elevation="4"
  >
    <span class="font-weight-bold">{{ toastText }}</span>
  </v-snackbar>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useGamificationStore } from "../../stores/gamification";

const store = useGamificationStore();
const { t } = useI18n();

const visible = ref(false);
const current = ref(null);

watch(
  () => store.toastQueue.length,
  (len) => {
    if (len > 0 && !visible.value) {
      showNext();
    }
  },
);

watch(visible, (val) => {
  if (!val && store.toastQueue.length > 0) {
    setTimeout(() => {
      showNext();
    }, 250);
  }
});

function showNext() {
  if (store.toastQueue.length === 0) return;
  current.value = store.toastQueue[0];
  store.shiftToast();
  visible.value = true;
}

const toastColor = computed(() => {
  if (!current.value) return "primary";
  if (current.value.type === "levelUp") return "amber-darken-2";
  if (current.value.type === "badge") return "deep-purple";
  return "success";
});

const toastText = computed(() => {
  if (!current.value) return "";
  if (current.value.type === "xp") {
    return t("gamification.toast.xpEarned", { xp: current.value.xp });
  }
  if (current.value.type === "levelUp") {
    return t("gamification.toast.levelUp", { level: current.value.level });
  }
  if (current.value.type === "badge") {
    return t("gamification.toast.badgeEarned", { name: current.value.name });
  }
  return "";
});
</script>
