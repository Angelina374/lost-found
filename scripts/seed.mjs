// npm run seed: записывает находки своего варианта в MongoDB.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { config } from 'dotenv';
import { MongoClient } from 'mongodb';

// Явно загружаем .env.local через dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env.local') });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI не задан. Проверьте файл .env.local в корне проекта.');
  process.exit(1);
}

console.log('URI загружен, тип:', uri.startsWith('mongodb+srv') ? 'SRV' : 'DIRECT');
console.log('Первые 60 символов:', uri.substring(0, 60));

const number = JSON.parse(readFileSync(new URL('../variant.json', import.meta.url), 'utf8')).variant;
const variant = JSON.parse(readFileSync(new URL('../src/data/seed.json', import.meta.url), 'utf8')).variants[number];
if (!variant) {
  console.error('Вариант не выбран: выполните npm run variant.');
  process.exit(1);
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
try {
  const items = client.db('lostfound').collection('items');
  await items.deleteMany({});
  const result = await items.insertMany(variant.items);
  console.log(`Готово: ${result.insertedCount} находок варианта ${number} (${variant.place}) в lostfound.items.`);
} catch (error) {
  console.error(`Ошибка: ${error.message}`);
  if (/auth/i.test(error.message)) console.error('Проверьте имя и пароль пользователя базы данных.');
  else console.error('Проверьте Network Access в Atlas и подключение к интернету.');
  process.exitCode = 1;
} finally {
  await client.close();
}