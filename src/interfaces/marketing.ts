/** Qué promociona la plantilla: productos de la tienda o una imagen/póster (MARKETING_LAYOUTS del backend). */
export type MarketingLayout = "products" | "poster";

export interface MarketingColors {
  primary: string;
  background: string;
  text: string;
}

/** Marca de los correos (companies.marketing_settings). */
export interface MarketingBrand {
  sender_name: string;
  reply_to: string;
  logo_url: string;
  colors: MarketingColors;
  store_url: string;
  /** Formato del enlace de producto (lo fija el superadmin; solo lectura aquí). */
  product_url: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
}

export interface MarketingTemplateContent {
  subject: string;
  preheader: string;
  heading: string;
  body: string;
  button_text: string;
  discount_code: string;
  /** Imagen de la galería: el póster, o el banner opcional arriba de los productos; "" = sin imagen. */
  image_url?: string;
  /** A dónde lleva la imagen; "" = la tienda. */
  image_link?: string;
  product_ids: string[];
  /** Varios productos: cuadrícula de 2 por fila o destacados en fila. Plantillas antiguas no lo traen (= grid). */
  product_style?: ProductStyle;
  /** null = colores de la marca. */
  colors: MarketingColors | null;
}

export interface MarketingTemplate {
  /** 1, 2 o 3. */
  slot: number;
  /** false = casilla vacía con contenido de ejemplo. */
  saved: boolean;
  name: string;
  layout: MarketingLayout;
  content: MarketingTemplateContent;
  updated_at: string | null;
}

/** Producto tal como lo usa el correo (precio de venta y, si tiene descuento, el normal). */
export interface MarketingProduct {
  id: string;
  title: string;
  image: string;
  price: number;
  regularPrice: number | null;
}

export interface MarketingResponse {
  brand: MarketingBrand;
  brandSaved: boolean;
  templates: MarketingTemplate[];
  layouts: Record<MarketingLayout, { label: string; minProducts: number; maxProducts: number }>;
  /** Productos que usan las plantillas guardadas. */
  products: MarketingProduct[];
  /** Desde dónde se envía y si el servidor tiene SES configurado. */
  sender: {
    email: string | null;
    configured: boolean;
    /** Solo local: las campañas de correo van a esta dirección, nunca a clientes. */
    testRedirect: string | null;
  };
  /** Correos de prueba: a dónde llegan (lo fija el superadmin; null = sin configurar) y cuántos se han usado. */
  test: MarketingTestQuota;
  /** Campañas de correo pausadas por muchos rebotes o quejas de spam (null = puede enviar). */
  pause: MarketingPause | null;
  /** Cobro de Marketing: cancelado al terminar el mes y/o subida de precio programada (null = nada que avisar). */
  billing_notice?: {
    cancel_at: string | null;
    price_change: { price: number; current_price: number | null; effective_at: string } | null;
  } | null;
}

export interface MarketingTestQuota {
  email: string | null;
  used: number;
  limit: number;
}

/** Plantilla tal como se edita y se envía (sin casilla ni fechas). */
export type MarketingTemplateDraft = Pick<MarketingTemplate, "name" | "layout" | "content">;

export interface MarketingPreviewRequest {
  template: MarketingTemplateDraft;
  /** Borrador de la marca (sin guardar). */
  brand?: MarketingBrand;
}

// * Campañas

export type CampaignChannel = "email" | "whatsapp";
/** Grupos de clientes (los segmentos de Clientes, más "todos"). */
export type CampaignSegment = "all" | "recurring" | "new" | "inactive";
/** sending → sent | failed (correo y WhatsApp por API); ready = lista de WhatsApp manual. */
/** stopped = detenida a mitad del envío porque la tienda quedó pausada (rebotes o quejas). */
export type CampaignStatus = "sending" | "sent" | "failed" | "ready" | "stopped";

/** Pausa por reputación: motivo y cifras de los últimos envíos. */
export interface MarketingPause {
  reason: "bounces" | "complaints";
  at: string;
  sends: number;
  bounced: number;
  complained: number;
  bounce_rate: number;
  complaint_rate: number;
}
/** whatsapp_api = enviada por la API de Meta; manual = enlaces wa.me; null en correo. */
export type CampaignDelivery = "whatsapp_api" | "manual" | null;

/**
 * Estado de un destinatario. Correo: pending → sent (SES lo aceptó) →
 * delivered | bounced | complained; failed = rechazado. WhatsApp manual:
 * pending → opened (se abrió el chat) → contacted (la tienda lo confirmó).
 * WhatsApp API: pending → sent | failed.
 */
export type RecipientStatus = "pending" | "sent" | "delivered" | "bounced" | "complained" | "failed" | "opened" | "contacted";

export interface QuotaWindow {
  limit: number;
  used: number;
  remaining: number;
  /** Cuándo se restablece (la hora: solo si está llena). */
  resets_at: string | null;
}

export interface MarketingQuota {
  monthly: QuotaWindow;
  daily: QuotaWindow;
  hourly: QuotaWindow;
}

export interface MarketingAudience {
  /** Clientes alcanzables por grupo; email_cooldown = con correo pero en espera de 7 días. */
  /** opted_out = sin permiso: no aceptaron promociones o se dieron de baja (no reciben por ningún canal). */
  segments: Record<CampaignSegment, { email: number; email_cooldown: number; whatsapp: number; opted_out: number }>;
  customers: number;
  /** Correos que no reciben (baja, rebote o spam). */
  unsubscribed: number;
  quota: MarketingQuota;
  cooldown_days: number;
  /** api = WhatsApp Cloud API configurada; manual = enlaces wa.me. */
  whatsapp_mode: "api" | "manual";
}

export interface MarketingCampaign {
  id: string;
  channel: CampaignChannel;
  delivery: CampaignDelivery;
  segment: CampaignSegment;
  template_slot: number;
  template_name: string;
  subject: string;
  status: CampaignStatus;
  total: number;
  sent: number;
  failed: number;
  /** Destinatarios por estado. */
  counts: Partial<Record<RecipientStatus, number>>;
  /** Envío pausado por el límite por hora hasta esta fecha. */
  paused_until: string | null;
  created_by: string | null;
  created_at: string;
  finished_at: string | null;
  /** Compras de quienes la recibieron en los 7 días siguientes (cada venta cuenta para la campaña más reciente). */
  sales?: CampaignSalesStats;
}

export interface CampaignSalesStats {
  count: number;
  /** Clientes distintos que compraron. */
  buyers: number;
  /** Pesos. */
  total: number;
  /** Ventas que usaron el código de descuento de la campaña. */
  with_code: number;
}

/** Venta de alguien que recibió la campaña. */
export interface CampaignSale {
  id: string;
  order_number: string | null;
  name: string;
  total: number;
  purchase_date: string;
  status: string;
  used_code: boolean;
}

/** Total de ventas después de las campañas en los últimos `days` días. */
export interface CampaignSalesSummary extends CampaignSalesStats {
  days: number;
  attribution_days: number;
}

export interface CampaignRecipient {
  id: string;
  name: string;
  /** Correo o número para wa.me. */
  address: string;
  status: RecipientStatus;
  error: string | null;
  sent_at: string | null;
}

export interface MarketingCampaignDetail {
  campaign: MarketingCampaign;
  sales?: CampaignSale[];
  discount_code?: string | null;
  /** Solo WhatsApp ("{nombre}" = nombre de cada cliente). */
  message: string | null;
  recipients: CampaignRecipient[];
}

export interface CreateCampaignResponse {
  message: string;
  campaign: MarketingCampaign;
  /** true si ese request_id ya había creado la campaña (doble clic). */
  duplicate: boolean;
  /** Descartados: sin permiso (no aceptó o de baja), correo bloqueado (rebote/spam) y en espera de 7 días. */
  skipped: { opted_out: number; suppressed: number; cooldown: number; invalid?: number };
}

// * Notificaciones por cliente

export interface ContactLastSend {
  status: RecipientStatus;
  at: string;
  error: string | null;
}

export interface MarketingContact {
  key: string;
  name: string;
  email: string | null;
  phone: string | null;
  /** null = sin correo. */
  email_state: {
    last: ContactLastSend | null;
    /** Desde cuándo puede recibir otro correo (null = ya puede). */
    available_at: string | null;
    /** unsubscribed | bounced | complained | invalid (mal escrito o sin servidor de correo); null = puede recibir. */
    blocked: "unsubscribed" | "bounced" | "complained" | "invalid" | null;
  } | null;
  /** null = sin celular válido. */
  whatsapp_state: { last: ContactLastSend | null } | null;
  /** Permiso para promociones (correo y WhatsApp). */
  promotions: ContactPromotions;
}

/**
 * accepted: marcó la casilla (con la fecha) · no_answer: compró antes de la
 * casilla (recibe) · declined: no la marcó · unsubscribed: se dio de baja.
 * Solo accepted y no_answer reciben.
 */
export type PromotionsStatus = "accepted" | "no_answer" | "declined" | "unsubscribed";

export interface ContactPromotions {
  status: PromotionsStatus;
  /** Cuándo aceptó, no aceptó o se dio de baja. */
  at: string | null;
  /** Origen de la baja: link (enlace del correo) | panel (la tienda) | ses | spam. */
  source: string | null;
  /** La tienda puede deshacer la baja (solo las que registró ella). */
  can_undo: boolean;
}

/** opted_out = sin permiso: no aceptaron o se dieron de baja. */
export type ContactsFilter = "all" | "never" | "notified" | "email_cooldown" | "opted_out";

export interface MarketingContactsResponse {
  items: MarketingContact[];
  total: number;
  page: number;
  totalPages: number;
  summary: { total: number; notified: number; never: number; email_cooldown: number; accepted: number; opted_out: number };
}

// * Carritos abandonados

/** open (sin recordar) | reminded (correo enviado) | contacted (WhatsApp) | recovered (compró) | dismissed */
export type AbandonedCartStatus = "open" | "reminded" | "contacted" | "recovered" | "dismissed";

export interface AbandonedCart {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  products: { id: string; title: string; image: string; price: number; quantity: number }[];
  total: number;
  status: AbandonedCartStatus;
  /** Ya pasó el tiempo de espera y no compró. */
  abandoned: boolean;
  created_at: string;
  updated_at: string;
  reminded_at: string | null;
  reminder_channel: "email" | "whatsapp" | null;
  recovered_at: string | null;
  promotions: PromotionsStatus;
  /** Chat con el mensaje listo (null = sin celular, sin permiso o ya compró). */
  whatsapp_url: string | null;
}

export interface AbandonedCartConfig {
  email_enabled: boolean;
  delay_hours: number;
}

export type AbandonedCartsFilter = "abandoned" | "recovered" | "all";

export interface AbandonedCartsResponse {
  items: AbandonedCart[];
  total: number;
  page: number;
  totalPages: number;
  summary: { abandoned: number; recovered: number; recovered_total: number };
  config: AbandonedCartConfig;
  delay_options: number[];
}

/** Cómo se muestran varios productos en el correo. */
export type ProductStyle = "grid" | "list";

/** Tarjeta del carrusel de WhatsApp tal como saldrá. */
export interface WhatsappPreviewCard {
  image: string;
  title: string;
  price: string;
  url: string;
}

/**
 * Vista previa de la campaña por WhatsApp (GET /marketing/whatsapp-preview).
 * cards = tarjetas de la plantilla de carrusel (null = sin carrusel); products = productos de la plantilla.
 */
export type WhatsappPreview =
  | { mode: "locked" }
  | { mode: "empty" }
  | { mode: "carousel"; products: number; cards: number; body: string[]; items: WhatsappPreviewCard[]; extra: number }
  | {
      mode: "text";
      products: number;
      cards: number | null;
      params: string[];
      reason: "no_carousel" | "few_products" | "missing_image_or_link";
    };
