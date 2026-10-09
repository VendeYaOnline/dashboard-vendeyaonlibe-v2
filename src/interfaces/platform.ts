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

import type { PaidFeature } from "@/config/navigation";
import type { Users } from "./users";

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
  /** Cuántos administradores tiene la empresa (`admin` muestra solo el primero). */
  admins: number;
  /** Con qué cuenta cobra en Mercado Pago (ver MercadoPagoSource). */
  mercadopago: MercadoPagoSource;
  /** Vistas de pago activas. */
  features: PaidFeature[];
  /** Correos de Marketing por mes; null = el valor por defecto (2.000). */
  marketing_monthly_limit: number | null;
  /** Ruta de un producto en la tienda para los correos; null = /producto/{id}. */
  marketing_product_path: string | null;
  /** Correos de Marketing por día y por hora; null = los globales de Plataforma. */
  marketing_daily_limit: number | null;
  marketing_hourly_limit: number | null;
  /** verified = Cloud API activa y verificada; api = activa sin verificar; off = enlaces wa.me. */
  whatsapp: "verified" | "api" | "off";
  /** A dónde llegan los correos de prueba de la tienda; null = sin pruebas. */
  marketing_test_email: string | null;
  /** Correos de prueba usados (máximo 10). */
  marketing_test_sends: number;
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
  features?: PaidFeature[];
  marketing_monthly_limit?: number | null;
  marketing_product_path?: string | null;
  marketing_daily_limit?: number | null;
  marketing_hourly_limit?: number | null;
  marketing_test_email?: string | null;
  /** true = la tienda vuelve a tener sus 10 correos de prueba. */
  reset_test_sends?: boolean;
}

/** Límites de correos de Marketing por defecto (todas las tiendas sin límite propio). */
export interface MarketingLimits {
  monthly: number;
  daily: number;
  hourly: number;
}

/** WhatsApp Cloud API de una tienda (el token nunca llega al navegador). */
export interface WhatsappSettings {
  enabled: boolean;
  phone_number_id: string;
  template_name: string;
  template_language: string;
  display_phone: string | null;
  verified_name: string | null;
  /** Lista para enviar (activa y con todo lo necesario). */
  ready: boolean;
  /** Meta confirmó el token y el número (se pierde si cambian). */
  verified: boolean;
  has_token: boolean;
  token_hint: string | null;
  can_store_secrets: boolean;
}

export interface WhatsappSettingsPayload {
  enabled?: boolean;
  phone_number_id?: string;
  template_name?: string;
  template_language?: string;
  /** Texto = reemplazar; ausente = conservar; null = borrar. */
  access_token?: string | null;
}

/** Usuarios de una empresa (`GET /platform/companies/:id/users`), administradores primero. */
export interface CompanyUsersResponse {
  company: { id: string; name: string };
  users: Users[];
}

export interface CompanyUserPayload {
  username: string;
  email: string;
  role: string;
  /** Al editar, vacía o ausente = conservar la contraseña actual. */
  password?: string;
}

/** Superadministrador de la plataforma (`GET /platform/superadmins`, solo el propietario). */
export interface Superadmin {
  id: string;
  username: string;
  email: string;
  /** El propietario no se elimina ni cambia de correo. */
  is_owner: boolean;
}

export interface SuperadminsResponse {
  superadmins: Superadmin[];
}

export interface SuperadminPayload {
  username: string;
  email: string;
  /** Al editar, vacía o ausente = conservar la contraseña actual. */
  password?: string;
}

/** Categorías del filtro del registro de actividad (`GET /platform/audit-log`). */
export type AuditCategory = "companies" | "users" | "superadmins" | "settings";

/** Una acción de un superadministrador. Las copias de nombres y correos se conservan aunque la empresa o el usuario ya no existan. */
export interface AuditEntry {
  id: string;
  created_at: string;
  actor_name: string;
  actor_email: string;
  /** Código estable, p. ej. "company_user.update". */
  action: string;
  company_id: string | null;
  company_name: string | null;
  target_type: string | null;
  target_label: string | null;
  /** Datos no secretos: campos cambiados con su valor anterior y nuevo. */
  details: Record<string, unknown> | null;
}

export interface AuditLogResponse {
  items: AuditEntry[];
  total: number;
  page: number;
  totalPages: number;
  /** Quienes han actuado alguna vez (para el filtro "Quién"). */
  actors: { email: string; name: string }[];
}

/** "all" = sin filtrar; fechas AAAA-MM-DD ("" = sin límite). */
export interface AuditFilters {
  page: number;
  companyId: string;
  actor: string;
  category: AuditCategory | "all";
  from: string;
  to: string;
}
