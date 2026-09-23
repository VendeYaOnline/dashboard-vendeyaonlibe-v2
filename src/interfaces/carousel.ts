import { Products } from "./products";

export interface Carousel {
  id: string;
  name: string;
  /** UUID de la categoría que abre este carrusel en la ficha del producto. */
  category_id?: string | null;
  /** Determina el carrusel que se ve debajo de las categorías en la portada. */
  show_on_home?: boolean;
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
  categoryId?: string | null;
  showOnHome?: boolean;
}

// Límites definidos por el negocio
export const MAX_CAROUSELS = 10;
export const MIN_PRODUCTS_CAROUSEL = 3;
export const MAX_PRODUCTS_CAROUSEL = 8;
/** Mismo tope que el backend. */
export const MAX_CAROUSEL_NAME_LENGTH = 50;
