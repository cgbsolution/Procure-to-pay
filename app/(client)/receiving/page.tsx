"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";

import { useGRNs, type GRNListItem } from "@/features/grn/api";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/states";
import { formatDate } from "@/lib/format";

export default function ReceivingPage() {
  const router = useRouter();
  const { data, isLoading } = useGRNs({ page_size: 100 });

  const columns = React.useMemo<ColumnDef<GRNListItem>[]>(
    () => [
      { accessorKey: "code", header: "GRN", cell: (c) => <span className="font-mono text-xs">{c.getValue<string>()}</span> },
      {
        accessorKey: "po_code", header: "PO",
        cell: (c) => <span className="font-mono text-xs text-primary">{c.getValue<string>() ?? "—"}</span>,
      },
      { accessorKey: "grn_date", header: "Date", cell: (c) => <span className="text-xs text-muted-foreground">{formatDate(c.getValue<string>())}</span> },
      { accessorKey: "status", header: "Status", cell: (c) => <StatusBadge status={c.getValue<string>()} /> },
    ],
    [],
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Goods Receipts</h1>
        <p className="text-sm text-muted-foreground">
          Receipts are recorded from a dispatched PO; the accepted quantity unlocks invoicing.
        </p>
      </div>
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        onRowClick={(g) => g.po_code && router.push(`/purchase-orders/${g.po_code}`)}
        empty={<EmptyState title="No goods receipts yet" description="Record a GRN from a dispatched purchase order." />}
      />
    </div>
  );
}
