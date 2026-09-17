"use client";

import { Button, Chip } from "@heroui/react";
import { X } from "lucide-react";
import type { AttributeValue } from "@/interfaces/attributes";
import { AttributeStockInputs, AttributeValues } from "./attribute-values";
import { MAX_QUANTITY } from "./constants";

export interface ProductAttributeItem {
  id: string;
  name: string;
  type: string;
  values: AttributeValue[];
  /** El atributo ya no existe en el catálogo; se muestran los valores guardados. */
  isMissing?: boolean;
}

interface ProductAttributeListProps {
  items: ProductAttributeItem[];
  onRemove: (id: string) => void;
  /** Unidades por valor; si se pasa, cada valor muestra su campo de cantidad. */
  getStock?: (attributeId: string, valueKey: string) => string;
  onStockChange?: (attributeId: string, valueKey: string, quantity: string) => void;
  /** Suma de unidades por atributo (mismo orden que `items`). */
  totals?: number[];
}

/**
 * Atributos agregados al producto, numerados en el orden en que se eligieron.
 * Cada tarjeta muestra el nombre, el tipo, sus valores y, si el producto lleva
 * inventario por atributo, las unidades de cada valor.
 */
export function ProductAttributeList({
  items,
  onRemove,
  getStock,
  onStockChange,
  totals,
}: ProductAttributeListProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-5 text-center text-sm text-muted">
        Aún no has agregado atributos. Elige uno arriba y aparecerá aquí con sus valores.
      </p>
    );
  }

  const withStock = Boolean(getStock && onStockChange);
  const referenceTotal = totals?.[0] ?? 0;

  return (
    <ol className="space-y-2">
      {items.map((item, index) => {
        const total = totals?.[index] ?? 0;
        const mismatch = withStock && index > 0 && total !== referenceTotal;
        return (
          <li key={item.id} className="rounded-lg border border-border bg-surface-secondary p-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-soft-foreground">
                {index + 1}
              </span>

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium">{item.name}</span>
                  <Chip size="sm" variant="soft">
                    {item.type}
                  </Chip>
                  {item.isMissing && (
                    <Chip size="sm" variant="soft" color="warning">
                      Ya no existe en el catálogo
                    </Chip>
                  )}
                  <span className="text-xs text-muted">
                    {item.values.length} {item.values.length === 1 ? "valor" : "valores"}
                  </span>
                  {withStock && (
                    <Chip size="sm" variant="soft" color={mismatch ? "warning" : "accent"}>
                      {total} {total === 1 ? "unidad" : "unidades"}
                    </Chip>
                  )}
                </div>

                {withStock ? (
                  <>
                    <p className="text-xs text-muted">
                      Indica cuántas unidades tienes de cada valor.
                      {index === 0 && items.length > 1 && " Este atributo define el total del producto."}
                    </p>
                    <AttributeStockInputs
                      attributeId={item.id}
                      type={item.type}
                      values={item.values}
                      getQuantity={getStock!}
                      onChange={onStockChange!}
                      max={MAX_QUANTITY}
                    />
                    {mismatch && (
                      <p className="text-xs text-warning">
                        Las unidades de «{item.name}» ({total}) no coinciden con las de «
                        {items[0].name}» ({referenceTotal}). El total del producto usa el primer
                        atributo.
                      </p>
                    )}
                  </>
                ) : (
                  <AttributeValues type={item.type} values={item.values} />
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                isIconOnly
                aria-label={`Quitar ${item.name}`}
                className="shrink-0 text-muted hover:text-danger"
                onPress={() => onRemove(item.id)}
              >
                <X className="size-4" />
              </Button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
