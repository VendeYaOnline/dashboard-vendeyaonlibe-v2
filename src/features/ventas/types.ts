import type { Products } from "@/interfaces/products";

/**
 * Snapshot de un producto dentro de una venta, tal como lo guarda el backend
 * en la columna JSON `products` (plano, sin envoltorio): ver
 * `ModalDetailsSale.tsx` / `ProductSale` en dashboard-cliente v1, que lee la
 * misma tabla. `id` es opcional porque las ventas creadas antes de este
 * cambio no lo incluyen.
 */
export interface SaleProduct {
  id?: string;
  /**
   * Variante vendida (misma clave que `product_variants.variant_key`): con
   * ella el backend descuenta el inventario de esa combinación. Un producto
   * vendido como set lleva en su lugar `bundle_items` (una variante por pieza).
   */
  variant_key?: string;
  /** Texto legible de la variante ("Color: Rojo · Talla: M"). */
  variant_label?: string;
  bundle_items?: { variant_key: string; variant_label: string }[];
  image_product: string;
  title: string;
  price: string;
  discount_price: string;
  discount: number;
  images: string[];
  quantity: number;
  purchase_total: string;
}

/**
 * Payload real que espera `POST /create-sale` (ver sales.controller.js y
 * sales.js). El backend usa snake_case; el formulario usa camelCase y se
 * traduce al enviar.
 */
export interface CreateSalePayload {
  id_number: string;
  first_name: string;
  last_name: string;
  phone: string;
  department: string;
  city: string;
  address: string;
  additional_info: string;
  email: string;
  order_number: string;
  products: SaleProduct[];
  quantity: string;
  status: string;
  purchase_date: string;
  type_purchase: string;
  payment_method: string;
  total: string;
}

/** Venta tal como la devuelve `GET /get-sales` (ver sales.controller.js). */
export interface Sale {
  id: string;
  id_number: string;
  type_purchase: string;
  first_name: string;
  last_name: string;
  phone: string;
  department: string;
  city: string;
  address: string;
  additional_info: string;
  email: string;
  order_number: string;
  products: SaleProduct[];
  quantity: string;
  status: string;
  /** Ya viene formateada como DD/MM/YYYY (`formatDate` en el backend). */
  purchase_date: string;
  payment_method: string;
  total: string;
}

export interface SaleRequest {
  sales: Sale[];
  total: number;
  grandTotal: number;
  page: number;
  totalPages: number;
}

/**
 * Línea de la venta: un producto del catálogo con la variante (o las piezas
 * del set) y la cantidad elegidas. `lineKey` distingue dos variantes del
 * mismo producto; `available` es el tope de unidades (null = sin control).
 */
export interface SelectedProduct extends Products {
  lineKey: string;
  quantity: number;
  available: number | null;
  variant_key?: string;
  variant_label?: string;
  bundle_items?: { variant_key: string; variant_label: string }[];
}

export interface VentaFormValues {
  date: string;
  phone: string;
  firstName: string;
  lastName: string;
  department: string;
  city: string;
  address: string;
  additionalReferences: string;
  email: string;
  orderNumber: string;
  idNumber: string;
  status: string;
  paymentMethod: string;
}

export const EMPTY_VENTA_FORM: VentaFormValues = {
  date: "",
  phone: "",
  firstName: "",
  lastName: "",
  department: "",
  city: "",
  address: "",
  additionalReferences: "",
  email: "",
  orderNumber: "",
  idNumber: "",
  status: "",
  paymentMethod: "",
};

/**
 * `status` en el backend es texto libre (sin enum): se reutiliza el mismo
 * vocabulario que ya usa `dashboard-cliente` v1 contra el mismo backend
 * (ver `TableSales.tsx`/`ModalDetailsSale.tsx`), para que ambos paneles
 * registren y filtren el mismo conjunto de estados.
 */
export const SALE_STATUSES = [
  { id: "Pago pendiente", label: "Pago pendiente" },
  { id: "Gestionando pedido", label: "Gestionando pedido" },
  { id: "En tránsito", label: "En tránsito" },
  { id: "Pedido entregado", label: "Pedido entregado" },
] as const;

/**
 * El `id` es el código que espera el backend (ver `paymentMethodMap` en
 * `dashboard-cliente/ModalSales.tsx`), no un slug de la UI.
 */
export const PAYMENT_METHODS = [
  { id: "cash", label: "Efectivo" },
  { id: "credit_card", label: "Tarjeta de crédito" },
  { id: "debit_card", label: "Tarjeta de débito" },
  { id: "ticket", label: "Efecty" },
  { id: "bank_transfer", label: "Transferencia" },
  { id: "bre_b", label: "Llave BRE-B" },
  { id: "account_money", label: "Mercado pago" },
  { id: "other", label: "Otro" },
] as const;

/**
 * Códigos que puede traer una venta real pero que no se ofrecen al crear
 * manualmente desde el panel (p. ej. variantes que arma el checkout de la
 * tienda). Se usa sólo para mostrar la etiqueta correcta al leer.
 */
const PAYMENT_METHOD_DISPLAY: Record<string, string> = {
  ...Object.fromEntries(PAYMENT_METHODS.flatMap((m) => [
    [m.id, m.label],
    [m.label.toLowerCase(), m.label],
  ])),
  bank_transfer_bancolombia: "Transferencia Bancolombia",
  bank_transfer_bbva: "Transferencia BBVA",
  "transferencia bancolombia": "Transferencia Bancolombia",
  "transferencia bbva": "Transferencia BBVA",
  "pago por llave": "Llave BRE-B",
  llave: "Llave BRE-B",
  llaveo: "Llave BRE-B",
  "bre-b": "Llave BRE-B",
};

export const getPaymentMethodLabel = (code: string | null | undefined): string => {
  const method = code?.trim() ?? "";
  const key = method.toLowerCase();
  return Object.hasOwn(PAYMENT_METHOD_DISPLAY, key)
    ? PAYMENT_METHOD_DISPLAY[key]
    : method || "No especificado";
};
