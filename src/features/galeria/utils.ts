import type { Category } from "@/interfaces/categories";

/** Máximo de imágenes seleccionables para el borrado múltiple. */
export const MAX_SELECTION = 10;

/** Imágenes por página que pide la galería. */
export const IMAGES_PER_PAGE = 60;

/** Imágenes que se pueden subir en una sola vez (mismo tope que el backend). */
export const MAX_UPLOAD_IMAGES = 10;

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateLong(dateString: string): string {
  return new Date(dateString).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Las claves de S3 son `{categoryId}/archivo.jpg`. Estas dos funciones separan
 * las partes: el backend no devuelve la categoría como campo aparte.
 */
export function getFileName(key: string): string {
  return key.slice(key.lastIndexOf("/") + 1);
}

export function getCategoryId(key: string): string | null {
  const separatorIndex = key.lastIndexOf("/");
  return separatorIndex === -1 ? null : key.slice(0, separatorIndex);
}

/** Resuelve el nombre legible de la categoría a partir de la clave de S3. */
export function getCategoryName(key: string, categories: Category[]): string | null {
  const categoryId = getCategoryId(key);
  if (!categoryId) return null;
  return categories.find((category) => category.id === categoryId)?.name ?? null;
}
