"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Check, X, ScanLine, FileCheck2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TableSkeleton, ErrorState } from "@/components/shared/states";
import { useApplication, useDecision } from "@/features/onboarding/api";
import { ApiError } from "@/lib/api-client";

function humanize(s: string) {
  return s.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function confColor(c: number) {
  if (c >= 0.85) return "text-success-foreground";
  if (c >= 0.7) return "text-warning-foreground";
  return "text-danger-foreground";
}

export default function ApplicationDetailPage() {
  const { code } = useParams<{ code: string }>();
  const { data: app, isLoading, isError, refetch } = useApplication(code);
  const decision = useDecision(code);

  const [form, setForm] = React.useState({
    category: "",
    payment_terms: "net_30",
    credit_limit: "",
    msme_status: "none",
    notes: "",
  });

  async function decide(kind: "approve" | "reject") {
    try {
      const body =
        kind === "approve"
          ? {
              decision: "approve" as const,
              category: form.category || undefined,
              payment_terms: form.payment_terms,
              credit_limit: form.credit_limit ? Number(form.credit_limit) : undefined,
              msme_status: form.msme_status,
              notes: form.notes || undefined,
            }
          : { decision: "reject" as const, notes: form.notes || undefined };
      const res = await decision.mutateAsync(body);
      toast.success(
        kind === "approve"
          ? res.status === "approved"
            ? "Approved — vendor created"
            : "Approved — advanced to next approver"
          : "Application rejected",
      );
    } catch (err) {
      toast.error("Decision failed", {
        description: err instanceof ApiError ? err.message : "Please try again.",
      });
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <LinkButton href="/onboarding" variant="ghost" size="icon-sm" aria-label="Back">
          <ArrowLeft className="size-4" />
        </LinkButton>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Onboarding Approval{app ? ` · ${app.code}` : ""}</h1>
          {app && (
            <p className="text-sm text-muted-foreground">
              {app.company_name}
              {app.gstin ? ` · ${app.gstin}` : ""}
            </p>
          )}
        </div>
        {app && <StatusBadge status={app.status} />}
      </div>

      {isLoading ? (
        <TableSkeleton cols={2} rows={6} />
      ) : isError || !app ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">
              <ScanLine className="size-4" /> OCR Profile
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileCheck2 className="size-4" /> Documents
              <span className="ml-1 rounded bg-background/60 px-1.5 text-[10px] font-mono">
                {app.docs_uploaded}/{app.docs_required}
              </span>
            </TabsTrigger>
            <TabsTrigger value="decision">
              <ShieldCheck className="size-4" /> Decision
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">OCR-Extracted Profile</CardTitle>
              </CardHeader>
              <CardContent>
                {app.ocr_profile && Object.keys(app.ocr_profile).length > 0 ? (
                  <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                    {Object.entries(app.ocr_profile).map(([key, field]) => (
                      <div key={key} className="flex items-center justify-between gap-3 border-b border-border py-2">
                        <dt className="text-xs text-muted-foreground">{humanize(key)}</dt>
                        <dd className="flex items-center gap-2">
                          <span className="text-sm font-medium">{field.value}</span>
                          <span className={`font-mono text-xs ${confColor(field.confidence)}`}>
                            {Math.round(field.confidence * 100)}%
                          </span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-sm text-muted-foreground">No OCR data yet — vendor has not uploaded documents.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardContent className="space-y-2 pt-6">
                {app.documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
                ) : (
                  app.documents.map((d) => (
                    <div key={d.id} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5">
                      <span className="text-sm font-medium">{d.doc_type_name ?? d.doc_type_key ?? "Document"}</span>
                      <div className="flex items-center gap-3">
                        {d.ocr_confidence != null && (
                          <span className={`font-mono text-xs ${confColor(d.ocr_confidence)}`}>OCR {Math.round(d.ocr_confidence * 100)}%</span>
                        )}
                        <StatusBadge status={d.status} />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="decision">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle className="text-base">Approval Decision</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {app.vendor_id && (
                  <div className="flex items-center gap-2 rounded-md border border-success/40 bg-success/5 px-3 py-2 text-sm text-success-foreground">
                    <Check className="size-4" /> Vendor record created from this application.
                  </div>
                )}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="category">Category</Label>
                    <Input id="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Raw Materials" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Payment Terms</Label>
                    <Select value={form.payment_terms} onValueChange={(v) => setForm({ ...form, payment_terms: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="net_30">Net 30</SelectItem>
                        <SelectItem value="net_45">Net 45</SelectItem>
                        <SelectItem value="net_60">Net 60</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="credit_limit">Credit Limit (₹)</Label>
                    <Input id="credit_limit" type="number" value={form.credit_limit} onChange={(e) => setForm({ ...form, credit_limit: e.target.value })} placeholder="2500000" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>MSME Category</Label>
                    <Select value={form.msme_status} onValueChange={(v) => setForm({ ...form, msme_status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not MSME</SelectItem>
                        <SelectItem value="micro">Micro</SelectItem>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="gold" onClick={() => decide("approve")} disabled={decision.isPending}>
                    <Check className="size-4" /> Approve
                  </Button>
                  <Button variant="destructive" onClick={() => decide("reject")} disabled={decision.isPending}>
                    <X className="size-4" /> Reject
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your role determines which DOA step you can act on; the backend enforces the chain and separation of duties.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
