"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Search, MoreHorizontal, Eye } from "lucide-react";

import { useVendors, useVendor, type VendorListItem } from "@/features/vendors/api";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/states";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { formatINR } from "@/lib/format";

export default function VendorsPage() {
  const [status, setStatus] = React.useState("all");
  const [q, setQ] = React.useState("");
  const [selected, setSelected] = React.useState<string | null>(null);
  const { data, isLoading } = useVendors({
    status: status === "all" ? "" : status,
    q,
    page_size: 100,
  });

  const columns = React.useMemo<ColumnDef<VendorListItem>[]>(
    () => [
      { accessorKey: "code", header: "Code", cell: (c) => <span className="font-mono text-xs">{c.getValue<string>()}</span> },
      { accessorKey: "legal_name", header: "Vendor", cell: (c) => <span className="font-medium">{c.getValue<string>()}</span> },
      { accessorKey: "gstin", header: "GSTIN", cell: (c) => <span className="font-mono text-xs">{c.getValue<string>() ?? "—"}</span> },
      { accessorKey: "category", header: "Category", cell: (c) => c.getValue<string>() ?? "—" },
      {
        accessorKey: "msme_status",
        header: "MSME",
        cell: (c) => {
          const v = c.getValue<string>();
          return v && v !== "none" ? <Badge variant="success" className="capitalize">{v}</Badge> : <span className="text-muted-foreground">—</span>;
        },
      },
      { accessorKey: "payment_terms", header: "Terms", cell: (c) => <span className="text-xs uppercase">{c.getValue<string>().replace("_", " ")}</span> },
      { accessorKey: "gstin_status", header: "GSTIN", cell: (c) => <StatusBadge status={c.getValue<string>()} /> },
      { accessorKey: "status", header: "Status", cell: (c) => <StatusBadge status={c.getValue<string>()} /> },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: (c) => (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Actions">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSelected(c.row.original.code)}>
                  <Eye className="size-4" /> View details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Vendor Master</h1>
        <p className="text-sm text-muted-foreground">
          {data ? `${data.meta.total} vendor${data.meta.total === 1 ? "" : "s"}` : "Approved suppliers"}
        </p>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        onRowClick={(v) => setSelected(v.code)}
        empty={<EmptyState title="No vendors found" description="Approved onboarding applications appear here as active vendors." />}
        toolbar={
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search vendors…" className="pl-8" aria-label="Search vendors" />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent>
          {selected && <VendorDetail code={selected} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function VendorDetail({ code }: { code: string }) {
  const { data: v, isLoading } = useVendor(code);
  return (
    <>
      <SheetHeader>
        <SheetTitle>{v?.legal_name ?? code}</SheetTitle>
        <SheetDescription className="font-mono">{code}</SheetDescription>
      </SheetHeader>
      <div className="space-y-4 px-5 py-4 text-sm">
        {isLoading || !v ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={v.status} />
              <StatusBadge status={v.gstin_status} />
              {v.msme_status !== "none" && <Badge variant="success" className="capitalize">{v.msme_status} MSME</Badge>}
            </div>
            <dl className="divide-y divide-border rounded-lg border border-border">
              <Row label="GSTIN" value={v.gstin} mono />
              <Row label="PAN" value={v.pan} mono />
              <Row label="CIN" value={v.cin} mono />
              <Row label="Udyam No." value={v.udyam_no} mono />
              <Row label="Category" value={v.category} />
              <Row label="Payment Terms" value={v.payment_terms?.replace("_", " ")} />
              <Row label="Credit Limit" value={v.credit_limit != null ? formatINR(Number(v.credit_limit)) : null} />
              <Row label="Portal" value={v.portal_status} />
            </dl>
          </>
        )}
      </div>
    </>
  );
}

function Row({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono text-xs" : "text-sm capitalize"}>{value || "—"}</dd>
    </div>
  );
}
