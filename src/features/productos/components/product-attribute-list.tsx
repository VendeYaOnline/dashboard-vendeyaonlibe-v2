"use client";

import { Button, Chip } from "@heroui/react";
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
}

/**
 * Atributos agregados al producto, numerados en el orden en que se eligieron.
 * Cada tarjeta muestra el nombre, el tipo y todos los valores del atributo.
 */
export function ProductAttributeList({ items, onRemove }: ProductAttributeListProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-5 text-center text-sm text-muted">
        Aún no has agregado atributos. Elige uno arriba y aparecerá aquí con sus valores.
      </p>
    );
  }

  return (
    <ol className="space-y-2">
      {items.map((item, index) => (
        <li
          key={item.id}
          className="rounded-lg border border-border bg-surface p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        >
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
              </div>

              <AttributeValues type={item.type} values={item.values} />
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
      ))}
    </ol>
  );
}
