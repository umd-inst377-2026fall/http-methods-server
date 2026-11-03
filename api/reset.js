// /api/reset?key=YOUR_RESET_KEY  (POST)
// Instructor-only: wipes student data and restores the 3 sample products.
// Set RESET_KEY in your Vercel project's Environment Variables.

import { seed } from '../lib/store.js';

export default async function handler(req, res) {
  res.setHeader('Allow', 'POST');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed', message: 'Use POST.' });
  }

  const key = process.env.RESET_KEY;
  if (!key) return res.status(503).json({ error: 'Reset is disabled. Set RESET_KEY in Vercel.' });
  if (req.query.key !== key) return res.status(403).json({ error: 'Forbidden' });

  await seed();
  return res.status(200).json({ message: 'Data reset to the 3 sample products.' });
}
