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
  value: AttributeValue[];
}

export interface Products {
  id: string;
  image_product: string;
  quantity: number;
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
  specs: string;
  Categories: { id: string; name: string }[];
}
