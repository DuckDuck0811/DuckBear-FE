import { defineStore } from "pinia";
import { ref } from "vue";
import { getSummary } from "../services/notebook";

export const useNotebookStore = defineStore("notebook", () => {
  const summary = ref({ dueToday: 0, active: 0, mastered: 0 });
  const summaryLoading = ref(false);
  const summaryLoaded = ref(false);

  async function loadSummary() {
    summaryLoading.value = true;
    try {
      const data = await getSummary();
      summary.value = {
        dueToday: Number(data?.dueToday ?? 0),
        active: Number(data?.active ?? 0),
        mastered: Number(data?.mastered ?? 0),
      };
      summaryLoaded.value = true;
    } catch {
      // Hide badge silently if summary fails; do not block UI
    } finally {
      summaryLoading.value = false;
    }
  }

  return {
    summary,
    summaryLoading,
    summaryLoaded,
    loadSummary,
  };
});
