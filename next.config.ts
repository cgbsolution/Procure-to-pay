import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // NEXT_PUBLIC_* vars are inlined automatically; BACKEND_INTERNAL_URL stays
  // server-only and is read directly in the BFF route handlers. The BFF
  // (app/api/*) is the only thing that talks to FastAPI directly.
};

export default nextConfig;
