import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { CategoryFilter } from '../components/CategoryFilter.tsx';
import { ItemsView } from '../components/ItemsView.tsx';
import { TodoNote } from '../components/TodoNote.tsx';
import { colors } from '../components/theme.ts';
import { useItems } from '../hooks/useItems.ts';
import { variant } from '../lib/variant.ts';

export default function ListScreen() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  
  // Исправлено: передаем примитивы, а не объект
  const trimmedQ = q.trim();
  const state = useItems(trimmedQ || undefined, category || undefined);

  return (
    <View style={styles.screen}>
      <TextInput
        style={styles.search}
        value={q}
        onChangeText={setQ}
        placeholder="Поиск по названию и описанию"
        accessibilityLabel="Поиск"
        autoCorrect={false}
      />
      <CategoryFilter
        categories={variant?.categories ?? []}
        value={category}
        onChange={setCategory}
      />
      {state.status === 'error' && state.todo && (
        <TodoNote code={state.todo} />
      )}
    <ItemsView
  state={state}
  onRetry={() => window.location.reload()}
  onOpen={(id) => router.push({ pathname: '/items/[id]', params: { id } })}
/>
      <Link href="/about" style={styles.link}>
        О проекте и сервере
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12, gap: 10 },
  search: {
    marginHorizontal: 12,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 44,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  link: {
    color: colors.accent,
    fontSize: 16,
    textAlign: 'center',
    padding: 12,
  },
});