export type PromoDiscountType = "percentage" | "fixed";
export type PromoScope = "all" | "categories" | "products";
/** Estado calculado por el backend según fechas, usos y el interruptor. */
export type PromoStatus = "active" | "scheduled" | "expired" | "exhausted" | "paused";

export interface PromoCodeProduct {
  id: string;
  title: string;
  image_product: string | null;
}

export interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: PromoDiscountType;
  /** Porcentaje (1–90) o pesos, según `discount_type`. */
  discount_value: number;
  scope: PromoScope;
  category_ids: string[];
  product_ids: string[];
  /** Resumen de los productos elegidos (scope = "products"). */
  products: PromoCodeProduct[];
  include_discounted: boolean;
  min_purchase: number | null;
  max_uses: number | null;
  uses_count: number;
  /** Días de Colombia "YYYY-MM-DD", ambos incluidos; null = sin límite. */
  starts_on: string | null;
  expires_on: string | null;
  is_active: boolean;
  status: PromoStatus;
  created_at: string;
}

export interface PromoCodesResponse {
  promoCodes: PromoCode[];
  total: number;
  grandTotal: number;
  page: number;
  totalPages: number;
}

export interface PromoCodePayload {
  code: string;
  description: string;
  discount_type: PromoDiscountType;
  discount_value: number;
  scope: PromoScope;
  category_ids: string[];
  product_ids: string[];
  include_discounted: boolean;
  min_purchase: number | null;
  max_uses: number | null;
  starts_on: string | null;
  expires_on: string | null;
  is_active: boolean;
}

/** Mismos topes que el backend. */
export const PROMO_CODE_REGEX = /^[A-Z0-9_-]{3,20}$/;
export const MAX_PROMO_CODE_LENGTH = 20;
export const MAX_PROMO_DESCRIPTION_LENGTH = 120;
export const MAX_PROMO_PERCENTAGE = 90;
export const MAX_PROMO_AMOUNT = 100_000_000;
export const MAX_PROMO_USES = 1_000_000;
