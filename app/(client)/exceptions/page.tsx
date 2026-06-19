"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { MoreHorizontal, CheckCircle2, Undo2 } from "lucide-react";

import { useExceptions, type ExceptionItem } from "@/features/exception/api";
import { apiFetch, ApiError } from "@/lib/api-client";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/states";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/format";

const SEV: Record<string, "danger" | "warning" | "info" | "neutral"> = {
  critical: "danger", high: "warning", medium: "info", low: "neutral",
};

export default function ExceptionsPage() {
  const qc = useQueryClient();
  const [severity, setSeverity] = React.useState("all");
  const { data, isLoading } = useExceptions({ severity: severity === "all" ? undefined : severity, page_size: 100 });
  const [dlg, setDlg] = React.useState<{ id: string; kind: "resolve" | "return-to-vendor" } | null>(null);
  const [notes, setNotes] = React.useState("");

  const act = useMutation({
    mutationFn: (v: { id: string; kind: string; notes?: string }) =>
      apiFetch(`/api/v1/exceptions/${v.id}/${v.kind}`, { method: "POST", json: { notes: v.notes } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exceptions"] }),
  });

  async function run() {
    if (!dlg) return;
    try {
      await act.mutateAsync({ id: dlg.id, kind: dlg.kind, notes: notes || undefined });
      toast.success(dlg.kind === "resolve" ? "Exception resolved" : "Returned to vendor");
      setDlg(null); setNotes("");
    } catch (err) {
      toast.error("Action failed", { description: err instanceof ApiError ? err.message : "Try again." });
    }
  }

  const columns = React.useMemo<ColumnDef<ExceptionItem>[]>(
    () => [
      { accessorKey: "type_key", header: "Type", cell: (c) => <span className="font-mono text-xs">{c.getValue<string>()}</span> },
      { accessorKey: "invoice_code", header: "Invoice", cell: (c) => <span className="font-mono text-xs text-primary">{c.getValue<string>() ?? "—"}</span> },
      { accessorKey: "severity", header: "Severity", cell: (c) => <Badge variant={SEV[c.getValue<string>()] ?? "neutral"} className="capitalize">{c.getValue<string>()}</Badge> },
      { accessorKey: "title", header: "Title", cell: (c) => <span className="text-sm">{c.getValue<string>()}</span> },
      { accessorKey: "assigned_role", header: "Owner", cell: (c) => <span className="text-xs text-muted-foreground capitalize">{(c.getValue<string>() ?? "—").replace(/_/g, " ")}</span> },
      { accessorKey: "sla_due_at", header: "SLA Due", cell: (c) => <span className="text-xs text-muted-foreground">{c.getValue<string>() ? formatDateTime(c.getValue<string>()) : "—"}</span> },
      { accessorKey: "status", header: "Status", cell: (c) => <StatusBadge status={c.getValue<string>()} /> },
      {
        id: "actions", header: "", enableSorting: false,
        cell: (c) => {
          const e = c.row.original;
          if (["resolved", "auto_resolved"].includes(e.status)) return null;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label="Actions"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setDlg({ id: e.id, kind: "resolve" })}><CheckCircle2 className="size-4" /> Resolve</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDlg({ id: e.id, kind: "return-to-vendor" })}><Undo2 className="size-4" /> Return to vendor</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [],
  );

  const open = data?.data.filter((e) => !["resolved", "auto_resolved"].includes(e.status)).length ?? 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Exception Queue</h1>
        <p className="text-sm text-muted-foreground">{open} open · validation/match failures routed by type, severity and SLA.</p>
      </div>
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        empty={<EmptyState title="No exceptions 🎉" description="Invoices that fail validation or matching land here." />}
        toolbar={
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <Dialog open={!!dlg} onOpenChange={(o) => { if (!o) { setDlg(null); setNotes(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dlg?.kind === "resolve" ? "Resolve exception" : "Return to vendor"}</DialogTitle>
            <DialogDescription>
              {dlg?.kind === "resolve" ? "Record how this was resolved." : "Notify the vendor of the required correction."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
          <DialogFooter>
            <Button variant="navy" onClick={run} disabled={act.isPending}>
              {dlg?.kind === "resolve" ? "Mark Resolved" : "Return to Vendor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
