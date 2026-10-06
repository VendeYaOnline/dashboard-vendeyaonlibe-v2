/** Estado por total de unidades: out = agotado; low = stock bajo; ok; untracked = sin cantidad guardada. */
export type StockStatus = "out" | "low" | "ok" | "untracked";

/** Filtro de estado: además, partial = con stock pero con alguna variante agotada. */
export type StockFilter = StockStatus | "partial";

export type InventorySort = "stock" | "-stock" | "value" | "title" | "last-sale";

export interface InventoryVariant {
  key: string;
  /** "Talla: M · Color: rojo" */
  label: string;
  /** "M / rojo" */
  name: string;
  quantity: number;
  status: StockStatus;
}

/** Un producto con el total de unidades y el detalle de sus variantes. */
export interface InventoryRow {
  productId: string;
  title: string;
  image: string | null;
  hidden: boolean;
  categories: { id: string; name: string }[];
  /** Suma de las variantes (o la cantidad general); null = producto antiguo sin cantidad guardada. */
  quantity: number | null;
  status: StockStatus;
  /** En el orden de los valores del atributo (S, M, L...). Vacío si no tiene variantes. */
  variants: InventoryVariant[];
  /** Variantes en 0. */
  variantsOut: number;
  /** Precio de venta por unidad (con descuento si lo tiene). */
  unitPrice: number;
  /** Unidades × precio. */
  value: number;
  /** Fecha de la última venta; null = nunca vendido. */
  lastSoldAt: string | null;
}

export interface InventorySummary {
  products: number;
  variants: number;
  units: number;
  value: number;
  out: number;
  low: number;
  partial: number;
  untracked: number;
}

export interface InventoryResponse {
  items: InventoryRow[];
  total: number;
  page: number;
  totalPages: number;
  summary: InventorySummary;
  lowStockThreshold: number;
}

export interface InventoryFilters {
  page: number;
  search: string;
  status: StockFilter | "all";
  categoryId: string;
  staleDays: 0 | 30 | 60 | 90;
  sort: InventorySort;
}
