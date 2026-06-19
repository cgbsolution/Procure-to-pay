"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export interface ASNCreate {
  po_code: string;
  dispatch_date: string;
  expected_delivery?: string;
  qty_dispatched: string;
  transporter?: string;
  lr_no?: string;
  vehicle_no?: string;
  remarks?: string;
}

export function useSubmitASN() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ASNCreate) =>
      apiFetch("/api/v1/portal/asns", { method: "POST", json: body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portal-asns"] }),
  });
}
