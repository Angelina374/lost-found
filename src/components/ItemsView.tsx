import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import type { Item } from '../lib/types.ts';
import { ItemCard } from './ItemCard.tsx';
import { TodoNote } from './TodoNote.tsx';
import { common } from './theme.ts';

type ItemsState =
  | { status: 'loading' }
  | { status: 'error'; message: string; todo?: string }
  | { status: 'ready'; items: Item[]; q?: string; filtered?: boolean };

type Props = {
  state: ItemsState;
  onRetry: () => void;
  onOpen: (id: string) => void;
};

export function ItemsView({ state, onRetry, onOpen }: Props) {
    if (!state) {
    return (
      <View style={common.center}>
        <ActivityIndicator />
      </View>
    );
  }
  if (state.status === 'loading') {
    return (
      <View style={common.center}>
        <ActivityIndicator />
        <Text style={common.hint}>Загружаем находки...</Text>
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View style={common.center}>
        {state.todo && <TodoNote code={state.todo} />}
        <Text style={common.error}>{state.message}</Text>
        <Text
          style={common.button}
          onPress={onRetry}
        >
          Повторить
        </Text>
      </View>
    );
  }

  if (state.items.length === 0) {
    const hint = state.filtered
      ? `Ничего не найдено${state.q ? ` по запросу «${state.q}»` : ''}. Измените запрос или категорию.`
      : 'Находок пока нет.';
    return (
      <View style={common.center}>
        <Text style={common.hint}>{hint}</Text>
      </View>
    );
  }

  return (
    <View>
      {state.q ? (
        <Text style={common.hint}>По запросу «{state.q}»: {state.items.length}</Text>
      ) : null}
      <FlatList
        data={state.items}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ItemCard item={item} onPress={() => onOpen(item._id)} />
        )}
      />
    </View>
  );
}