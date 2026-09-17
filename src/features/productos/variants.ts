import type { AttributeValue } from "@/interfaces/attributes";
import type { VariantPart } from "@/interfaces/products";
import {
  getValueKey,
  getValueLabel,
  isColorType,
  normalizeAttributeType,
} from "./components/attribute-values";

/** Combinaciones máximas por producto (mismo tope que el backend). */
export const MAX_VARIANTS = 150;
/** A partir de aquí se avisa de que la matriz se vuelve difícil de mantener. */
export const WARN_VARIANTS = 60;

/** Atributo del producto tal como lo maneja el formulario. */
export interface InventoryAttribute {
  id: string;
  name: string;
  type: string;
  values: AttributeValue[];
}

/** Por defecto todos los tipos controlan inventario salvo Género (descriptivo). */
export const defaultInventoryForType = (type: string) => normalizeAttributeType(type) !== "genero";

/**
 * Atributos que generan variantes, ordenados: el de color es siempre el
 * padre; después, el orden de agregación.
 */
export const getInventoryAttributes = <T extends InventoryAttribute>(
  items: T[],
  flags: Record<string, boolean>,
): T[] => {
  const withInventory = items.filter((item) => flags[item.id] ?? defaultInventoryForType(item.type));
  return [
    ...withInventory.filter((item) => isColorType(item.type)),
    ...withInventory.filter((item) => !isColorType(item.type)),
  ];
};

export const toVariantKey = (combination: VariantPart[]) =>
  combination.map((part) => `${part.attribute_id}:${part.value_key}`).join("|");

/** Producto cartesiano de los valores (padre → hijos), sin superar MAX_VARIANTS. */
export const buildCombinations = (attributes: InventoryAttribute[]): VariantPart[][] => {
  let combos: VariantPart[][] = [[]];
  for (const attribute of attributes) {
    const parts: VariantPart[] = attribute.values.map((value) => ({
      attribute_id: attribute.id,
      attribute_name: attribute.name,
      value_key: getValueKey(value),
      value_label: getValueLabel(value),
    }));
    if (parts.length === 0) continue;
    combos = combos.flatMap((combo) => parts.map((part) => [...combo, part]));
    if (combos.length > MAX_VARIANTS) return combos.slice(0, MAX_VARIANTS + 1);
  }
  return combos.filter((combo) => combo.length > 0);
};

export const sumQuantities = (keys: string[], quantities: Record<string, string>) =>
  keys.reduce((sum, key) => sum + (parseInt(quantities[key] ?? "", 10) || 0), 0);
