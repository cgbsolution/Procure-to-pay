"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { Send } from "lucide-react";

import { useApplications } from "@/features/onboarding/api";
import type { ApplicationListItem } from "@/features/onboarding/types";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/states";
import { SendInviteDialog } from "@/features/onboarding/SendInviteDialog";
import { formatDateTime } from "@/lib/format";

const OB_STATUSES = [
  ["all", "All statuses"],
  ["awaiting_docs", "Awaiting Docs"],
  ["under_review", "Under Review"],
  ["finance_review", "Finance Review"],
  ["approved", "Approved"],
  ["rejected", "Rejected"],
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { data, isLoading } = useApplications();
  const [status, setStatus] = React.useState("all");
  // Sidebar "Approval Workflow" deep-links via ?status=under_review.
  React.useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("status");
    if (s) setStatus(s);
  }, []);
  const rows = (data ?? []).filter((a) => status === "all" || a.status === status);

  const columns = React.useMemo<ColumnDef<ApplicationListItem>[]>(
    () => [
      { accessorKey: "code", header: "App", cell: (c) => <span className="font-mono text-xs">{c.getValue<string>()}</span> },
      { accessorKey: "company_name", header: "Company", cell: (c) => <span className="font-medium">{c.getValue<string>()}</span> },
      { accessorKey: "gstin", header: "GSTIN", cell: (c) => <span className="font-mono text-xs">{c.getValue<string>() ?? "—"}</span> },
      { accessorKey: "category", header: "Category", cell: (c) => c.getValue<string>() ?? "—" },
      {
        id: "docs",
        header: "Docs",
        cell: (c) => {
          const a = c.row.original;
          const pct = a.docs_required ? Math.round((a.docs_uploaded / a.docs_required) * 100) : 0;
          return (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
              </div>
              <span className="font-mono text-xs text-muted-foreground">{a.docs_uploaded}/{a.docs_required}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "submitted_at",
        header: "Submitted",
        cell: (c) => {
          const v = c.getValue<string | null>();
          return <span className="text-xs text-muted-foreground">{v ? formatDateTime(v) : "—"}</span>;
        },
      },
      { accessorKey: "status", header: "Status", cell: (c) => <StatusBadge status={c.getValue<string>()} /> },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: (c) => (
          <div className="text-right">
            <Button variant="outline" size="sm" onClick={() => router.push(`/onboarding/${c.row.original.code}`)}>
              Review
            </Button>
          </div>
        ),
      },
    ],
    [router],
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Vendor Onboarding</h1>
          <p className="text-sm text-muted-foreground">
            Invite a vendor, then review their OCR-filled profile and approve through the DOA chain.
          </p>
        </div>
        <SendInviteDialog
          trigger={
            <Button variant="navy" size="sm">
              <Send className="size-4" /> Send Invite
            </Button>
          }
        />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        onRowClick={(a) => router.push(`/onboarding/${a.code}`)}
        toolbar={
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>{OB_STATUSES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
          </Select>
        }
        empty={
          <EmptyState
            title="No onboarding applications yet"
            description="Send an invite to start onboarding a vendor."
            action={
              <SendInviteDialog
                trigger={
                  <Button variant="navy" size="sm">
                    <Send className="size-4" /> Send Invite
                  </Button>
                }
              />
            }
          />
        }
      />
    </div>
  );
}
