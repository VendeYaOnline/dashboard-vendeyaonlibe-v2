/** Portada (banner) de la tienda. */
export interface Cover {
  id: string;
  image: string;
  title: string;
  description: string;
  link: string;
  /** Orden en la tienda (0 = primera); null en portadas antiguas. */
  position?: number | null;
}

export interface CoverPayload {
  image: string;
  title: string;
  description: string;
  link: string;
}

export interface Covers {
  covers: Cover[];
  total: number;
  grandTotal: number;
  page: number;
  totalPages: number;
  /** Tope de portadas por empresa, definido en el backend. */
  maxCovers: number;
}
