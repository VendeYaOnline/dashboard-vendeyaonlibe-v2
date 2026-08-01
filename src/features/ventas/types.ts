import type { Products } from "@/interfaces/products";

export interface SaleProductDetail {
  id: number | string;
  image_product: string;
  title: string;
  price: string;
  reference: string;
}

export interface SaleProduct {
  quantity: number;
  product: SaleProductDetail;
  purchase_total?: string;
  total?: string;
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

export interface Sale {
  id: string | number;
  date: string;
  city: string;
  phone: string;
  status: string;
  orderNumber: string;
  paymentMethod: string;
  firstName: string;
  lastName: string;
  email: string;
  idNumber: string;
  department: string;
  address: string;
  additionalReferences: string;
  productsCount: number;
  quantity: number | string;
  totalPaid: string;
  productsList?: SaleProduct[];
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

/** Usados por el filtro de la tabla, que hoy filtra sobre `MOCK_SALES`. */
export const SALE_STATUSES = [
  { id: "pendiente", label: "Pendiente" },
  { id: "en-transito", label: "En tránsito" },
  { id: "completada", label: "Completada" },
  { id: "cancelada", label: "Cancelada" },
] as const;

/**
 * Usados por el campo "Estado" del formulario de crear venta. `status` en el
 * backend es texto libre (sin enum), así que se reutiliza el mismo
 * vocabulario que ya usa `dashboard-cliente` v1 contra el mismo backend, para
 * que ambos paneles registren el mismo conjunto de estados.
 */
export const CREATE_SALE_STATUSES = [
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
