"use client";

import { useState, type DragEvent, type ReactNode } from "react";
import { ChevronDown, ChevronUp, ChevronsDown, ChevronsUp, GripVertical } from "lucide-react";
import { cn } from "@heroui/react";

interface SortableListProps<T> {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  onChange: (items: T[]) => void;
  isDisabled?: boolean;
  /** Muestra ⇈ ⇊ para llevar una fila al inicio o al final (listas largas). */
  showEdgeButtons?: boolean;
  /** Fila resaltada (p. ej. el resultado actual de una búsqueda). */
  highlightedKey?: string | null;
}

/**
 * Lista vertical reordenable: arrastrando (HTML5 drag & drop) o con las
 * flechas ▲ ▼ (accesibles con teclado). Muestra la posición de cada fila.
 * Cada fila lleva `data-sortable-key` para poder desplazarse hasta ella.
 */
export function SortableList<T>({
  items,
  getKey,
  renderItem,
  onChange,
  isDisabled = false,
  showEdgeButtons = false,
  highlightedKey = null,
}: SortableListProps<T>) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= items.length) return;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const indexOf = (key: string) => items.findIndex((item) => getKey(item) === key);

  const handleDrop = (event: DragEvent, targetKey: string) => {
    event.preventDefault();
    if (dragging && dragging !== targetKey) move(indexOf(dragging), indexOf(targetKey));
    setDragging(null);
    setOver(null);
  };

  const arrowClass = "rounded p-0.5 text-muted hover:text-foreground disabled:opacity-30";

  return (
    <ol className="space-y-2" aria-label="Lista ordenable (arrastra o usa las flechas)">
      {items.map((item, index) => {
        const key = getKey(item);
        const isFirst = index === 0;
        const isLast = index === items.length - 1;
        return (
          <li
            key={key}
            data-sortable-key={key}
            draggable={!isDisabled}
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "move";
              setDragging(key);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              if (over !== key) setOver(key);
            }}
            onDragLeave={() => setOver((current) => (current === key ? null : current))}
            onDrop={(event) => handleDrop(event, key)}
            onDragEnd={() => {
              setDragging(null);
              setOver(null);
            }}
            className={cn(
              "flex items-center gap-2 rounded-lg border border-border bg-surface px-2 py-1.5 transition-all",
              !isDisabled && "cursor-grab active:cursor-grabbing",
              dragging === key && "opacity-40",
              over === key && dragging !== key && "ring-2 ring-accent",
              highlightedKey === key && "border-accent bg-accent/10 ring-2 ring-accent/60",
            )}
          >
            <GripVertical className="size-4 shrink-0 text-muted" aria-hidden="true" />
            <span className="w-6 shrink-0 text-center text-xs font-medium tabular-nums text-muted">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">{renderItem(item)}</div>
            {showEdgeButtons && (
              <div className="flex shrink-0 flex-col">
                <button
                  type="button"
                  aria-label="Mover al inicio"
                  title="Mover al inicio"
                  disabled={isDisabled || isFirst}
                  onClick={() => move(index, 0)}
                  className={arrowClass}
                >
                  <ChevronsUp className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Mover al final"
                  title="Mover al final"
                  disabled={isDisabled || isLast}
                  onClick={() => move(index, items.length - 1)}
                  className={arrowClass}
                >
                  <ChevronsDown className="size-4" />
                </button>
              </div>
            )}
            <div className="flex shrink-0 flex-col">
              <button
                type="button"
                aria-label="Subir"
                title="Subir"
                disabled={isDisabled || isFirst}
                onClick={() => move(index, index - 1)}
                className={arrowClass}
              >
                <ChevronUp className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Bajar"
                title="Bajar"
                disabled={isDisabled || isLast}
                onClick={() => move(index, index + 1)}
                className={arrowClass}
              >
                <ChevronDown className="size-4" />
              </button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
