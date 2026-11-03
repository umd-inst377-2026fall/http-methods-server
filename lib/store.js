// Storage for products.
// On Vercel, serverless functions don't keep memory between requests, so we
// use Upstash Redis when its environment variables are present. Without them
// (e.g. running locally) we fall back to an in-memory store.

import { Redis } from '@upstash/redis';

const HASH = 'inst377:products';
const COUNTER = 'inst377:nextId';
const SEEDED = 'inst377:seeded';
export const MAX_PRODUCTS = 200;

const SEED = [
  { name: 'Prof. Suh', productName: 'Testudo Plush', productDescription: 'A soft terrapin', productPrice: 19.99 },
  { name: 'Prof. Suh', productName: 'UMD Mug', productDescription: 'Holds 12 oz of coffee', productPrice: 12.5 },
  { name: 'Prof. Suh', productName: 'Laptop Sticker', productDescription: 'Fear the Turtle', productPrice: 3 },
];

const hasRedis = Boolean(
  (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) &&
  (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)
);

export const storageMode = hasRedis ? 'redis' : 'memory';

// ---------- Redis implementation ----------
function redisStore() {
  const redis = Redis.fromEnv({ automaticDeserialization: false });
  const parse = (v) => (typeof v === 'string' ? JSON.parse(v) : v);

  return {
    async all() {
      const map = (await redis.hgetall(HASH)) || {};
      return Object.values(map).map(parse).sort((a, b) => a.id - b.id);
    },
    async get(id) {
      const v = await redis.hget(HASH, String(id));
      return v ? parse(v) : null;
    },
    async count() {
      return redis.hlen(HASH);
    },
    async nextId() {
      return redis.incr(COUNTER);
    },
    async save(product) {
      await redis.hset(HASH, { [String(product.id)]: JSON.stringify(product) });
      return product;
    },
    async remove(id) {
      return (await redis.hdel(HASH, String(id))) > 0;
    },
    async clear() {
      await redis.del(HASH, COUNTER);
    },
    async isSeeded() {
      return Boolean(await redis.get(SEEDED));
    },
    async markSeeded() {
      await redis.set(SEEDED, '1');
    },
  };
}

// ---------- In-memory implementation ----------
function memoryStore() {
  const g = globalThis;
  g.__inst377 ??= { products: new Map(), nextId: 0, seeded: false };
  const db = g.__inst377;

  return {
    async all() { return [...db.products.values()].sort((a, b) => a.id - b.id); },
    async get(id) { return db.products.get(Number(id)) || null; },
    async count() { return db.products.size; },
    async nextId() { return ++db.nextId; },
    async save(product) { db.products.set(product.id, product); return product; },
    async remove(id) { return db.products.delete(Number(id)); },
    async clear() { db.products.clear(); db.nextId = 0; },
    async isSeeded() { return db.seeded; },
    async markSeeded() { db.seeded = true; },
  };
}

export const store = hasRedis ? redisStore() : memoryStore();

// Put the sample products back (used on first run and by /api/reset).
export async function seed() {
  await store.clear();
  const now = new Date().toISOString();
  for (const p of SEED) {
    const id = await store.nextId();
    await store.save({ id, ...p, createdAt: now, updatedAt: now });
  }
  await store.markSeeded();
}

// Seed the sample products once, the first time the API is used.
// After that, an empty list stays empty (students may delete everything).
export async function ensureSeeded() {
  if (await store.isSeeded()) return;
  await seed();
}
