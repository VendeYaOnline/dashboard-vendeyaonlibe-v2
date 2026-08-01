import type { ReactNode } from "react";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="px-4 pb-10 pt-20 lg:ml-64 lg:px-8 lg:pt-8">{children}</main>
    </div>
  );
}
