"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type {
  AgeBucket, ClientSummary, ExcTrend, GstSummary, Spend, TimelineEvent,
  VendorPerf, VendorSummary,
} from "./types";

export function useClientSummary() {
  return useQuery({
    queryKey: ["analytics", "client-summary"],
    queryFn: () => apiFetch<ClientSummary>("/api/v1/analytics/client-summary"),
  });
}

export function useVendorSummary() {
  return useQuery({
    queryKey: ["analytics", "vendor-summary"],
    queryFn: () => apiFetch<VendorSummary>("/api/v1/analytics/vendor-summary"),
  });
}

export function useSpend() {
  return useQuery({ queryKey: ["analytics", "spend"], queryFn: () => apiFetch<Spend>("/api/v1/analytics/spend") });
}

export function useApAgeing() {
  return useQuery({ queryKey: ["analytics", "ap-ageing"], queryFn: () => apiFetch<AgeBucket[]>("/api/v1/analytics/ap-ageing") });
}

export function useGstSummary() {
  return useQuery({ queryKey: ["analytics", "gst"], queryFn: () => apiFetch<GstSummary>("/api/v1/analytics/gst-summary") });
}

export function useVendorPerformance() {
  return useQuery({ queryKey: ["analytics", "vendor-perf"], queryFn: () => apiFetch<VendorPerf[]>("/api/v1/analytics/vendor-performance") });
}

export function useExceptionTrends() {
  return useQuery({ queryKey: ["analytics", "exc-trends"], queryFn: () => apiFetch<ExcTrend[]>("/api/v1/analytics/exception-trends") });
}

export interface WorklistItem { type: string; code: string; value: string | null; status: string; created_at: string | null }
export interface RecentEvent { at: string | null; action: string; actor: string; entity_type: string | null; after: Record<string, unknown> | null }

export function useWorklist() {
  return useQuery({ queryKey: ["analytics", "worklist"], queryFn: () => apiFetch<WorklistItem[]>("/api/v1/analytics/worklist") });
}
export function useRecentActivity() {
  return useQuery({ queryKey: ["analytics", "recent"], queryFn: () => apiFetch<RecentEvent[]>("/api/v1/audit/recent") });
}

export function useTimeline(entityType: string, entityId: string | undefined) {
  return useQuery({
    queryKey: ["analytics", "timeline", entityType, entityId],
    queryFn: () => apiFetch<TimelineEvent[]>(`/api/v1/audit/timeline/${entityType}/${entityId}`),
    enabled: !!entityId,
  });
}
