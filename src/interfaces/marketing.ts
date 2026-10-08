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
  /** Imagen de la galería (diseño póster); "" = sin imagen. Plantillas antiguas no la traen. */
  image_url?: string;
  /** A dónde lleva la imagen; "" = la tienda. */
  image_link?: string;
  product_ids: string[];
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
    /** Modo de prueba (solo local): todo correo va a esta dirección. */
    testRedirect: string | null;
  };
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
/** Correo: sending → sent | failed. WhatsApp: ready. */
export type CampaignStatus = "sending" | "sent" | "failed" | "ready";

export interface MarketingQuota {
  limit: number;
  used: number;
  remaining: number;
}

export interface MarketingAudience {
  /** Clientes alcanzables por grupo y canal. */
  segments: Record<CampaignSegment, Record<CampaignChannel, number>>;
  customers: number;
  /** Correos dados de baja. */
  unsubscribed: number;
  quota: MarketingQuota;
}

export interface MarketingCampaign {
  id: string;
  channel: CampaignChannel;
  segment: CampaignSegment;
  template_slot: number;
  template_name: string;
  subject: string;
  status: CampaignStatus;
  total: number;
  sent: number;
  failed: number;
  /** Solo WhatsApp. */
  contacted?: number;
  created_by: string | null;
  created_at: string;
  finished_at: string | null;
}

export interface CampaignRecipient {
  id: string;
  name: string;
  /** Correo o número para wa.me. */
  address: string;
  /** pending | sent | failed (correo) · pending | contacted (WhatsApp). */
  status: "pending" | "sent" | "failed" | "contacted";
  error: string | null;
  sent_at: string | null;
  /** Solo WhatsApp: abre el chat con el mensaje ya escrito. */
  whatsapp_url?: string;
}

export interface MarketingCampaignDetail {
  campaign: MarketingCampaign;
  /** Solo WhatsApp ("{nombre}" = nombre de cada cliente). */
  message: string | null;
  recipients: CampaignRecipient[];
}
