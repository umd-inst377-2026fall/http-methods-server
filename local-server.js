// Run the API on your own computer without Vercel:  npm run local
// Then open http://localhost:3000
// This file imitates the helpers Vercel adds (req.query, req.body,
// res.status, res.json, res.send). It is NOT used when deployed to Vercel.

import http from 'node:http';
import { readFile } from 'node:fs/promises';

import products from './api/products/index.js';
import productById from './api/products/[id].js';
import echo from './api/echo.js';
import reset from './api/reset.js';

const PORT = process.env.PORT || 3000;

function readBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      if (!raw) return resolve(undefined);
      const type = req.headers['content-type'] || '';
      try {
        if (type.includes('application/json')) return resolve(JSON.parse(raw));
        if (type.includes('application/x-www-form-urlencoded')) {
          return resolve(Object.fromEntries(new URLSearchParams(raw)));
        }
      } catch {
        return resolve(raw);
      }
      resolve(raw);
    });
  });
}

function addHelpers(res) {
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data));
    return res;
  };
  res.send = (data) => { res.end(String(data)); return res; };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  req.query = Object.fromEntries(url.searchParams);
  req.body = await readBody(req);
  addHelpers(res);

  const path = url.pathname.replace(/\/$/, '') || '/';
  const match = path.match(/^\/api\/products\/([^/]+)$/);

  if (path === '/api/products') return products(req, res);
  if (match) { req.query.id = decodeURIComponent(match[1]); return productById(req, res); }
  if (path === '/api/echo') return echo(req, res);
  if (path === '/api/reset') return reset(req, res);

  if (path === '/' || path === '/index.html') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(await readFile(new URL('./index.html', import.meta.url)));
  }

  res.status(404).json({ error: 'Not Found', message: `Nothing at ${path}` });
});

server.listen(PORT, () => console.log(`INST377 HTTP Lab running at http://localhost:${PORT}`));
