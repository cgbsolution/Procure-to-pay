"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";

import { usePOs, type POFilters } from "@/features/po/api";
import type { POListItem } from "@/features/po/types";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/states";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatINR, formatDate } from "@/lib/format";

const STATUSES = [
  ["all", "All statuses"],
  ["draft", "Draft"],
  ["pending_approval", "Pending Approval"],
  ["approved", "Approved"],
  ["dispatched", "Dispatched"],
  ["acknowledged", "Acknowledged"],
  ["cancelled", "Cancelled"],
] as const;

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [status, setStatus] = React.useState("all");
  const filters: POFilters = { status: status === "all" ? "" : status, page_size: 100 };
  const { data, isLoading } = usePOs(filters);

  const columns = React.useMemo<ColumnDef<POListItem>[]>(
    () => [
      { accessorKey: "code", header: "PO", cell: (c) => <span className="font-mono text-xs">{c.getValue<string>()}</span> },
      {
        id: "vendor",
        header: "Vendor",
        cell: (c) => <span className="font-medium">{c.row.original.vendor_legal_name ?? "—"}</span>,
      },
      { accessorKey: "department", header: "Dept" },
      { accessorKey: "category", header: "Category" },
      {
        accessorKey: "total_amount",
        header: "Total",
        cell: (c) => <span className="font-mono text-xs">{formatINR(Number(c.getValue<string>()))}</span>,
      },
      {
        accessorKey: "po_date",
        header: "Date",
        cell: (c) => <span className="text-xs text-muted-foreground">{formatDate(c.getValue<string>())}</span>,
      },
      { accessorKey: "vendor_ack_status", header: "Vendor Ack", cell: (c) => <StatusBadge status={c.getValue<string>()} /> },
      { accessorKey: "status", header: "Status", cell: (c) => <StatusBadge status={c.getValue<string>()} /> },
    ],
    [],
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Purchase Orders</h1>
        <p className="text-sm text-muted-foreground">
          {data ? `${data.meta.total} PO${data.meta.total === 1 ? "" : "s"}` : "Approved POs are dispatched to the vendor portal"}
        </p>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        onRowClick={(po) => router.push(`/purchase-orders/${po.code}`)}
        empty={
          <EmptyState
            title="No purchase orders yet"
            description="Create a PO from an approved requisition."
          />
        }
        toolbar={
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              {STATUSES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
}
