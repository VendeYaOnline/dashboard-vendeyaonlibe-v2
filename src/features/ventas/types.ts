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

/** Producto del catálogo real, con la cantidad elegida al armar la venta. */
export interface SelectedProduct extends Products {
  quantity: number;
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
  { id: "account_money", label: "Mercado pago" },
  { id: "other", label: "Otro" },
] as const;

/**
 * Códigos que puede traer una venta real pero que no se ofrecen al crear
 * manualmente desde el panel (p. ej. variantes que arma el checkout de la
 * tienda). Se usa sólo para mostrar la etiqueta correcta al leer.
 */
const PAYMENT_METHOD_DISPLAY: Record<string, string> = {
  ...Object.fromEntries(PAYMENT_METHODS.map((m) => [m.id, m.label])),
  bank_transfer_bancolombia: "Transferencia Bancolombia",
  bank_transfer_bbva: "Transferencia BBVA",
};

export const getPaymentMethodLabel = (code: string): string =>
  PAYMENT_METHOD_DISPLAY[code] ?? "Otro medio de pago";
