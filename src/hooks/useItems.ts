import { useEffect, useState } from 'react';
import { getItems } from '../api/client.ts';
import type { Item } from '../lib/types.ts';

type ItemsState =
  | { status: 'loading' }
  | { status: 'error'; message: string; todo?: string }
  | { status: 'ready'; items: Item[]; q?: string; filtered?: boolean };

export function useItems(q?: string, category?: string) {
  const [state, setState] = useState<ItemsState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    setState({ status: 'loading' });

    getItems({ q, category, signal })
      .then((result) => {
        if (signal.aborted) return;
        setState({
          status: 'ready',
          items: result.items,
          q,
          filtered: !!(q || category),
        });
      })
      .catch((err) => {
        if (signal.aborted) return;
        if (err.name === 'AbortError') return;
        setState({
          status: 'error',
          message: err.message || 'Неизвестная ошибка',
        });
      });

    return () => {
      controller.abort();
    };
  }, [q, category]);

  return state;
}