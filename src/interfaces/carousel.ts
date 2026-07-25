import { Products } from "./products";

export interface Carousel {
  id: string;
  name: string;
  products: Products[];
}

export interface CarouselRequest {
  carousels: Carousel[];
  total: number;
  grandTotal: number;
  page: number;
  totalPages: number;
}

export interface CarouselPayload {
  name: string;
  idsProducts: string[];
}

// Límites definidos por el negocio
export const MAX_CAROUSELS = 5;
export const MIN_PRODUCTS_CAROUSEL = 3;
export const MAX_PRODUCTS_CAROUSEL = 8;
