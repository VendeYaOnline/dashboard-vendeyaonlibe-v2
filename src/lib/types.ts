/**
 * Imagen tal como la devuelve S3 a través de `GET /get-images`.
 * La categoría no viene como campo: va en el prefijo de `Key`
 * (ver `features/galeria/utils.ts`).
 */
export interface ImageItem {
  Key: string;
  LastModified: string;
  Size: number;
  Url: string;
}

export interface Images {
  images: ImageItem[];
  total: number;
  grandTotal: number;
  page: number;
  totalPages: number;
}
