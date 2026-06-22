"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Building2, CreditCard, ShieldCheck, FileCheck, CheckCircle2, AlertCircle,
  Pencil, Plus, Trash2, Star, Upload, ScanLine,
} from "lucide-react";

import {
  useVendorProfile, useUpdateProfile, useUpdateBank, useVendorDocuments, useUploadDocument,
  type VendorProfile, type ContactInput,
} from "@/features/portal/api";
import { ApiError } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TableSkeleton, ErrorState } from "@/components/shared/states";
import { formatINR } from "@/lib/format";

const CATEGORIES = ["Raw Materials", "Consumables", "Services", "Capex", "Chemicals", "Safety&PPE"];

// Mandatory document set (keys mirror backend seed_data.DOCUMENT_TYPES).
const MANDATORY_DOCS: { key: string; name: string }[] = [
  { key: "gst_cert", name: "GST Registration Certificate" },
  { key: "pan", name: "PAN Card (Entity)" },
  { key: "coi", name: "Certificate of Incorporation" },
  { key: "gst_returns", name: "GST Returns (Last 3 months)" },
  { key: "msme", name: "MSME / Udyam Certificate" },
  { key: "cancelled_cheque", name: "Cancelled Cheque / Bank Statement" },
  { key: "director_id", name: "Director / Authorised Signatory ID" },
  { key: "address_proof", name: "Address Proof" },
  { key: "itr", name: "ITR (Last 2 years)" },
];

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-sm ${mono ? "font-mono" : "font-medium"}`}>{value ?? "—"}</div>
    </div>
  );
}

export default function VendorProfilePage() {
  const { data: v, isLoading, isError, refetch } = useVendorProfile();
  if (isLoading) return <TableSkeleton cols={2} rows={6} />;
  if (isError || !v) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">{v.legal_name}</h1>
        <p className="text-sm text-muted-foreground">
          {v.code} · {v.category ?? "—"} · <StatusBadge status={v.status} />
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile"><Building2 className="size-4" /> Profile</TabsTrigger>
          <TabsTrigger value="bank"><CreditCard className="size-4" /> Bank</TabsTrigger>
          <TabsTrigger value="kyc"><ShieldCheck className="size-4" /> KYC &amp; Compliance</TabsTrigger>
          <TabsTrigger value="docs"><FileCheck className="size-4" /> Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="profile"><ProfileTab v={v} /></TabsContent>
        <TabsContent value="bank"><BankTab v={v} /></TabsContent>

        <TabsContent value="kyc">
          <Card><CardContent className="grid grid-cols-2 gap-4 pt-6 md:grid-cols-4">
            <Compliance ok={v.gstin_status === "active"} label="GSTN Verified" hint={v.gstin_status} />
            <Compliance ok={!!v.pan} label="PAN Linked" hint={v.pan ?? "missing"} />
            <Compliance ok={v.msme_status !== "none"} label="MSME" hint={v.msme_status} />
            <Compliance ok={v.portal_status === "active"} label="Portal Active" hint={v.portal_status} />
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="docs"><DocsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ── Profile + contacts (editable) ────────────────────────────────────
function ProfileTab({ v }: { v: VendorProfile }) {
  const update = useUpdateProfile();
  const [editing, setEditing] = React.useState(false);
  const [tradeName, setTradeName] = React.useState(v.trade_name ?? "");
  const [category, setCategory] = React.useState(v.category ?? "");
  const [contacts, setContacts] = React.useState<ContactInput[]>([]);

  function start() {
    setTradeName(v.trade_name ?? "");
    setCategory(v.category ?? "");
    setContacts(
      v.contacts.length
        ? v.contacts.map((c) => ({ ...c }))
        : [{ name: "", designation: "", email: "", phone: "", is_primary: true }],
    );
    setEditing(true);
  }

  function setContact(i: number, patch: Partial<ContactInput>) {
    setContacts((cs) => cs.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function setPrimary(i: number) {
    setContacts((cs) => cs.map((c, idx) => ({ ...c, is_primary: idx === i })));
  }
  function addContact() {
    setContacts((cs) => [...cs, { name: "", designation: "", email: "", phone: "", is_primary: cs.length === 0 }]);
  }
  function removeContact(i: number) {
    setContacts((cs) => {
      const next = cs.filter((_, idx) => idx !== i);
      if (next.length > 0 && !next.some((c) => c.is_primary)) {
        next[0] = { ...next[0]!, is_primary: true };
      }
      return next;
    });
  }

  async function save() {
    const cleaned = contacts.filter((c) => c.name.trim());
    if (!cleaned.length) { toast.error("Add at least one contact with a name"); return; }
    try {
      await update.mutateAsync({
        trade_name: tradeName.trim() || null,
        category: category || null,
        contacts: cleaned.map((c) => ({
          name: c.name.trim(),
          designation: c.designation?.trim() || null,
          email: c.email?.trim() || null,
          phone: c.phone?.trim() || null,
          is_primary: !!c.is_primary,
        })),
      });
      toast.success("Profile updated");
      setEditing(false);
    } catch (err) {
      toast.error("Could not save profile", { description: err instanceof ApiError ? err.message : "Try again." });
    }
  }

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-semibold">Company details</div>
            {!editing ? (
              <Button size="sm" variant="outline" onClick={start}><Pencil className="size-4" /> Edit</Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={update.isPending}>Cancel</Button>
                <Button size="sm" variant="teal" onClick={save} disabled={update.isPending}>
                  {update.isPending ? "Saving…" : "Save changes"}
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <Field label="Legal Name" value={v.legal_name} />
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Trade Name</div>
              {editing
                ? <Input className="mt-1 h-9" value={tradeName} onChange={(e) => setTradeName(e.target.value)} placeholder="Trade name" />
                : <div className="mt-0.5 text-sm font-medium">{v.trade_name ?? "—"}</div>}
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Category</div>
              {editing ? (
                <Select value={category || undefined} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : <div className="mt-0.5 text-sm font-medium">{v.category ?? "—"}</div>}
            </div>
            <Field label="GSTIN" value={v.gstin} mono />
            <Field label="PAN" value={v.pan} mono />
            <Field label="CIN" value={v.cin} mono />
            <Field label="MSME" value={<Badge variant="success" className="capitalize">{v.msme_status}</Badge>} />
            <Field label="Udyam No." value={v.udyam_no} mono />
            <Field label="Payment Terms" value={v.payment_terms?.replace("_", " ")} />
            <Field label="Credit Limit" value={v.credit_limit ? formatINR(Number(v.credit_limit)) : "—"} />
            <Field label="Portal Status" value={<StatusBadge status={v.portal_status} />} />
          </div>
          {editing && (
            <p className="mt-3 text-xs text-muted-foreground">
              Legal name, GSTIN and PAN are KYC-bound and changed via a verified request — contact your buyer.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold">Contacts</div>
            {editing && <Button size="sm" variant="outline" onClick={addContact}><Plus className="size-4" /> Add contact</Button>}
          </div>

          {!editing ? (
            v.contacts.length === 0
              ? <p className="text-sm text-muted-foreground">No contacts on file.</p>
              : <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {v.contacts.map((c, i) => (
                    <Field key={i} label={c.is_primary ? "Primary Contact" : "Contact"}
                      value={<>{c.name}<div className="text-xs font-normal text-muted-foreground">{c.designation} · {c.email}</div></>} />
                  ))}
                </div>
          ) : (
            <div className="space-y-3">
              {contacts.map((c, i) => (
                <div key={i} className="grid grid-cols-1 items-end gap-2 rounded-md border border-border p-3 md:grid-cols-[1fr_1fr_1fr_1fr_auto]">
                  <div className="space-y-1"><Label>Name *</Label>
                    <Input className="h-9" value={c.name} onChange={(e) => setContact(i, { name: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Designation</Label>
                    <Input className="h-9" value={c.designation ?? ""} onChange={(e) => setContact(i, { designation: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Email</Label>
                    <Input className="h-9" type="email" value={c.email ?? ""} onChange={(e) => setContact(i, { email: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Phone</Label>
                    <Input className="h-9" value={c.phone ?? ""} onChange={(e) => setContact(i, { phone: e.target.value })} /></div>
                  <div className="flex gap-1">
                    <Button size="icon-sm" variant={c.is_primary ? "gold" : "ghost"} title="Make primary"
                      onClick={() => setPrimary(i)} type="button"><Star className="size-4" /></Button>
                    <Button size="icon-sm" variant="ghost" title="Remove" onClick={() => removeContact(i)} type="button">
                      <Trash2 className="size-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// ── Bank (editable, sensitive) ───────────────────────────────────────
function BankTab({ v }: { v: VendorProfile }) {
  const update = useUpdateBank();
  const current = v.bank_accounts[0];
  const bankVerified = v.bank_accounts.some((b) => b.is_verified);
  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState({
    bank_name: "", branch: "", account_no: "", ifsc: "", account_type: "current",
  });

  function start() {
    setForm({
      bank_name: current?.bank_name ?? "",
      branch: current?.branch ?? "",
      account_no: "",
      ifsc: current?.ifsc ?? "",
      account_type: current?.account_type ?? "current",
    });
    setEditing(true);
  }

  async function save() {
    if (form.bank_name.trim().length < 2) { toast.error("Enter the bank name"); return; }
    if (form.account_no.trim().length < 4) { toast.error("Enter the full account number"); return; }
    if (form.ifsc.trim().length < 4) { toast.error("Enter a valid IFSC"); return; }
    try {
      await update.mutateAsync({
        bank_name: form.bank_name.trim(), branch: form.branch.trim() || null,
        account_no: form.account_no.trim(), ifsc: form.ifsc.trim().toUpperCase(),
        account_type: form.account_type,
      });
      toast.success("Bank details submitted", {
        description: "The account is now pending re-verification before the next payment.",
      });
      setEditing(false);
    } catch (err) {
      toast.error("Could not update bank details", { description: err instanceof ApiError ? err.message : "Try again." });
    }
  }

  return (
    <Card><CardContent className="space-y-3 pt-6">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Bank account</div>
        {!editing
          ? <Button size="sm" variant="outline" onClick={start}><Pencil className="size-4" /> {current ? "Update" : "Add account"}</Button>
          : <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={update.isPending}>Cancel</Button>
              <Button size="sm" variant="teal" onClick={save} disabled={update.isPending}>{update.isPending ? "Saving…" : "Save bank details"}</Button>
            </div>}
      </div>

      {!bankVerified && (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <AlertCircle className="size-4" /> Bank account not yet verified — payments require a verified account.
        </div>
      )}

      {!editing ? (
        !current ? <p className="text-sm text-muted-foreground">No bank account on file.</p> :
          v.bank_accounts.map((b, i) => (
            <div key={i} className="grid grid-cols-2 gap-4 rounded-md border border-border p-4 md:grid-cols-4">
              <Field label="Bank" value={b.bank_name} />
              <Field label="Branch" value={b.branch} />
              <Field label="Account No." value={b.account_no} mono />
              <Field label="IFSC" value={b.ifsc} mono />
              <Field label="Type" value={<span className="capitalize">{b.account_type}</span>} />
              <Field label="Status" value={b.is_verified ? <Badge variant="success">Verified</Badge> : <Badge variant="warning">Pending</Badge>} />
            </div>
          ))
      ) : (
        <div className="space-y-3 rounded-md border border-border p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1.5"><Label>Bank name *</Label>
              <Input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} placeholder="HDFC Bank Ltd" /></div>
            <div className="space-y-1.5"><Label>Branch</Label>
              <Input value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} placeholder="Pimpri, Pune" /></div>
            <div className="space-y-1.5"><Label>Account number *</Label>
              <Input className="font-mono" value={form.account_no} onChange={(e) => setForm({ ...form, account_no: e.target.value })} placeholder="Full account number" /></div>
            <div className="space-y-1.5"><Label>IFSC *</Label>
              <Input className="font-mono uppercase" value={form.ifsc} onChange={(e) => setForm({ ...form, ifsc: e.target.value })} placeholder="HDFC0001234" /></div>
            <div className="space-y-1.5"><Label>Account type</Label>
              <Select value={form.account_type} onValueChange={(val) => setForm({ ...form, account_type: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                </SelectContent>
              </Select></div>
          </div>
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            Changing bank details resets verification. The account stays unverified until your buyer re-confirms it, and payments are held until then.
          </div>
        </div>
      )}
    </CardContent></Card>
  );
}

// ── Documents (upload + OCR) ─────────────────────────────────────────
function DocsTab() {
  const { data: docs, isLoading } = useVendorDocuments();
  const upload = useUploadDocument();
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const pendingKey = React.useRef<string | null>(null);

  const byKey = new Map((docs ?? []).map((d) => [d.doc_type_key ?? "", d]));

  function pick(key: string) {
    pendingKey.current = key;
    fileRef.current?.click();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const key = pendingKey.current;
    e.target.value = ""; // allow re-selecting the same file
    if (!file || !key) return;
    try {
      const doc = await upload.mutateAsync({
        doc_type_key: key, original_name: file.name,
        content_type: file.type || "application/pdf", size_bytes: file.size,
      });
      const pct = doc.ocr_confidence != null ? ` · OCR ${Math.round(doc.ocr_confidence * 100)}%` : "";
      toast.success(`${doc.doc_type_name ?? "Document"} uploaded${pct}`);
    } catch (err) {
      toast.error("Upload failed", { description: err instanceof ApiError ? err.message : "Try again." });
    }
  }

  return (
    <Card><CardContent className="space-y-2 pt-6">
      <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={onFile} />
      <div className="mb-1 flex items-center gap-2 rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-800">
        <ScanLine className="size-4" /> Upload each document — OCR reads it and auto-fills your profile. PDF, JPG or PNG.
      </div>
      {isLoading ? <TableSkeleton cols={2} rows={4} /> : MANDATORY_DOCS.map((d) => {
        const doc = byKey.get(d.key);
        const uploaded = !!doc;
        const busy = upload.isPending && pendingKey.current === d.key;
        return (
          <div key={d.key} className={`flex items-center justify-between rounded-md border px-3 py-2 ${uploaded ? "border-emerald-100 bg-emerald-50/40" : "border-border"}`}>
            <div>
              <span className="text-sm font-medium">{d.name}</span>
              {doc?.ocr_confidence != null && (
                <span className="ml-2 text-xs text-muted-foreground">OCR {Math.round(doc.ocr_confidence * 100)}%</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {uploaded
                ? <Badge variant="success"><CheckCircle2 className="size-3" /> On file</Badge>
                : <Badge variant="warning">Missing</Badge>}
              <Button size="sm" variant={uploaded ? "ghost" : "teal"} disabled={busy} onClick={() => pick(d.key)}>
                <Upload className="size-4" /> {busy ? "Uploading…" : uploaded ? "Replace" : "Upload"}
              </Button>
            </div>
          </div>
        );
      })}
      <p className="pt-1 text-xs text-muted-foreground">Expiring documents trigger a re-upload request from your buyer.</p>
    </CardContent></Card>
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
