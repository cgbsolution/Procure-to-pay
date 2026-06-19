/** Purchase Requisition types — mirror backend app/schemas/pr.py. */

export interface PRLineIn {
  item_desc: string;
  hsn_code?: string;
  uom: string;
  qty: string; // Decimal as string
  est_rate: string;
}

export interface PRCreate {
  title: string;
  description?: string;
  category: string;
  department: string;
  plant?: string;
  cost_centre?: string;
  capex_opex: "capex" | "opex";
  required_by: string; // ISO date
  justification?: string;
  lines: PRLineIn[];
}

export interface PRLineRead {
  id: string;
  sequence: number;
  item_desc: string;
  hsn_code: string | null;
  uom: string;
  qty: string;
  est_rate: string;
  amount: string;
}

export interface PRListItem {
  code: string;
  title: string;
  category: string;
  department: string;
  capex_opex: string;
  est_value: string;
  fy: string;
  status: string;
  required_by: string;
  submitted_at: string | null;
}

export interface PRRead extends PRListItem {
  id: string;
  description: string | null;
  plant: string | null;
  cost_centre: string | null;
  justification: string | null;
  budget_id: string | null;
  reserved_at: string | null;
  requester_user_id: string;
  decided_at: string | null;
  decision_notes: string | null;
  version: number;
  lines: PRLineRead[];
}

export interface BudgetStatus {
  budget_id: string | null;
  allocated: string;
  reserved: string;
  committed: string;
  available: string;
  requested: string;
  within: boolean;
  reason: string | null;
}

export interface StepPreview {
  sequence: number;
  level: string;
  approver_role: string;
  sla_hours: number | null;
}

export interface PRCreated {
  pr: PRRead;
  budget: BudgetStatus;
}

export type PRAction = "approve" | "reject" | "return";
