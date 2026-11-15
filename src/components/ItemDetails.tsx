import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import type { Item } from '../lib/types.ts';
import { categoryLabel } from '../lib/variant.ts';
import { TodoNote } from './TodoNote.tsx';
import { common } from './theme.ts';

type DetailsState =
  | { status: 'loading' }
  | { status: 'error'; message: string; todo?: string }
  | { status: 'not-found' }
  | { status: 'ready'; item: Item };

type Props = {
  state: DetailsState;
  onRetry: () => void;
  onBack: () => void;
};

export function ItemDetails({ state, onRetry, onBack }: Props) {
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
        <Text style={common.hint}>Загружаем находку...</Text>
      </View>
    );
  }

  if (state.status === 'not-found') {
    return (
      <View style={common.center}>
        <Text style={common.error}>Находка не найдена</Text>
        <Pressable style={common.button} onPress={onBack}>
          <Text>К списку</Text>
        </Pressable>
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View style={common.center}>
        {state.todo && <TodoNote code={state.todo} />}
        <Text style={common.error}>{state.message}</Text>
        <Pressable style={common.button} onPress={onRetry}>
          <Text>Повторить</Text>
        </Pressable>
      </View>
    );
  }

  const { item } = state;
  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold' }}>{item.title}</Text>
      <Text style={common.hint}>{categoryLabel(item.category)}</Text>
      {item.extra ? <Text>Комната: {item.extra}</Text> : null}
      <Text style={common.hint}>Найдено: {item.foundAt}</Text>
      <Text>{item.description}</Text>
      <Text>
        Статус:{' '}
        {item.status === 'stored' ? 'Хранится в бюро' : 'Выдано владельцу'}
      </Text>
      <Pressable style={common.button} onPress={onBack}>
        <Text>К списку</Text>
      </Pressable>
    </View>
  );
}