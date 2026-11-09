import { defineStore } from "pinia";

const storageKey = (ownerId) => `notifications:${ownerId}`;

export const useNotificationsStore = defineStore("notifications", {
  state: () => ({
    ownerId: null,
    items: [],
  }),

  getters: {
    count: (state) => state.items.length,
  },

  actions: {
    setOwner(ownerId) {
      const nextOwner = ownerId ? String(ownerId) : null;
      if (this.ownerId === nextOwner) return;
      this.ownerId = nextOwner;
      if (!nextOwner) {
        this.items = [];
        return;
      }
      try {
        const saved = JSON.parse(
          localStorage.getItem(storageKey(nextOwner)) || "[]",
        );
        this.items = Array.isArray(saved) ? saved : [];
      } catch {
        this.items = [];
      }
    },

    add(notification) {
      if (!this.ownerId) return;
      const item = {
        ...notification,
        id:
          globalThis.crypto?.randomUUID?.() ||
          `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        createdAt: new Date().toISOString(),
      };
      this.items.unshift(item);
      this.persist();
    },

    dismiss(id) {
      this.items = this.items.filter((item) => item.id !== id);
      this.persist();
    },

    persist() {
      if (!this.ownerId) return;
      localStorage.setItem(
        storageKey(this.ownerId),
        JSON.stringify(this.items),
      );
    },
  },
});
