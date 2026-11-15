import { MongoClient, type Filter } from 'mongodb';
import { requireVariant, TodoError } from './http.ts';
import { memoryStore } from './memoryStore.ts';
import type { Item, ItemStore } from './types.ts';

const uri = process.env.MONGODB_URI;

// Сервер разработки заново выполняет этот модуль на каждый запрос.
// Клиент MongoDB хранится в globalThis, чтобы не открывать новые подключения.
const shared = globalThis as typeof globalThis & { lostFoundClient?: MongoClient };

// Символы регулярного выражения из запроса ищутся буквально.
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function itemStore(): Promise<ItemStore> {
  const variant = requireVariant();
  if (!uri) return memoryStore(variant.items);

  const client = (shared.lostFoundClient ??= new MongoClient(uri));
  const items = client.db('lostfound').collection<Item>('items');

  return {
    kind: 'mongodb',

    async list({ q, category }) {
      const filter: Filter<Item> = {};

      if (category) {
        filter.category = category;
      }

      if (q) {
        const pattern = { $regex: escapeRegex(q), $options: 'i' };
        filter.$or = [{ title: pattern }, { description: pattern }];
      }

      return items.find(filter).sort({ foundAt: -1, _id: 1 }).toArray();
    },

    async get(id) {
      return items.findOne({ _id: id });
    },
  };
}