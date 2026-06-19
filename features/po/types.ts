/** Purchase Order types — mirror backend app/schemas/po.py. */

export interface POCreate {
  pr_ids: string[];
  vendor_id: string;
  delivery_plant_code?: string;
  delivery_location?: string;
  delivery_required_by: string;
  place_of_supply_state_code: string;
  payment_terms: "net_30" | "net_45" | "net_60" | "advance_pct";
  advance_pct?: string;
  incoterms?: string;
  freight_amount?: string;
}

export interface POLineRead {
  id: string;
  sequence: number;
  pr_line_id: string | null;
  source_pr_id: string | null;
  item_desc: string;
  hsn_code: string;
  uom: string;
  qty_ordered: string;
  rate: string;
  gst_rate: string;
  cgst_amount: string;
  sgst_amount: string;
  igst_amount: string;
  line_amount: string;
  qty_received: string;
  qty_accepted: string;
  qty_invoiced: string;
}

export interface POSourcePRRead {
  pr_id: string;
}

export interface POAmendmentRead {
  revision_no: number;
  change_summary: string;
  requires_reapproval: boolean;
  created_at: string;
}

export interface POListItem {
  code: string;
  vendor_id: string;
  vendor_code: string | null;
  vendor_legal_name: string | null;
  department: string;
  category: string;
  status: string;
  vendor_ack_status: string;
  fy: string;
  total_amount: string;
  po_date: string;
}

export interface PORead extends POListItem {
  id: string;
  capex_opex: string;
  delivery_plant_code: string | null;
  delivery_location: string | null;
  delivery_required_by: string;
  place_of_supply_state_code: string;
  is_inter_state: boolean;
  payment_terms: string;
  advance_pct: string | null;
  incoterms: string | null;
  base_amount: string;
  freight_amount: string;
  tax_amount: string;
  revision_no: number;
  dispatched_at: string | null;
  vendor_ack_at: string | null;
  vendor_ack_reason: string | null;
  budget_committed: boolean;
  version: number;
  lines: POLineRead[];
  source_prs: POSourcePRRead[];
  amendments: POAmendmentRead[];
}

export type POAction = "approve" | "reject" | "return";
export type POAckAction = "acknowledge" | "query" | "reject";
