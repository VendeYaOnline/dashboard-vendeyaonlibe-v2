import { CreditCard, Landmark, Wallet, type LucideIcon } from "lucide-react";
import { Chip } from "@heroui/react";
import type { PaymentGroup } from "@/interfaces/customers";

/** Cómo se muestra cada grupo de medios de pago. */
export const PAYMENT_GROUPS: Record<
  PaymentGroup,
  { label: string; hint: string; icon: LucideIcon; color: "accent" | "default" | "success" }
> = {
  transfer: {
    label: "Transferencia o llave",
    hint: "Llave BRE-B y transferencias: confirmas el pago a mano",
    icon: Landmark,
    color: "success",
  },
  mercadopago: {
    label: "Mercado Pago",
    hint: "Tarjetas de crédito y débito, PSE, Efecty: se confirma solo",
    icon: CreditCard,
    color: "accent",
  },
  other: {
    label: "Registrado en el panel",
    hint: "Efectivo u otros medios anotados a mano",
    icon: Wallet,
    color: "default",
  },
};

/** Chip con el icono del grupo y el medio concreto ("Llave BRE-B", "Tarjeta de crédito"...). */
export function PaymentChip({ group, label, count }: { group: PaymentGroup; label: string; count?: number }) {
  const config = PAYMENT_GROUPS[group];
  const Icon = config.icon;
  return (
    <Chip size="sm" variant="soft" color={config.color}>
      <Icon className="size-3" aria-hidden />
      <span title={config.label}>
        {label}
        {count && count > 1 ? ` ×${count}` : ""}
      </span>
    </Chip>
  );
}
