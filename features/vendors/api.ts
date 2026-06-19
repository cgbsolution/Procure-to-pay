"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { Page } from "@/types/api";

export interface VendorListItem {
  code: string;
  legal_name: string;
  gstin: string | null;
  category: string | null;
  msme_status: string;
  payment_terms: string;
  status: string;
  portal_status: string;
  gstin_status: string;
}

export interface VendorRead extends VendorListItem {
  id: string;
  trade_name: string | null;
  pan: string | null;
  cin: string | null;
  udyam_no: string | null;
  credit_limit: number | null;
  onboarded_at: string | null;
}

export interface VendorFilters {
  status?: string;
  msme?: string;
  q?: string;
  page?: number;
  page_size?: number;
}

export function useVendors(filters: VendorFilters = {}) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== "") params.set(k, String(v));
  }
  const qs = params.toString();
  return useQuery({
    queryKey: ["vendors", filters],
    // Page responses carry `{ data, meta }` — don't unwrap the envelope.
    queryFn: () =>
      apiFetch<Page<VendorListItem>>(`/api/v1/vendors${qs ? `?${qs}` : ""}`, {
        unwrap: false,
      }),
  });
}

export function useVendor(code: string) {
  return useQuery({
    queryKey: ["vendors", code],
    queryFn: () => apiFetch<VendorRead>(`/api/v1/vendors/${code}`),
    enabled: !!code,
  });
}
