"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Truck } from "lucide-react";

import { useVendorAsns, type AsnItem } from "@/features/portal/api";
import { LinkButton } from "@/components/ui/link-button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/states";
import { formatDate } from "@/lib/format";

export default function VendorShipmentsPage() {
  const { data, isLoading } = useVendorAsns();
  const columns = React.useMemo<ColumnDef<AsnItem>[]>(
    () => [
      { accessorKey: "code", header: "ASN", cell: (c) => <span className="font-mono text-xs">{c.getValue<string>()}</span> },
      { accessorKey: "po_code", header: "PO", cell: (c) => <span className="font-mono text-xs text-vendor">{c.getValue<string>() ?? "—"}</span> },
      { accessorKey: "qty_dispatched", header: "Qty", cell: (c) => <span className="font-mono text-xs">{c.getValue<string>()}</span> },
      { accessorKey: "dispatch_date", header: "Dispatched", cell: (c) => <span className="text-xs text-muted-foreground">{formatDate(c.getValue<string>())}</span> },
      { accessorKey: "expected_delivery", header: "Expected", cell: (c) => <span className="text-xs text-muted-foreground">{c.getValue<string>() ? formatDate(c.getValue<string>()) : "—"}</span> },
      { accessorKey: "transporter", header: "Transporter", cell: (c) => <span className="text-xs">{c.getValue<string>() ?? "—"}</span> },
      { accessorKey: "lr_no", header: "LR No.", cell: (c) => <span className="font-mono text-[11px]">{c.getValue<string>() ?? "—"}</span> },
      { accessorKey: "status", header: "Status", cell: (c) => <StatusBadge status={c.getValue<string>()} /> },
    ],
    [],
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">Shipments & ASN</h1>
          <p className="text-sm text-muted-foreground">Advance Shipment Notices you&apos;ve submitted against dispatched POs.</p>
        </div>
        <LinkButton href="/vendor/purchase-orders" variant="teal" size="sm"><Truck className="size-4" /> Submit ASN from a PO</LinkButton>
      </div>
      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        empty={<EmptyState title="No shipments yet" description="Submit an ASN from Purchase Orders once a PO is acknowledged." />}
      />
    </div>
  );
}
