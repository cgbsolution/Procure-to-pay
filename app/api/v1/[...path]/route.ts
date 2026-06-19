import { NextRequest, NextResponse } from "next/server";
import { backendUrl } from "../../_bff";

/**
 * Catch-all BFF proxy for data endpoints: forwards `/api/v1/*` to the FastAPI
 * backend (BACKEND_INTERNAL_URL, server-only). The browser only ever talks to
 * its own origin — no CORS, no public backend URL. The bearer access token
 * arrives in the Authorization header (attached client-side by the api-client);
 * we pass it through, plus Idempotency-Key for mutating endpoints.
 */
async function proxy(req: NextRequest, path: string[]): Promise<NextResponse> {
  const search = req.nextUrl.search; // includes leading "?" when present
  const target = backendUrl(`/api/v1/${path.join("/")}${search}`);

  const headers: Record<string, string> = { Accept: "application/json" };
  const auth = req.headers.get("authorization");
  if (auth) headers.Authorization = auth;
  const idem = req.headers.get("idempotency-key");
  if (idem) headers["Idempotency-Key"] = idem;

  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const text = await req.text();
    if (text) {
      headers["Content-Type"] = "application/json";
      body = text;
    }
  }

  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body,
    cache: "no-store",
  });

  const payload = await upstream.text();
  return new NextResponse(payload || null, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
