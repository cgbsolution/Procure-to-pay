"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Check, X, CornerUpLeft, Send, FileText, Wallet, GitBranch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TableSkeleton, ErrorState } from "@/components/shared/states";
import { usePR, usePRBudget, usePRRouting, useSubmitPR, usePRDecision, useCancelPR } from "@/features/pr/api";
import { CreatePODialog } from "@/features/po/CreatePODialog";
import { ApiError } from "@/lib/api-client";
import { formatINR, formatDate } from "@/lib/format";

export default function PRDetailPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { data: pr, isLoading, isError, refetch } = usePR(code);
  const budget = usePRBudget(code);
  const routing = usePRRouting(code);
  const submit = useSubmitPR(code);
  const cancel = useCancelPR(code);
  const decision = usePRDecision(code);
  const busy = submit.isPending || cancel.isPending || decision.isPending;

  async function act(fn: () => Promise<unknown>, okMsg: string) {
    try {
      await fn();
      toast.success(okMsg);
    } catch (err) {
      toast.error("Action failed", { description: err instanceof ApiError ? err.message : "Try again." });
    }
  }

  if (isLoading) return <TableSkeleton cols={2} rows={6} />;
  if (isError || !pr) return <ErrorState onRetry={() => refetch()} />;

  const v = pr.version;
  const canSubmit = pr.status === "draft" || pr.status === "returned";
  const canDecide = pr.status === "pending_approval";
  const canCreatePO = pr.status === "approved";
  const canCancel = !["po_created", "cancelled", "rejected"].includes(pr.status);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <LinkButton href="/requisitions" variant="ghost" size="icon-sm" aria-label="Back">
          <ArrowLeft className="size-4" />
        </LinkButton>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{pr.code}</h1>
          <p className="text-sm text-muted-foreground">
            {pr.title} · {pr.department} · {pr.category} · <span className="uppercase">{pr.capex_opex}</span>
          </p>
        </div>
        <StatusBadge status={pr.status} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left: lines + actions */}
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText className="size-4" /> Line Items</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Item</TableHead><TableHead>HSN</TableHead><TableHead>UOM</TableHead>
                    <TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pr.lines.map((l) => (
                    <TableRow key={l.id} className="hover:bg-transparent">
                      <TableCell className="font-medium">{l.item_desc}</TableCell>
                      <TableCell className="font-mono text-xs">{l.hsn_code ?? "—"}</TableCell>
                      <TableCell>{l.uom}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{l.qty}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatINR(Number(l.est_rate))}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatINR(Number(l.amount))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-3 flex justify-end border-t border-border pt-3 text-sm">
                Estimated value&nbsp;<span className="font-mono font-semibold">{formatINR(Number(pr.est_value))}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Actions</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {canSubmit && (
                <Button variant="navy" disabled={busy}
                  onClick={() => act(() => submit.mutateAsync({ expected_version: v }), "Submitted for approval")}>
                  <Send className="size-4" /> Submit for Approval
                </Button>
              )}
              {canDecide && (
                <>
                  <Button variant="gold" disabled={busy}
                    onClick={() => act(() => decision.decide(v, "approve"), "Approved")}>
                    <Check className="size-4" /> Approve
                  </Button>
                  <Button variant="destructive" disabled={busy}
                    onClick={() => act(() => decision.decide(v, "reject"), "Rejected")}>
                    <X className="size-4" /> Reject
                  </Button>
                  <Button variant="outline" disabled={busy}
                    onClick={() => act(() => decision.decide(v, "return"), "Returned")}>
                    <CornerUpLeft className="size-4" /> Return
                  </Button>
                </>
              )}
              {canCreatePO && (
                <CreatePODialog
                  prId={pr.id}
                  onCreated={(poCode) => router.push(`/purchase-orders/${poCode}`)}
                  trigger={<Button variant="navy"><FileText className="size-4" /> Create PO</Button>}
                />
              )}
              {canCancel && (
                <Button variant="ghost" disabled={busy}
                  onClick={() => act(() => cancel.mutateAsync({ expected_version: v }), "Cancelled")}>
                  Cancel PR
                </Button>
              )}
              {pr.status === "po_created" && (
                <p className="text-sm text-muted-foreground">A purchase order has been created from this PR.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: budget + routing */}
        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Wallet className="size-4" /> Budget</CardTitle></CardHeader>
            <CardContent>
              {budget.isError ? (
                <p className="text-sm text-muted-foreground">Budget details require requester access.</p>
              ) : !budget.data ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : (
                <div className="space-y-2 text-sm">
                  <Row label="Allocated" value={formatINR(Number(budget.data.allocated))} />
                  <Row label="Encumbered" value={formatINR(Number(budget.data.reserved))} />
                  <Row label="Available" value={formatINR(Number(budget.data.available))} strong />
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-accent"
                      style={{ width: `${pctUsed(budget.data.allocated, budget.data.available)}%` }} />
                  </div>
                  <div className={budget.data.within ? "text-success-foreground" : "text-danger-foreground"}>
                    {budget.data.within ? "✓ Within budget" : `✗ ${budget.data.reason ?? "Budget exceeded"}`}
                  </div>
                  {pr.reserved_at && <Badge variant="success">Reserved</Badge>}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><GitBranch className="size-4" /> DOA Routing</CardTitle></CardHeader>
            <CardContent>
              {routing.isError ? (
                <p className="text-sm text-muted-foreground">Routing preview requires requester access.</p>
              ) : !routing.data ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : routing.data.length === 0 ? (
                <p className="text-sm text-muted-foreground">No approval steps apply.</p>
              ) : (
                <ol className="space-y-2">
                  {routing.data.map((s) => (
                    <li key={s.sequence} className="flex items-center gap-3">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                        {s.level}
                      </span>
                      <div className="text-sm">
                        <div className="font-medium capitalize">{s.approver_role.replace(/_/g, " ")}</div>
                        {s.sla_hours != null && <div className="text-xs text-muted-foreground">SLA {s.sla_hours}h</div>}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 pt-6 text-sm">
              <Row label="Required by" value={formatDate(pr.required_by)} />
              <Row label="Cost centre" value={pr.cost_centre ?? "—"} />
              <Row label="FY" value={pr.fy} />
              {pr.justification && (
                <div className="border-t border-border pt-2">
                  <div className="text-xs text-muted-foreground">Justification</div>
                  <div>{pr.justification}</div>
                </div>
              )}
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
      <span className={strong ? "font-mono font-semibold" : "font-mono text-xs"}>{value}</span>
    </div>
  );
}

function pctUsed(allocated: string, available: string) {
  const a = Number(allocated);
  if (!a) return 0;
  return Math.min(100, Math.max(0, Math.round(((a - Number(available)) / a) * 100)));
}
