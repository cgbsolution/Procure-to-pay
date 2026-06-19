"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Plus, MoreHorizontal, Check, X } from "lucide-react";

import { useSesList, useCreateSes, useSesDecision, type SESListItem } from "@/features/ses/api";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/states";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api-client";
import { formatINR, formatDate } from "@/lib/format";

export default function ServiceEntriesPage() {
  const { data, isLoading } = useSesList({ page_size: 100 });
  const create = useCreateSes();
  const decide = useSesDecision();
  const [newOpen, setNewOpen] = React.useState(false);
  const [rej, setRej] = React.useState<string | null>(null);
  const [notes, setNotes] = React.useState("");

  const [form, setForm] = React.useState({
    po_code: "", ses_type: "milestone" as const, service_desc: "", value: "",
    period_from: "", period_to: "",
  });

  async function submitNew() {
    try {
      const ses = await create.mutateAsync({
        po_code: form.po_code, ses_type: form.ses_type, service_desc: form.service_desc,
        value: form.value, period_from: form.period_from || null, period_to: form.period_to || null,
      });
      toast.success(`${ses.code} created`, { description: "Awaiting approval." });
      setNewOpen(false);
      setForm({ po_code: "", ses_type: "milestone", service_desc: "", value: "", period_from: "", period_to: "" });
    } catch (err) {
      toast.error("Could not create SES", { description: err instanceof ApiError ? err.message : "Try again." });
    }
  }

  async function act(code: string, action: "approve" | "reject", n?: string) {
    try {
      await decide.mutateAsync({ code, action, notes: n });
      toast.success(action === "approve" ? "SES approved" : "SES rejected");
      setRej(null); setNotes("");
    } catch (err) {
      toast.error("Action failed", { description: err instanceof ApiError ? err.message : "Try again." });
    }
  }

  const columns = React.useMemo<ColumnDef<SESListItem>[]>(
    () => [
      { accessorKey: "code", header: "SES", cell: (c) => <span className="font-mono text-xs">{c.getValue<string>()}</span> },
      { accessorKey: "po_code", header: "PO", cell: (c) => <span className="font-mono text-xs text-primary">{c.getValue<string>() ?? "—"}</span> },
      { accessorKey: "ses_type", header: "Type", cell: (c) => <span className="text-xs capitalize">{c.getValue<string>()}</span> },
      { accessorKey: "value", header: "Value", cell: (c) => <span className="font-mono text-xs">{formatINR(Number(c.getValue<string>()))}</span> },
      { accessorKey: "created_at", header: "Created", cell: (c) => <span className="text-xs text-muted-foreground">{formatDate(c.getValue<string>())}</span> },
      { accessorKey: "status", header: "Status", cell: (c) => <StatusBadge status={c.getValue<string>()} /> },
      {
        id: "actions", header: "", enableSorting: false,
        cell: (c) => {
          const s = c.row.original;
          if (s.status !== "draft") return null;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label="Actions"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => act(s.code, "approve")}><Check className="size-4" /> Approve</DropdownMenuItem>
                  <DropdownMenuItem className="text-danger-foreground" onClick={() => setRej(s.code)}><X className="size-4" /> Reject</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">Service Entry Sheets</h1>
          <p className="text-sm text-muted-foreground">Record and approve services delivered against a PO (2-way invoice path).</p>
        </div>
        <Button variant="navy" onClick={() => setNewOpen(true)}><Plus className="size-4" /> New SES</Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        empty={<EmptyState title="No service entries" description="Create one against a services PO to certify work done." />}
      />

      {/* create */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Service Entry Sheet</DialogTitle>
            <DialogDescription>Certify services delivered against a purchase order.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="po">PO Code *</Label>
                <Input id="po" className="font-mono" value={form.po_code} onChange={(e) => setForm({ ...form, po_code: e.target.value })} placeholder="PO-2026-0043" />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.ses_type} onValueChange={(v) => setForm({ ...form, ses_type: v as "milestone" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="milestone">Milestone</SelectItem>
                    <SelectItem value="period">Period</SelectItem>
                    <SelectItem value="disputed">Disputed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desc">Service description *</Label>
              <Input id="desc" value={form.service_desc} onChange={(e) => setForm({ ...form, service_desc: e.target.value })} placeholder="Annual maintenance — Q1 milestone" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="val">Value (₹) *</Label>
                <Input id="val" type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="from">From</Label>
                <Input id="from" type="date" value={form.period_from} onChange={(e) => setForm({ ...form, period_from: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="to">To</Label>
                <Input id="to" type="date" value={form.period_to} onChange={(e) => setForm({ ...form, period_to: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="navy" onClick={submitNew}
              disabled={create.isPending || !form.po_code || !form.service_desc || !form.value}>
              {create.isPending ? "Creating…" : "Create SES"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* reject */}
      <Dialog open={!!rej} onOpenChange={(o) => { if (!o) { setRej(null); setNotes(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject SES</DialogTitle>
            <DialogDescription>Provide a reason for rejecting this service entry.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="rnotes">Reason</Label>
            <textarea id="rnotes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
          <DialogFooter>
            <Button variant="destructive" disabled={decide.isPending} onClick={() => rej && act(rej, "reject", notes || undefined)}>
              Reject SES
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
