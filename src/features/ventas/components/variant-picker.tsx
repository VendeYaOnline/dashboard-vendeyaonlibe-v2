"use client";

import { Label, ListBox, ListBoxItem, Select } from "@heroui/react";
import { ColorSwatch } from "@/features/productos/components/attribute-values";
import type { ProductVariant } from "@/interfaces/products";
import {
  isHexKey,
  unitsForOption,
  type VariantAttribute,
  type VariantSelection,
} from "../variant-choice";

interface VariantPickerProps {
  variants: ProductVariant[];
  attributes: VariantAttribute[];
  selection: VariantSelection;
  onChange: (selection: VariantSelection) => void;
  /** Prefijo de las etiquetas cuando hay varias piezas ("Pieza 1"). */
  prefix?: string;
}

/**
 * Un selector por atributo con inventario (color, talla...). Cada opción
 * indica cuántas unidades quedan combinada con lo ya elegido, y las agotadas
 * se marcan sin bloquearse: el tope real lo pone la cantidad.
 */
export function VariantPicker({
  variants,
  attributes,
  selection,
  onChange,
  prefix,
}: VariantPickerProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {attributes.map((attribute) => (
        <Select
          key={attribute.id}
          selectedKey={selection[attribute.id] ?? null}
          onSelectionChange={(key) => onChange({ ...selection, [attribute.id]: String(key) })}
        >
          <Label>{prefix ? `${prefix} · ${attribute.name}` : attribute.name}</Label>
          <Select.Trigger>
            {selection[attribute.id] ? (
              <Select.Value />
            ) : (
              <span className="text-muted">Seleccionar {attribute.name.toLowerCase()}</span>
            )}
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox className="max-h-56 overflow-y-auto">
              {attribute.options.map((option) => {
                const units = unitsForOption(variants, selection, attribute.id, option.key);
                return (
                  <ListBoxItem key={option.key} id={option.key} textValue={option.label}>
                    <span className="flex items-center gap-2">
                      {isHexKey(option.key) && <ColorSwatch hex={option.key} className="size-4" />}
                      <span>{option.label}</span>
                      <span className="ml-auto text-xs text-muted">
                        {units > 0 ? `${units} disp.` : "Agotado"}
                      </span>
                    </span>
                  </ListBoxItem>
                );
              })}
            </ListBox>
          </Select.Popover>
        </Select>
      ))}
    </div>
  );
}
