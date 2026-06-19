import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  backendUrl,
  passthroughError,
  readJson,
  REFRESH_COOKIE,
  refreshCookieOptions,
} from "../../_bff";

/**
 * POST /api/auth/refresh
 * Reads the httpOnly `pf_refresh` cookie, forwards it to FastAPI as a bearer
 * token, and returns a fresh `{ access_token, expires_in }`. If the backend
 * rotates the refresh token, the new one is written back to the cookie.
 */
export async function POST() {
  const cookieStore = await cookies();
  const refresh = cookieStore.get(REFRESH_COOKIE)?.value;

  if (!refresh) {
    return passthroughError(401, {
      error: { code: "no_refresh_token", message: "No active session" },
    });
  }

  const upstream = await fetch(backendUrl("/api/v1/auth/refresh"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${refresh}`,
    },
    cache: "no-store",
  });

  const payload = await readJson(upstream);

  if (!upstream.ok) {
    const res = passthroughError(upstream.status, payload);
    // Clear the stale cookie on auth failure.
    if (upstream.status === 401 || upstream.status === 403) {
      res.cookies.delete(REFRESH_COOKIE);
    }
    return res;
  }

  const data = (
    payload as {
      data?: {
        access_token?: string;
        refresh_token?: string;
        expires_in?: number;
      };
    } | null
  )?.data;

  if (!data?.access_token) {
    return passthroughError(502, {
      error: {
        code: "bad_upstream",
        message: "Malformed refresh response from backend",
      },
    });
  }

  const res = NextResponse.json({
    data: { access_token: data.access_token, expires_in: data.expires_in },
  });
  // Rotate the cookie if the backend issued a new refresh token.
  if (data.refresh_token) {
    res.cookies.set(REFRESH_COOKIE, data.refresh_token, refreshCookieOptions());
  }
  return res;
}
