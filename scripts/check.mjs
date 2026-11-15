// npm run check: самопроверка практической работы № 3.
// Запускайте при работающем сервере (npx expo start). Другой адрес: npm run check -- http://localhost:8082
// Результат записывается в check-result.md. Скрипт помогает найти ошибку, но не заменяет защиту.
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const base = (process.argv[2] ?? 'http://localhost:8081').replace(/\/$/, '');
const rows = [];
let failed = 0;

function report(ok, name, detail, hint) {
  if (!ok) failed += 1;
  rows.push({ ok, name, detail });
  console.log(`${ok ? '[OK]' : '[!!]'} ${name}${detail ? `: ${detail}` : ''}`);
  if (!ok && hint) console.log(`     ${hint}`);
}

async function get(path) {
  try {
    const response = await fetch(base + path);
    return { status: response.status, body: await response.json().catch(() => null) };
  } catch {
    return { status: 0, body: null };
  }
}

const lower = (text) => text.toLocaleLowerCase('ru');
const number = JSON.parse(readFileSync(join(root, 'variant.json'), 'utf8')).variant;
const variant = JSON.parse(readFileSync(join(root, 'src/data/seed.json'), 'utf8')).variants[number];
report(Boolean(variant), 'Вариант', variant ? `${number}, ${variant.place}` : 'не выбран', 'Выполните npm run variant.');
if (!variant) process.exit(1);

const byDate = [...variant.items].sort((a, b) => b.foundAt.localeCompare(a.foundAt) || a._id.localeCompare(b._id)).map((item) => item._id);
const word = variant.items[0].title.split(' ')[0];
const query = word.toLocaleUpperCase('ru');
const expected = byDate.filter((id) => {
  const item = variant.items.find((candidate) => candidate._id === id);
  return lower(item.title).includes(lower(word)) || lower(item.description).includes(lower(word));
});
const category = variant.categories[0].id;
const first = variant.items[0]._id;

const health = await get('/api/health');
if (health.status === 0) {
  report(false, 'Сервер', `нет ответа от ${base}`, 'Запустите npx expo start в корне проекта и повторите проверку.');
} else {
  report(health.status === 200, 'GET /api/health', `${health.status} ${JSON.stringify(health.body)}`, 'Ответ 501 с P03-ATLAS: этап не выполнен; 503: нет связи с Atlas.');
  report(health.body?.store === 'mongodb', 'Хранилище MongoDB', health.body?.store ?? '-', 'Без MONGODB_URI в .env.local сервер работает с памятью; этап P03-ATLAS засчитывается только с MongoDB.');
  report(health.body?.items === variant.items.length, 'Данные варианта в базе', `${health.body?.items ?? '-'} из ${variant.items.length}`, 'Выполните npm run seed.');

  const all = await get('/api/items');
  const ids = all.body?.items?.map((item) => item._id) ?? [];
  report(all.status === 200 && JSON.stringify(ids) === JSON.stringify(byDate), 'GET /api/items', `${all.status}, ${ids.join(' ') || 'пусто'}`, `Ожидается ${byDate.join(' ')} (новые находки первыми).`);

  const found = await get(`/api/items?q=${encodeURIComponent(query)}`);
  const foundIds = found.body?.items?.map((item) => item._id) ?? [];
  report(found.status === 200 && JSON.stringify(foundIds) === JSON.stringify(expected), `Поиск q=${query}`, `${found.status}, ${foundIds.join(' ') || 'пусто'}`, `Ожидается ${expected.join(' ')}: поиск без учёта регистра по названию и описанию.`);

  const literal = await get('/api/items?q=.*');
  report(literal.status === 200 && literal.body?.items?.length === 0, 'Поиск q=.*', `${literal.status}, ${literal.body?.items?.length ?? '-'} шт.`, 'Символы . и * должны искаться буквально: используйте escapeRegex().');

  const filtered = await get(`/api/items?category=${category}`);
  const sameCategory = filtered.body?.items?.every((item) => item.category === category);
  report(filtered.status === 200 && filtered.body?.items?.length === 2 && sameCategory, `Категория ${category}`, `${filtered.status}, ${filtered.body?.items?.length ?? '-'} шт.`, 'Ожидаются две находки этой категории.');

  const unknown = await get('/api/items?category=unknown');
  report(unknown.status === 400 && typeof unknown.body?.error === 'string', 'Неизвестная категория', `${unknown.status} ${JSON.stringify(unknown.body)}`, 'Ожидается 400 и { "error": "..." }.');

  const long = await get(`/api/items?q=${'а'.repeat(51)}`);
  report(long.status === 400 && typeof long.body?.error === 'string', 'Запрос длиннее 50 символов', String(long.status), 'Ожидается 400 и { "error": "..." }.');

  const one = await get(`/api/items/${first}`);
  report(one.status === 200 && one.body?.item?._id === first, `GET /api/items/${first}`, String(one.status), 'Ожидается 200 и { "item": {...} }.');

  const missing = await get('/api/items/NOPE-0');
  report(missing.status === 404 && typeof missing.body?.error === 'string', 'GET /api/items/NOPE-0', `${missing.status} ${JSON.stringify(missing.body)}`, 'Ожидается 404 и { "error": "Находка не найдена" }.');
}

function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)]);
}
const sources = files(join(root, 'src')).filter((file) => /\.(ts|tsx)$/.test(file));
const todos = sources.filter((file) => /TODO P03-/.test(readFileSync(file, 'utf8'))).map((file) => file.slice(root.length));
report(todos.length === 0, 'Заглушки этапов', todos.length ? todos.join(', ') : 'нет', 'В этих файлах остались TODO P03-.');
// Комментарии с подсказками не считаются кодом.
const hook = readFileSync(join(root, 'src/hooks/useItems.ts'), 'utf8').replace(/\/\/.*$/gm, '');
const aborts = /new AbortController\(\)/.test(hook) && /\.abort\(\)/.test(hook);
report(aborts, 'Отмена устаревшего запроса', aborts ? 'AbortController и abort() в useItems' : 'нет', 'В useItems создайте AbortController и отменяйте запрос при очистке эффекта.');

try {
  const tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean);
  const envFiles = tracked.filter((file) => /(^|\/)\.env/.test(file));
  report(envFiles.length === 0, '.env в Git', envFiles.length ? envFiles.join(', ') : 'не отслеживается', 'Удалите файл из Git: git rm --cached .env.local');
  const secret = /mongodb(\+srv)?:\/\/[^\s:@/]+:[^\s@/]+@/;
  const leaks = tracked.filter((file) => !/\.(png|jpg|jpeg)$/i.test(file)).filter((file) => {
    try { return secret.test(readFileSync(join(root, file), 'utf8')); } catch { return false; }
  });
  report(leaks.length === 0, 'Пароль базы данных в репозитории', leaks.length ? leaks.join(', ') : 'не найден', 'Строка подключения с паролем должна быть только в .env.local. Смените пароль пользователя в Atlas.');
} catch {
  report(false, 'Git-репозиторий', 'не найден', 'Выполните git init и первый коммит.');
}

const lines = [
  '# Самопроверка практической работы № 3', '',
  `Дата: ${new Date().toLocaleString('ru-RU')}. Адрес: ${base}. Вариант: ${number}.`, '',
  '| Результат | Проверка | Ответ |', '|---|---|---|',
  ...rows.map((row) => `| ${row.ok ? 'OK' : '!!'} | ${row.name} | ${String(row.detail ?? '').replaceAll('|', '/').slice(0, 160)} |`), '',
  `Не пройдено: ${failed}.`, '',
];
writeFileSync(join(root, 'check-result.md'), lines.join('\n'));
console.log(`\nНе пройдено: ${failed}. Результат записан в check-result.md.`);
process.exitCode = failed ? 1 : 0;
