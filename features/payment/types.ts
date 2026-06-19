/** Payment + Tally types — mirror backend app/schemas/payment.py. */

export interface PayableInvoice {
  code: string;
  vendor_legal_name: string | null;
  po_code: string | null;
  vendor_invoice_no: string;
  invoice_date: string;
  total_amount: string;
  tds_amount: string;
  net_payable: string;
  payment_due_date: string | null;
}

export interface PaymentRead {
  code: string;
  invoice_code: string | null;
  vendor_invoice_no: string | null;
  vendor_legal_name: string | null;
  amount: string;
  tds_amount: string;
  net_amount: string;
  method: string;
  status: string;
  utr: string | null;
  paid_at: string | null;
  tally_voucher_no: string | null;
  tally_sync_status: string;
  tally_synced_at: string | null;
}

export interface PaymentBatchListItem {
  code: string;
  batch_date: string;
  method: string;
  status: string;
  total_amount: string;
  payment_count: number;
  created_at: string;
}

export interface PaymentBatchRead extends PaymentBatchListItem {
  id: string;
  notes: string | null;
  scheduled_by: string;
  released_by: string | null;
  released_at: string | null;
  version: number;
  payments: PaymentRead[];
}

export interface PaymentBatchCreate {
  invoice_codes: string[];
  method: "neft" | "rtgs" | "imps";
  batch_date: string;
  notes?: string;
}
