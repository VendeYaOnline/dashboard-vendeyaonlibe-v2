import { formatCOP } from "@/features/productos/utils";
import type { PromoCode, PromoStatus } from "@/interfaces/promo-codes";

export const PROMO_STATUS: Record<
  PromoStatus,
  { label: string; color: "success" | "accent" | "danger" | "warning" | "default"; hint: string }
> = {
  active: { label: "Vigente", color: "success", hint: "Los clientes pueden usarlo ahora" },
  scheduled: { label: "Programado", color: "accent", hint: "Empezará a funcionar en la fecha de inicio" },
  expired: { label: "Vencido", color: "danger", hint: "Pasó su fecha de fin" },
  exhausted: { label: "Agotado", color: "warning", hint: "Alcanzó su límite de usos" },
  paused: { label: "Pausado", color: "default", hint: "Lo desactivaste; actívalo cuando quieras" },
};

/** "15 %" o "$ 20.000". */
export const describeDiscount = (promo: Pick<PromoCode, "discount_type" | "discount_value">) =>
  promo.discount_type === "percentage"
    ? `${promo.discount_value} %`
    : formatCOP(promo.discount_value);

const dayFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** "YYYY-MM-DD" → "5 oct 2026" (se formatea en UTC para no correr el día). */
export const formatDay = (day: string) => dayFormatter.format(new Date(`${day}T00:00:00Z`));

export const describeValidity = (promo: Pick<PromoCode, "starts_on" | "expires_on">) => {
  if (promo.starts_on && promo.expires_on) {
    return `${formatDay(promo.starts_on)} – ${formatDay(promo.expires_on)}`;
  }
  if (promo.expires_on) return `Hasta el ${formatDay(promo.expires_on)}`;
  if (promo.starts_on) return `Desde el ${formatDay(promo.starts_on)}`;
  return "Sin vencimiento";
};

/** Sin 0/O ni 1/I, que se confunden al dictarlos o copiarlos a mano. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const generatePromoCode = (length = 8) => {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => CODE_ALPHABET[value % CODE_ALPHABET.length]).join("");
};

/** Hoy en Colombia, "YYYY-MM-DD" (mínimo de los selectores de fecha). */
export const todayInBogota = () =>
  new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
