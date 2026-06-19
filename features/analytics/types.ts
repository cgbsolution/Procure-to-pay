/** Analytics payloads — mirror backend app/services/analytics.py. */

export interface Count { status?: string; severity?: string; count: number }
export interface LabelAmount { label: string; amount: string; count: number }
export interface AgeBucket { bucket: string; amount: string; count: number }

export interface ClientSummary {
  kpis: {
    prs_pending: number;
    pos_awaiting_ack: number;
    invoices_in_pipeline: number;
    exceptions_open: number;
    payables_due_amount: string;
    spend_fy_amount: string;
  };
  invoice_pipeline: Count[];
  exceptions_by_severity: Count[];
  ap_ageing: AgeBucket[];
  spend_by_category: LabelAmount[];
}

export interface VendorSummary {
  kpis: {
    pos_awaiting_ack?: number;
    invoices_submitted?: number;
    outstanding_amount?: string;
    paid_30d_amount?: string;
  };
  invoice_status: Count[];
}

export interface Spend { by_category: LabelAmount[]; by_department: LabelAmount[] }
export interface GstSummary {
  cgst: string; sgst: string; igst: string; total_itc: string; taxable: string; invoice_count: number;
}
export interface VendorPerf {
  vendor: string; po_count: number; po_value: string; invoice_count: number; exception_count: number;
}
export interface ExcTrend { type_key: string; severity: string; count: number }
export interface TimelineEvent { at: string | null; action: string; actor: string; after: Record<string, unknown> | null }
