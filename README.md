# Steam Cafe frontend

The Steam Cafe project contains one Next.js App Router frontend at the
repository root. The original HTML and vanilla JavaScript implementation has
been removed after verification. The original CSS files remain in `css/`
because they are imported directly by `app/globals.css`, preserving the
existing visual identity without maintaining a second frontend.

## Requirements

- Node.js 18.17+ (Node.js 20 LTS recommended)
- npm
- The existing auth service running at `http://localhost:4000` for login and
  registration

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. Production verification and serving use:

```bash
npm run lint
npm run build
npm run start
```

## Environment

Authentication defaults to `http://localhost:4000`, matching the existing
frontend. Set `NEXT_PUBLIC_AUTH_API_URL` when the auth service is hosted
elsewhere:

```env
NEXT_PUBLIC_AUTH_API_URL=http://localhost:4000
```

The browser storage contracts are preserved:

- `steamCafeCart` stores the current cart.
- `steamCafeOrders` stores locally-created orders.
- `steamCafeRememberedEmail` stores only the optional remembered email.
- The auth token and user session are kept in `sessionStorage`, not
  `localStorage`.

Future Next.js Route Handlers should use `authenticateRequest` and `requireRole`
from `lib/server/auth.ts`. They require the server-only `JWT_SECRET` environment
variable that matches the authentication service; it must never use a
`NEXT_PUBLIC_` prefix or be exposed to browser code. Existing JWTs without a
role claim are treated as `customer`. Staff and admin access must be granted
only from server-controlled user data.

The versioned REST API uses the server-only `MONGODB_URI` and optional
`MONGODB_DB_NAME` environment variables. Order creation uses a MongoDB
transaction so inventory decrement and order creation succeed or fail
together. MongoDB transactions require a replica set or sharded cluster; a
standalone local MongoDB instance will need replica-set configuration before
`POST /api/v1/orders` can be used.

Card payment remains a display option only until a real payment provider is
configured. The existing checkout and order-history pages still use their
browser storage contracts and are not wired to the versioned API yet. The
server-side order contract is available at `/api/v1/orders` for the next
frontend integration step.
