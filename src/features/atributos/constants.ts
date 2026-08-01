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

export interface ColorValue {
  name: string;
  value: string;
}

export const isColorValue = (value: unknown): value is ColorValue =>
  typeof value === "object" && value !== null && "name" in value && "value" in value;
