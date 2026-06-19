"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";

import { useVendorPayments, type VendorPayment } from "@/features/portal/api";
import { StatCard } from "@/components/charts";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/states";
import { formatINR } from "@/lib/format";

export default function VendorDeductionsPage() {
  const { data, isLoading } = useVendorPayments();
  const rows = data ?? [];
  const totalTds = rows.reduce((s, p) => s + Number(p.tds_amount), 0);
  const totalGross = rows.reduce((s, p) => s + Number(p.amount), 0);

  const columns = React.useMemo<ColumnDef<VendorPayment>[]>(
    () => [
      { accessorKey: "invoice_code", header: "Invoice", cell: (c) => <span className="font-mono text-xs">{c.getValue<string>() ?? "—"}</span> },
      { accessorKey: "amount", header: "Gross", cell: (c) => <span className="font-mono text-xs">{formatINR(Number(c.getValue<string>()))}</span> },
      { id: "type", header: "TDS Type", cell: () => <span className="text-xs">194Q</span> },
      { id: "rate", header: "Rate", cell: () => <span className="text-xs">0.1%</span> },
      { accessorKey: "tds_amount", header: "Deducted", cell: (c) => <span className="font-mono text-xs text-danger-foreground">−{formatINR(Number(c.getValue<string>()))}</span> },
      { accessorKey: "net_amount", header: "Net Paid", cell: (c) => <span className="font-mono text-xs">{formatINR(Number(c.getValue<string>()))}</span> },
      { accessorKey: "status", header: "26AS", cell: (c) => c.getValue<string>() === "paid" ? <Badge variant="success">Reflected</Badge> : <Badge variant="neutral">Pending</Badge> },
    ],
    [],
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Deductions & TDS</h1>
        <p className="text-sm text-muted-foreground">TDS under §194Q deducted on your invoices (0.1% above the ₹50L threshold).</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Gross Billed" value={formatINR(totalGross)} />
        <StatCard label="Total TDS" value={formatINR(totalTds)} accent="danger" />
        <StatCard label="Section" value="194Q" />
      </div>
      <DataTable columns={columns} data={rows} isLoading={isLoading}
        empty={<EmptyState title="No deductions yet" description="TDS appears once invoices are paid." />} />
    </div>
  );
}
