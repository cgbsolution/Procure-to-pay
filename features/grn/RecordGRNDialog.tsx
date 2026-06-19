"use client";

import * as React from "react";
import { toast } from "sonner";
import { Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useRecordGRN, type RejectReason } from "@/features/grn/api";
import type { POLineRead } from "@/features/po/types";
import { ApiError } from "@/lib/api-client";

const REASONS: [RejectReason, string][] = [
  ["moisture", "High moisture"],
  ["damage", "Physical damage"],
  ["spec_mismatch", "Spec mismatch"],
  ["short_supply", "Short supply"],
  ["wrong_item", "Wrong item"],
  ["other", "Other"],
];

interface LineState {
  received: string;
  accepted: string;
  rejected: string;
  reason: RejectReason | "";
}

export function RecordGRNDialog({
  poCode,
  lines,
  trigger,
}: {
  poCode: string;
  lines: POLineRead[];
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const record = useRecordGRN(poCode);
  const today = new Date().toISOString().slice(0, 10);
  const [grnDate, setGrnDate] = React.useState(today);
  const [lr, setLr] = React.useState("");

  const remainingOf = (l: POLineRead) => Number(l.qty_ordered) - Number(l.qty_received);
  const [state, setState] = React.useState<Record<string, LineState>>({});

  // Initialize per-line defaults when opening.
  React.useEffect(() => {
    if (!open) return;
    const init: Record<string, LineState> = {};
    for (const l of lines) {
      const rem = Math.max(0, remainingOf(l));
      init[l.id] = { received: String(rem), accepted: String(rem), rejected: "0", reason: "" };
    }
    setState(init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function upd(id: string, patch: Partial<LineState>) {
    setState((s) => {
      const cur: LineState = s[id] ?? { received: "0", accepted: "0", rejected: "0", reason: "" };
      return { ...s, [id]: { ...cur, ...patch } };
    });
  }

  async function onSubmit() {
    const payloadLines = [];
    for (const l of lines) {
      const st = state[l.id];
      if (!st) continue;
      const recv = Number(st.received);
      if (recv <= 0) continue;
      const acc = Number(st.accepted);
      const rej = Number(st.rejected);
      if (acc + rej !== recv) {
        toast.error(`${l.item_desc}: accepted + rejected must equal received`);
        return;
      }
      if (recv > remainingOf(l)) {
        toast.error(`${l.item_desc}: exceeds open balance ${remainingOf(l)}`);
        return;
      }
      if (rej > 0 && !st.reason) {
        toast.error(`${l.item_desc}: select a reject reason`);
        return;
      }
      payloadLines.push({
        po_line_id: l.id,
        qty_received: st.received,
        qty_accepted: st.accepted,
        qty_rejected: st.rejected,
        reject_reason: rej > 0 ? (st.reason as RejectReason) : undefined,
      });
    }
    if (payloadLines.length === 0) {
      toast.error("Enter a received quantity for at least one line");
      return;
    }
    try {
      const grn = await record.mutateAsync({ grn_date: grnDate, lr_no: lr || undefined, lines: payloadLines });
      toast.success(`${grn.code} recorded`, { description: "Accepted quantity is now invoiceable." });
      setOpen(false);
    } catch (err) {
      toast.error("Could not record GRN", { description: err instanceof ApiError ? err.message : "Try again." });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Truck className="size-5" /> Record Goods Receipt</DialogTitle>
          <DialogDescription>{poCode} · enter received / accepted / rejected per line.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="grn_date">GRN Date</Label>
            <Input id="grn_date" type="date" value={grnDate} onChange={(e) => setGrnDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lr">LR / Docket No.</Label>
            <Input id="lr" className="font-mono" value={lr} onChange={(e) => setLr(e.target.value)} placeholder="LR-99" />
          </div>
        </div>

        <div className="space-y-3">
          {lines.map((l) => {
            const st = state[l.id];
            const rem = remainingOf(l);
            return (
              <div key={l.id} className="rounded-md border border-border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">{l.item_desc}</span>
                  <span className="text-xs text-muted-foreground">open balance <span className="font-mono">{rem} {l.uom}</span></span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="space-y-1"><Label className="text-xs">Received</Label>
                    <Input type="number" step="any" className="font-mono" value={st?.received ?? ""}
                      onChange={(e) => upd(l.id, { received: e.target.value })} /></div>
                  <div className="space-y-1"><Label className="text-xs">Accepted</Label>
                    <Input type="number" step="any" className="font-mono" value={st?.accepted ?? ""}
                      onChange={(e) => upd(l.id, { accepted: e.target.value })} /></div>
                  <div className="space-y-1"><Label className="text-xs">Rejected</Label>
                    <Input type="number" step="any" className="font-mono" value={st?.rejected ?? ""}
                      onChange={(e) => upd(l.id, { rejected: e.target.value })} /></div>
                  <div className="space-y-1"><Label className="text-xs">Reason</Label>
                    <Select value={st?.reason || ""} onValueChange={(v) => upd(l.id, { reason: v as RejectReason })}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        {REASONS.map(([v, lbl]) => <SelectItem key={v} value={v}>{lbl}</SelectItem>)}
                      </SelectContent>
                    </Select></div>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="navy" onClick={onSubmit} disabled={record.isPending}>
            {record.isPending ? "Recording…" : "Save GRN & Notify Vendor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
