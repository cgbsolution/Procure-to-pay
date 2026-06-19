"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Banknote, X, CheckCircle2, XCircle, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TableSkeleton, ErrorState } from "@/components/shared/states";
import { usePaymentBatch, useBatchAction } from "@/features/payment/api";
import { ApiError } from "@/lib/api-client";
import { formatINR, formatDate, formatDateTime } from "@/lib/format";

function TallyBadge({ status }: { status: string }) {
  if (status === "synced") return <Badge variant="success"><CheckCircle2 className="size-3" /> Synced</Badge>;
  if (status === "failed") return <Badge variant="danger"><XCircle className="size-3" /> Failed</Badge>;
  return <Badge variant="neutral"><Clock className="size-3" /> Pending</Badge>;
}

export default function BatchDetailPage() {
  const { code } = useParams<{ code: string }>();
  const { data: batch, isLoading, isError, refetch } = usePaymentBatch(code);
  const release = useBatchAction(code, "release");
  const cancel = useBatchAction(code, "cancel");

  async function act(kind: "release" | "cancel") {
    if (!batch) return;
    const m = kind === "release" ? release : cancel;
    try {
      await m.mutateAsync(batch.version);
      toast.success(kind === "release" ? "Payment run released & posted to Tally" : "Run cancelled");
    } catch (err) {
      toast.error("Action failed", { description: err instanceof ApiError ? err.message : "Try again." });
    }
  }

  if (isLoading) return <TableSkeleton cols={3} rows={6} />;
  if (isError || !batch) return <ErrorState onRetry={() => refetch()} />;

  const pending = batch.status === "pending_release";
  const busy = release.isPending || cancel.isPending;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <LinkButton href="/payments" variant="ghost" size="icon-sm" aria-label="Back"><ArrowLeft className="size-4" /></LinkButton>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{batch.code}</h1>
          <p className="text-sm text-muted-foreground">
            {batch.method.toUpperCase()} · {batch.payment_count} invoice(s) · {formatINR(Number(batch.total_amount))} · {formatDate(batch.batch_date)}
          </p>
        </div>
        <StatusBadge status={batch.status} />
      </div>

      {pending && (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 pt-6">
            <Button variant="gold" onClick={() => act("release")} disabled={busy}>
              <Banknote className="size-4" /> Release & Post to Tally
            </Button>
            <Button variant="outline" onClick={() => act("cancel")} disabled={busy}>
              <X className="size-4" /> Cancel Run
            </Button>
            <p className="text-xs text-muted-foreground">
              Separation of duties: the releaser must differ from the scheduler.
            </p>
          </CardContent>
        </Card>
      )}

      {batch.released_at && (
        <p className="text-xs text-muted-foreground">Released {formatDateTime(batch.released_at)}.</p>
      )}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Payment</TableHead><TableHead>Vendor</TableHead><TableHead>Invoice</TableHead>
              <TableHead className="text-right">Net</TableHead><TableHead>UTR</TableHead>
              <TableHead>Tally Voucher</TableHead><TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batch.payments.map((p) => (
              <TableRow key={p.code} className="hover:bg-transparent">
                <TableCell className="font-mono text-xs">{p.code}</TableCell>
                <TableCell className="font-medium">{p.vendor_legal_name ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs text-primary">{p.invoice_code ?? "—"}</TableCell>
                <TableCell className="text-right font-mono text-xs">{formatINR(Number(p.net_amount))}</TableCell>
                <TableCell className="font-mono text-[11px]">{p.utr ?? "—"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <TallyBadge status={p.tally_sync_status} />
                    {p.tally_voucher_no && <span className="font-mono text-[11px] text-muted-foreground">{p.tally_voucher_no}</span>}
                  </div>
                </TableCell>
                <TableCell><StatusBadge status={p.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
