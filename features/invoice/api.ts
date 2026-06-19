"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { Page } from "@/types/api";
import type {
  InvoiceAction, InvoiceCreate, InvoiceListItem, InvoiceRead,
} from "./types";

const KEY = ["invoices"] as const;

export function useInvoices(filters: { status?: string; page_size?: number } = {}) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v) p.set(k, String(v));
  const qs = p.toString();
  return useQuery({
    queryKey: [...KEY, filters],
    queryFn: () => apiFetch<Page<InvoiceListItem>>(`/api/v1/invoices${qs ? `?${qs}` : ""}`, { unwrap: false }),
  });
}

export function useInvoice(code: string) {
  return useQuery({
    queryKey: [...KEY, code],
    queryFn: () => apiFetch<InvoiceRead>(`/api/v1/invoices/${code}`),
    enabled: !!code,
  });
}

export function useSubmitInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: InvoiceCreate) =>
      apiFetch<InvoiceRead>("/api/v1/invoices", { method: "POST", json: body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useInvoiceDecision(code: string) {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: (vars: { expected_version: number; action: InvoiceAction; notes?: string }) =>
      apiFetch<InvoiceRead>(`/api/v1/invoices/${code}/decision?expected_version=${vars.expected_version}`, {
        method: "POST", json: { action: vars.action, notes: vars.notes },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...KEY, code] });
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
  return {
    ...m,
    decide: (expected_version: number, action: InvoiceAction, notes?: string) =>
      m.mutateAsync({ expected_version, action, notes }),
  };
}
