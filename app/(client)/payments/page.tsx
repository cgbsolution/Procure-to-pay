"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Wallet, Banknote, History } from "lucide-react";

import { usePayable, usePaymentBatches, useCreateBatch, usePayments } from "@/features/payment/api";
import type { PaymentBatchListItem, PaymentRead } from "@/features/payment/types";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState, TableSkeleton } from "@/components/shared/states";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api-client";
import { formatINR, formatDate } from "@/lib/format";

export default function PaymentsPage() {
  const [tab, setTab] = React.useState("payable");
  // Sidebar "Payment History" deep-links via ?tab=history.
  React.useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t) setTab(t);
  }, []);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Payments</h1>
        <p className="text-sm text-muted-foreground">
          Schedule approved invoices into a payment run; a second approver releases it and posts to Tally.
        </p>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="payable"><Banknote className="size-4" /> Payable</TabsTrigger>
          <TabsTrigger value="runs"><Wallet className="size-4" /> Payment Runs</TabsTrigger>
          <TabsTrigger value="history"><History className="size-4" /> Payment History</TabsTrigger>
        </TabsList>
        <TabsContent value="payable"><PayableTab /></TabsContent>
        <TabsContent value="runs"><RunsTab /></TabsContent>
        <TabsContent value="history"><HistoryTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function PayableTab() {
  const router = useRouter();
  const { data, isLoading } = usePayable();
  const create = useCreateBatch();
  const [sel, setSel] = React.useState<Set<string>>(new Set());
  const [open, setOpen] = React.useState(false);
  const [method, setMethod] = React.useState("neft");
  const [batchDate, setBatchDate] = React.useState(new Date().toISOString().slice(0, 10));

  const rows = data ?? [];
  const toggle = (code: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(code)) n.delete(code); else n.add(code);
      return n;
    });
  const allOn = rows.length > 0 && sel.size === rows.length;
  const total = rows.filter((r) => sel.has(r.code)).reduce((s, r) => s + Number(r.net_payable), 0);

  async function submit() {
    try {
      const batch = await create.mutateAsync({
        invoice_codes: [...sel], method: method as "neft", batch_date: batchDate,
      });
      toast.success(`Payment run ${batch.code} created`, { description: `${batch.payment_count} invoice(s) scheduled.` });
      setOpen(false); setSel(new Set());
      router.push(`/payments/${batch.code}`);
    } catch (err) {
      toast.error("Could not create run", { description: err instanceof ApiError ? err.message : "Try again." });
    }
  }

  if (isLoading) return <TableSkeleton cols={5} rows={5} />;
  if (rows.length === 0)
    return <EmptyState title="Nothing to pay" description="Approved invoices awaiting payment will appear here." />;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10">
                <input type="checkbox" aria-label="Select all" checked={allOn}
                  onChange={() => setSel(allOn ? new Set() : new Set(rows.map((r) => r.code)))} />
              </TableHead>
              <TableHead>Invoice</TableHead><TableHead>Vendor</TableHead><TableHead>PO</TableHead>
              <TableHead>Due</TableHead><TableHead className="text-right">Net Payable</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.code} className="cursor-pointer" onClick={() => toggle(r.code)}>
                <TableCell><input type="checkbox" aria-label={`Select ${r.code}`} checked={sel.has(r.code)} onChange={() => toggle(r.code)} onClick={(e) => e.stopPropagation()} /></TableCell>
                <TableCell className="font-mono text-xs">{r.code}</TableCell>
                <TableCell className="font-medium">{r.vendor_legal_name ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs text-primary">{r.po_code ?? "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.payment_due_date ? formatDate(r.payment_due_date) : "—"}</TableCell>
                <TableCell className="text-right font-mono text-xs">{formatINR(Number(r.net_payable))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="sticky bottom-4 flex items-center justify-between rounded-lg border border-border bg-background/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="text-sm">
          <span className="font-semibold">{sel.size}</span> selected ·{" "}
          <span className="font-mono">{formatINR(total)}</span>
        </div>
        <Button variant="gold" disabled={sel.size === 0} onClick={() => setOpen(true)}>
          <Wallet className="size-4" /> Create Payment Run
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Payment Run</DialogTitle>
            <DialogDescription>{sel.size} invoice(s) · {formatINR(total)}. A different approver must release it.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="neft">NEFT</SelectItem>
                  <SelectItem value="rtgs">RTGS</SelectItem>
                  <SelectItem value="imps">IMPS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bd">Batch date</Label>
              <Input id="bd" type="date" value={batchDate} onChange={(e) => setBatchDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="gold" onClick={submit} disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Create Run"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function HistoryTab() {
  const { data, isLoading } = usePayments({ status: "paid", page_size: 200 });
  const columns = React.useMemo<ColumnDef<PaymentRead>[]>(
    () => [
      { accessorKey: "code", header: "Payment", cell: (c) => <span className="font-mono text-xs">{c.getValue<string>()}</span> },
      { id: "vendor", header: "Vendor", cell: (c) => <span className="font-medium">{c.row.original.vendor_legal_name ?? "—"}</span> },
      { accessorKey: "invoice_code", header: "Invoice", cell: (c) => <span className="font-mono text-xs text-primary">{c.getValue<string>() ?? "—"}</span> },
      { accessorKey: "net_amount", header: "Net Paid", cell: (c) => <span className="font-mono text-xs">{formatINR(Number(c.getValue<string>()))}</span> },
      { accessorKey: "tds_amount", header: "TDS", cell: (c) => <span className="font-mono text-xs text-danger-foreground">−{formatINR(Number(c.getValue<string>()))}</span> },
      { accessorKey: "utr", header: "UTR", cell: (c) => <span className="font-mono text-[11px]">{c.getValue<string>() ?? "—"}</span> },
      { accessorKey: "tally_voucher_no", header: "Tally Voucher", cell: (c) => <span className="font-mono text-[11px] text-muted-foreground">{c.getValue<string>() ?? "—"}</span> },
      { accessorKey: "method", header: "Method", cell: (c) => <span className="text-xs uppercase">{c.getValue<string>()}</span> },
    ],
    [],
  );
  return (
    <DataTable
      columns={columns}
      data={data?.data ?? []}
      isLoading={isLoading}
      empty={<EmptyState title="No payments yet" description="Released payments appear here with their bank UTR and Tally voucher." />}
    />
  );
}

function RunsTab() {
  const router = useRouter();
  const { data, isLoading } = usePaymentBatches({ page_size: 100 });

  const columns = React.useMemo<ColumnDef<PaymentBatchListItem>[]>(
    () => [
      { accessorKey: "code", header: "Run", cell: (c) => <span className="font-mono text-xs">{c.getValue<string>()}</span> },
      { accessorKey: "batch_date", header: "Date", cell: (c) => <span className="text-xs text-muted-foreground">{formatDate(c.getValue<string>())}</span> },
      { accessorKey: "method", header: "Method", cell: (c) => <span className="text-xs uppercase">{c.getValue<string>()}</span> },
      { accessorKey: "payment_count", header: "Invoices", cell: (c) => <span className="font-mono text-xs">{c.getValue<number>()}</span> },
      { accessorKey: "total_amount", header: "Total", cell: (c) => <span className="font-mono text-xs">{formatINR(Number(c.getValue<string>()))}</span> },
      { accessorKey: "status", header: "Status", cell: (c) => <StatusBadge status={c.getValue<string>()} /> },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={data?.data ?? []}
      isLoading={isLoading}
      onRowClick={(b) => router.push(`/payments/${b.code}`)}
      empty={<EmptyState title="No payment runs yet" description="Create one from the Payable tab." />}
    />
  );
}
