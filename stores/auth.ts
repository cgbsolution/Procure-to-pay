import { create } from "zustand";
import type { User } from "@/types/api";

/**
 * Global auth/session store.
 *
 * The access token lives only in memory (never localStorage) — it is short-lived
 * and re-minted via the BFF refresh endpoint, which holds the long-lived refresh
 * token in an httpOnly cookie the JS can't read. TanStack Query owns server data;
 * this store only holds the session snapshot.
 */
export interface AuthState {
  accessToken: string | null;
  user: User | null;
  /** True once a login/refresh attempt has resolved (used to gate guards). */
  isHydrated: boolean;

  login: (accessToken: string, user: User) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
  setAccessToken: (accessToken: string | null) => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isHydrated: false,

  login: (accessToken, user) =>
    set({ accessToken, user, isHydrated: true }),

  logout: () => set({ accessToken: null, user: null, isHydrated: true }),

  setUser: (user) => set({ user }),

  setAccessToken: (accessToken) => set({ accessToken }),

  setHydrated: (isHydrated) => set({ isHydrated }),
}));

/**
 * Non-reactive accessor for the current access token.
 * Used by the api-client (outside React) to attach the bearer header.
 */
export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}
