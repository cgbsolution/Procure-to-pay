"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Download } from "lucide-react";

import { useVendorPayments, type VendorPayment } from "@/features/portal/api";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/states";
import { downloadCsv } from "@/lib/csv";
import { formatINR, formatDateTime } from "@/lib/format";

export default function VendorRemittancePage() {
  const { data, isLoading } = useVendorPayments();
  const paid = (data ?? []).filter((p) => p.status === "paid");

  const columns = React.useMemo<ColumnDef<VendorPayment>[]>(
    () => [
      { accessorKey: "invoice_code", header: "Invoice", cell: (c) => <span className="font-mono text-xs">{c.getValue<string>() ?? "—"}</span> },
      { accessorKey: "paid_at", header: "Paid On", cell: (c) => <span className="text-xs text-muted-foreground">{c.getValue<string>() ? formatDateTime(c.getValue<string>()) : "—"}</span> },
      { accessorKey: "amount", header: "Gross", cell: (c) => <span className="font-mono text-xs">{formatINR(Number(c.getValue<string>()))}</span> },
      { accessorKey: "tds_amount", header: "TDS", cell: (c) => <span className="font-mono text-xs">{formatINR(Number(c.getValue<string>()))}</span> },
      { accessorKey: "net_amount", header: "Net", cell: (c) => <span className="font-mono text-xs font-semibold">{formatINR(Number(c.getValue<string>()))}</span> },
      { accessorKey: "utr", header: "UTR", cell: (c) => <span className="font-mono text-[11px]">{c.getValue<string>() ?? "—"}</span> },
      { accessorKey: "method", header: "Method", cell: (c) => <span className="text-xs uppercase">{c.getValue<string>()}</span> },
    ],
    [],
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">Remittance Advices</h1>
          <p className="text-sm text-muted-foreground">Settled payments with bank UTR references.</p>
        </div>
        {paid.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => { downloadCsv("remittances.csv", paid); toast.success("Exported"); }}>
            <Download className="size-4" /> Export CSV
          </Button>
        )}
      </div>
      <DataTable columns={columns} data={paid} isLoading={isLoading}
        empty={<EmptyState title="No remittances yet" description="Paid invoices appear here with their UTR." />} />
    </div>
  );
}
