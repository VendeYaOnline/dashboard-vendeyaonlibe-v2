"use client";

import { AlertTriangle, CreditCard, ExternalLink } from "lucide-react";
import { buttonVariants, cn } from "@heroui/react";
import { useQueryFeatures } from "@/app/api/queries";
import { SUPERADMIN_ROLE } from "@/config/navigation";
import { useAuthStore } from "@/store/auth.store";

/** Dónde el dueño actualiza su tarjeta o vuelve a suscribirse en vendeyaonline.com. */
const ACCOUNT_URL = "https://www.vendeyaonline.com/account";

const ALERTS = {
  payment_failed: {
    icon: CreditCard,
    tone: "warning" as const,
    title: "No pudimos cobrar tu mensualidad de VendeYaOnline",
    admin: "Mercado Pago volverá a intentarlo. Actualiza tu método de pago para que tu plan no se cancele.",
    others: "Avísale al administrador de la tienda para que actualice el método de pago.",
    action: "Actualizar método de pago",
  },
  subscription_cancelled: {
    icon: AlertTriangle,
    tone: "danger" as const,
    title: "Tu suscripción de VendeYaOnline se canceló",
    admin: "Mercado Pago no pudo cobrar tu mensualidad y canceló la suscripción; ya no se volverá a intentar. Suscríbete de nuevo para no perder tu tienda.",
    others: "Avísale al administrador de la tienda para que se suscriba de nuevo en vendeyaonline.com.",
    action: "Suscribirme de nuevo",
  },
};

/**
 * Aviso en todo el panel cuando Mercado Pago no logró cobrar la mensualidad de
 * VendeYaOnline o canceló la suscripción (lo detecta la revisión periódica del
 * backend). Desaparece solo cuando se normaliza.
 */
export function BillingAlertBanner() {
  const user = useAuthStore((s) => s.user);
  const { data } = useQueryFeatures(Boolean(user) && user?.role !== SUPERADMIN_ROLE);
  const type = data?.billing_alert?.type;
  if (type !== "payment_failed" && type !== "subscription_cancelled") return null;
  const alert = ALERTS[type];
  const Icon = alert.icon;
  const isAdmin = user?.role === "admin";

  return (
    <div
      role="alert"
      className={cn(
        "mb-6 flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center",
        alert.tone === "danger" ? "border-danger/30 bg-danger/10" : "border-warning/30 bg-warning/10",
      )}
    >
      <Icon className={cn("size-5 shrink-0", alert.tone === "danger" ? "text-danger" : "text-warning")} aria-hidden />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold">{alert.title}</p>
        <p className="text-muted">{isAdmin ? alert.admin : alert.others}</p>
      </div>
      {isAdmin && (
        <a
          href={ACCOUNT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "primary", size: "sm" }), "shrink-0")}
        >
          {alert.action}
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      )}
    </div>
  );
}
