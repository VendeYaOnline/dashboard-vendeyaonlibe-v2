/**
 * Grupo del medio de pago:
 * - transfer: transferencia o llave (BRE-B…); el pago se confirma a mano.
 * - mercadopago: tarjeta de crédito o débito, PSE, Efecty… por Mercado Pago; se confirma solo.
 * - other: registrado a mano en el panel (efectivo, otro…).
 */
export type PaymentGroup = "transfer" | "mercadopago" | "other";

export type CustomerSegment = "recurring" | "new" | "inactive";

export type CustomerSort = "last-purchase" | "spent" | "orders" | "name";

export interface CustomerPayment {
  group: PaymentGroup;
  /** "Llave BRE-B", "Tarjeta de crédito", "PSE"... */
  label: string;
  /** Compras confirmadas con este medio. */
  orders: number;
}

export interface CustomerSale {
  id: string;
  orderNumber: string | null;
  date: string | null;
  total: number;
  status: string;
  payment: { group: PaymentGroup; label: string };
}

/** Un cliente se arma con sus ventas (agrupadas por cédula, o teléfono si no hay). */
export interface Customer {
  key: string;
  name: string;
  document: string | null;
  phone: string | null;
  /** Número para wa.me (57…); null si el teléfono no es un celular válido. */
  whatsapp: string | null;
  email: string | null;
  city: string | null;
  department: string | null;
  /** Compras confirmadas (no cuentan las de "Pago pendiente"). */
  orders: number;
  spent: number;
  averageTicket: number;
  /** Ventas esperando confirmación del pago (transferencias/llaves). */
  pendingOrders: number;
  pendingAmount: number;
  firstPurchaseAt: string | null;
  lastPurchaseAt: string | null;
  lastActivityAt: string | null;
  payments: CustomerPayment[];
  segments: Record<CustomerSegment, boolean>;
  /** La más reciente primero. */
  sales: CustomerSale[];
}

export interface CustomersSummary {
  customers: number;
  buyers: number;
  recurring: number;
  new: number;
  inactive: number;
  withPending: number;
  averageTicket: number;
  averageSpent: number;
  /** Clientes que han pagado alguna vez con cada grupo. */
  byPayment: Record<PaymentGroup, number>;
}

export interface CustomersResponse {
  items: Customer[];
  total: number;
  page: number;
  totalPages: number;
  summary: CustomersSummary;
  newCustomerDays: number;
  inactiveCustomerDays: number;
}

export interface CustomersFilters {
  page: number;
  search: string;
  segment: CustomerSegment | "all";
  payment: PaymentGroup | "all";
  pending: boolean;
  sort: CustomerSort;
}
