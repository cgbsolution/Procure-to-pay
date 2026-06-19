"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { Page } from "@/types/api";

export interface ExceptionItem {
  id: string;
  type_key: string;
  invoice_code: string | null;
  severity: string;
  title: string;
  status: string;
  sla_due_at: string | null;
  assigned_role: string | null;
  created_at: string;
  detail?: string | null;
  breached?: boolean;
  vendor_notified_at?: string | null;
  resolution_notes?: string | null;
}

export function useExceptions(filters: { status?: string; severity?: string; page_size?: number } = {}) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v) p.set(k, String(v));
  const qs = p.toString();
  return useQuery({
    queryKey: ["exceptions", filters],
    queryFn: () => apiFetch<Page<ExceptionItem>>(`/api/v1/exceptions${qs ? `?${qs}` : ""}`, { unwrap: false }),
  });
}

export function useExceptionAction(id: string, kind: "resolve" | "return-to-vendor") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notes?: string) =>
      apiFetch<ExceptionItem>(`/api/v1/exceptions/${id}/${kind}`, { method: "POST", json: { notes } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exceptions"] }),
  });
}
