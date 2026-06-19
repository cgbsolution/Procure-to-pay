"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const ITEMS = [
  { code: "RM-NR-001", desc: "Natural Rubber RSS-4", hsn: "40011000", uom: "MT", rate: "₹3,117", gst: "5%" },
  { code: "RM-NR-002", desc: "Natural Rubber RSS-3", hsn: "40011000", uom: "MT", rate: "₹3,290", gst: "5%" },
  { code: "RM-NR-003", desc: "Reclaimed Rubber", hsn: "40020000", uom: "MT", rate: "₹1,850", gst: "18%" },
];

export default function VendorCataloguePage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Item Catalogue</h1>
        <p className="text-sm text-muted-foreground">Products and services you supply to the buyer.</p>
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Item Code</TableHead><TableHead>Description</TableHead><TableHead>HSN</TableHead>
              <TableHead>UOM</TableHead><TableHead>Rate</TableHead><TableHead>GST</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ITEMS.map((it) => (
              <TableRow key={it.code} className="hover:bg-transparent">
                <TableCell className="font-mono text-xs">{it.code}</TableCell>
                <TableCell className="font-medium">{it.desc}</TableCell>
                <TableCell className="font-mono text-xs">{it.hsn}</TableCell>
                <TableCell>{it.uom}</TableCell>
                <TableCell className="font-mono text-xs">{it.rate}</TableCell>
                <TableCell><Badge variant="neutral">{it.gst}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
