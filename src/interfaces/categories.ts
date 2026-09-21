export interface Category {
  id: string;
  name: string;
  /** Imagen de la galería que representa la categoría; null si no tiene. */
  image?: string | null;
  /** Orden en la tienda (0 = primera); null en categorías antiguas. */
  position?: number | null;
  /** Productos asignados; solo lo devuelve el listado del panel. */
  productCount?: number;
}

/** Longitud máxima del nombre (mismo tope que el backend). */
export const MAX_CATEGORY_NAME_LENGTH = 40;

export interface Categories {
  categories: Category[];
  total: number;
  grandTotal: number;
  page: number;
  totalPages: number;
}
