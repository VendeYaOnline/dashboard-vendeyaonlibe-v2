"use client";

import { CreditCard, ExternalLink } from "lucide-react";
import { buttonVariants, cn } from "@heroui/react";
import { useQueryFeatures } from "@/app/api/queries";
import { SUPERADMIN_ROLE } from "@/config/navigation";
import { useAuthStore } from "@/store/auth.store";

/** Dónde el dueño actualiza su tarjeta en vendeyaonline.com. */
const ACCOUNT_URL = "https://www.vendeyaonline.com/account";

/**
 * Aviso en todo el panel cuando Mercado Pago no logró cobrar la mensualidad de
 * VendeYaOnline (lo detecta la revisión periódica del backend). Desaparece solo
 * cuando el cobro se normaliza.
 */
export function BillingAlertBanner() {
  const user = useAuthStore((s) => s.user);
  const { data } = useQueryFeatures(Boolean(user) && user?.role !== SUPERADMIN_ROLE);
  if (data?.billing_alert?.type !== "payment_failed") return null;
  const isAdmin = user?.role === "admin";

  return (
    <div
      role="alert"
      className="mb-6 flex flex-col gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 sm:flex-row sm:items-center"
    >
      <CreditCard className="size-5 shrink-0 text-warning" aria-hidden />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold">No pudimos cobrar tu mensualidad de VendeYaOnline</p>
        <p className="text-muted">
          {isAdmin
            ? "Mercado Pago volverá a intentarlo. Actualiza tu método de pago para que tu plan no se cancele."
            : "Avísale al administrador de la tienda para que actualice el método de pago."}
        </p>
      </div>
      {isAdmin && (
        <a
          href={ACCOUNT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "primary", size: "sm" }), "shrink-0")}
        >
          Actualizar método de pago
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      )}
    </div>
  );
}
