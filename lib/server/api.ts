import { AuthenticationError, AuthorizationError } from "@/lib/server/auth";

export function jsonError(message: string, status: number, details?: Record<string, string>) {
  return Response.json({ error: message, ...(details ? { details } : {}) }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
    return jsonError(error.message, error.status);
  }

  if (error instanceof Error && "status" in error && typeof error.status === "number") {
    return jsonError(error.message, error.status);
  }

  if (error instanceof SyntaxError) {
    return jsonError("Request body must be valid JSON.", 400);
  }

  if (error instanceof Error && error.name === "ValidationError") {
    return jsonError("Request validation failed.", 400);
  }

  console.error("REST API request failed.", error instanceof Error ? error.message : "Unknown error");
  return jsonError("Internal server error.", 500);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
