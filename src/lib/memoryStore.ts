import type { Item, ItemStore } from './types.ts';

// Запасное хранилище без MongoDB: данные варианта в памяти сервера.
export function memoryStore(items: Item[]): ItemStore {
  return {
    kind: 'memory',
    async list({ q, category }) {
      const needle = q?.toLocaleLowerCase('ru');
      return items
        .filter((item) => !category || item.category === category)
        .filter((item) => !needle
          || item.title.toLocaleLowerCase('ru').includes(needle)
          || item.description.toLocaleLowerCase('ru').includes(needle))
        .sort((a, b) => b.foundAt.localeCompare(a.foundAt) || a._id.localeCompare(b._id));
    },
    async get(id) {
      return items.find((item) => item._id === id) ?? null;
    },
  };
}
