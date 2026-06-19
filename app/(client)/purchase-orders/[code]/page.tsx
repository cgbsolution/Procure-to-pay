"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Check, X, Send, Truck, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TableSkeleton, ErrorState } from "@/components/shared/states";
import { usePO, useSubmitPO, usePODecision, useDispatchPO } from "@/features/po/api";
import { RecordGRNDialog } from "@/features/grn/RecordGRNDialog";
import { ApiError } from "@/lib/api-client";
import { formatINR, formatDate } from "@/lib/format";

const RECEIVABLE = ["dispatched", "acknowledged", "partially_received"];

const FLOW = ["draft", "pending_approval", "approved", "dispatched", "acknowledged"];
const FLOW_LABEL: Record<string, string> = {
  draft: "Draft", pending_approval: "Approval", approved: "Approved",
  dispatched: "Dispatched", acknowledged: "Acknowledged",
};

export default function PODetailPage() {
  const { code } = useParams<{ code: string }>();
  const { data: po, isLoading, isError, refetch } = usePO(code);
  const submit = useSubmitPO(code);
  const decision = usePODecision(code);
  const dispatch = useDispatchPO(code);
  const busy = submit.isPending || decision.isPending || dispatch.isPending;

  async function act(fn: () => Promise<unknown>, ok: string) {
    try {
      await fn();
      toast.success(ok);
    } catch (err) {
      toast.error("Action failed", { description: err instanceof ApiError ? err.message : "Try again." });
    }
  }

  if (isLoading) return <TableSkeleton cols={2} rows={6} />;
  if (isError || !po) return <ErrorState onRetry={() => refetch()} />;

  const v = po.version;
  const activeIdx = FLOW.indexOf(po.status === "cancelled" ? "draft" : po.status);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <LinkButton href="/purchase-orders" variant="ghost" size="icon-sm" aria-label="Back">
          <ArrowLeft className="size-4" />
        </LinkButton>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{po.code}</h1>
          <p className="text-sm text-muted-foreground">
            {po.vendor_legal_name ?? "Vendor"} · {formatINR(Number(po.total_amount))}
            {po.revision_no > 0 ? ` · rev ${po.revision_no}` : ""}
          </p>
        </div>
        <StatusBadge status={po.status} />
      </div>

      {/* status flow */}
      <div className="flex flex-wrap items-center gap-1.5">
        {FLOW.map((s, i) => (
          <React.Fragment key={s}>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${
              i <= activeIdx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>{FLOW_LABEL[s]}</span>
            {i < FLOW.length - 1 && <span className="text-muted-foreground">›</span>}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText className="size-4" /> Line Items</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Item</TableHead><TableHead>HSN</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">Accepted</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">GST%</TableHead><TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {po.lines.map((l) => {
                    const tax = Number(l.cgst_amount) + Number(l.sgst_amount) + Number(l.igst_amount);
                    return (
                      <TableRow key={l.id} className="hover:bg-transparent">
                        <TableCell className="font-medium">{l.item_desc}</TableCell>
                        <TableCell className="font-mono text-xs">{l.hsn_code}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{l.qty_ordered}</TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          <span className={Number(l.qty_received) >= Number(l.qty_ordered) ? "text-success-foreground" : ""}>
                            {l.qty_received}/{l.qty_ordered}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">{l.qty_accepted}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{formatINR(Number(l.rate))}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{Number(l.gst_rate)}%</TableCell>
                        <TableCell className="text-right font-mono text-xs">{formatINR(tax)}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{formatINR(Number(l.line_amount))}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
                <Row label="Base" value={formatINR(Number(po.base_amount))} />
                <Row label="Freight" value={formatINR(Number(po.freight_amount))} />
                <Row label={`GST (${po.is_inter_state ? "IGST" : "CGST+SGST"})`} value={formatINR(Number(po.tax_amount))} />
                <Row label="Total" value={formatINR(Number(po.total_amount))} strong />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Actions</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {po.status === "draft" && (
                <Button variant="navy" disabled={busy}
                  onClick={() => act(() => submit.mutateAsync({ expected_version: v }), "Submitted for approval")}>
                  <Send className="size-4" /> Submit for Approval
                </Button>
              )}
              {po.status === "pending_approval" && (
                <>
                  <Button variant="gold" disabled={busy} onClick={() => act(() => decision.decide(v, "approve"), "Approved")}>
                    <Check className="size-4" /> Approve
                  </Button>
                  <Button variant="destructive" disabled={busy} onClick={() => act(() => decision.decide(v, "reject"), "Rejected")}>
                    <X className="size-4" /> Reject
                  </Button>
                </>
              )}
              {po.status === "approved" && (
                <Button variant="teal" disabled={busy} onClick={() => act(() => dispatch.mutateAsync(), "Dispatched to vendor portal")}>
                  <Truck className="size-4" /> Dispatch to Vendor
                </Button>
              )}
              {RECEIVABLE.includes(po.status) && (
                <RecordGRNDialog
                  poCode={po.code}
                  lines={po.lines}
                  trigger={<Button variant="teal"><Truck className="size-4" /> Record GRN</Button>}
                />
              )}
              {["dispatched", "acknowledged", "partially_received", "received"].includes(po.status) && (
                <p className="self-center text-sm text-muted-foreground">
                  Vendor ack: <StatusBadge status={po.vendor_ack_status} />
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Vendor" value={po.vendor_legal_name ?? "—"} />
              <Row label="Payment terms" value={po.payment_terms.replace("_", " ")} />
              <Row label="Place of supply" value={po.place_of_supply_state_code} />
              <Row label="Tax type" value={po.is_inter_state ? "IGST (inter-state)" : "CGST+SGST (intra)"} />
              <Row label="Delivery by" value={formatDate(po.delivery_required_by)} />
              <Row label="Location" value={po.delivery_location ?? "—"} />
              <Row label="Budget" value={po.budget_committed ? "Committed" : "Not committed"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Source Requisitions</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {po.source_prs.length === 0 ? (
                <span className="text-sm text-muted-foreground">—</span>
              ) : (
                po.source_prs.map((s) => (
                  <Badge key={s.pr_id} variant="neutral" className="font-mono text-[10px]">{s.pr_id.slice(0, 8)}…</Badge>
                ))
              )}
              <p className="w-full text-xs text-muted-foreground">
                {po.source_prs.length} requisition{po.source_prs.length === 1 ? "" : "s"} consolidated into this PO.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={strong ? "font-mono font-semibold" : "text-sm capitalize"}>{value}</span>
    </div>
  );
}
