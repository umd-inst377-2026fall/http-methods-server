// /api/products
//   GET   -> list all products (optional filters: ?name=Tim&productName=mug)
//   POST  -> create a product (201 Created)

import { store, ensureSeeded, MAX_PRODUCTS } from '../../lib/store.js';
import { handleMethod, validateProduct } from '../../lib/http.js';

const ALLOWED = ['GET', 'HEAD', 'POST', 'OPTIONS'];

export default async function handler(req, res) {
  if (handleMethod(req, res, ALLOWED)) return;

  try {
    await ensureSeeded();

    if (req.method === 'GET' || req.method === 'HEAD') {
      let products = await store.all();
      // Simple case-insensitive "contains" filters from the query string
      for (const key of ['name', 'productName']) {
        const q = req.query[key];
        if (q) products = products.filter((p) => p[key].toLowerCase().includes(String(q).toLowerCase()));
      }
      return res.status(200).json(products);
    }

    // POST
    const { data, errors } = validateProduct(req.body);
    if (errors) return res.status(400).json({ error: 'Bad Request', details: errors });

    if ((await store.count()) >= MAX_PRODUCTS) {
      return res.status(507).json({ error: 'Storage full', message: 'Ask your instructor to reset the data.' });
    }

    const now = new Date().toISOString();
    const product = { id: await store.nextId(), ...data, createdAt: now, updatedAt: now };
    await store.save(product);

    res.setHeader('Location', `/api/products/${product.id}`);
    return res.status(201).json(product);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
