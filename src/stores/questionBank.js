import { defineStore } from "pinia";

export const useQuestionBankStore = defineStore("questionBank", {
  state: () => ({ draftsByUser: {} }),

  getters: {
    draftsFor: (state) => (userId, lessonId) =>
      state.draftsByUser[String(userId)]?.[String(lessonId)] || [],
    hasPendingDrafts: (state) =>
      Object.values(state.draftsByUser).some((lessons) =>
        Object.values(lessons).some((drafts) => drafts.length > 0),
      ),
  },

  actions: {
    setDrafts(userId, lessonId, drafts) {
      if (userId == null || lessonId == null) return;
      const userKey = String(userId);
      const lessonKey = String(lessonId);
      if (!this.draftsByUser[userKey]) this.draftsByUser[userKey] = {};
      this.draftsByUser[userKey][lessonKey] = [...drafts];
      if (!this.draftsByUser[userKey][lessonKey].length) {
        delete this.draftsByUser[userKey][lessonKey];
      }
      if (!Object.keys(this.draftsByUser[userKey]).length)
        delete this.draftsByUser[userKey];
    },

    updateDraft(userId, lessonId, index, draft) {
      const drafts = [...this.draftsFor(userId, lessonId)];
      if (index < 0 || index >= drafts.length) return;
      drafts[index] = draft;
      this.setDrafts(userId, lessonId, drafts);
    },

    removeDraft(userId, lessonId, index) {
      const drafts = [...this.draftsFor(userId, lessonId)];
      drafts.splice(index, 1);
      this.setDrafts(userId, lessonId, drafts);
    },

    clearLesson(userId, lessonId) {
      this.setDrafts(userId, lessonId, []);
    },

    clearAllDrafts() {
      this.draftsByUser = {};
    },
  },
});
