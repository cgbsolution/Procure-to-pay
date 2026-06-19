"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { Page } from "@/types/api";
import type {
  PayableInvoice, PaymentBatchCreate, PaymentBatchListItem, PaymentBatchRead, PaymentRead,
} from "./types";

const KEY = ["payments"] as const;

export function usePayments(filters: { status?: string; page_size?: number } = {}) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v) p.set(k, String(v));
  const qs = p.toString();
  return useQuery({
    queryKey: [...KEY, "flat", filters],
    queryFn: () => apiFetch<Page<PaymentRead>>(`/api/v1/payments${qs ? `?${qs}` : ""}`, { unwrap: false }),
  });
}

export function usePayable() {
  return useQuery({
    queryKey: [...KEY, "payable"],
    queryFn: () => apiFetch<PayableInvoice[]>("/api/v1/payments/payable"),
  });
}

export function usePaymentBatches(filters: { status?: string; page_size?: number } = {}) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v) p.set(k, String(v));
  const qs = p.toString();
  return useQuery({
    queryKey: [...KEY, "batches", filters],
    queryFn: () => apiFetch<Page<PaymentBatchListItem>>(`/api/v1/payment-batches${qs ? `?${qs}` : ""}`, { unwrap: false }),
  });
}

export function usePaymentBatch(code: string) {
  return useQuery({
    queryKey: [...KEY, "batch", code],
    queryFn: () => apiFetch<PaymentBatchRead>(`/api/v1/payment-batches/${code}`),
    enabled: !!code,
  });
}

export function useCreateBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PaymentBatchCreate) =>
      apiFetch<PaymentBatchRead>("/api/v1/payment-batches", { method: "POST", json: body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useBatchAction(code: string, kind: "release" | "cancel") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (expected_version: number) =>
      apiFetch<PaymentBatchRead>(`/api/v1/payment-batches/${code}/${kind}?expected_version=${expected_version}`, {
        method: "POST",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...KEY, "batch", code] });
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}
