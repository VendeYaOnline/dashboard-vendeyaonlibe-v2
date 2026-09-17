import type { AttributeValue } from "./attributes";

export interface ProductRequest {
  products: Products[];
  total: number;
  grandTotal: number;
  page: number;
  totalPages: number;
}

/**
 * Atributo asignado a un producto, con snapshot de sus valores en el momento
 * de guardarlo. El backend conserva el orden en que se agregaron.
 */
export interface ProductAttribute {
  id: string;
  attribute_name: string;
  attribute_type: string;
  /** Si genera variantes de inventario (por defecto sí, salvo Género). */
  inventory?: boolean;
  value: AttributeValue[];
}

/** Un valor dentro de la combinación de una variante. */
export interface VariantPart {
  attribute_id: string;
  attribute_name: string;
  value_key: string;
  value_label: string;
}

/** Variante (combinación de valores) con sus unidades: fila de `product_variants`. */
export interface ProductVariant {
  variant_key: string;
  combination: VariantPart[];
  quantity: number;
}

/** Imágenes relacionadas con un color del atributo de tipo Color del producto. */
export interface ColorImageGroup {
  /** Hex del color, tal como está en el valor del atributo. */
  color: string;
  name: string;
  images: string[];
  /** Posición elegida por el usuario: el primer color es el que carga primero. */
  order?: number;
}

export interface Products {
  id: string;
  image_product: string;
  /** Unidades disponibles; null en productos guardados antes de esta columna. */
  quantity: number | null;
  title: string;
  price: string;
  stock: boolean;
  discount_price: string;
  /**
   * Formato legacy agrupado por tipo que consume la tienda pública. Puede
   * llegar como string JSON, como objeto o (productos guardados por una
   * versión anterior de este panel) como array de IDs.
   */
  attributes: string | Record<string, unknown> | string[] | null;
  /** Lista ordenada de atributos; null en productos anteriores a esta columna. */
  product_attributes?: ProductAttribute[] | null;
  description: string;
  reference: string;
  discount: number;
  images: string[];
  /** Imágenes agrupadas por color; null en productos anteriores a esta columna. */
  color_images?: ColorImageGroup[] | null;
  /** Inventario por combinación; vacío si ningún atributo controla inventario. */
  variants?: ProductVariant[];
  specs: string;
  Categories: { id: string; name: string }[];
}
