"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export interface VendorBankAccount {
  bank_name: string; branch: string | null; account_no: string | null;
  ifsc: string; account_type: string; is_verified: boolean; status: string;
}
export interface VendorContact {
  name: string; designation: string | null; email: string | null;
  phone: string | null; is_primary: boolean;
}
export interface VendorProfile {
  code: string; legal_name: string; trade_name: string | null;
  gstin: string | null; pan: string | null; cin: string | null; category: string | null;
  msme_status: string; udyam_no: string | null; payment_terms: string;
  status: string; portal_status: string; gstin_status: string; credit_limit: string | null;
  bank_accounts: VendorBankAccount[]; contacts: VendorContact[];
}
export interface AsnItem {
  code: string; po_code: string | null; dispatch_date: string; expected_delivery: string | null;
  qty_dispatched: string; transporter: string | null; lr_no: string | null;
  vehicle_no: string | null; status: string;
}

export interface VendorPayment {
  code: string; invoice_code: string | null; vendor_invoice_no: string | null;
  amount: string; tds_amount: string; net_amount: string; method: string;
  status: string; utr: string | null; paid_at: string | null;
  tally_voucher_no: string | null; tally_sync_status: string;
}

export interface VendorDocument {
  id: string; doc_type_key: string | null; doc_type_name: string | null;
  status: string; ocr_confidence: number | null; valid_to: string | null;
}

export interface ContactInput {
  name: string; designation?: string | null; email?: string | null;
  phone?: string | null; is_primary?: boolean;
}
export interface ProfileUpdate {
  trade_name?: string | null;
  category?: string | null;
  contacts?: ContactInput[];
}
export interface BankUpdate {
  bank_name: string; branch?: string | null; account_no: string;
  ifsc: string; account_type?: string;
}

export function useVendorProfile() {
  return useQuery({ queryKey: ["portal", "profile"], queryFn: () => apiFetch<VendorProfile>("/api/v1/portal/profile") });
}
export function useVendorPayments() {
  return useQuery({ queryKey: ["portal", "payments"], queryFn: () => apiFetch<VendorPayment[]>("/api/v1/portal/payments") });
}
export function useVendorAsns() {
  return useQuery({ queryKey: ["portal", "asns"], queryFn: () => apiFetch<AsnItem[]>("/api/v1/portal/asns") });
}
export function useVendorDocuments() {
  return useQuery({ queryKey: ["portal", "documents"], queryFn: () => apiFetch<VendorDocument[]>("/api/v1/portal/documents") });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ProfileUpdate) =>
      apiFetch<VendorProfile>("/api/v1/portal/profile", { method: "PATCH", json: body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portal", "profile"] }),
  });
}

export function useUpdateBank() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BankUpdate) =>
      apiFetch<VendorProfile>("/api/v1/portal/bank", { method: "PUT", json: body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portal", "profile"] }),
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { doc_type_key: string; original_name?: string; content_type?: string; size_bytes?: number }) =>
      apiFetch<VendorDocument>("/api/v1/portal/documents", { method: "POST", json: body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portal", "documents"] });
      qc.invalidateQueries({ queryKey: ["portal", "profile"] });
    },
  });
}
