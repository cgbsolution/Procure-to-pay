"use client";

import { Send, Paperclip } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function VendorMessagesPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Messages</h1>
        <p className="text-sm text-muted-foreground">Contextual threads with the buyer&apos;s procurement team.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Conversations</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              ["GRN Discrepancy · PO-2026-0043", "8 MT rejected (moisture)…", "danger", "Unread"],
              ["Document Reminder · MSME Cert", "Please upload MSME certificate…", "warning", "Action"],
              ["INV-0085 Payment Confirmation", "Payment processed. UTR 994512347", "neutral", ""],
            ].map(([t, p, tone, tag], i) => (
              <div key={i} className={`cursor-pointer rounded-md border px-3 py-2 ${i === 0 ? "border-primary/30 bg-primary/[0.04]" : "border-border"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t}</span>
                  {tag && <Badge variant={tone as "danger"}>{tag}</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">{p}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader><CardTitle className="text-base">GRN Discrepancy · PO-2026-0043</CardTitle></CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <div className="flex-1 space-y-3 overflow-auto">
              <div className="max-w-[80%] rounded-lg bg-muted px-3 py-2">
                <div className="text-[10px] text-muted-foreground">Buyer QC · Jun 9, 16:48</div>
                <div className="text-sm">8 MT of RSS-4 rejected due to high moisture (&gt;5%). Please issue a credit note for ₹24,936.</div>
              </div>
              <div className="ml-auto max-w-[80%] rounded-lg bg-vendor px-3 py-2 text-vendor-foreground">
                <div className="text-[10px] opacity-70">You · Jun 9, 17:12</div>
                <div className="text-sm">Acknowledged. We&apos;ll verify the moisture report and issue the credit note within 48 hours.</div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
              <Input placeholder="Type a message…" className="flex-1" />
              <Button variant="teal" size="icon-sm" aria-label="Send"><Send className="size-4" /></Button>
              <Button variant="outline" size="icon-sm" aria-label="Attach"><Paperclip className="size-4" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <p className="text-xs text-muted-foreground">Messaging is a preview — threads are illustrative; live messaging connects to the buyer&apos;s queue in a later release.</p>
    </div>
  );
}
