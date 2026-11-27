import { defineStore } from "pinia";
import { ref } from "vue";
import { getCoach, getOverview, refreshCoach } from "../services/assistant";

export const useAssistantStore = defineStore("assistant", () => {
  const overview = ref(null);
  const overviewLoading = ref(false);
  const overviewError = ref("");

  const coach = ref(null);
  const coachLoading = ref(false);
  const coachError = ref("");
  const refreshing = ref(false);
  const refreshError = ref("");

  async function loadOverview() {
    overviewLoading.value = true;
    overviewError.value = "";
    try {
      overview.value = await getOverview();
      return overview.value;
    } catch (err) {
      overviewError.value = err?.message || "Failed to load overview";
      return null;
    } finally {
      overviewLoading.value = false;
    }
  }

  async function loadCoach() {
    coachLoading.value = true;
    coachError.value = "";
    try {
      coach.value = await getCoach();
      return coach.value;
    } catch (err) {
      coachError.value = err?.message || "Failed to load coach";
      return null;
    } finally {
      coachLoading.value = false;
    }
  }

  async function triggerRefresh() {
    refreshing.value = true;
    refreshError.value = "";
    try {
      coach.value = await refreshCoach();
      return coach.value;
    } catch (err) {
      refreshError.value = err?.message || "Failed to refresh";
      return null;
    } finally {
      refreshing.value = false;
    }
  }

  return {
    overview,
    overviewLoading,
    overviewError,
    coach,
    coachLoading,
    coachError,
    refreshing,
    refreshError,
    loadOverview,
    loadCoach,
    triggerRefresh,
  };
});
