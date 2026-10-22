import type { ReactNode } from "react";
import { BillingAlertBanner } from "@/components/layout/billing-alert-banner";
import { BillingBlockGate } from "@/components/layout/billing-block-gate";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { RouteGuard } from "@/components/layout/route-guard";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* El guard envuelve también el menú: sin sesión validada no se pinta nada del panel. */}
      <RouteGuard>
        {/* Bloqueado por falta de pago: en vez del panel, la pantalla para suscribirse de nuevo. */}
        <BillingBlockGate>
          <DashboardSidebar />
          <main className="px-4 pb-10 pt-20 lg:ml-64 lg:px-8 lg:pt-8">
            <BillingAlertBanner />
            {children}
          </main>
        </BillingBlockGate>
      </RouteGuard>
    </div>
  );
}
