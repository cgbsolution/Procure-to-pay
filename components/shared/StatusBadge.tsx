import * as React from "react";
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  CircleDot,
  Ban,
  Send,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

type SemanticVariant = NonNullable<BadgeProps["variant"]>;

interface StatusConfig {
  label: string;
  variant: SemanticVariant;
  icon: LucideIcon;
}

/**
 * Maps a domain status string -> { label, color token, icon }.
 * Color is NEVER the only signal: every status carries an icon + text label
 * (accessibility / color-blind safety).
 *
 * Unknown statuses fall back to a neutral badge with a humanized label.
 */
const STATUS_MAP: Record<string, StatusConfig> = {
  // Generic lifecycle
  draft: { label: "Draft", variant: "neutral", icon: FileText },
  submitted: { label: "Submitted", variant: "info", icon: Send },
  pending: { label: "Pending", variant: "warning", icon: Clock },
  pending_approval: {
    label: "Pending Approval",
    variant: "warning",
    icon: Clock,
  },
  in_review: { label: "In Review", variant: "info", icon: CircleDot },
  approved: { label: "Approved", variant: "success", icon: CheckCircle2 },
  rejected: { label: "Rejected", variant: "danger", icon: XCircle },
  cancelled: { label: "Cancelled", variant: "neutral", icon: Ban },
  on_hold: { label: "On Hold", variant: "warning", icon: AlertTriangle },

  // P2P-specific
  exception: { label: "Exception", variant: "danger", icon: AlertTriangle },
  matched: { label: "Matched", variant: "success", icon: CheckCircle2 },
  partially_matched: {
    label: "Partially Matched",
    variant: "warning",
    icon: AlertTriangle,
  },
  paid: { label: "Paid", variant: "success", icon: CheckCircle2 },
  unpaid: { label: "Unpaid", variant: "warning", icon: Clock },
  overdue: { label: "Overdue", variant: "danger", icon: AlertTriangle },
  active: { label: "Active", variant: "success", icon: CheckCircle2 },
  inactive: { label: "Inactive", variant: "danger", icon: Ban },
  verified: { label: "Verified", variant: "success", icon: CheckCircle2 },

  // Onboarding
  awaiting_docs: { label: "Awaiting Docs", variant: "warning", icon: Clock },
  under_review: { label: "Under Review", variant: "info", icon: CircleDot },
  finance_review: { label: "Finance Review", variant: "info", icon: CircleDot },
  onboarding: { label: "Onboarding", variant: "info", icon: CircleDot },

  // PR / PO
  returned: { label: "Returned", variant: "warning", icon: Send },
  po_created: { label: "PO Created", variant: "success", icon: CheckCircle2 },
  dispatched: { label: "Dispatched", variant: "info", icon: Send },
  acknowledged: { label: "Acknowledged", variant: "success", icon: CheckCircle2 },
  in_transit: { label: "In Transit", variant: "info", icon: CircleDot },
  on_hold_v: { label: "On Hold", variant: "warning", icon: AlertTriangle },
  uploaded: { label: "Uploaded", variant: "info", icon: FileText },
};

function humanize(status: string): string {
  return status
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface StatusBadgeProps
  extends Omit<BadgeProps, "variant" | "children"> {
  status: string;
  /** Hide the icon (text + color still convey state). */
  hideIcon?: boolean;
}

export function StatusBadge({
  status,
  hideIcon,
  className,
  ...props
}: StatusBadgeProps) {
  const key = status?.toLowerCase().trim() ?? "";
  const config: StatusConfig = STATUS_MAP[key] ?? {
    label: humanize(status ?? "Unknown"),
    variant: "neutral",
    icon: CircleDot,
  };
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={cn(className)} {...props}>
      {!hideIcon && <Icon className="size-3" aria-hidden="true" />}
      <span>{config.label}</span>
    </Badge>
  );
}
