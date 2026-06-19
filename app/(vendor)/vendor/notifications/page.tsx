"use client";

import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";

import { useNotifications, useMarkRead, useMarkAllRead, type NotificationItem } from "@/features/notifications/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, TableSkeleton } from "@/components/shared/states";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";

export default function VendorNotificationsPage() {
  const router = useRouter();
  const { data, isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();
  const items = data ?? [];
  const unread = items.filter((n) => !n.read_at).length;

  function open(n: NotificationItem) {
    if (!n.read_at) markRead.mutate(n.id);
    if (n.link) router.push(n.link);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground">{unread} unread</p>
        </div>
        {unread > 0 && <Button variant="outline" size="sm" onClick={() => markAll.mutate()}><CheckCheck className="size-4" /> Mark all read</Button>}
      </div>
      {isLoading ? <TableSkeleton cols={1} rows={5} /> : items.length === 0 ? (
        <EmptyState title="You're all caught up" description="PO, invoice and payment alerts will appear here." />
      ) : (
        <Card><CardContent className="p-0">
          {items.map((n) => (
            <button key={n.id} onClick={() => open(n)}
              className={cn("flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-muted/50",
                !n.read_at && "bg-primary/[0.04]")}>
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-muted"><Bell className="size-4 text-muted-foreground" /></div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {!n.read_at && <span className="size-1.5 rounded-full bg-primary" />}
                  <span className="text-sm font-medium">{n.title}</span>
                </div>
                {n.body && <div className="text-xs text-muted-foreground">{n.body}</div>}
                <div className="mt-0.5 text-[10px] text-muted-foreground">{formatDateTime(n.created_at)}</div>
              </div>
            </button>
          ))}
        </CardContent></Card>
      )}
    </div>
  );
}
