// /api/products/:id
//   GET     -> one product (404 if it doesn't exist)
//   PUT     -> replace the whole product (all fields required)
//   PATCH   -> change only the fields you send
//   DELETE  -> remove it (204 No Content)

import { store, ensureSeeded } from '../../lib/store.js';
import { handleMethod, validateProduct } from '../../lib/http.js';

const ALLOWED = ['GET', 'HEAD', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

export default async function handler(req, res) {
  if (handleMethod(req, res, ALLOWED)) return;

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Bad Request', message: 'The id in the URL must be a positive whole number.' });
  }

  try {
    await ensureSeeded();
    const existing = await store.get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Not Found', message: `No product with id ${id}.` });
    }

    switch (req.method) {
      case 'GET':
      case 'HEAD':
        return res.status(200).json(existing);

      case 'PUT': {
        const { data, errors } = validateProduct(req.body);
        if (errors) return res.status(400).json({ error: 'Bad Request', details: errors });
        const updated = { id, ...data, createdAt: existing.createdAt, updatedAt: new Date().toISOString() };
        await store.save(updated);
        return res.status(200).json(updated);
      }

      case 'PATCH': {
        const { data, errors } = validateProduct(req.body, { partial: true });
        if (errors) return res.status(400).json({ error: 'Bad Request', details: errors });
        const updated = { ...existing, ...data, id, updatedAt: new Date().toISOString() };
        await store.save(updated);
        return res.status(200).json(updated);
      }

      case 'DELETE':
        await store.remove(id);
        return res.status(204).end();
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
