"use client";

import * as React from "react";
import { toast } from "sonner";
import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useVendors, useVendor } from "@/features/vendors/api";
import { useCreatePO } from "@/features/po/api";
import { ApiError } from "@/lib/api-client";

export function CreatePODialog({
  prId,
  trigger,
  onCreated,
}: {
  prId: string;
  trigger: React.ReactNode;
  onCreated: (poCode: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [vendorCode, setVendorCode] = React.useState("");
  const [pos, setPos] = React.useState("");
  const [terms, setTerms] = React.useState("net_30");
  const [deliveryBy, setDeliveryBy] = React.useState(new Date().toISOString().slice(0, 10));
  const [location, setLocation] = React.useState("North Works, Pune");

  const { data: vendors } = useVendors({ status: "active", page_size: 100 });
  const { data: vendor } = useVendor(vendorCode);
  const create = useCreatePO();

  // Default place-of-supply to the vendor's GSTIN state when it loads.
  React.useEffect(() => {
    if (vendor?.gstin) setPos(vendor.gstin.slice(0, 2));
  }, [vendor?.gstin]);

  async function onSubmit() {
    if (!vendor) {
      toast.error("Select a vendor");
      return;
    }
    try {
      const po = await create.mutateAsync({
        pr_ids: [prId],
        vendor_id: vendor.id,
        delivery_location: location || undefined,
        delivery_required_by: deliveryBy,
        place_of_supply_state_code: pos,
        payment_terms: terms as "net_30" | "net_45" | "net_60",
      });
      toast.success(`PO ${po.code} created`);
      setOpen(false);
      onCreated(po.code);
    } catch (err) {
      toast.error("Could not create PO", {
        description: err instanceof ApiError ? err.message : "Please try again.",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileText className="size-5" /> Create Purchase Order</DialogTitle>
          <DialogDescription>
            From the approved requisition. GST and totals are recomputed server-side; MSME terms auto-clamp to Net-45.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Vendor (Approved Vendor List)</Label>
            <Select value={vendorCode} onValueChange={setVendorCode}>
              <SelectTrigger><SelectValue placeholder="Select an active vendor" /></SelectTrigger>
              <SelectContent>
                {(vendors?.data ?? []).map((v) => (
                  <SelectItem key={v.code} value={v.code}>
                    {v.legal_name} ({v.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pos">Place of Supply (state code)</Label>
              <Input id="pos" maxLength={2} className="font-mono" value={pos} onChange={(e) => setPos(e.target.value)} placeholder="27" />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Terms</Label>
              <Select value={terms} onValueChange={setTerms}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="net_30">Net 30</SelectItem>
                  <SelectItem value="net_45">Net 45</SelectItem>
                  <SelectItem value="net_60">Net 60</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dby">Delivery Required By</Label>
              <Input id="dby" type="date" value={deliveryBy} onChange={(e) => setDeliveryBy(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loc">Delivery Location</Label>
              <Input id="loc" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="navy" onClick={onSubmit} disabled={create.isPending || !vendorCode || pos.length !== 2}>
            {create.isPending ? "Creating…" : "Create PO"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
