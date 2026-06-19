"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";

import {
  useUnreadCount, useNotifications, useMarkRead, useMarkAllRead, type NotificationItem,
} from "@/features/notifications/api";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";

export function NotificationBell() {
  const router = useRouter();
  const { data: count } = useUnreadCount();
  const { data: items } = useNotifications();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();
  const unread = count?.count ?? 0;

  function open(n: NotificationItem) {
    if (!n.read_at) markRead.mutate(n.id);
    if (n.link) router.push(n.link);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative rounded-full p-2 text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-sm font-semibold">Notifications</span>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => markAll.mutate()}>
              <CheckCheck className="size-3.5" /> Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-auto">
          {(items ?? []).length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
          ) : (
            (items ?? []).map((n) => (
              <button key={n.id} onClick={() => open(n)}
                className={cn("flex w-full flex-col items-start gap-0.5 border-b border-border px-3 py-2.5 text-left hover:bg-muted/60",
                  !n.read_at && "bg-primary/[0.04]")}>
                <div className="flex w-full items-center gap-2">
                  {!n.read_at && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
                  <span className="flex-1 text-sm font-medium leading-snug">{n.title}</span>
                </div>
                {n.body && <span className="text-xs text-muted-foreground">{n.body}</span>}
                <span className="text-[10px] text-muted-foreground">{formatDateTime(n.created_at)}</span>
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
