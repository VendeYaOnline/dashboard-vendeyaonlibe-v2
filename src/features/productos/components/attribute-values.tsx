"use client";

import { Chip } from "@heroui/react";
import type { AttributeValue } from "@/interfaces/attributes";

/** Quita acentos para comparar tipos ("Género" y "Genero" son el mismo). */
export const normalizeAttributeType = (type: string) =>
  type
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();

export const isColorType = (type: string) => normalizeAttributeType(type) === "color";

/** Hex de un valor de color guardado como `{ name, value }` o `{ name, color }`. */
const getColorHex = (value: AttributeValue) =>
  typeof value === "object" && value !== null ? (value.value ?? value.color ?? "") : "";

const getValueLabel = (value: AttributeValue) =>
  typeof value === "object" && value !== null ? value.name : String(value);

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
              <span
                aria-hidden="true"
                title={hex}
                style={{ backgroundColor: hex }}
                className="size-5 shrink-0 rounded-full border border-black/10 shadow-inner"
              />
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
