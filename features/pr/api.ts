"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { Page } from "@/types/api";
import type {
  BudgetStatus,
  PRAction,
  PRCreate,
  PRCreated,
  PRListItem,
  PRRead,
  StepPreview,
} from "./types";

const KEY = ["prs"] as const;

export interface PRFilters {
  status?: string;
  department?: string;
  category?: string;
  page?: number;
  page_size?: number;
}

export function usePRs(filters: PRFilters = {}) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== "") params.set(k, String(v));
  }
  const qs = params.toString();
  return useQuery({
    queryKey: [...KEY, filters],
    queryFn: () =>
      apiFetch<Page<PRListItem>>(`/api/v1/prs${qs ? `?${qs}` : ""}`, { unwrap: false }),
  });
}

export function usePR(code: string) {
  return useQuery({
    queryKey: [...KEY, code],
    queryFn: () => apiFetch<PRRead>(`/api/v1/prs/${code}`),
    enabled: !!code,
  });
}

export function usePRBudget(code: string, enabled = true) {
  return useQuery({
    queryKey: [...KEY, code, "budget"],
    queryFn: () =>
      apiFetch<BudgetStatus>(`/api/v1/prs/${code}/budget-check`, { method: "POST" }),
    enabled: !!code && enabled,
  });
}

export function usePRRouting(code: string, enabled = true) {
  return useQuery({
    queryKey: [...KEY, code, "routing"],
    queryFn: () =>
      apiFetch<StepPreview[]>(`/api/v1/prs/${code}/preview-routing`, { method: "POST" }),
    enabled: !!code && enabled,
  });
}

export function useCreatePR() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PRCreate) =>
      apiFetch<PRCreated>("/api/v1/prs", { method: "POST", json: body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

function useVersionedPR(code: string, suffix: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { expected_version: number; body?: unknown }) =>
      apiFetch<PRRead>(
        `/api/v1/prs/${code}/${suffix}?expected_version=${vars.expected_version}`,
        { method: "POST", json: vars.body },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...KEY, code] });
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useSubmitPR(code: string) {
  return useVersionedPR(code, "submit");
}

export function usePRDecision(code: string) {
  const m = useVersionedPR(code, "decision");
  return {
    ...m,
    decide: (expected_version: number, action: PRAction, notes?: string) =>
      m.mutateAsync({ expected_version, body: { action, notes } }),
  };
}

export function useCancelPR(code: string) {
  return useVersionedPR(code, "cancel");
}
