/**
 * Shared helpers for the BFF (Backend-For-Frontend) route handlers.
 *
 * These run server-side only. They proxy to FastAPI using BACKEND_INTERNAL_URL
 * (never exposed to the browser) and manage the httpOnly refresh cookie.
 */
import { NextResponse } from "next/server";

export const REFRESH_COOKIE = "pf_refresh";

export function backendUrl(path: string): string {
  const base = (process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000").replace(
    /\/$/,
    "",
  );
  return `${base}${path}`;
}

/**
 * Cookie options for the refresh token. httpOnly + Secure + SameSite=Strict
 * so it's inaccessible to JS and not sent cross-site.
 */
export function refreshCookieOptions(maxAgeSeconds = 60 * 60 * 24 * 7) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/** Read the bearer access token off the incoming request, if any. */
export function bearerFrom(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }
  return null;
}

/** Forward a backend error envelope (or synthesize one) to the client. */
export function passthroughError(
  status: number,
  body: unknown,
): NextResponse {
  if (body && typeof body === "object" && "error" in body) {
    return NextResponse.json(body, { status });
  }
  return NextResponse.json(
    {
      error: {
        code: `http_${status}`,
        message:
          (body as { message?: string } | null)?.message ??
          "Upstream request failed",
      },
    },
    { status },
  );
}

export async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
