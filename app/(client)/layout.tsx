import * as React from "react";
import { ClientShell } from "@/components/shared/ClientShell";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <ClientShell>{children}</ClientShell>;
}
