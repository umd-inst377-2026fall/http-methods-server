# INST377 HTTP Lab

A tiny products API students can call with GET, POST, PUT, PATCH, DELETE, HEAD and OPTIONS. Unlike JSONPlaceholder, changes are saved, so students can create a product and then GET it back.

## Endpoints

| Method | Path | What it does | Success |
| --- | --- | --- | --- |
| GET | `/api/products` | List products (`?name=` and `?productName=` filters) | 200 |
| POST | `/api/products` | Create a product | 201 |
| GET | `/api/products/:id` | Get one product | 200 |
| PUT | `/api/products/:id` | Replace a product (all fields required) | 200 |
| PATCH | `/api/products/:id` | Update only the fields sent | 200 |
| DELETE | `/api/products/:id` | Delete a product | 204 |
| any | `/api/echo` | Echo back method, query, headers and body | 200 |
| POST | `/api/reset?key=RESET_KEY` | Instructor only: restore the 3 sample products | 200 |

Product fields match the Week 8 form: `name`, `productName`, `productDescription`, `productPrice`.
Both JSON and regular HTML form posts work. Errors: 400 (bad or missing fields), 404 (no such id), 405 (wrong method).

## Deploy to Vercel (about 10 minutes)

1. Push this folder to a GitHub repo.
2. In Vercel, click **Add New → Project**, import the repo, keep the defaults (Framework: Other), and deploy.
3. **Add storage so data persists.** Vercel functions forget everything between requests, so the app uses Upstash Redis (free tier).
   In the project, open **Storage → Create Database → Upstash for Redis**, pick the free plan, and connect it to the project. Vercel adds the `KV_REST_API_URL` and `KV_REST_API_TOKEN` environment variables automatically.
4. **Add a reset key.** Under **Settings → Environment Variables**, add `RESET_KEY` with any secret value.
5. Redeploy (Deployments → ⋯ → Redeploy) so the new variables take effect.

Without step 3 the app still runs, but data lives in memory and will randomly reset or differ between requests.

## Reset the data before class

```bash
curl -X POST "https://YOUR-APP.vercel.app/api/reset?key=YOUR_RESET_KEY"
```

## Run it on your own computer

```bash
npm install
npm run local
```

Then open http://localhost:3000. Local mode keeps data in memory until you stop the server.

## Limits

- At most 200 products (returns 507 when full; reset to clear).
- Text fields up to 100 characters; price from 0 to 1,000,000.
- Anyone with the URL can add or delete products. That's intended for class, so don't store anything real.
