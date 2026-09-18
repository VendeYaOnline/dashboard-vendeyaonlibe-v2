export const ATTRIBUTE_TYPES = [
  "Color",
  "Talla",
  "Peso",
  "Dimension",
  "Mililitro",
  "Genero",
] as const;

export const GENDER_OPTIONS = [
  "Masculino",
  "Femenino",
  "Hombre",
  "Mujer",
  "Niño",
  "Niña",
] as const;

export const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#000000",
  "#6b7280",
  "#ffffff",
] as const;

/** Tope de valores por atributo. */
export const MAX_ATTRIBUTE_VALUES = 10;
/** Longitudes máximas (mismos topes que el backend). */
export const MAX_ATTRIBUTE_NAME_LENGTH = 30;
export const MAX_ATTRIBUTE_VALUE_LENGTH = 30;

export interface ColorValue {
  name: string;
  value: string;
}

/**
 * Un color guardado como `{ name, value }` (este panel) o `{ name, color }`
 * (panel anterior). Ambos se muestran y editan igual.
 */
export const isColorValue = (value: unknown): value is ColorValue =>
  typeof value === "object" &&
  value !== null &&
  "name" in value &&
  ("value" in value || "color" in value);

/** Normaliza cualquiera de los dos formatos a `{ name, value }`. */
export const toColorValue = (value: { name: string; color?: string; value?: string }): ColorValue => ({
  name: value.name,
  value: String(value.value ?? value.color ?? ""),
});
