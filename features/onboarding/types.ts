/** Onboarding domain types — mirror backend app/schemas/vendor.py. */

export interface ApplicationListItem {
  code: string;
  company_name: string;
  gstin: string | null;
  category: string | null;
  status: string;
  docs_uploaded: number;
  docs_required: number;
  submitted_at: string | null;
}

export interface OcrField {
  value: string;
  confidence: number;
}

export interface DocumentRead {
  id: string;
  doc_type_id: string;
  doc_type_key: string | null;
  doc_type_name: string | null;
  status: string;
  ocr_confidence: number | null;
  valid_to: string | null;
}

export interface ApplicationRead extends ApplicationListItem {
  id: string;
  vendor_id: string | null;
  ocr_profile: Record<string, OcrField> | null;
  decision_notes: string | null;
  documents: DocumentRead[];
}

export interface InviteCreate {
  company_name: string;
  contact_email: string;
  gstin?: string;
  category?: string;
  contact_name?: string;
  phone?: string;
  notes?: string;
}

export interface InviteCreated {
  application_code: string;
  invite_link: string;
}

export interface ApplicationDecision {
  decision: "approve" | "reject";
  category?: string;
  payment_terms?: string;
  credit_limit?: number;
  msme_status?: string;
  notes?: string;
}
