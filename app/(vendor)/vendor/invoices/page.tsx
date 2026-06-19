"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";

import { useInvoices } from "@/features/invoice/api";
import type { InvoiceListItem } from "@/features/invoice/types";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/states";
import { formatINR, formatDate } from "@/lib/format";

export default function VendorInvoicesPage() {
  const { data, isLoading } = useInvoices({ page_size: 100 });

  const columns = React.useMemo<ColumnDef<InvoiceListItem>[]>(
    () => [
      { accessorKey: "code", header: "Invoice", cell: (c) => <span className="font-mono text-xs">{c.getValue<string>()}</span> },
      { accessorKey: "vendor_invoice_no", header: "Your Inv #", cell: (c) => <span className="font-mono text-xs">{c.getValue<string>()}</span> },
      { accessorKey: "po_code", header: "PO", cell: (c) => <span className="font-mono text-xs text-vendor">{c.getValue<string>() ?? "—"}</span> },
      { accessorKey: "invoice_date", header: "Date", cell: (c) => <span className="text-xs text-muted-foreground">{formatDate(c.getValue<string>())}</span> },
      { accessorKey: "total_amount", header: "Total", cell: (c) => <span className="font-mono text-xs">{formatINR(Number(c.getValue<string>()))}</span> },
      { accessorKey: "status", header: "Status", cell: (c) => <StatusBadge status={c.getValue<string>()} /> },
    ],
    [],
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">My Invoices</h1>
        <p className="text-sm text-muted-foreground">
          Submit invoices from a received PO; track them through validation, matching and approval.
        </p>
      </div>
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        empty={<EmptyState title="No invoices submitted" description="Use Purchase Orders → Submit Invoice on a received PO." />}
      />
    </div>
  );
}
