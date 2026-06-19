import { NextResponse } from "next/server";
import {
  backendUrl,
  bearerFrom,
  passthroughError,
  readJson,
} from "../../_bff";

/**
 * GET /api/auth/me
 * Proxies to FastAPI GET /api/v1/auth/me using the bearer access token sent by
 * the client. Returns `{ data: User }`.
 */
export async function GET(request: Request) {
  const token = bearerFrom(request);
  if (!token) {
    return passthroughError(401, {
      error: { code: "missing_token", message: "Missing access token" },
    });
  }

  const upstream = await fetch(backendUrl("/api/v1/auth/me"), {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const payload = await readJson(upstream);

  if (!upstream.ok) {
    return passthroughError(upstream.status, payload);
  }

  return NextResponse.json(payload);
}
