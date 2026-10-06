/** Plan y uso de la empresa del usuario (`GET /get-plan`). null = sin límite. */
export interface PlanResponse {
  company: { id: string; name: string };
  limits: { products: number | null; images: number | null };
  usage: { products: number; images: number };
}

/** Rangos permitidos para los topes (`GET /platform/config`). */
export interface PlatformConfig {
  products: { min: number; max: number };
  images: { min: number; max: number };
  imagesPerProduct: number;
  imagesExtra: number;
}

export interface PlatformCompany {
  id: string;
  name: string;
  /** Carpeta en el bucket; null = raíz (empresa anterior al esquema por carpetas). */
  s3_prefix: string | null;
  created_at: string | null;
  max_products: number | null;
  max_images: number | null;
  /** Envío que cobra la tienda (pesos); null = no cobra envío. */
  shipping_fee: number | null;
  /** Envío gratis desde este valor de productos (pesos); null = nunca gratis. */
  free_shipping_from: number | null;
  products: number;
  users: number;
  /** null cuando no se puede atribuir (varias empresas comparten la raíz). */
  images: number | null;
  admin: { email: string; username: string } | null;
  /** Con qué cuenta cobra en Mercado Pago (ver MercadoPagoSource). */
  mercadopago: MercadoPagoSource;
}

/**
 * company = cuenta propia configurada; legacy = empresa heredada que aún usa
 * el token del servidor; disabled = configurada pero desactivada; none = sin pagos.
 */
export type MercadoPagoSource = "company" | "legacy" | "disabled" | "none";

/** Configuración de Mercado Pago de una empresa. El token nunca llega: solo su pista. */
export interface MercadoPagoSettings {
  enabled: boolean;
  source: MercadoPagoSource;
  store_url: string;
  statement_descriptor: string;
  email_from: string;
  email_color: string;
  logo_url: string;
  has_access_token: boolean;
  /** "…ABCD" (últimos 4 caracteres) o null. */
  access_token_hint: string | null;
  mode: "test" | "production" | "unreadable" | null;
  webhook_url: string;
  /** false si el servidor no tiene SECRETS_KEY (no puede guardar tokens). */
  can_store_secrets: boolean;
}

export interface MercadoPagoSettingsPayload {
  enabled: boolean;
  /** Texto = reemplazar; "" = conservar el guardado; null = borrarlo. */
  access_token: string | null;
  store_url: string;
  statement_descriptor: string;
  email_from: string;
  email_color: string;
  logo_url: string;
}

export interface PlatformCompaniesResponse {
  companies: PlatformCompany[];
  total: number;
}

export interface CreateCompanyPayload {
  name: string;
  max_products: number | null;
  max_images: number | null;
  admin: { username: string; email: string; password: string };
}

export interface UpdateCompanyPayload {
  name?: string;
  max_products?: number | null;
  max_images?: number | null;
  shipping_fee?: number | null;
  free_shipping_from?: number | null;
}
