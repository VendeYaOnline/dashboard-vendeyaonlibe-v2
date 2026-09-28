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

/** Producto de una categoría, tal como se lista en el modal de orden. */
export interface CategoryProduct {
  id: string;
  title: string;
  image_product: string | null;
}

/** Productos de una categoría en el orden en que los muestra la tienda. */
export interface CategoryProductsResponse {
  category: Pick<Category, "id" | "name">;
  products: CategoryProduct[];
}
