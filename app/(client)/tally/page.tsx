"use client";

import * as React from "react";
import { toast } from "sonner";
import { RefreshCw, Upload, Download, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

import { useTallySync, useRetryTally } from "@/features/tally/api";
import { usePayments } from "@/features/payment/api";
import type { PaymentRead } from "@/features/payment/types";
import { StatCard } from "@/components/charts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/shared/states";
import { ApiError } from "@/lib/api-client";
import { formatINR } from "@/lib/format";

function SyncBadge({ status }: { status: string }) {
  if (status === "synced") return <Badge variant="success"><CheckCircle2 className="size-3" /> Synced</Badge>;
  if (status === "failed") return <Badge variant="danger"><AlertTriangle className="size-3" /> Failed</Badge>;
  return <Badge variant="neutral"><Clock className="size-3" /> Pending</Badge>;
}

export default function TallySyncPage() {
  const { data: sync, isLoading: syncLoading } = useTallySync();
  const { data: payments } = usePayments({ status: "paid", page_size: 200 });
  const retry = useRetryTally();
  const rows = payments?.data ?? [];
  const sample = rows.find((p) => p.tally_voucher_no) ?? rows[0];

  async function onRetry() {
    try {
      const r = await retry.mutateAsync();
      toast.success("Tally retry complete", { description: `${r.synced}/${r.retried} re-synced.` });
    } catch (err) {
      toast.error("Retry failed", { description: err instanceof ApiError ? err.message : "Try again." });
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">Tally Sync</h1>
          <p className="text-sm text-muted-foreground">Payment vouchers pushed to Tally Prime; UTRs reconciled back. Failures are surfaced and retryable.</p>
        </div>
        {(sync?.failed ?? 0) > 0 && (
          <Button variant="outline" onClick={onRetry} disabled={retry.isPending}>
            <RefreshCw className={`size-4 ${retry.isPending ? "animate-spin" : ""}`} /> Retry failed
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Synced" value={sync?.synced ?? 0} icon={<CheckCircle2 className="size-4" />} accent="success" />
        <StatCard label="Failed" value={sync?.failed ?? 0} icon={<AlertTriangle className="size-4" />} accent={(sync?.failed ?? 0) > 0 ? "danger" : "default"} />
        <StatCard label="Pending" value={sync?.pending ?? 0} icon={<Clock className="size-4" />} />
        <StatCard label="Total Vouchers" value={sync?.total ?? 0} icon={<Upload className="size-4" />} accent="navy" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base"><Upload className="mr-1 inline size-4" /> Voucher Push & Reconciliation</CardTitle>
          </CardHeader>
          <CardContent>
            {syncLoading ? <TableSkeleton cols={4} rows={5} /> : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Payment</TableHead><TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Net</TableHead><TableHead>Voucher</TableHead>
                    <TableHead>UTR</TableHead><TableHead>Sync</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((p: PaymentRead) => (
                    <TableRow key={p.code} className="hover:bg-transparent">
                      <TableCell className="font-mono text-xs">{p.code}</TableCell>
                      <TableCell className="font-medium">{p.vendor_legal_name ?? "—"}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatINR(Number(p.net_amount))}</TableCell>
                      <TableCell className="font-mono text-[11px] text-muted-foreground">{p.tally_voucher_no ?? "—"}</TableCell>
                      <TableCell className="font-mono text-[11px] text-success-foreground">{p.utr ?? "—"}</TableCell>
                      <TableCell><SyncBadge status={p.tally_sync_status} /></TableCell>
                    </TableRow>
                  ))}
                  {rows.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">No vouchers yet. Release a payment run to push to Tally.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base"><Download className="mr-1 inline size-4" /> Voucher XML</CardTitle></CardHeader>
          <CardContent>
            {sample ? (
              <pre className="overflow-auto rounded-md bg-slate-900 p-3 text-[10px] leading-relaxed text-slate-300">
{`<TALLYMESSAGE>
  <VOUCHER TYPE="Payment">
    <PARTYLEDGERNAME>${sample.vendor_legal_name ?? ""}</PARTYLEDGERNAME>
    <AMOUNT>${sample.amount}</AMOUNT>
    <TDSAMOUNT>${sample.tds_amount}</TDSAMOUNT>
    <NETAMOUNT>${sample.net_amount}</NETAMOUNT>
    <UTR>${sample.utr ?? "pending"}</UTR>
    <NARRATION>${sample.code} · ${sample.invoice_code ?? ""}</NARRATION>
    <VOUCHERNUMBER>${sample.tally_voucher_no ?? "pending"}</VOUCHERNUMBER>
  </VOUCHER>
</TALLYMESSAGE>`}
            </pre>
            ) : <p className="text-sm text-muted-foreground">No voucher to preview.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
