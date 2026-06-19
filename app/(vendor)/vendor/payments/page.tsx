"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";

import { apiFetch } from "@/lib/api-client";
import type { PaymentRead } from "@/features/payment/types";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/states";
import { formatINR, formatDateTime } from "@/lib/format";

export default function VendorPaymentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["portal-payments"],
    queryFn: () => apiFetch<PaymentRead[]>("/api/v1/portal/payments"),
  });

  const columns = React.useMemo<ColumnDef<PaymentRead>[]>(
    () => [
      { accessorKey: "code", header: "Payment", cell: (c) => <span className="font-mono text-xs">{c.getValue<string>()}</span> },
      { accessorKey: "invoice_code", header: "Invoice", cell: (c) => <span className="font-mono text-xs text-vendor">{c.getValue<string>() ?? "—"}</span> },
      { accessorKey: "vendor_invoice_no", header: "Your Inv #", cell: (c) => <span className="font-mono text-xs">{c.getValue<string>() ?? "—"}</span> },
      { accessorKey: "net_amount", header: "Net Paid", cell: (c) => <span className="font-mono text-xs">{formatINR(Number(c.getValue<string>()))}</span> },
      { accessorKey: "method", header: "Method", cell: (c) => <span className="text-xs uppercase">{c.getValue<string>()}</span> },
      { accessorKey: "utr", header: "UTR", cell: (c) => <span className="font-mono text-[11px]">{c.getValue<string>() ?? "—"}</span> },
      { accessorKey: "paid_at", header: "Paid On", cell: (c) => <span className="text-xs text-muted-foreground">{c.getValue<string>() ? formatDateTime(c.getValue<string>()) : "—"}</span> },
      { accessorKey: "status", header: "Status", cell: (c) => <StatusBadge status={c.getValue<string>()} /> },
    ],
    [],
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Payments</h1>
        <p className="text-sm text-muted-foreground">Disbursements against your invoices, with bank UTR references.</p>
      </div>
      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        empty={<EmptyState title="No payments yet" description="Once an approved invoice is paid, it appears here with its UTR." />}
      />
    </div>
  );
}
