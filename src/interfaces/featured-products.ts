/**
 * El backend sólo devuelve un subconjunto de columnas del producto
 * (ver getFeaturedProducts en featured-products.controller.js).
 */
export interface FeaturedProductDetail {
  id: string;
  image_product: string;
  title: string;
  price: string;
  discount_price: string;
  stock: boolean;
  /** Unidades cuando el producto controla inventario; null si no. */
  quantity?: number | null;
  reference: string;
  discount: number;
  images: string[];
}

export interface FeaturedProduct {
  id: string;
  product: FeaturedProductDetail;
}

export interface FeaturedProductRequest {
  products: FeaturedProduct[];
  total: number;
  grandTotal: number;
  page: number;
  totalPages: number;
}

// Límite definido por el negocio
export const MAX_FEATURED_PRODUCTS = 8;
