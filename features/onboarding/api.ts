"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type {
  ApplicationDecision,
  ApplicationListItem,
  ApplicationRead,
  InviteCreate,
  InviteCreated,
} from "./types";

const KEY = ["onboarding", "applications"] as const;

export function useApplications(status?: string) {
  return useQuery({
    queryKey: [...KEY, { status: status ?? "all" }],
    queryFn: () =>
      apiFetch<ApplicationListItem[]>(
        `/api/v1/onboarding/applications${status ? `?status=${status}` : ""}`,
      ),
  });
}

export function useApplication(code: string) {
  return useQuery({
    queryKey: [...KEY, code],
    queryFn: () =>
      apiFetch<ApplicationRead>(`/api/v1/onboarding/applications/${code}`),
    enabled: !!code,
  });
}

export function useSendInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: InviteCreate) =>
      apiFetch<InviteCreated>("/api/v1/vendors/invites", {
        method: "POST",
        json: body,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDecision(code: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ApplicationDecision) =>
      apiFetch<ApplicationRead>(
        `/api/v1/onboarding/applications/${code}/decision`,
        { method: "POST", json: body },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...KEY, code] });
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["vendors"] });
    },
  });
}
