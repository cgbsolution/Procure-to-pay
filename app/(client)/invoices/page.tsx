"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";

import { useInvoices } from "@/features/invoice/api";
import type { InvoiceListItem } from "@/features/invoice/types";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/states";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatINR } from "@/lib/format";

const STATUSES = [
  ["all", "All statuses"],
  ["received", "Received (OCR)"],
  ["matched", "Matched"],
  ["pending_approval", "Pending Approval"],
  ["validation_failed", "Validation Failed"],
  ["exception", "Exception"],
  ["approved", "Approved"],
  ["scheduled", "Scheduled"],
  ["paid", "Paid"],
] as const;

function passBadge(v: string) {
  if (v === "passed" || v === "pass") return <Badge variant="success">{v}</Badge>;
  if (v === "failed" || v === "fail") return <Badge variant="danger">{v}</Badge>;
  return <Badge variant="neutral">{v}</Badge>;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [status, setStatus] = React.useState("all");
  // Honour a ?status= deep-link from the sidebar (OCR Review / Validation / Match / Approval).
  React.useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("status");
    if (s) setStatus(s);
  }, []);
  const { data, isLoading } = useInvoices({ status: status === "all" ? undefined : status, page_size: 100 });

  const columns = React.useMemo<ColumnDef<InvoiceListItem>[]>(
    () => [
      { accessorKey: "code", header: "Invoice", cell: (c) => <span className="font-mono text-xs">{c.getValue<string>()}</span> },
      { id: "vendor", header: "Vendor", cell: (c) => <span className="font-medium">{c.row.original.vendor_legal_name ?? "—"}</span> },
      { accessorKey: "vendor_invoice_no", header: "Vendor Inv #", cell: (c) => <span className="font-mono text-xs">{c.getValue<string>()}</span> },
      { accessorKey: "po_code", header: "PO", cell: (c) => <span className="font-mono text-xs text-primary">{c.getValue<string>() ?? "—"}</span> },
      { accessorKey: "total_amount", header: "Total", cell: (c) => <span className="font-mono text-xs">{formatINR(Number(c.getValue<string>()))}</span> },
      { accessorKey: "validation_status", header: "Validation", cell: (c) => passBadge(c.getValue<string>()) },
      { accessorKey: "match_result", header: "Match", cell: (c) => passBadge(c.getValue<string>()) },
      { accessorKey: "status", header: "Status", cell: (c) => <StatusBadge status={c.getValue<string>()} /> },
    ],
    [],
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Invoice Queue</h1>
        <p className="text-sm text-muted-foreground">
          OCR → 9-layer validation → 2/3-way match → approval — all automatic on submission.
        </p>
      </div>
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        onRowClick={(inv) => router.push(`/invoices/${inv.code}`)}
        empty={<EmptyState title="No invoices yet" description="Vendor-submitted invoices appear here as they enter the pipeline." />}
        toolbar={
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>{STATUSES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
          </Select>
        }
      />
    </div>
  );
}
