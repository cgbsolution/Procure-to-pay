"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { Page } from "@/types/api";

export interface SESListItem {
  code: string;
  po_code: string | null;
  status: string;
  ses_type: string;
  value: string;
  created_at: string;
}

export interface SESRead extends SESListItem {
  id: string;
  po_id: string;
  vendor_id: string;
  service_desc: string;
  period_from: string | null;
  period_to: string | null;
  approved_at: string | null;
  decision_notes: string | null;
  version: number;
}

export interface SESCreate {
  po_code: string;
  ses_type: "milestone" | "period" | "disputed";
  period_from?: string | null;
  period_to?: string | null;
  service_desc: string;
  value: string;
}

export function useSesList(filters: { status?: string; page_size?: number } = {}) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v) p.set(k, String(v));
  const qs = p.toString();
  return useQuery({
    queryKey: ["ses", filters],
    queryFn: () => apiFetch<Page<SESListItem>>(`/api/v1/ses${qs ? `?${qs}` : ""}`, { unwrap: false }),
  });
}

export function useCreateSes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SESCreate) => apiFetch<SESRead>("/api/v1/ses", { method: "POST", json: body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ses"] }),
  });
}

export function useSesDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { code: string; action: "approve" | "reject"; notes?: string }) =>
      apiFetch<SESRead>(`/api/v1/ses/${vars.code}/decision`, {
        method: "POST", json: { action: vars.action, notes: vars.notes },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ses"] }),
  });
}
