import { itemStore } from '../../lib/db.ts';
import { HttpError, errorResponse } from '../../lib/http.ts';
import { variant } from '../../lib/variant.ts';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const rawQ = url.searchParams.get('q');
    const q = rawQ?.trim() || undefined;
    const category = url.searchParams.get('category') || undefined;

    if (q && q.length > 50) {
      throw new HttpError(400, 'Запрос слишком длинный');
    }

    if (!variant) {
      throw new HttpError(500, 'Вариант не выбран');
    }

    if (category && !variant.categories.some(c => c.id === category)) {
      throw new HttpError(400, `Неизвестная категория: ${category}`);
    }

    const store = await itemStore();
    const items = await store.list({ q, category });

    return Response.json({ items, store: store.kind });
  } catch (err) {
    return errorResponse(err);
  }
}