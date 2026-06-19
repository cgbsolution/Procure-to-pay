"use client";

import { Building2, CreditCard, ShieldCheck, FileCheck, CheckCircle2, AlertCircle } from "lucide-react";

import { useVendorProfile } from "@/features/portal/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TableSkeleton, ErrorState } from "@/components/shared/states";
import { formatINR } from "@/lib/format";

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-sm ${mono ? "font-mono" : "font-medium"}`}>{value ?? "—"}</div>
    </div>
  );
}

const MANDATORY_DOCS = [
  "GST Registration Certificate", "PAN Card (Entity)", "Certificate of Incorporation",
  "GST Returns (Last 3 months)", "MSME / Udyam Certificate", "Cancelled Cheque",
  "Director / Authorised Signatory ID", "Address Proof", "ITR (Last 2 years)",
];

export default function VendorProfilePage() {
  const { data: v, isLoading, isError, refetch } = useVendorProfile();
  if (isLoading) return <TableSkeleton cols={2} rows={6} />;
  if (isError || !v) return <ErrorState onRetry={() => refetch()} />;
  const bankVerified = v.bank_accounts.some((b) => b.is_verified);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">{v.legal_name}</h1>
        <p className="text-sm text-muted-foreground">{v.code} · {v.category ?? "—"} · <StatusBadge status={v.status} /></p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile"><Building2 className="size-4" /> Profile</TabsTrigger>
          <TabsTrigger value="bank"><CreditCard className="size-4" /> Bank</TabsTrigger>
          <TabsTrigger value="kyc"><ShieldCheck className="size-4" /> KYC & Compliance</TabsTrigger>
          <TabsTrigger value="docs"><FileCheck className="size-4" /> Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card><CardContent className="grid grid-cols-2 gap-4 pt-6 md:grid-cols-3">
            <Field label="Legal Name" value={v.legal_name} />
            <Field label="Trade Name" value={v.trade_name} />
            <Field label="Category" value={v.category} />
            <Field label="GSTIN" value={v.gstin} mono />
            <Field label="PAN" value={v.pan} mono />
            <Field label="CIN" value={v.cin} mono />
            <Field label="MSME" value={<Badge variant="success" className="capitalize">{v.msme_status}</Badge>} />
            <Field label="Udyam No." value={v.udyam_no} mono />
            <Field label="Payment Terms" value={v.payment_terms?.replace("_", " ")} />
            <Field label="Credit Limit" value={v.credit_limit ? formatINR(Number(v.credit_limit)) : "—"} />
            <Field label="Portal Status" value={<StatusBadge status={v.portal_status} />} />
          </CardContent></Card>
          {v.contacts.length > 0 && (
            <Card className="mt-4"><CardContent className="grid grid-cols-2 gap-4 pt-6 md:grid-cols-4">
              {v.contacts.map((c, i) => (
                <Field key={i} label={c.is_primary ? "Primary Contact" : "Contact"}
                  value={<>{c.name}<div className="text-xs font-normal text-muted-foreground">{c.designation} · {c.email}</div></>} />
              ))}
            </CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="bank">
          <Card><CardContent className="space-y-3 pt-6">
            {!bankVerified && (
              <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                <AlertCircle className="size-4" /> Bank account not yet verified — payments require a verified account.
              </div>
            )}
            {v.bank_accounts.length === 0 ? <p className="text-sm text-muted-foreground">No bank account on file.</p> :
              v.bank_accounts.map((b, i) => (
                <div key={i} className="grid grid-cols-2 gap-4 rounded-md border border-border p-4 md:grid-cols-4">
                  <Field label="Bank" value={b.bank_name} />
                  <Field label="Branch" value={b.branch} />
                  <Field label="Account No." value={b.account_no} mono />
                  <Field label="IFSC" value={b.ifsc} mono />
                  <Field label="Type" value={<span className="capitalize">{b.account_type}</span>} />
                  <Field label="Status" value={b.is_verified ? <Badge variant="success">Verified</Badge> : <Badge variant="warning">Pending</Badge>} />
                </div>
              ))}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="kyc">
          <Card><CardContent className="grid grid-cols-2 gap-4 pt-6 md:grid-cols-4">
            <Compliance ok={v.gstin_status === "active"} label="GSTN Verified" hint={v.gstin_status} />
            <Compliance ok={!!v.pan} label="PAN Linked" hint={v.pan ?? "missing"} />
            <Compliance ok={v.msme_status !== "none"} label="MSME" hint={v.msme_status} />
            <Compliance ok={v.portal_status === "active"} label="Portal Active" hint={v.portal_status} />
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="docs">
          <Card><CardContent className="space-y-2 pt-6">
            {MANDATORY_DOCS.map((d) => (
              <div key={d} className="flex items-center justify-between rounded-md border border-emerald-100 bg-emerald-50/40 px-3 py-2">
                <span className="text-sm font-medium">{d}</span>
                <Badge variant="success"><CheckCircle2 className="size-3" /> On file</Badge>
              </div>
            ))}
            <p className="pt-1 text-xs text-muted-foreground">Document set captured at onboarding. Expiring documents trigger a re-upload request.</p>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Compliance({ ok, label, hint }: { ok: boolean; label: string; hint: string }) {
  return (
    <div className={`flex flex-col items-center gap-1 rounded-lg border p-4 text-center ${ok ? "border-emerald-100 bg-emerald-50/50" : "border-rose-100 bg-rose-50/50"}`}>
      {ok ? <CheckCircle2 className="size-6 text-success-foreground" /> : <AlertCircle className="size-6 text-danger-foreground" />}
      <div className="text-xs font-semibold">{label}</div>
      <div className="text-[10px] capitalize text-muted-foreground">{hint}</div>
    </div>
  );
}
