"use client";

import { Button, Chip, Input, cn } from "@heroui/react";
import { Copy, Minus, Plus } from "lucide-react";
import type { VariantPart } from "@/interfaces/products";
import { ColorSwatch, getValueKey, getValueLabel, isColorType } from "./attribute-values";
import { MAX_QUANTITY } from "./constants";
import {
  type InventoryAttribute,
  MAX_VARIANTS,
  WARN_VARIANTS,
  buildCombinations,
  sumQuantities,
  toVariantKey,
} from "../variants";

interface VariantMatrixProps {
  /** Atributos con inventario, ya ordenados (padre primero). */
  attributes: InventoryAttribute[];
  /** Unidades por `variant_key` (texto para permitir el campo vacío). */
  quantities: Record<string, string>;
  onChange: (variantKey: string, quantity: string) => void;
  /** Copia las unidades de un valor del padre al resto de valores del padre. */
  onCopyParent?: (parentValueKey: string) => void;
  /** Botones −/+ además del campo (para la actualización rápida de inventario). */
  stepper?: boolean;
}

const clamp = (value: number) => Math.max(0, Math.min(value, MAX_QUANTITY));

/**
 * Inventario por combinación. Se agrupa por el valor del atributo padre
 * (normalmente el color) y dentro se listan los valores de los hijos:
 *
 *   🔴 Rojo    M [3]  S [4]
 *   🟢 Verde   M [0]  S [2]
 *
 * Con un solo atributo es una lista de valores; con tres, cada valor del
 * segundo atributo forma una fila con los valores del tercero.
 */
export function VariantMatrix({
  attributes,
  quantities,
  onChange,
  onCopyParent,
  stepper = false,
}: VariantMatrixProps) {
  if (attributes.length === 0) return null;

  const combinations = buildCombinations(attributes);
  if (combinations.length > MAX_VARIANTS) {
    return (
      <p className="rounded-lg border border-danger/40 bg-danger/5 px-3 py-2 text-xs text-danger">
        Este producto genera más de {MAX_VARIANTS} combinaciones. Desactiva «Controla inventario»
        en algún atributo o reduce sus valores.
      </p>
    );
  }

  const [parent, ...children] = attributes;
  const total = sumQuantities(combinations.map(toVariantKey), quantities);

  const renderInput = (combination: VariantPart[]) => {
    const key = toVariantKey(combination);
    const raw = quantities[key] ?? "";
    const current = parseInt(raw, 10) || 0;
    const label = combination.map((part) => part.value_label).join(" / ");
    return (
      <div className="flex items-center gap-1">
        {stepper && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label={`Quitar una unidad de ${label}`}
            isDisabled={current <= 0}
            onPress={() => onChange(key, String(clamp(current - 1)))}
          >
            <Minus className="size-3.5" />
          </Button>
        )}
        <Input
          aria-label={`Unidades de ${label}`}
          type="number"
          inputMode="numeric"
          min={0}
          max={MAX_QUANTITY}
          placeholder="0"
          value={raw}
          onChange={(event) => onChange(key, event.target.value)}
          className={cn("text-right", stepper ? "w-20" : "w-24")}
        />
        {stepper && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label={`Agregar una unidad a ${label}`}
            isDisabled={current >= MAX_QUANTITY}
            onPress={() => onChange(key, String(clamp(current + 1)))}
          >
            <Plus className="size-3.5" />
          </Button>
        )}
      </div>
    );
  };

  const partFor = (attribute: InventoryAttribute, value: (typeof attribute.values)[number]): VariantPart => ({
    attribute_id: attribute.id,
    attribute_name: attribute.name,
    value_key: getValueKey(value),
    value_label: getValueLabel(value),
  });

  const renderValueLabel = (attribute: InventoryAttribute, value: (typeof attribute.values)[number]) => (
    <span className="flex min-w-0 items-center gap-1.5 text-sm">
      {isColorType(attribute.type) && <ColorSwatch hex={getValueKey(value)} />}
      <span className="truncate">{getValueLabel(value)}</span>
    </span>
  );

  /** Fila de hijos para un prefijo dado (p. ej. Rojo → S/M/XL, o Rojo+Algodón → S/M). */
  const renderLeafRow = (prefix: VariantPart[], leaf: InventoryAttribute) => (
    <div className="flex flex-wrap gap-2">
      {leaf.values.map((value) => {
        const combination = [...prefix, partFor(leaf, value)];
        return (
          <div
            key={toVariantKey(combination)}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2 py-1.5"
          >
            {renderValueLabel(leaf, value)}
            {renderInput(combination)}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-3">
      {combinations.length > WARN_VARIANTS && (
        <p className="text-xs text-warning">
          {combinations.length} combinaciones: considera desactivar «Controla inventario» en
          algún atributo para que sea más fácil de mantener.
        </p>
      )}

      <ol className="space-y-2">
        {parent.values.map((parentValue) => {
          const parentPart = partFor(parent, parentValue);
          const groupKeys = combinations
            .filter((combo) => combo[0].value_key === parentPart.value_key)
            .map(toVariantKey);
          const groupTotal = sumQuantities(groupKeys, quantities);

          return (
            <li
              key={parentPart.value_key}
              className="space-y-2 rounded-lg border border-border bg-surface-secondary p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                {isColorType(parent.type) && (
                  <ColorSwatch hex={parentPart.value_key} className="size-6" />
                )}
                <span className="text-sm font-medium">{parentPart.value_label}</span>
                <Chip size="sm" variant="soft" color={groupTotal > 0 ? "accent" : "default"}>
                  {groupTotal} {groupTotal === 1 ? "unidad" : "unidades"}
                </Chip>
                {children.length === 0 && <div className="ml-auto">{renderInput([parentPart])}</div>}
                {children.length > 0 && onCopyParent && parent.values.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-muted"
                    onPress={() => onCopyParent(parentPart.value_key)}
                  >
                    <Copy className="size-3.5" />
                    Copiar a los demás
                  </Button>
                )}
              </div>

              {children.length === 1 && renderLeafRow([parentPart], children[0])}

              {children.length >= 2 && (
                <div className="space-y-2">
                  {children[0].values.map((midValue) => {
                    const midPart = partFor(children[0], midValue);
                    return (
                      <div key={midPart.value_key} className="space-y-1.5 rounded-md border border-border/60 p-2">
                        <div className="text-xs font-medium text-muted">
                          {children[0].name}: {midPart.value_label}
                        </div>
                        {renderLeafRow([parentPart, midPart], children[1])}
                      </div>
                    );
                  })}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm">
        <span className="text-muted">Total del producto</span>
        <span className="font-semibold">
          {total} {total === 1 ? "unidad" : "unidades"} ·{" "}
          <span className={total > 0 ? "text-success" : "text-danger"}>
            {total > 0 ? "Disponible" : "Sin stock"}
          </span>
        </span>
      </div>
    </div>
  );
}
