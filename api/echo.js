// /api/echo  -> accepts ANY method and sends back what it received.
// Great for seeing where GET puts data (query string) vs POST (body).

const ALLOWED = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

// Only show headers students care about (hide Vercel's internal ones)
const SHOW_HEADERS = ['content-type', 'content-length', 'user-agent', 'accept', 'origin', 'referer'];

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', ALLOWED.join(', '));
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Allow', ALLOWED.join(', '));

  if (req.method === 'OPTIONS') return res.status(204).end();

  const headers = {};
  for (const h of SHOW_HEADERS) if (req.headers[h]) headers[h] = req.headers[h];

  return res.status(200).json({
    method: req.method,
    path: req.url.split('?')[0],
    query: req.query,
    headers,
    body: req.body ?? null,
    note:
      req.method === 'GET'
        ? 'GET sends data in the URL (see "query"). The body is empty.'
        : 'Data sent in the request body shows up under "body".',
  });
}
