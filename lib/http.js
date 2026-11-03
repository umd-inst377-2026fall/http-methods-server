// Small helpers shared by every endpoint.

// Allow students to call the API from any page (a local HTML file, CodePen, etc.)
export function cors(req, res, allowed) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', allowed.join(', '));
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Allow', allowed.join(', '));
}

// Handles OPTIONS and unsupported methods. Returns true if it already responded.
export function handleMethod(req, res, allowed) {
  cors(req, res, allowed);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  if (!allowed.includes(req.method)) {
    res.status(405).json({
      error: 'Method Not Allowed',
      message: `${req.method} is not supported on ${req.url.split('?')[0]}. Try: ${allowed.join(', ')}`,
    });
    return true;
  }
  return false;
}

export const FIELDS = ['name', 'productName', 'productDescription', 'productPrice'];

// Validates the fields of a product. `partial` = PATCH (only some fields required).
// Returns { data } on success or { errors } on failure.
export function validateProduct(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: ['Request body must be JSON or form data with product fields.'] };
  }

  const errors = [];
  const data = {};

  for (const field of FIELDS) {
    const present = body[field] !== undefined && body[field] !== '';
    if (!present) {
      if (!partial) errors.push(`"${field}" is required.`);
      continue;
    }
    if (field === 'productPrice') {
      const price = Number(body[field]);
      if (!Number.isFinite(price) || price < 0 || price > 1000000) {
        errors.push('"productPrice" must be a number between 0 and 1,000,000.');
      } else {
        data.productPrice = Math.round(price * 100) / 100;
      }
    } else {
      const text = String(body[field]).trim();
      if (text.length > 100) errors.push(`"${field}" must be 100 characters or fewer.`);
      else data[field] = text;
    }
  }

  if (partial && Object.keys(data).length === 0 && errors.length === 0) {
    errors.push(`PATCH needs at least one of: ${FIELDS.join(', ')}.`);
  }

  return errors.length ? { errors } : { data };
}
