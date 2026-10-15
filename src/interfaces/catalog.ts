/**
 * Cómo salen los productos con tallas o colores:
 * product = una fila por producto (anuncios que llevan a tu tienda);
 * variant = una fila por talla/color (vender dentro de Facebook e Instagram Shops).
 */
export type CatalogGrouping = "product" | "variant";

/** Filtros de la exportación del catálogo para Meta (todos opcionales). */
export interface MetaCatalogFilters {
  grouping: CatalogGrouping;
  categoryIds: string[];
  /** Por defecto solo salen productos con unidades en alguna variante. */
  includeOutOfStock: boolean;
  discountedOnly: boolean;
  /** Dígitos, en pesos; "" = sin tope. */
  minPrice: string;
  maxPrice: string;
  /** Solo si la empresa no tiene guardada la dirección de su tienda. */
  storeUrl: string;
  /** "" = el nombre de la empresa. */
  brand: string;
}

export interface MetaCatalogProblemProduct {
  id: string;
  title: string;
  reason: string;
}

/** Vista previa de lo que saldrá con los filtros elegidos. */
export interface MetaCatalogSummary {
  grouping: CatalogGrouping;
  /** Productos que se exportan. */
  products: number;
  /** Filas del archivo: una por producto, o una por variante. */
  items: number;
  outOfStockItems: number;
  problems: { noImage: number; badImage: number; invalidPrice: number };
  /** Productos que no se pueden exportar y por qué (los primeros). */
  problemProducts: MetaCatalogProblemProduct[];
  /** Ejemplo de enlace de producto; "" si falta la dirección de la tienda. */
  sampleLink: string;
  /** Productos ocultos en la tienda: no se exportan. */
  hiddenProducts: number;
  brand: string;
  /** null = la empresa no tiene guardada la dirección de su tienda. */
  storeUrl: string | null;
  storeUrlSource: "request" | "saved" | null;
  productPath: string;
}

/** Filtros del catálogo automático tal como los guarda el servidor. */
export interface MetaFeedSavedFilters {
  grouping: CatalogGrouping;
  categoryIds: string[];
  includeOutOfStock: boolean;
  discountedOnly: boolean;
  minPrice: number | null;
  maxPrice: number | null;
  storeUrl: string | null;
  brand: string;
}

/** Catálogo automático para Meta (parte de Marketing): URL secreta que Meta lee cada cierto tiempo. */
export interface MetaFeedSettings {
  enabled: boolean;
  url: string | null;
  filters: MetaFeedSavedFilters | null;
  created_at: string | null;
  /** Última vez que Meta (u otro) leyó la URL, y cuántas filas recibió. */
  last_fetched_at: string | null;
  last_rows: number | null;
}
