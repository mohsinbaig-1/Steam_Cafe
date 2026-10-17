# Steam Cafe Authentication Service

This service uses Express, the official MongoDB Node.js driver, bcrypt, JWT, dotenv, and CORS.

## Setup

1. Start a local MongoDB server.
2. Copy `.env.example` to `.env`.
3. Replace `JWT_SECRET` with a long random value. Do not commit `.env`.
4. Install dependencies:

```powershell
cd services\auth-service
npm install
```

5. Start the service:

```powershell
npm start
```

The service listens on `http://localhost:4000` by default and uses the `steam_cafe` database and `users` collection.

## Endpoints

- `GET /health` checks service and MongoDB connectivity.
- `POST /api/auth/register` accepts `fullName`, `email`, `phone`, and `password`.
- `POST /api/auth/login` accepts `email` and `password`, returning a JWT and safe user data.

The frontend development origins are configured with `FRONTEND_ORIGINS`.

## Manual smoke tests

```powershell
Invoke-RestMethod http://localhost:4000/health

Invoke-RestMethod http://localhost:4000/api/auth/register `
  -Method Post -ContentType "application/json" `
  -Body '{"fullName":"Test User","email":"test@example.com","phone":"03000000000","password":"secret123"}'

# Repeat the registration request to verify HTTP 409.

Invoke-RestMethod http://localhost:4000/api/auth/login `
  -Method Post -ContentType "application/json" `
  -Body '{"email":"test@example.com","password":"secret123"}'

# Repeat login with a wrong password to verify HTTP 401.
```
