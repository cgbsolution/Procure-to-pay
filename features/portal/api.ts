"use client";

import { useQuery } from "@tanstack/react-query";
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

export function useVendorProfile() {
  return useQuery({ queryKey: ["portal", "profile"], queryFn: () => apiFetch<VendorProfile>("/api/v1/portal/profile") });
}
export function useVendorPayments() {
  return useQuery({ queryKey: ["portal", "payments"], queryFn: () => apiFetch<VendorPayment[]>("/api/v1/portal/payments") });
}
export function useVendorAsns() {
  return useQuery({ queryKey: ["portal", "asns"], queryFn: () => apiFetch<AsnItem[]>("/api/v1/portal/asns") });
}
