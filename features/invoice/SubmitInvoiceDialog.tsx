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

interface EditableLine {
  po_line_id?: string;
  item_desc: string;
  hsn_code?: string;
  uom: string;
  qty: string;
  rate: string;
  gst_rate: string;
}

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
  const [lines, setLines] = React.useState<EditableLine[]>([]);

  // Pre-fill lines from received quantities at PO rates whenever the PO loads.
  React.useEffect(() => {
    if (!po) { setLines([]); return; }
    setLines((po.lines ?? []).map((l) => ({
      po_line_id: l.id, item_desc: l.item_desc, hsn_code: l.hsn_code, uom: l.uom,
      qty: String(l.qty_received), rate: String(l.rate), gst_rate: String(l.gst_rate),
    })));
  }, [po]);

  function setLine(i: number, patch: Partial<EditableLine>) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  const num = (s: string) => (Number.isFinite(Number(s)) ? Number(s) : 0);
  const taxable = lines.reduce((s, l) => s + num(l.qty) * num(l.rate), 0);
  const tax = lines.reduce((s, l) => s + (num(l.qty) * num(l.rate) * num(l.gst_rate)) / 100, 0);
  const inter = !!po?.is_inter_state;
  const cgst = inter ? 0 : tax / 2;
  const sgst = inter ? 0 : tax / 2;
  const igst = inter ? tax : 0;

  async function onSubmit() {
    if (!po || !poCode) return;
    if (!invNo.trim()) { toast.error("Enter your invoice number"); return; }
    if (lines.every((l) => num(l.qty) <= 0)) { toast.error("Enter a quantity to invoice"); return; }
    try {
      const inv = await submit.mutateAsync({
        po_code: poCode, vendor_invoice_no: invNo, invoice_date: invDate, source: "portal",
        cgst: cgst.toFixed(2), sgst: sgst.toFixed(2), igst: igst.toFixed(2),
        lines: lines
          .filter((l) => num(l.qty) > 0)
          .map((l) => ({
            po_line_id: l.po_line_id, item_desc: l.item_desc, hsn_code: l.hsn_code, uom: l.uom,
            qty: String(num(l.qty)), rate: String(num(l.rate)), gst_rate: String(num(l.gst_rate)),
          })),
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
            Against {poCode}. Lines are pre-filled from received quantities at PO rates — adjust qty / rate / GST% if needed.
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
              <TableHead className="text-right">GST%</TableHead><TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((l, i) => (
              <TableRow key={i} className="hover:bg-transparent">
                <TableCell className="font-medium">{l.item_desc}</TableCell>
                <TableCell className="font-mono text-xs">{l.hsn_code ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <Input type="number" step="any" className="h-8 w-20 text-right font-mono text-xs"
                    value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value })} />
                </TableCell>
                <TableCell className="text-right">
                  <Input type="number" step="any" className="h-8 w-24 text-right font-mono text-xs"
                    value={l.rate} onChange={(e) => setLine(i, { rate: e.target.value })} />
                </TableCell>
                <TableCell className="text-right">
                  <Input type="number" step="any" className="h-8 w-16 text-right font-mono text-xs"
                    value={l.gst_rate} onChange={(e) => setLine(i, { gst_rate: e.target.value })} />
                </TableCell>
                <TableCell className="text-right font-mono text-xs">{formatINR(num(l.qty) * num(l.rate))}</TableCell>
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
