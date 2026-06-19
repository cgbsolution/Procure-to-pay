"use client";

import Link from "next/link";
import {
  ClipboardList, FileText, ReceiptText, AlertTriangle, Wallet, TrendingUp, Inbox,
} from "lucide-react";

import { useClientSummary, useWorklist, useRecentActivity } from "@/features/analytics/api";
import { StatCard, BarList, CountPills } from "@/components/charts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton, ErrorState } from "@/components/shared/states";
import { formatINR, formatDateTime } from "@/lib/format";
import { useAuthStore } from "@/stores/auth";

const WORK_LINK: Record<string, string> = {
  PR: "/requisitions", Invoice: "/invoices", "Payment Run": "/payments", Onboarding: "/onboarding",
};

function WorklistCard() {
  const { data } = useWorklist();
  const items = data ?? [];
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Awaiting My Action {items.length > 0 && <Badge variant="warning">{items.length}</Badge>}</CardTitle></CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-sm text-muted-foreground">
            <Inbox className="size-8 opacity-30" /> Nothing awaiting you 🎉
          </div>
        ) : (
          <div className="space-y-1.5">
            {items.map((it) => (
              <Link key={it.code} href={WORK_LINK[it.type] ?? "/dashboard"}
                className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  <Badge variant="neutral">{it.type}</Badge>
                  <span className="font-mono text-xs">{it.code}</span>
                </div>
                <span className="font-mono text-xs text-muted-foreground">{it.value ? formatINR(Number(it.value)) : ""}</span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityCard() {
  const { data } = useRecentActivity();
  const events = data ?? [];
  function humanize(s: string) { return s.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()); }
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Live Activity</CardTitle></CardHeader>
      <CardContent>
        {events.length === 0 ? <p className="py-4 text-sm text-muted-foreground">No recent activity.</p> : (
          <ol className="relative space-y-3 border-l border-border pl-5">
            {events.map((e, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[1.45rem] top-1 size-2.5 rounded-full bg-primary ring-4 ring-background" />
                <div className="text-sm font-medium">{humanize(e.action)}</div>
                <div className="text-xs text-muted-foreground">{e.actor}{e.at ? ` · ${formatDateTime(e.at)}` : ""}</div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function humanize(s: string) {
  return s.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
const SEV_TONE: Record<string, string> = {
  critical: "bg-rose-100 text-rose-700", high: "bg-amber-100 text-amber-700",
  medium: "bg-sky-100 text-sky-700", low: "bg-muted text-foreground",
};

export default function ClientDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, refetch } = useClientSummary();

  if (isLoading) return <TableSkeleton cols={3} rows={4} />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;
  const k = data.kpis;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">{user ? `Welcome back, ${user.full_name}.` : "Welcome back."}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="PRs Pending" value={k.prs_pending} icon={<ClipboardList className="size-4" />} />
        <StatCard label="POs Awaiting Ack" value={k.pos_awaiting_ack} icon={<FileText className="size-4" />} />
        <StatCard label="Invoices In Pipeline" value={k.invoices_in_pipeline} icon={<ReceiptText className="size-4" />} accent="navy" />
        <StatCard label="Open Exceptions" value={k.exceptions_open} icon={<AlertTriangle className="size-4" />} accent="danger" />
        <StatCard label="Payables Due" value={formatINR(Number(k.payables_due_amount))} icon={<Wallet className="size-4" />} accent="gold" />
        <StatCard label="Spend (FY)" value={formatINR(Number(k.spend_fy_amount))} icon={<TrendingUp className="size-4" />} accent="success" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <WorklistCard />
        <ActivityCard />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">AP Ageing</CardTitle></CardHeader>
          <CardContent>
            <BarList color="bg-amber-400" items={data.ap_ageing.map((b) => ({
              label: `${b.bucket} (${b.count})`, value: Number(b.amount), display: formatINR(Number(b.amount)),
            }))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Spend by Category</CardTitle></CardHeader>
          <CardContent>
            <BarList items={data.spend_by_category.map((c) => ({
              label: c.label, value: Number(c.amount), display: formatINR(Number(c.amount)),
            }))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Invoice Pipeline</CardTitle></CardHeader>
          <CardContent>
            {data.invoice_pipeline.length === 0
              ? <p className="py-4 text-sm text-muted-foreground">No invoices yet.</p>
              : <CountPills items={data.invoice_pipeline.map((p) => ({ label: humanize(p.status ?? ""), count: p.count }))} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Open Exceptions by Severity</CardTitle></CardHeader>
          <CardContent>
            {data.exceptions_by_severity.length === 0
              ? <p className="py-4 text-sm text-muted-foreground">No open exceptions 🎉</p>
              : <CountPills items={data.exceptions_by_severity.map((e) => ({
                  label: humanize(e.severity ?? ""), count: e.count, tone: SEV_TONE[e.severity ?? ""],
                }))} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
