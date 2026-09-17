"use client";

import { Button, Chip, Label, Switch } from "@heroui/react";
import { X } from "lucide-react";
import type { AttributeValue } from "@/interfaces/attributes";
import { AttributeValues } from "./attribute-values";

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
  /** Si el atributo genera variantes de inventario (por id). */
  inventoryFlags?: Record<string, boolean>;
  onInventoryChange?: (id: string, enabled: boolean) => void;
  /** Ids de los atributos que actúan como padre en la matriz (normalmente el color). */
  parentId?: string;
}

/**
 * Atributos agregados al producto, numerados en el orden en que se eligieron.
 * Cada tarjeta muestra el nombre, el tipo, sus valores y el interruptor
 * "Controla inventario" que decide si el atributo genera variantes.
 */
export function ProductAttributeList({
  items,
  onRemove,
  inventoryFlags,
  onInventoryChange,
  parentId,
}: ProductAttributeListProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-5 text-center text-sm text-muted">
        Aún no has agregado atributos. Elige uno arriba y aparecerá aquí con sus valores.
      </p>
    );
  }

  return (
    <ol className="space-y-2">
      {items.map((item, index) => {
        const controlsInventory = inventoryFlags?.[item.id] ?? true;
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
                  {controlsInventory && parentId === item.id && items.length > 1 && (
                    <Chip size="sm" variant="soft" color="accent">
                      Atributo padre
                    </Chip>
                  )}
                  <span className="text-xs text-muted">
                    {item.values.length} {item.values.length === 1 ? "valor" : "valores"}
                  </span>
                </div>

                <AttributeValues type={item.type} values={item.values} />

                {onInventoryChange && (
                  <Switch
                    size="sm"
                    isSelected={controlsInventory}
                    onChange={(enabled) => onInventoryChange(item.id, enabled)}
                  >
                    <Switch.Content>
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                      <Label className="text-xs">
                        {controlsInventory
                          ? "Controla inventario: se indican unidades por cada valor"
                          : "Solo descriptivo: no genera variantes de inventario"}
                      </Label>
                    </Switch.Content>
                  </Switch>
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
