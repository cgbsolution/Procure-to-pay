"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { Page } from "@/types/api";
import type { POAckAction, POAction, POCreate, POListItem, PORead } from "./types";

const KEY = ["pos"] as const;

export interface POFilters {
  status?: string;
  vendor_id?: string;
  page?: number;
  page_size?: number;
}

function qs(filters: POFilters) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== "") p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function usePOs(filters: POFilters = {}) {
  return useQuery({
    queryKey: [...KEY, filters],
    queryFn: () => apiFetch<Page<POListItem>>(`/api/v1/pos${qs(filters)}`, { unwrap: false }),
  });
}

export function usePO(code: string) {
  return useQuery({
    queryKey: [...KEY, code],
    queryFn: () => apiFetch<PORead>(`/api/v1/pos/${code}`),
    enabled: !!code,
  });
}

export function useCreatePO() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: POCreate) => apiFetch<PORead>("/api/v1/pos", { method: "POST", json: body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["prs"] });
    },
  });
}

function useVersionedPO(code: string, suffix: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { expected_version: number; body?: unknown }) =>
      apiFetch<PORead>(
        `/api/v1/pos/${code}/${suffix}?expected_version=${vars.expected_version}`,
        { method: "POST", json: vars.body },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...KEY, code] });
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useSubmitPO(code: string) {
  return useVersionedPO(code, "submit");
}

export function usePODecision(code: string) {
  const m = useVersionedPO(code, "decision");
  return {
    ...m,
    decide: (expected_version: number, action: POAction, notes?: string) =>
      m.mutateAsync({ expected_version, body: { action, notes } }),
  };
}

export function useDispatchPO(code: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<PORead>(`/api/v1/pos/${code}/dispatch`, {
        method: "POST",
        headers: { "Idempotency-Key": `ui-${code}` },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...KEY, code] });
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

// ── vendor portal ────────────────────────────────────────────────────
const VKEY = ["portal-pos"] as const;

export function useVendorPOs(filters: POFilters = {}) {
  return useQuery({
    queryKey: [...VKEY, filters],
    queryFn: () => apiFetch<Page<POListItem>>(`/api/v1/portal/pos${qs(filters)}`, { unwrap: false }),
  });
}

export function useVendorPO(code: string) {
  return useQuery({
    queryKey: [...VKEY, code],
    queryFn: () => apiFetch<PORead>(`/api/v1/portal/pos/${code}`),
    enabled: !!code,
  });
}

export function useAckPO(code: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { action: POAckAction; reason?: string }) =>
      apiFetch<PORead>(`/api/v1/portal/pos/${code}/acknowledge`, { method: "POST", json: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: VKEY }),
  });
}
