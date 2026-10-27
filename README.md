# Steam Cafe frontend

The Steam Cafe project contains one Next.js App Router frontend at the
repository root. The original HTML and vanilla JavaScript implementation has
been removed after verification. The original CSS files remain in `css/`
because they are imported directly by `app/globals.css`, preserving the
existing visual identity without maintaining a second frontend.

## Requirements

- Node.js 18.17+ (Node.js 20 LTS recommended)
- npm
- Docker (optional, for local replica-set MongoDB) or MongoDB Replica Set
- The existing auth service running at `http://localhost:4000` for login and registration

## Run locally

1. **Start MongoDB Replica Set** (needed for atomic order creation & inventory decrement):
   ```bash
   docker compose up -d
   ```

2. **Install dependencies & seed database**:
   ```bash
   npm install
   npm run seed
   ```

3. **Start the authentication service**:
   ```bash
   cd services/auth-service
   npm install
   npm start
   ```

4. **Start the Next.js frontend** (in project root):
   ```bash
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
MONGODB_URI=mongodb://localhost:27017/steam_cafe
JWT_SECRET=your_jwt_secret
```

The browser storage contracts are preserved:

- `steamCafeCart` stores the current cart.
- `steamCafeOrders` stores locally cached orders.
- `steamCafeRememberedEmail` stores only the optional remembered email.
- The auth token and user session are kept in `sessionStorage`, not `localStorage`.

Route Handlers use `authenticateRequest` and `requireRole` from `lib/server/auth.ts`.
They require the server-only `JWT_SECRET` environment variable that matches the
authentication service.

The versioned REST API uses `MONGODB_URI` and `MONGODB_DB_NAME`.
Order creation (`POST /api/v1/orders`) uses a MongoDB transaction so inventory decrement
and order creation succeed or fail together. Order history (`GET /api/v1/orders`) fetches
all orders placed by the authenticated user.
