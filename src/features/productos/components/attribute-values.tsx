"use client";

import { Chip, Input, cn } from "@heroui/react";
import type { AttributeValue } from "@/interfaces/attributes";

/** Quita acentos para comparar tipos ("Género" y "Genero" son el mismo). */
export const normalizeAttributeType = (type: string) =>
  type
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

export const isColorType = (type: string) => normalizeAttributeType(type) === "color";

/** Hex de un valor de color guardado como `{ name, value }` o `{ name, color }`. */
export const getColorHex = (value: AttributeValue) =>
  typeof value === "object" && value !== null ? (value.value ?? value.color ?? "") : "";

export const getValueLabel = (value: AttributeValue) =>
  typeof value === "object" && value !== null ? value.name : String(value);

export interface ColorOption {
  hex: string;
  name: string;
}

/** Colores (con hex válido) de un atributo de tipo Color, en su orden. */
export const toColorOptions = (values: AttributeValue[]): ColorOption[] =>
  values
    .map((value) => ({ hex: getColorHex(value), name: getValueLabel(value) }))
    .filter((option) => option.hex !== "");

/** Swatch circular reutilizado en la lista de valores y en las imágenes por color. */
export function ColorSwatch({ hex, className }: { hex: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      title={hex}
      style={{ backgroundColor: hex }}
      className={cn(
        "size-5 shrink-0 rounded-full border border-black/10 shadow-inner",
        className,
      )}
    />
  );
}

interface AttributeValuesProps {
  type: string;
  values: AttributeValue[];
}

/**
 * Valores de un atributo en el orden en que se definieron: los colores como
 * swatches circulares con su nombre y el resto (talla, peso, género...) como
 * chips.
 */
export function AttributeValues({ type, values }: AttributeValuesProps) {
  if (values.length === 0) {
    return <span className="text-xs text-muted">Este atributo no tiene valores.</span>;
  }

  if (isColorType(type)) {
    return (
      <ul className="flex flex-wrap gap-2" aria-label="Colores del atributo">
        {values.map((value, index) => {
          const hex = getColorHex(value);
          const label = getValueLabel(value);
          return (
            <li
              key={`${label}-${hex}-${index}`}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1 pr-3 pl-1.5 text-xs"
            >
              <ColorSwatch hex={hex} />
              <span className="font-medium">{label}</span>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul className="flex flex-wrap gap-1.5" aria-label={`Valores de ${type}`}>
      {values.map((value, index) => {
        const label = getValueLabel(value);
        return (
          <li key={`${label}-${index}`}>
            <Chip size="sm" variant="soft">
              {label}
            </Chip>
          </li>
        );
      })}
    </ul>
  );
}

/** Clave estable de un valor: el hex para colores, el texto para el resto. */
export const getValueKey = (value: AttributeValue) =>
  typeof value === "object" && value !== null ? getColorHex(value) : String(value);

interface AttributeStockInputsProps {
  attributeId: string;
  type: string;
  values: AttributeValue[];
  /** Unidades actuales por clave de valor (texto para permitir el campo vacío). */
  getQuantity: (attributeId: string, valueKey: string) => string;
  onChange: (attributeId: string, valueKey: string, quantity: string) => void;
  max: number;
}

/**
 * Un campo de unidades por cada valor del atributo (p. ej. Rojo: 5, Azul: 2).
 * Los colores muestran su swatch para identificarlos rápido.
 */
export function AttributeStockInputs({
  attributeId,
  type,
  values,
  getQuantity,
  onChange,
  max,
}: AttributeStockInputsProps) {
  const isColor = isColorType(type);

  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2" aria-label={`Unidades por ${type}`}>
      {values.map((value, index) => {
        const key = getValueKey(value);
        const label = getValueLabel(value);
        const quantity = getQuantity(attributeId, key);
        return (
          <li
            key={`${key}-${index}`}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2 py-1.5"
          >
            {isColor && <ColorSwatch hex={key} />}
            <span className="min-w-0 flex-1 truncate text-sm">{label}</span>
            <Input
              aria-label={`Unidades de ${label}`}
              type="number"
              inputMode="numeric"
              min={0}
              max={max}
              placeholder="0"
              value={quantity}
              onChange={(event) => onChange(attributeId, key, event.target.value)}
              className="w-24 text-right"
            />
          </li>
        );
      })}
    </ul>
  );
}
