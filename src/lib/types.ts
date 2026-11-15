export type Category = { id: string; label: string };

export type Item = {
  _id: string;
  title: string;
  category: string;
  description: string;
  extra: string;
  foundAt: string;
  status: 'stored' | 'returned';
};

export type ItemQuery = { q?: string; category?: string; signal?: AbortSignal; };

// Общий интерфейс хранилища: обработчики API не знают, где лежат данные.
export interface ItemStore {
  kind: 'mongodb' | 'memory';
  list(query: ItemQuery): Promise<Item[]>;
  get(id: string): Promise<Item | null>;
}
