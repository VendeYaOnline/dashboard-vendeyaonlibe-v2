import type { MercadoPagoSource, PlatformConfig } from "@/interfaces/platform";

/** Estado de Mercado Pago de una empresa, para chips y avisos. */
export const MERCADOPAGO_SOURCE_LABELS: Record<MercadoPagoSource, string> = {
  company: "Cuenta propia",
  legacy: "Cuenta del servidor (heredada)",
  disabled: "Desactivado",
  none: "Sin configurar",
};

/** Tope de imágenes sugerido: productos × imágenes por producto + portadas (mismo cálculo que el backend). */
export const suggestedImageLimit = (maxProducts: number, config?: PlatformConfig) => {
  const perProduct = config?.imagesPerProduct ?? 6;
  const extra = config?.imagesExtra ?? 5;
  const cap = config?.images.max ?? 10000;
  return Math.min(cap, maxProducts * perProduct + extra);
};

export const formatDate = (value: string | null | undefined) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
};
