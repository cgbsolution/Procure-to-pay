"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";

import { usePRs, type PRFilters } from "@/features/pr/api";
import type { PRListItem } from "@/features/pr/types";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/states";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatINR, formatDate } from "@/lib/format";

const STATUSES = [
  ["all", "All statuses"],
  ["draft", "Draft"],
  ["pending_approval", "Pending Approval"],
  ["approved", "Approved"],
  ["po_created", "PO Created"],
  ["rejected", "Rejected"],
] as const;

export default function RequisitionsPage() {
  const router = useRouter();
  const [status, setStatus] = React.useState("all");
  // Sidebar deep-links: "PR Approvals" -> ?status=pending_approval, "Create PO" -> ?status=approved.
  React.useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("status");
    if (s) setStatus(s);
  }, []);
  const filters: PRFilters = { status: status === "all" ? "" : status, page_size: 100 };
  const { data, isLoading } = usePRs(filters);

  const columns = React.useMemo<ColumnDef<PRListItem>[]>(
    () => [
      { accessorKey: "code", header: "PR", cell: (c) => <span className="font-mono text-xs">{c.getValue<string>()}</span> },
      { accessorKey: "title", header: "Title", cell: (c) => <span className="font-medium">{c.getValue<string>()}</span> },
      { accessorKey: "department", header: "Dept" },
      { accessorKey: "category", header: "Category" },
      {
        accessorKey: "capex_opex",
        header: "Type",
        cell: (c) => <Badge variant="neutral" className="uppercase">{c.getValue<string>()}</Badge>,
      },
      {
        accessorKey: "est_value",
        header: "Value",
        cell: (c) => <span className="font-mono text-xs">{formatINR(Number(c.getValue<string>()))}</span>,
      },
      {
        accessorKey: "required_by",
        header: "Required By",
        cell: (c) => <span className="text-xs text-muted-foreground">{formatDate(c.getValue<string>())}</span>,
      },
      { accessorKey: "status", header: "Status", cell: (c) => <StatusBadge status={c.getValue<string>()} /> },
    ],
    [],
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Purchase Requisitions</h1>
          <p className="text-sm text-muted-foreground">
            Raise a requisition — budget is checked live and routing is DOA-driven by value.
          </p>
        </div>
        <LinkButton href="/requisitions/new" variant="navy" size="sm">
          <Plus className="size-4" /> Raise PR
        </LinkButton>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        onRowClick={(pr) => router.push(`/requisitions/${pr.code}`)}
        empty={
          <EmptyState
            title="No requisitions yet"
            description="Raise your first PR to start the P2P cycle."
            action={
              <LinkButton href="/requisitions/new" variant="navy" size="sm">
                <Plus className="size-4" /> Raise PR
              </LinkButton>
            }
          />
        }
        toolbar={
          <div className="flex items-center gap-3">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-52"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {STATUSES.map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  );
}
