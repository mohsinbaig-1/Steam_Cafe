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

Card payment remains a display option only until a real payment provider is
configured. Orders are not sent to MongoDB or an order API by this frontend;
they remain local until a backend order contract is connected.
