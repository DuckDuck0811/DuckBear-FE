import { ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { createNotebookPractice } from "../services/notebook";

export function useNotebookPractice() {
  const router = useRouter();
  const { t } = useI18n();
  const starting = ref(false);
  const error = ref("");

  async function startPractice(payload) {
    if (starting.value) return;
    starting.value = true;
    error.value = "";
    try {
      const res = await createNotebookPractice(payload);
      router.push(`/student/notebook/practice/${res.sessionId}`);
    } catch (err) {
      const status = err?.status;
      if (status === 403) {
        error.value = err?.message || t("notebook.practice.errorAttempt");
      } else if (status === 429) {
        error.value = t("notebook.practice.errorRateLimit");
      } else {
        error.value = err?.message || t("notebook.practice.errorNetwork");
      }
    } finally {
      starting.value = false;
    }
  }

  return { starting, error, startPractice };
}
