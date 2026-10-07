/** Diseños base de las plantillas (MARKETING_LAYOUTS del backend). */
export type MarketingLayout = "featured" | "grid" | "announcement";

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
  /** Formato del enlace de producto: {store_url}, {id}, {slug}. */
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
  sender: { email: string | null; configured: boolean };
}

/** Plantilla tal como se edita y se envía (sin casilla ni fechas). */
export type MarketingTemplateDraft = Pick<MarketingTemplate, "name" | "layout" | "content">;

export interface MarketingPreviewRequest {
  template: MarketingTemplateDraft;
  /** Borrador de la marca (sin guardar). */
  brand?: MarketingBrand;
}
