"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export interface TallySyncStatus {
  synced: number;
  failed: number;
  pending: number;
  total: number;
  failed_items: { code: string; invoice: string | null; vendor: string | null; net: string }[];
}

export function useTallySync() {
  return useQuery({
    queryKey: ["tally", "sync-status"],
    queryFn: () => apiFetch<TallySyncStatus>("/api/v1/tally/sync-status"),
    retry: false, // hidden for roles without payment:read — don't hammer on 403
  });
}

export function useRetryTally() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<{ retried: number; synced: number }>("/api/v1/tally/retry-failed", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tally"] }),
  });
}
