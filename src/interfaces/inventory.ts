/** Estado de una fila: out = agotado; low = stock bajo; ok; untracked = sin cantidad guardada. */
export type StockStatus = "out" | "low" | "ok" | "untracked";

export type InventorySort = "stock" | "-stock" | "value" | "title" | "last-sale";

/** Una variante (o el producto completo si no tiene variantes). */
export interface InventoryRow {
  key: string;
  productId: string;
  title: string;
  image: string | null;
  hidden: boolean;
  categories: { id: string; name: string }[];
  /** null en productos sin variantes. */
  variantKey: string | null;
  /** "Talla: M · Color: rojo"; null en productos sin variantes. */
  variantLabel: string | null;
  /** null = producto antiguo sin cantidad guardada. */
  quantity: number | null;
  status: StockStatus;
  /** Precio de venta por unidad (con descuento si lo tiene). */
  unitPrice: number;
  /** Unidades × precio. */
  value: number;
  /** Fecha de la última venta del producto; null = nunca vendido. */
  lastSoldAt: string | null;
}

export interface InventorySummary {
  products: number;
  rows: number;
  units: number;
  value: number;
  out: number;
  low: number;
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
  status: StockStatus | "all";
  categoryId: string;
  staleDays: 0 | 30 | 60 | 90;
  sort: InventorySort;
}
