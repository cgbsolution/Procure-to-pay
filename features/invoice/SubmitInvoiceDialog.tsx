"use client";

import * as React from "react";
import { toast } from "sonner";
import { ReceiptText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useVendorPO } from "@/features/po/api";
import { useSubmitInvoice } from "@/features/invoice/api";
import { ApiError } from "@/lib/api-client";
import { formatINR } from "@/lib/format";

export function SubmitInvoiceDialog({
  poCode,
  open,
  onOpenChange,
}: {
  poCode: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { data: po } = useVendorPO(poCode ?? "");
  const submit = useSubmitInvoice();
  const today = new Date().toISOString().slice(0, 10);
  const [invNo, setInvNo] = React.useState("");
  const [invDate, setInvDate] = React.useState(today);

  // Bill the received quantity at PO rates; tax split by place of supply.
  const lines = (po?.lines ?? []).map((l) => ({
    po_line_id: l.id, item_desc: l.item_desc, hsn_code: l.hsn_code, uom: l.uom,
    qty: l.qty_received, rate: l.rate, gst_rate: l.gst_rate,
  }));
  const taxable = lines.reduce((s, l) => s + Number(l.qty) * Number(l.rate), 0);
  const tax = lines.reduce((s, l) => s + (Number(l.qty) * Number(l.rate) * Number(l.gst_rate)) / 100, 0);
  const inter = !!po?.is_inter_state;
  const cgst = inter ? 0 : tax / 2;
  const sgst = inter ? 0 : tax / 2;
  const igst = inter ? tax : 0;

  async function onSubmit() {
    if (!po || !poCode) return;
    if (!invNo.trim()) { toast.error("Enter your invoice number"); return; }
    if (lines.every((l) => Number(l.qty) <= 0)) { toast.error("Nothing received to invoice yet"); return; }
    try {
      const inv = await submit.mutateAsync({
        po_code: poCode, vendor_invoice_no: invNo, invoice_date: invDate, source: "portal",
        cgst: cgst.toFixed(2), sgst: sgst.toFixed(2), igst: igst.toFixed(2),
        lines: lines.map((l) => ({ ...l, qty: String(l.qty), rate: String(l.rate), gst_rate: String(l.gst_rate) })),
      });
      const s = inv.status;
      toast.success(`Invoice ${inv.code} submitted`, {
        description: s === "pending_approval" ? "Validated & matched — in approval."
          : s === "exception" ? "An exception was raised — see status."
          : s === "validation_failed" ? "Validation failed — please correct." : `Status: ${s}`,
      });
      onOpenChange(false);
      setInvNo("");
    } catch (err) {
      toast.error("Could not submit invoice", { description: err instanceof ApiError ? err.message : "Try again." });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ReceiptText className="size-5" /> Submit Invoice</DialogTitle>
          <DialogDescription>
            Against {poCode}. Lines are pre-filled from received quantities at PO rates; GST splits by place of supply.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label htmlFor="inv">Your Invoice No. *</Label>
            <Input id="inv" className="font-mono" value={invNo} onChange={(e) => setInvNo(e.target.value)} placeholder="BRC/2026-27/0091" /></div>
          <div className="space-y-1.5"><Label htmlFor="idate">Invoice Date</Label>
            <Input id="idate" type="date" value={invDate} onChange={(e) => setInvDate(e.target.value)} /></div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Item</TableHead><TableHead>HSN</TableHead>
              <TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">GST%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((l, i) => (
              <TableRow key={i} className="hover:bg-transparent">
                <TableCell className="font-medium">{l.item_desc}</TableCell>
                <TableCell className="font-mono text-xs">{l.hsn_code ?? "—"}</TableCell>
                <TableCell className="text-right font-mono text-xs">{l.qty}</TableCell>
                <TableCell className="text-right font-mono text-xs">{formatINR(Number(l.rate))}</TableCell>
                <TableCell className="text-right font-mono text-xs">{Number(l.gst_rate)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="rounded-md bg-muted p-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Taxable</span><span className="font-mono">{formatINR(taxable)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">GST ({inter ? "IGST" : "CGST+SGST"})</span><span className="font-mono">{formatINR(tax)}</span></div>
          <div className="flex justify-between font-semibold"><span>Total</span><span className="font-mono">{formatINR(taxable + tax)}</span></div>
        </div>

        <DialogFooter>
          <Button variant="teal" onClick={onSubmit} disabled={submit.isPending || !po}>
            {submit.isPending ? "Submitting…" : "Submit Invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
