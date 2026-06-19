"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Check, MoreHorizontal, MessageCircleQuestion, X, Truck, ReceiptText } from "lucide-react";
import { SubmitASNDialog } from "@/features/asn/SubmitASNDialog";
import { SubmitInvoiceDialog } from "@/features/invoice/SubmitInvoiceDialog";

import { useVendorPOs } from "@/features/po/api";
import type { POListItem, POAckAction } from "@/features/po/types";
import { apiFetch, ApiError } from "@/lib/api-client";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/states";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { formatINR, formatDate } from "@/lib/format";

export default function VendorPurchaseOrdersPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useVendorPOs({ page_size: 100 });
  const [dlg, setDlg] = React.useState<{ code: string; action: POAckAction } | null>(null);
  const [reason, setReason] = React.useState("");
  const [asnFor, setAsnFor] = React.useState<string | null>(null);
  const [invFor, setInvFor] = React.useState<string | null>(null);

  const ack = useMutation({
    mutationFn: (vars: { code: string; action: POAckAction; reason?: string }) =>
      apiFetch(`/api/v1/portal/pos/${vars.code}/acknowledge`, {
        method: "POST",
        json: { action: vars.action, reason: vars.reason },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portal-pos"] }),
  });

  async function run(code: string, action: POAckAction, reasonText?: string) {
    try {
      await ack.mutateAsync({ code, action, reason: reasonText });
      toast.success(
        action === "acknowledge" ? "PO acknowledged" : action === "query" ? "Query raised" : "PO rejected",
      );
      setDlg(null);
      setReason("");
    } catch (err) {
      toast.error("Action failed", { description: err instanceof ApiError ? err.message : "Try again." });
    }
  }

  const columns = React.useMemo<ColumnDef<POListItem>[]>(
    () => [
      { accessorKey: "code", header: "PO", cell: (c) => <span className="font-mono text-xs">{c.getValue<string>()}</span> },
      { accessorKey: "department", header: "Dept" },
      { accessorKey: "category", header: "Category" },
      {
        accessorKey: "total_amount", header: "Total",
        cell: (c) => <span className="font-mono text-xs">{formatINR(Number(c.getValue<string>()))}</span>,
      },
      { accessorKey: "po_date", header: "Date", cell: (c) => <span className="text-xs text-muted-foreground">{formatDate(c.getValue<string>())}</span> },
      { accessorKey: "vendor_ack_status", header: "My Response", cell: (c) => <StatusBadge status={c.getValue<string>()} /> },
      { accessorKey: "status", header: "Status", cell: (c) => <StatusBadge status={c.getValue<string>()} /> },
      {
        id: "actions", header: "", enableSorting: false,
        cell: (c) => {
          const po = c.row.original;
          const ackPending = po.status === "dispatched" && po.vendor_ack_status === "pending";
          const shippable = ["dispatched", "acknowledged", "partially_received"].includes(po.status);
          const invoiceable = ["partially_received", "received"].includes(po.status);
          if (!ackPending && !shippable && !invoiceable) return null;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label="Respond"><MoreHorizontal className="size-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {ackPending && (
                    <>
                      <DropdownMenuItem onClick={() => run(po.code, "acknowledge")}>
                        <Check className="size-4" /> Acknowledge
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDlg({ code: po.code, action: "query" })}>
                        <MessageCircleQuestion className="size-4" /> Raise query
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-danger-foreground" onClick={() => setDlg({ code: po.code, action: "reject" })}>
                        <X className="size-4" /> Reject
                      </DropdownMenuItem>
                    </>
                  )}
                  {shippable && (
                    <DropdownMenuItem onClick={() => setAsnFor(po.code)}>
                      <Truck className="size-4" /> Submit ASN
                    </DropdownMenuItem>
                  )}
                  {invoiceable && (
                    <DropdownMenuItem onClick={() => setInvFor(po.code)}>
                      <ReceiptText className="size-4" /> Submit Invoice
                    </DropdownMenuItem>
                  )}
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
      <div>
        <h1 className="text-xl font-semibold">Purchase Orders</h1>
        <p className="text-sm text-muted-foreground">
          New POs from Meridian. Acknowledge within 48 hours, or raise a query / reject with a reason.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        empty={<EmptyState title="No purchase orders" description="Dispatched POs will appear here." />}
      />

      <SubmitASNDialog poCode={asnFor} open={!!asnFor} onOpenChange={(o) => !o && setAsnFor(null)} />
      <SubmitInvoiceDialog poCode={invFor} open={!!invFor} onOpenChange={(o) => !o && setInvFor(null)} />

      <Dialog open={!!dlg} onOpenChange={(o) => { if (!o) { setDlg(null); setReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dlg?.action === "reject" ? "Reject PO" : "Raise a query"}</DialogTitle>
            <DialogDescription>
              {dlg?.action === "reject"
                ? "Tell the buyer why you're rejecting this PO."
                : "Ask the buyer a question about this PO."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason *</Label>
            <textarea id="reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
          <DialogFooter>
            <Button variant={dlg?.action === "reject" ? "destructive" : "navy"}
              disabled={ack.isPending || reason.trim().length < 2}
              onClick={() => dlg && run(dlg.code, dlg.action, reason)}>
              {dlg?.action === "reject" ? "Reject PO" : "Send query"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
