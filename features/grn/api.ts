"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { Page } from "@/types/api";

export type RejectReason =
  | "moisture" | "damage" | "spec_mismatch" | "short_supply" | "wrong_item" | "other";

export interface GRNLineIn {
  po_line_id: string;
  qty_received: string;
  qty_accepted: string;
  qty_rejected: string;
  reject_reason?: RejectReason;
}

export interface GRNCreate {
  grn_date: string;
  receipt_plant_code?: string;
  transporter?: string;
  lr_no?: string;
  notes?: string;
  lines: GRNLineIn[];
}

export interface GRNLineRead {
  id: string;
  sequence: number;
  po_line_id: string;
  item_desc: string;
  uom: string;
  qty_received: string;
  qty_accepted: string;
  qty_rejected: string;
  reject_reason: string | null;
  accepted_value: string;
}

export interface GRNListItem {
  code: string;
  po_code: string | null;
  vendor_id: string;
  status: string;
  grn_date: string;
  created_at: string;
}

export interface GRNRead extends GRNListItem {
  id: string;
  transporter: string | null;
  lr_no: string | null;
  notes: string | null;
  lines: GRNLineRead[];
}

export function useGRNs(filters: { status?: string; po_code?: string; page_size?: number } = {}) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v) p.set(k, String(v));
  const qs = p.toString();
  return useQuery({
    queryKey: ["grns", filters],
    queryFn: () => apiFetch<Page<GRNListItem>>(`/api/v1/grns${qs ? `?${qs}` : ""}`, { unwrap: false }),
  });
}

export function useRecordGRN(poCode: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: GRNCreate) =>
      apiFetch<GRNRead>(`/api/v1/pos/${poCode}/grns`, { method: "POST", json: body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grns"] });
      qc.invalidateQueries({ queryKey: ["pos", poCode] });
      qc.invalidateQueries({ queryKey: ["pos"] });
    },
  });
}
