"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, FileText, Wallet, LogOut, ChevronDown, Store,
  Building2, Bell, Truck, List, ReceiptText, FileDown, Percent, MessageCircle, HelpCircle,
  type LucideIcon,
} from "lucide-react";

import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth";
import { SessionGuard } from "@/components/shared/SessionGuard";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
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
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type NavItem = { href: string; label: string; icon: LucideIcon; soon?: boolean };
const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/vendor/profile", label: "Company Profile", icon: Building2 },
      { href: "/vendor/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    label: "Procurement",
    items: [
      { href: "/vendor/purchase-orders", label: "Purchase Orders", icon: FileText },
      { href: "/vendor/shipments", label: "Shipments & ASN", icon: Truck },
      { href: "/vendor/catalogue", label: "Item Catalogue", icon: List },
    ],
  },
  {
    label: "Invoicing & Payments",
    items: [
      { href: "/vendor/invoices", label: "Invoices", icon: ReceiptText },
      { href: "/vendor/payments", label: "Payment History", icon: Wallet },
      { href: "/vendor/remittance", label: "Remittance Advices", icon: FileDown },
      { href: "/vendor/deductions", label: "Deductions & TDS", icon: Percent },
    ],
  },
  {
    label: "Support",
    items: [
      { href: "/vendor/messages", label: "Messages", icon: MessageCircle },
      { href: "/vendor/help", label: "Help & FAQs", icon: HelpCircle },
    ],
  },
];

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export function VendorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  async function onLogout() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST", skipAuth: true });
    } catch { /* proceed */ }
    logout();
    router.replace("/login");
  }

  return (
    <SessionGuard>
      <SidebarProvider>
        <Sidebar collapsible="icon" className="theme-vendor">
          <SidebarHeader>
            <div className="flex h-10 items-center gap-2 px-1 text-base font-semibold text-sidebar-foreground">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-sidebar-foreground/15">
                <Store className="size-4" />
              </span>
              <span className="truncate group-data-[collapsible=icon]:hidden">Vendor Portal</span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            {NAV_SECTIONS.map((section) => (
              <SidebarGroup key={section.label}>
                <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map(({ href, label, icon: Icon }) => {
                      const active = pathname === href || pathname.startsWith(`${href}/`);
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
            <div className="px-2 py-1 text-[10px] text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
              ProcureFlow · Supplier Portal
            </div>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-background/95 px-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Supplier Portal</span>
            </div>
            <div className="flex items-center gap-1">
              <NotificationBell />
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1 pr-2 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
                    <Avatar className="size-8"><AvatarFallback className="bg-vendor text-vendor-foreground">{initials(user.full_name)}</AvatarFallback></Avatar>
                    <div className="hidden text-left sm:block">
                      <div className="text-sm font-medium leading-tight">{user.full_name}</div>
                      <div className="text-[11px] leading-tight text-muted-foreground">Vendor</div>
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
