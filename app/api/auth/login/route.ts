import { NextResponse } from "next/server";
import {
  backendUrl,
  passthroughError,
  readJson,
  REFRESH_COOKIE,
  refreshCookieOptions,
} from "../../_bff";
import type { Envelope, LoginResponse } from "@/types/api";

/**
 * POST /api/auth/login
 * Proxies to FastAPI POST /api/v1/auth/login.
 * On success, moves `refresh_token` into the httpOnly `pf_refresh` cookie and
 * returns `{ access_token, expires_in, token_type, user }` (refresh stripped).
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return passthroughError(400, {
      error: { code: "invalid_request", message: "Invalid JSON body" },
    });
  }

  const upstream = await fetch(backendUrl("/api/v1/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload = await readJson(upstream);

  if (!upstream.ok) {
    return passthroughError(upstream.status, payload);
  }

  const data = (payload as Envelope<LoginResponse> | null)?.data;
  if (!data) {
    return passthroughError(502, {
      error: {
        code: "bad_upstream",
        message: "Malformed login response from backend",
      },
    });
  }

  const { refresh_token, ...safe } = data;

  const res = NextResponse.json({ data: safe });
  if (refresh_token) {
    res.cookies.set(REFRESH_COOKIE, refresh_token, refreshCookieOptions());
  }
  return res;
}
