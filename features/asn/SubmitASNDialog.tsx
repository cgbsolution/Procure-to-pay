"use client";

import * as React from "react";
import { toast } from "sonner";
import { Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useSubmitASN } from "@/features/asn/api";
import { ApiError } from "@/lib/api-client";

export function SubmitASNDialog({
  poCode,
  open,
  onOpenChange,
}: {
  poCode: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const submit = useSubmitASN();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = React.useState({
    dispatch_date: today, expected_delivery: today, qty_dispatched: "",
    transporter: "", lr_no: "", vehicle_no: "", remarks: "",
  });

  async function onSubmit() {
    if (!poCode) return;
    try {
      await submit.mutateAsync({
        po_code: poCode,
        dispatch_date: form.dispatch_date,
        expected_delivery: form.expected_delivery || undefined,
        qty_dispatched: form.qty_dispatched || "0",
        transporter: form.transporter || undefined,
        lr_no: form.lr_no || undefined,
        vehicle_no: form.vehicle_no || undefined,
        remarks: form.remarks || undefined,
      });
      toast.success("ASN submitted", { description: "Procurement has been notified." });
      onOpenChange(false);
    } catch (err) {
      toast.error("Could not submit ASN", { description: err instanceof ApiError ? err.message : "Try again." });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Truck className="size-5" /> Submit ASN</DialogTitle>
          <DialogDescription>Advance Shipment Notice for {poCode}.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label htmlFor="dd">Dispatch Date</Label>
            <Input id="dd" type="date" value={form.dispatch_date} onChange={(e) => setForm({ ...form, dispatch_date: e.target.value })} /></div>
          <div className="space-y-1.5"><Label htmlFor="ed">Expected Delivery</Label>
            <Input id="ed" type="date" value={form.expected_delivery} onChange={(e) => setForm({ ...form, expected_delivery: e.target.value })} /></div>
          <div className="space-y-1.5"><Label htmlFor="qd">Qty Dispatched</Label>
            <Input id="qd" type="number" step="any" className="font-mono" value={form.qty_dispatched} onChange={(e) => setForm({ ...form, qty_dispatched: e.target.value })} /></div>
          <div className="space-y-1.5"><Label htmlFor="tr">Transporter</Label>
            <Input id="tr" value={form.transporter} onChange={(e) => setForm({ ...form, transporter: e.target.value })} placeholder="VRL" /></div>
          <div className="space-y-1.5"><Label htmlFor="lr">LR / Docket No.</Label>
            <Input id="lr" className="font-mono" value={form.lr_no} onChange={(e) => setForm({ ...form, lr_no: e.target.value })} /></div>
          <div className="space-y-1.5"><Label htmlFor="vn">Vehicle No.</Label>
            <Input id="vn" className="font-mono" value={form.vehicle_no} onChange={(e) => setForm({ ...form, vehicle_no: e.target.value })} placeholder="MH12-AB-1234" /></div>
        </div>
        <DialogFooter>
          <Button variant="teal" onClick={onSubmit} disabled={submit.isPending}>
            {submit.isPending ? "Submitting…" : "Submit ASN"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
