"use client";

import Link from "next/link";
import { FileText, ReceiptText, Wallet, Banknote, Bell, ChevronRight } from "lucide-react";

import { useVendorSummary } from "@/features/analytics/api";
import { useNotifications } from "@/features/notifications/api";
import { StatCard, CountPills } from "@/components/charts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TableSkeleton, ErrorState } from "@/components/shared/states";
import { formatINR, formatDateTime } from "@/lib/format";
import { useAuthStore } from "@/stores/auth";

function humanize(s: string) {
  return s.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function VendorDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, refetch } = useVendorSummary();
  const { data: notifs } = useNotifications();

  if (isLoading) return <TableSkeleton cols={3} rows={3} />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;
  const k = data.kpis;
  const events = notifs ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">{user ? `Welcome back, ${user.full_name}.` : "Welcome back."}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Outstanding" value={formatINR(Number(k.outstanding_amount ?? 0))} icon={<Wallet className="size-4" />} accent="gold" />
        <StatCard label="Paid (30 days)" value={formatINR(Number(k.paid_30d_amount ?? 0))} icon={<Banknote className="size-4" />} accent="success" />
        <StatCard label="POs Awaiting Ack" value={k.pos_awaiting_ack ?? 0} icon={<FileText className="size-4" />} accent="navy" />
        <StatCard label="Invoices Submitted" value={k.invoices_submitted ?? 0} icon={<ReceiptText className="size-4" />} />
      </div>

      {(k.pos_awaiting_ack ?? 0) > 0 && (
        <Link href="/vendor/purchase-orders" className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 hover:bg-amber-100">
          <span><strong>{k.pos_awaiting_ack}</strong> purchase order(s) awaiting your acknowledgement.</span>
          <ChevronRight className="size-4" />
        </Link>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">My Invoices by Status</CardTitle></CardHeader>
          <CardContent>
            {data.invoice_status.length === 0
              ? <p className="py-4 text-sm text-muted-foreground">No invoices submitted yet.</p>
              : <CountPills items={data.invoice_status.map((s) => ({ label: humanize(s.status ?? ""), count: s.count }))} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
          <CardContent>
            {events.length === 0 ? <p className="py-4 text-sm text-muted-foreground">No recent activity.</p> : (
              <div className="space-y-2">
                {events.slice(0, 6).map((n) => (
                  <Link key={n.id} href={n.link ?? "/vendor/notifications"} className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50">
                    <Bell className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-sm font-medium leading-snug">{n.title}</div>
                      <div className="text-[10px] text-muted-foreground">{formatDateTime(n.created_at)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
