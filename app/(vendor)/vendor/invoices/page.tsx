"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { ReceiptText } from "lucide-react";

import { useInvoices } from "@/features/invoice/api";
import type { InvoiceListItem } from "@/features/invoice/types";
import { useVendorPOs } from "@/features/po/api";
import type { POListItem } from "@/features/po/types";
import { SubmitInvoiceDialog } from "@/features/invoice/SubmitInvoiceDialog";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/states";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatINR, formatDate } from "@/lib/format";

// A PO can be invoiced once goods have been (at least partly) received.
const INVOICEABLE = ["received", "partially_received"];

export default function VendorInvoicesPage() {
  const { data, isLoading } = useInvoices({ page_size: 100 });
  const { data: pos } = useVendorPOs({ page_size: 100 });
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [chosen, setChosen] = React.useState<string>("");
  const [invFor, setInvFor] = React.useState<string | null>(null);

  const eligible = React.useMemo(
    () => (pos?.data ?? []).filter((p: POListItem) => INVOICEABLE.includes(p.status)),
    [pos],
  );

  function startSubmit() {
    const only = eligible.length === 1 ? eligible[0] : undefined;
    setChosen(only ? only.code : "");
    setPickerOpen(true);
  }
  function proceed() {
    if (!chosen) return;
    setPickerOpen(false);
    setInvFor(chosen);
  }

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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">My Invoices</h1>
          <p className="text-sm text-muted-foreground">
            Submit invoices against received POs; track them through validation, matching and approval.
          </p>
        </div>
        <Button variant="teal" onClick={startSubmit}>
          <ReceiptText className="size-4" /> Submit Invoice
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        empty={<EmptyState title="No invoices submitted" description="Use the Submit Invoice button above (or Purchase Orders → Submit Invoice) on a received PO." />}
      />

      {/* PO picker → opens the submission dialog */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ReceiptText className="size-5" /> Submit Invoice</DialogTitle>
            <DialogDescription>Choose the purchase order you are invoicing against.</DialogDescription>
          </DialogHeader>

          {eligible.length === 0 ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-700">
              No PO is ready to invoice yet. An invoice can be raised once Meridian records goods receipt (GRN)
              for a PO. Acknowledge and ship your open POs from <span className="font-medium">Purchase Orders</span> first.
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Purchase Order</label>
              <Select value={chosen || undefined} onValueChange={setChosen}>
                <SelectTrigger><SelectValue placeholder="Select a received PO" /></SelectTrigger>
                <SelectContent>
                  {eligible.map((p: POListItem) => (
                    <SelectItem key={p.code} value={p.code}>
                      {p.code} · {p.category} · {formatINR(Number(p.total_amount))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button variant="teal" onClick={proceed} disabled={!chosen}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SubmitInvoiceDialog poCode={invFor} open={!!invFor} onOpenChange={(o) => !o && setInvFor(null)} />
    </div>
  );
}
