"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, Check, X, CornerUpLeft, ShieldCheck, GitMerge, FileText, ScanLine,
  CheckCircle2, XCircle, MinusCircle, AlertTriangle, History,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TableSkeleton, ErrorState } from "@/components/shared/states";
import { useInvoice, useInvoiceDecision } from "@/features/invoice/api";
import { useTimeline } from "@/features/analytics/api";
import type { ValidationResult } from "@/features/invoice/types";
import { ApiError } from "@/lib/api-client";
import { formatINR, formatDate, formatDateTime } from "@/lib/format";

function humanize(s: string) {
  return s.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function ResultIcon({ result }: { result: string }) {
  if (result === "pass") return <CheckCircle2 className="size-4 text-success-foreground" />;
  if (result === "fail") return <XCircle className="size-4 text-danger-foreground" />;
  if (result === "warn") return <AlertTriangle className="size-4 text-warning-foreground" />;
  return <MinusCircle className="size-4 text-muted-foreground" />;
}

export default function InvoiceDetailPage() {
  const { code } = useParams<{ code: string }>();
  const { data: inv, isLoading, isError, refetch } = useInvoice(code);
  const decision = useInvoiceDecision(code);
  const timeline = useTimeline("invoice", inv?.id);

  async function act(action: "approve" | "reject" | "return") {
    if (!inv) return;
    try {
      await decision.decide(inv.version, action);
      toast.success(action === "approve" ? "Approved" : action === "reject" ? "Rejected" : "Returned");
    } catch (err) {
      toast.error("Action failed", { description: err instanceof ApiError ? err.message : "Try again." });
    }
  }

  if (isLoading) return <TableSkeleton cols={2} rows={6} />;
  if (isError || !inv) return <ErrorState onRetry={() => refetch()} />;

  const vr = inv.validation_results ?? [];
  const vPass = vr.filter((v: ValidationResult) => v.result === "pass").length;
  const mc = inv.match_results ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <LinkButton href="/invoices" variant="ghost" size="icon-sm" aria-label="Back"><ArrowLeft className="size-4" /></LinkButton>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{inv.code}</h1>
          <p className="text-sm text-muted-foreground">
            {inv.vendor_legal_name} · {inv.vendor_invoice_no} · {formatINR(Number(inv.total_amount))}
            {inv.po_code ? ` · ${inv.po_code}` : ""}
          </p>
        </div>
        <StatusBadge status={inv.status} />
      </div>

      {/* pipeline rail */}
      <div className="flex flex-wrap items-center gap-2">
        <PipeStep label="Received" done icon={<ScanLine className="size-3.5" />} />
        <span className="text-muted-foreground">›</span>
        <PipeStep label={`Validation ${vPass}/${vr.length}`} done={inv.validation_status === "passed"}
          fail={inv.validation_status === "failed"} icon={<ShieldCheck className="size-3.5" />} />
        <span className="text-muted-foreground">›</span>
        <PipeStep label="3-Way Match" done={inv.match_result === "pass"} fail={inv.match_result === "fail"}
          icon={<GitMerge className="size-3.5" />} />
        <span className="text-muted-foreground">›</span>
        <PipeStep label="Approval" done={inv.status === "approved"} icon={<Check className="size-3.5" />} />
      </div>

      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary"><FileText className="size-4" /> Summary</TabsTrigger>
          <TabsTrigger value="ocr"><ScanLine className="size-4" /> OCR</TabsTrigger>
          <TabsTrigger value="validation">
            <ShieldCheck className="size-4" /> Validation
            <span className="ml-1 rounded bg-background/60 px-1.5 text-[10px] font-mono">{vPass}/{vr.length}</span>
          </TabsTrigger>
          <TabsTrigger value="match"><GitMerge className="size-4" /> 3-Way Match</TabsTrigger>
          <TabsTrigger value="lines"><FileText className="size-4" /> Lines</TabsTrigger>
          <TabsTrigger value="activity"><History className="size-4" /> Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-base">Amounts</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Taxable value" value={formatINR(Number(inv.taxable_value))} />
                <Row label="CGST" value={formatINR(Number(inv.cgst))} />
                <Row label="SGST" value={formatINR(Number(inv.sgst))} />
                <Row label="IGST" value={formatINR(Number(inv.igst))} />
                <Row label="Total" value={formatINR(Number(inv.total_amount))} strong />
                <div className="border-t border-border pt-2" />
                <Row label={`TDS (${inv.tds_section ?? "—"})`} value={`− ${formatINR(Number(inv.tds_amount))}`} />
                <Row label="Net payable" value={formatINR(Number(inv.net_payable))} strong />
              </CardContent>
            </Card>
            <div className="space-y-5">
              <Card>
                <CardContent className="space-y-2 pt-6 text-sm">
                  <Row label="Payment due" value={inv.payment_due_date ? formatDate(inv.payment_due_date) : "—"} />
                  <Row label="Source" value={inv.source} />
                  <Row label="Match type" value={inv.match_type.replace("_", "-")} />
                  <Row label="OCR confidence" value={inv.ocr_confidence != null ? `${Math.round(inv.ocr_confidence * 100)}%` : "—"} />
                </CardContent>
              </Card>
              {inv.status === "pending_approval" && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Approval</CardTitle></CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    <Button variant="gold" onClick={() => act("approve")} disabled={decision.isPending}><Check className="size-4" /> Approve</Button>
                    <Button variant="destructive" onClick={() => act("reject")} disabled={decision.isPending}><X className="size-4" /> Reject</Button>
                    <Button variant="outline" onClick={() => act("return")} disabled={decision.isPending}><CornerUpLeft className="size-4" /> Return</Button>
                    <p className="text-xs text-muted-foreground">DOA tier role is enforced by the backend.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ocr">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Document</CardTitle></CardHeader>
              <CardContent>
                <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border bg-muted/40 py-10">
                  <FileText className="size-12 text-muted-foreground/40" />
                  <div className="text-xs text-muted-foreground">{inv.code}_{inv.vendor_invoice_no}.pdf</div>
                  <span className="rounded border-2 border-amber-400 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">▭ Invoice No. field detected</span>
                  <span className="rounded border-2 border-rose-400 bg-rose-50 px-2 py-0.5 text-[11px] text-rose-600">▭ HSN field — low confidence</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">Extracted Fields</CardTitle>
                <Badge variant={(inv.ocr_confidence ?? 0) >= 0.9 ? "success" : "warning"}>
                  OCR {inv.ocr_confidence != null ? Math.round(inv.ocr_confidence * 100) : "—"}%
                </Badge>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {([
                  ["Invoice No.", inv.vendor_invoice_no, 99],
                  ["Invoice Date", formatDate(inv.invoice_date), 98],
                  ["Vendor", inv.vendor_legal_name ?? "—", 97],
                  ["PO Reference", inv.po_code ?? "—", 96],
                  ["Taxable Value", formatINR(Number(inv.taxable_value)), 97],
                  ["CGST", formatINR(Number(inv.cgst)), 96],
                  ["SGST", formatINR(Number(inv.sgst)), 96],
                  ["IGST", formatINR(Number(inv.igst)), 96],
                  ["Total Amount", formatINR(Number(inv.total_amount)), 98],
                  ["HSN Code", inv.lines[0]?.hsn_code ?? "—", 71],
                ] as [string, string, number][]).map(([label, value, conf]) => (
                  <div key={label} className={`flex items-center gap-3 rounded-md border px-3 py-1.5 ${
                    conf >= 90 ? "border-emerald-100 bg-emerald-50/50" : conf >= 80 ? "border-amber-100 bg-amber-50/50" : "border-rose-100 bg-rose-50/50"}`}>
                    <span className="w-28 shrink-0 text-xs text-muted-foreground">{label}</span>
                    <span className="flex-1 text-sm font-medium">{value}</span>
                    <span className={`font-mono text-xs ${conf >= 90 ? "text-success-foreground" : conf >= 80 ? "text-warning-foreground" : "text-danger-foreground"}`}>{conf}%</span>
                  </div>
                ))}
                <p className="pt-1 text-xs text-muted-foreground">Low-confidence fields are highlighted for manual confirmation before validation.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="validation">
          <Card>
            <CardContent className="space-y-1.5 pt-6">
              {vr.length === 0 ? <p className="text-sm text-muted-foreground">No validation run.</p> :
                vr.map((v: ValidationResult) => (
                  <div key={v.layer_key} className="flex items-start gap-3 rounded-md border border-border px-3 py-2">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">{v.sequence}</span>
                    <ResultIcon result={v.result} />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{humanize(v.layer_key)}</div>
                      <div className="text-xs text-muted-foreground">{v.message}</div>
                    </div>
                    <Badge variant={v.result === "pass" ? "success" : v.result === "fail" ? "danger" : "neutral"} className="uppercase">{v.result}</Badge>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="match">
          <Card>
            <CardContent className="pt-6">
              {mc.length === 0 ? <p className="text-sm text-muted-foreground">Match not run (validation may have failed).</p> : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Check</TableHead><TableHead>PO</TableHead><TableHead>GRN</TableHead>
                      <TableHead>Invoice</TableHead><TableHead>Variance</TableHead><TableHead>Tol.</TableHead>
                      <TableHead>Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mc.map((m) => (
                      <TableRow key={m.check_key} className="hover:bg-transparent">
                        <TableCell className="font-medium">{humanize(m.check_key)}</TableCell>
                        <TableCell className="font-mono text-xs">{m.po_value}</TableCell>
                        <TableCell className="font-mono text-xs">{m.grn_value}</TableCell>
                        <TableCell className="font-mono text-xs">{m.invoice_value}</TableCell>
                        <TableCell className="font-mono text-xs">{m.variance}</TableCell>
                        <TableCell className="font-mono text-xs">{m.tolerance}</TableCell>
                        <TableCell><Badge variant={m.result === "pass" ? "success" : "danger"} className="uppercase">{m.result}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lines">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Item</TableHead><TableHead>HSN</TableHead>
                    <TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">GST%</TableHead><TableHead className="text-right">Taxable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inv.lines.map((l) => (
                    <TableRow key={l.id} className="hover:bg-transparent">
                      <TableCell className="font-medium">{l.item_desc}</TableCell>
                      <TableCell className="font-mono text-xs">{l.hsn_code ?? "—"}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{l.qty}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatINR(Number(l.rate))}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{Number(l.gst_rate)}%</TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatINR(Number(l.taxable_value))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardContent className="pt-6">
              {(timeline.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity recorded.</p>
              ) : (
                <ol className="relative space-y-4 border-l border-border pl-5">
                  {(timeline.data ?? []).map((e, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[1.45rem] top-1 size-2.5 rounded-full bg-primary ring-4 ring-background" />
                      <div className="text-sm font-medium">{humanize(e.action.replace(/^invoice\./, ""))}</div>
                      <div className="text-xs text-muted-foreground">
                        {e.actor}{e.at ? ` · ${formatDateTime(e.at)}` : ""}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PipeStep({ label, done, fail, icon }: { label: string; done?: boolean; fail?: boolean; icon: React.ReactNode }) {
  return (
    <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
      fail ? "bg-danger/10 text-danger-foreground" : done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
    }`}>
      {icon}{label}
    </span>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={strong ? "font-mono font-semibold" : "font-mono text-xs"}>{value}</span>
    </div>
  );
}
