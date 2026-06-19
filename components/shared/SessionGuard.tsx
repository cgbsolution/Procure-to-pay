"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth";
import type { User } from "@/types/api";

/**
 * Client-side auth guard. The access token lives only in memory, so on a hard
 * refresh we re-mint it from the httpOnly refresh cookie via the BFF, then load
 * the current user. On failure, redirect to /login.
 *
 * RBAC in the UI is cosmetic only — the backend is always the enforcement point.
 */
export function SessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const [checking, setChecking] = React.useState(!accessToken);
  const ran = React.useRef(false);

  React.useEffect(() => {
    if (accessToken || ran.current) return;
    ran.current = true;

    (async () => {
      try {
        const { access_token } = await apiFetch<{ access_token: string }>(
          "/api/auth/refresh",
          { method: "POST", skipAuth: true },
        );
        setAccessToken(access_token);
        const user = await apiFetch<User>("/api/auth/me");
        setUser(user);
        setChecking(false);
      } catch {
        router.replace("/login");
      }
    })();
  }, [accessToken, router, setAccessToken, setUser]);

  if (!accessToken && checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  return <>{children}</>;
}
