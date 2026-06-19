import * as React from "react";
import { VendorShell } from "@/components/shared/VendorShell";

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return <VendorShell>{children}</VendorShell>;
}
