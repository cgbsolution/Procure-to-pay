"use client";

import * as React from "react";
import { toast } from "sonner";
import { Download, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";

import {
  useSpend, useApAgeing, useGstSummary, useVendorPerformance,
} from "@/features/analytics/api";
import { useTallySync, useRetryTally } from "@/features/tally/api";
import { StatCard, BarList } from "@/components/charts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/shared/states";
import { downloadCsv } from "@/lib/csv";
import { formatINR } from "@/lib/format";

export default function ReportsPage() {
  const spend = useSpend();
  const ageing = useApAgeing();
  const gst = useGstSummary();
  const perf = useVendorPerformance();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">Spend, AP ageing, GST input credit and vendor performance.</p>
      </div>

      <TallySyncCard />


      {/* GST / ITC */}
      {gst.data && (
        <div id="gst-itc" className="grid scroll-mt-20 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Taxable Value" value={formatINR(Number(gst.data.taxable))} hint={`${gst.data.invoice_count} invoices`} />
          <StatCard label="CGST" value={formatINR(Number(gst.data.cgst))} />
          <StatCard label="SGST" value={formatINR(Number(gst.data.sgst))} />
          <StatCard label="IGST" value={formatINR(Number(gst.data.igst))} />
          <StatCard label="Input Tax Credit" value={formatINR(Number(gst.data.total_itc))} accent="success" />
        </div>
      )}

      <div id="spend" className="grid scroll-mt-20 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Spend by Category</CardTitle>
            {spend.data && (
              <Button variant="ghost" size="sm" onClick={() => downloadCsv("spend-by-category.csv", spend.data!.by_category)}>
                <Download className="size-4" /> CSV
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {spend.isLoading ? <TableSkeleton cols={1} rows={4} /> : (
              <BarList items={(spend.data?.by_category ?? []).map((c) => ({
                label: c.label, value: Number(c.amount), display: formatINR(Number(c.amount)),
              }))} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Spend by Department</CardTitle>
            {spend.data && (
              <Button variant="ghost" size="sm" onClick={() => downloadCsv("spend-by-department.csv", spend.data!.by_department)}>
                <Download className="size-4" /> CSV
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {spend.isLoading ? <TableSkeleton cols={1} rows={4} /> : (
              <BarList color="bg-indigo-400" items={(spend.data?.by_department ?? []).map((c) => ({
                label: c.label, value: Number(c.amount), display: formatINR(Number(c.amount)),
              }))} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card id="ap-ageing" className="scroll-mt-20">
        <CardHeader><CardTitle className="text-base">AP Ageing</CardTitle></CardHeader>
        <CardContent>
          <BarList color="bg-amber-400" items={(ageing.data ?? []).map((b) => ({
            label: `${b.bucket} (${b.count})`, value: Number(b.amount), display: formatINR(Number(b.amount)),
          }))} />
        </CardContent>
      </Card>

      <Card id="vendor-performance" className="scroll-mt-20">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Vendor Performance</CardTitle>
          {perf.data && perf.data.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => downloadCsv("vendor-performance.csv", perf.data!)}>
              <Download className="size-4" /> CSV
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {perf.isLoading ? <TableSkeleton cols={4} rows={4} /> : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right">POs</TableHead>
                  <TableHead className="text-right">PO Value</TableHead>
                  <TableHead className="text-right">Invoices</TableHead>
                  <TableHead className="text-right">Exceptions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(perf.data ?? []).map((v) => (
                  <TableRow key={v.vendor} className="hover:bg-transparent">
                    <TableCell className="font-medium">{v.vendor}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{v.po_count}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{formatINR(Number(v.po_value))}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{v.invoice_count}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{v.exception_count}</TableCell>
                  </TableRow>
                ))}
                {(perf.data ?? []).length === 0 && (
                  <TableRow><TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">No vendor activity yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TallySyncCard() {
  const { data, isError } = useTallySync();
  const retry = useRetryTally();
  if (isError || !data) return null; // hidden for roles without payment:read

  async function onRetry() {
    try {
      const r = await retry.mutateAsync();
      toast.success(`Tally retry complete`, { description: `${r.synced}/${r.retried} re-synced.` });
    } catch {
      toast.error("Retry failed");
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Tally Sync</CardTitle>
        {data.failed > 0 && (
          <Button variant="outline" size="sm" onClick={onRetry} disabled={retry.isPending}>
            <RefreshCw className={`size-4 ${retry.isPending ? "animate-spin" : ""}`} /> Retry failed
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        <Badge variant="success"><CheckCircle2 className="size-3" /> {data.synced} synced</Badge>
        <Badge variant={data.failed > 0 ? "danger" : "neutral"}>
          <AlertTriangle className="size-3" /> {data.failed} failed
        </Badge>
        {data.pending > 0 && <Badge variant="neutral">{data.pending} pending</Badge>}
        <span className="text-xs text-muted-foreground">{data.total} payment voucher(s) total</span>
      </CardContent>
    </Card>
  );
}
