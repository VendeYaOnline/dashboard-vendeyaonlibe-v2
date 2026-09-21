import type { ProductVariant, Products } from "@/interfaces/products";

/** Opción de un atributo, tal como aparece en las combinaciones del producto. */
export interface VariantOption {
  key: string;
  label: string;
}

/** Atributo que hay que elegir para identificar una variante. */
export interface VariantAttribute {
  id: string;
  name: string;
  options: VariantOption[];
}

/** Valor elegido por atributo (`attribute_id` → `value_key`). */
export type VariantSelection = Record<string, string>;

/**
 * Atributos y valores que participan en las variantes del producto, en el
 * orden de las combinaciones (color primero, igual que en el formulario de
 * productos). Se derivan de las variantes reales y no del snapshot de
 * atributos, así siempre coinciden con las filas de inventario.
 */
export const getVariantAttributes = (variants: ProductVariant[]): VariantAttribute[] => {
  const attributes: VariantAttribute[] = [];
  for (const variant of variants) {
    for (const part of variant.combination) {
      let attribute = attributes.find((item) => item.id === part.attribute_id);
      if (!attribute) {
        attribute = { id: part.attribute_id, name: part.attribute_name, options: [] };
        attributes.push(attribute);
      }
      if (!attribute.options.some((option) => option.key === part.value_key)) {
        attribute.options.push({ key: part.value_key, label: part.value_label });
      }
    }
  }
  return attributes;
};

/** Variante cuya combinación coincide con la selección completa; null si falta algo. */
export const findVariant = (
  variants: ProductVariant[],
  attributes: VariantAttribute[],
  selection: VariantSelection,
): ProductVariant | null => {
  if (attributes.some((attribute) => !selection[attribute.id])) return null;
  return (
    variants.find((variant) =>
      variant.combination.every((part) => selection[part.attribute_id] === part.value_key),
    ) ?? null
  );
};

/**
 * Unidades disponibles de un valor dado el resto de la selección: sirve para
 * marcar "Agotado" en cada opción sin obligar a probar combinaciones.
 */
export const unitsForOption = (
  variants: ProductVariant[],
  selection: VariantSelection,
  attributeId: string,
  valueKey: string,
): number =>
  variants
    .filter((variant) =>
      variant.combination.every((part) =>
        part.attribute_id === attributeId
          ? part.value_key === valueKey
          : !selection[part.attribute_id] || selection[part.attribute_id] === part.value_key,
      ),
    )
    .reduce((sum, variant) => sum + variant.quantity, 0);

/** Texto legible de la variante ("Color: Rojo · Talla: M"). */
export const describeVariant = (variant: ProductVariant) =>
  variant.combination.map((part) => `${part.attribute_name}: ${part.value_label}`).join(" · ");

/** Los colores se guardan con su hex como clave. */
export const isHexKey = (key: string) => /^#[0-9a-f]{3,8}$/i.test(key);

/** Producto vendido como "Set x N": cada pieza lleva su propia variante. */
export const bundleSizeOf = (product: Products) =>
  product.bundle_size && product.bundle_size > 1 ? product.bundle_size : 0;

/**
 * Sets completos que se pueden armar con las piezas elegidas: si dos piezas
 * usan la misma variante, cada set consume dos unidades de ella.
 */
export const bundleUnitsAvailable = (pieces: ProductVariant[]): number => {
  const needed = new Map<string, { quantity: number; count: number }>();
  for (const piece of pieces) {
    const entry = needed.get(piece.variant_key) ?? { quantity: piece.quantity, count: 0 };
    entry.count += 1;
    needed.set(piece.variant_key, entry);
  }
  let available = Infinity;
  for (const { quantity, count } of needed.values()) {
    available = Math.min(available, Math.floor(quantity / count));
  }
  return available === Infinity ? 0 : available;
};
