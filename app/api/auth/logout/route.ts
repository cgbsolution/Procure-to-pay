import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendUrl, readJson, REFRESH_COOKIE } from "../../_bff";

/**
 * POST /api/auth/logout
 * Best-effort notifies the backend to revoke the refresh token, then always
 * clears the httpOnly cookie locally so the browser session ends regardless.
 */
export async function POST() {
  const cookieStore = await cookies();
  const refresh = cookieStore.get(REFRESH_COOKIE)?.value;

  if (refresh) {
    try {
      const upstream = await fetch(backendUrl("/api/v1/auth/logout"), {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${refresh}`,
        },
        cache: "no-store",
      });
      // Drain the body so the connection can be reused; ignore result.
      await readJson(upstream);
    } catch {
      // Ignore upstream errors — local logout must still succeed.
    }
  }

  const res = NextResponse.json({ data: { success: true } });
  res.cookies.delete(REFRESH_COOKIE);
  return res;
}
