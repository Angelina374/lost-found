import { itemStore } from '../../../lib/db.ts';
import { HttpError, errorResponse } from '../../../lib/http.ts';

export async function GET(request: Request, { id }: { id: string }) {
  try {
    const store = await itemStore();
    const item = await store.get(id);

    if (!item) {
      throw new HttpError(404, 'Находка не найдена');
    }

    return Response.json({ item, store: store.kind });
  } catch (err) {
    return errorResponse(err);
  }
}