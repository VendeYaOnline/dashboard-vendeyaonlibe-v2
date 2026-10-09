/** Filtros de la exportación del catálogo para Meta (todos opcionales). */
export interface MetaCatalogFilters {
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
