import { jwtVerify, SignJWT, type JWTPayload } from "jose";

export type UserRole = "customer" | "staff" | "admin";

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role: UserRole;
}

export class AuthenticationError extends Error {
  readonly status = 401;

  constructor(message = "Authentication is required.") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  readonly status = 403;

  constructor(message = "You are not authorized to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === "replace-this-with-a-long-random-secret") {
    throw new Error("JWT_SECRET must be configured for server-side authentication.");
  }
  return secret;
}

type AuthPayload = JWTPayload & { role?: unknown };

function toAuthenticatedUser(payload: AuthPayload) {
  if (typeof payload.sub !== "string" || payload.sub.length === 0) {
    throw new AuthenticationError("The authentication token is invalid.");
  }

  const role: UserRole =
    payload.role === "staff" || payload.role === "admin" ? payload.role : "customer";

  return {
    id: payload.sub,
    ...(typeof payload.email === "string" ? { email: payload.email } : {}),
    role
  } satisfies AuthenticatedUser;
}

function readBearerToken(request: Request) {
  const header = request.headers.get("authorization");
  if (!header) {
    throw new AuthenticationError();
  }

  const match = /^Bearer\s+([^\s]+)$/i.exec(header);
  if (!match) {
    throw new AuthenticationError("The authorization header is malformed.");
  }
  return match[1];
}

export async function authenticateRequest(request: Request) {
  const token = readBearerToken(request);
  const secret = getJwtSecret();
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"]
    });
    return toAuthenticatedUser(payload as AuthPayload);
  } catch (error) {
    if (error instanceof AuthenticationError) throw error;
    throw new AuthenticationError("The authentication token is invalid or expired.");
  }
}

export function requireRole(user: AuthenticatedUser, ...allowedRoles: UserRole[]) {
  if (!allowedRoles.includes(user.role)) {
    throw new AuthorizationError();
  }
  return user;
}

export async function signUserToken(user: { id: string; email: string; role?: string }) {
  const secret = getJwtSecret();
  const role = user.role === "staff" || user.role === "admin" ? user.role : "customer";
  return new SignJWT({ email: user.email, role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(new TextEncoder().encode(secret));
}
