import { defineStore } from "pinia";
import { ref } from "vue";
import { getMe } from "../services/gamification";

export const useGamificationStore = defineStore("gamification", () => {
  const me = ref(null);
  const loading = ref(false);
  const error = ref("");
  const toastQueue = ref([]);

  async function loadMe() {
    loading.value = true;
    error.value = "";
    try {
      const prevLevel = me.value?.level ?? null;
      const data = await getMe();
      me.value = data;
      if (prevLevel !== null && data?.level > prevLevel) {
        pushToast({ type: "levelUp", level: data.level });
      }
      return data;
    } catch (err) {
      error.value = err?.message || "Failed to load gamification";
      return null;
    } finally {
      loading.value = false;
    }
  }

  function pushToast(item) {
    toastQueue.value.push({
      id: Date.now() + Math.random(),
      ...item,
    });
  }

  function shiftToast() {
    if (toastQueue.value.length > 0) {
      toastQueue.value.shift();
    }
  }

  function notifyXp(xpAwarded, newBadges = []) {
    if (xpAwarded > 0) {
      pushToast({ type: "xp", xp: xpAwarded });
    }
    if (Array.isArray(newBadges)) {
      for (const badge of newBadges) {
        const name = typeof badge === "string" ? badge : badge?.nameVi || badge?.code || "";
        if (name) {
          pushToast({ type: "badge", name });
        }
      }
    }
  }

  return {
    me,
    loading,
    error,
    toastQueue,
    loadMe,
    pushToast,
    shiftToast,
    notifyXp,
  };
});
