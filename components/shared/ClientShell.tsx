"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  UserPlus,
  Send,
  CheckCircle2,
  ClipboardList,
  FileText,
  Plus,
  Check,
  PackageCheck,
  ClipboardCheck,
  ReceiptText,
  ScanLine,
  ShieldCheck,
  GitMerge,
  AlertTriangle,
  Wallet,
  RefreshCw,
  History,
  BarChart3,
  CalendarClock,
  Percent,
  PieChart,
  Star,
  LogOut,
  ChevronDown,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth";
import { SessionGuard } from "@/components/shared/SessionGuard";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type NavItem = { href: string; label: string; icon: LucideIcon; soon?: boolean };
// Mirrors the prototype's flow-based structure. Items we consolidated into tabs /
// dialogs / filtered views deep-link with a query or hash (e.g. an invoice stage
// filters the queue; a report scrolls to its section).
const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Flow 1 — Vendor Onboarding",
    items: [
      { href: "/onboarding", label: "Applications", icon: UserPlus },
      { href: "/onboarding/new", label: "Send Invite Link", icon: Send },
      { href: "/onboarding?status=under_review", label: "Approval Workflow", icon: CheckCircle2 },
      { href: "/vendors", label: "Vendor Master", icon: Building2 },
    ],
  },
  {
    label: "Flow 2 — PR & PO",
    items: [
      { href: "/requisitions", label: "Requisitions", icon: ClipboardList },
      { href: "/requisitions/new", label: "Raise New PR", icon: Plus },
      { href: "/requisitions?status=pending_approval", label: "PR Approvals", icon: Check },
      { href: "/purchase-orders", label: "Purchase Orders", icon: FileText },
      { href: "/requisitions?status=approved", label: "Create PO", icon: Plus },
    ],
  },
  {
    label: "Flow 3 — Invoicing & GR",
    items: [
      { href: "/receiving", label: "GRN / SES List", icon: PackageCheck },
      { href: "/service-entries", label: "Service Entries", icon: ClipboardCheck },
      { href: "/invoices", label: "Invoice Queue", icon: ReceiptText },
      { href: "/invoices?status=received", label: "OCR Review", icon: ScanLine },
      { href: "/invoices?status=validation_failed", label: "Validation Pipeline", icon: ShieldCheck },
      { href: "/invoices?status=matched", label: "3-Way Match", icon: GitMerge },
      { href: "/invoices?status=pending_approval", label: "Invoice Approval", icon: CheckCircle2 },
      { href: "/exceptions", label: "Exceptions", icon: AlertTriangle },
    ],
  },
  {
    label: "Flow 4 — Payment & Tally",
    items: [
      { href: "/payments", label: "Payment Queue", icon: Wallet },
      { href: "/tally", label: "Tally Sync", icon: RefreshCw },
      { href: "/payments?tab=history", label: "Payment History", icon: History },
    ],
  },
  {
    label: "Flow 5 — Reports",
    items: [
      { href: "/reports", label: "Analytics", icon: BarChart3 },
      { href: "/reports#ap-ageing", label: "AP Ageing", icon: CalendarClock },
      { href: "/reports#gst-itc", label: "GST / ITC", icon: Percent },
      { href: "/reports#spend", label: "Spend Analysis", icon: PieChart },
      { href: "/reports#vendor-performance", label: "Vendor Performance", icon: Star },
    ],
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function humanRole(role?: string) {
  return role ? role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";
}

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  async function onLogout() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST", skipAuth: true });
    } catch {
      /* local logout proceeds regardless */
    }
    logout();
    router.replace("/login");
  }

  return (
    <SessionGuard>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <div className="flex h-10 items-center gap-2 px-1 text-base font-semibold text-sidebar-foreground">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-sidebar-foreground/10 text-sidebar-primary">
                <Zap className="size-4" />
              </span>
              <span className="truncate group-data-[collapsible=icon]:hidden">ProcureFlow</span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            {NAV_SECTIONS.map((section) => (
              <SidebarGroup key={section.label}>
                <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map(({ href, label, icon: Icon, soon }) => {
                      // Deep-link items (?query / #hash) navigate to a base page's
                      // filtered view/tab; only the plain base item shows active.
                      const base = href.split(/[?#]/)[0];
                      const active = !/[?#]/.test(href)
                        && (pathname === base || pathname.startsWith(`${base}/`));
                      if (soon) {
                        return (
                          <SidebarMenuItem key={href}>
                            <SidebarMenuButton
                              tooltip={label}
                              aria-disabled
                              className="opacity-50"
                            >
                              <Icon />
                              <span>{label}</span>
                            </SidebarMenuButton>
                            <SidebarMenuBadge className="bg-sidebar-foreground/10">
                              soon
                            </SidebarMenuBadge>
                          </SidebarMenuItem>
                        );
                      }
                      return (
                        <SidebarMenuItem key={href}>
                          <SidebarMenuButton asChild isActive={active} tooltip={label}>
                            <Link href={href} aria-current={active ? "page" : undefined}>
                              <Icon />
                              <span>{label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter>
            <div className="px-2 py-1 text-[10px] text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
              Meridian Manufacturing Ltd
            </div>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-background/95 px-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Client Portal</span>
            </div>
            <div className="flex items-center gap-1">
              <NotificationBell />
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1 pr-2 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
                    <Avatar className="size-8">
                      <AvatarFallback>{initials(user.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="hidden text-left sm:block">
                      <div className="text-sm font-medium leading-tight">{user.full_name}</div>
                      <div className="text-[11px] leading-tight text-muted-foreground">
                        {humanRole(user.roles[0])}
                      </div>
                    </div>
                    <ChevronDown className="size-4 text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onLogout} className="text-danger-foreground">
                      <LogOut className="size-4" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </header>
          <div className="flex-1 p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </SessionGuard>
  );
}
