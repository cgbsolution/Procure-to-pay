/** Invoice types — mirror backend app/schemas/invoice.py. */

export interface InvoiceLineIn {
  po_line_id?: string;
  item_desc: string;
  hsn_code?: string;
  uom: string;
  qty: string;
  rate: string;
  gst_rate: string;
}

export interface InvoiceCreate {
  po_code: string;
  vendor_invoice_no: string;
  invoice_date: string;
  source?: "portal" | "email" | "manual";
  cgst: string;
  sgst: string;
  igst: string;
  lines: InvoiceLineIn[];
}

export interface InvoiceLineRead {
  id: string;
  sequence: number;
  po_line_id: string | null;
  item_desc: string;
  hsn_code: string | null;
  uom: string;
  qty: string;
  rate: string;
  gst_rate: string;
  taxable_value: string;
  line_total: string;
}

export interface ValidationResult {
  layer_key: string;
  sequence: number;
  result: "pass" | "fail" | "warn" | "skip";
  message: string;
  evidence: Record<string, unknown>;
}

export interface MatchCheck {
  check_key: string;
  po_value: string;
  grn_value: string;
  invoice_value: string;
  variance: string;
  tolerance: string;
  result: "pass" | "fail" | "warn" | "skip";
  exception_key: string | null;
}

export interface InvoiceListItem {
  code: string;
  vendor_legal_name: string | null;
  po_code: string | null;
  vendor_invoice_no: string;
  invoice_date: string;
  total_amount: string;
  status: string;
  validation_status: string;
  match_result: string;
}

export interface InvoiceRead extends InvoiceListItem {
  id: string;
  vendor_id: string;
  source: string;
  match_type: string;
  taxable_value: string;
  cgst: string;
  sgst: string;
  igst: string;
  tds_section: string | null;
  tds_amount: string;
  net_payable: string;
  payment_due_date: string | null;
  ocr_confidence: number | null;
  validation_results: ValidationResult[] | null;
  match_results: MatchCheck[] | null;
  decision_notes: string | null;
  version: number;
  lines: InvoiceLineRead[];
}

export type InvoiceAction = "approve" | "reject" | "return";
