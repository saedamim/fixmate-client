import { Suspense } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";

// Shared layout for every dashboard page (customer, technician, admin): sidebar + topbar + content.
// It replaces the public navbar and footer, which stay in the (site) layout.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    // The shell reads the current path, so it needs a Suspense boundary
    <Suspense fallback={<div className="flex-1 bg-[#f7f8f8]" aria-busy="true" />}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}
