/** Días hacia atrás que acepta `GET /get-analytics`. */
export type AnalyticsPeriod = 7 | 30 | 90 | 365;

export interface AnalyticsPoint {
  /** YYYY-MM-DD (día) o YYYY-MM (mes) según la granularidad. */
  date: string;
  revenue: number;
  orders: number;
}

export interface AnalyticsProduct {
  id: string | null;
  title: string;
  image: string | null;
  units: number;
  revenue: number;
}

export interface AnalyticsLowStock {
  id: string;
  title: string;
  image: string | null;
  quantity: number;
}

export interface AnalyticsResponse {
  period: { days: AnalyticsPeriod; granularity: "day" | "month"; from: string; to: string };
  kpis: {
    revenue: number;
    orders: number;
    units: number;
    averageTicket: number;
    pendingOrders: number;
    deliveredOrders: number;
    /** % respecto al periodo anterior; null cuando antes no había datos. */
    revenueChange: number | null;
    ordersChange: number | null;
    unitsChange: number | null;
    previousRevenue: number;
    previousOrders: number;
  };
  series: AnalyticsPoint[];
  byStatus: { status: string; orders: number }[];
  byPaymentMethod: { method: string; orders: number; revenue: number }[];
  byChannel: { channel: string; orders: number }[];
  topProducts: AnalyticsProduct[];
  lowStock: AnalyticsLowStock[];
  lowStockThreshold: number;
  catalog: { products: number; categories: number; outOfStock: number; lowStock: number };
  unreadMessages: number;
}
