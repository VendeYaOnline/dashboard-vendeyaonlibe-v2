"use client";

import { useState, type DragEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, GripVertical, X } from "lucide-react";
import { cn } from "@heroui/react";

interface SortableChipsProps<T> {
  items: T[];
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  /** Contenido extra al inicio del chip (p. ej. la muestra de color). */
  renderPrefix?: (item: T) => ReactNode;
  onChange: (items: T[]) => void;
  isDisabled?: boolean;
  emptyMessage?: string;
}

/**
 * Lista de valores en chips que se pueden reordenar arrastrando (o con las
 * flechas ◀ ▶, accesibles con teclado) y quitar con la X. El orden resultante
 * es el que verá el cliente en la tienda.
 */
export function SortableChips<T>({
  items,
  getKey,
  getLabel,
  renderPrefix,
  onChange,
  isDisabled = false,
  emptyMessage = "Aún no hay valores",
}: SortableChipsProps<T>) {
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

  if (items.length === 0) {
    return <p className="text-xs text-muted">{emptyMessage}</p>;
  }

  return (
    <ul className="flex flex-wrap gap-2" aria-label="Valores (arrastra para reordenar)">
      {items.map((item, index) => {
        const key = getKey(item);
        const label = getLabel(item);
        return (
          <li
            key={key}
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
              "inline-flex items-center gap-1 rounded-full border border-border bg-surface py-1 pr-1 pl-2 text-sm transition-all",
              !isDisabled && "cursor-grab active:cursor-grabbing",
              dragging === key && "opacity-40",
              over === key && dragging !== key && "ring-2 ring-accent",
            )}
          >
            <GripVertical className="size-3.5 text-muted" aria-hidden="true" />
            {renderPrefix?.(item)}
            <span className="max-w-40 truncate">{label}</span>
            <span className="ml-1 flex items-center">
              <button
                type="button"
                aria-label={`Mover ${label} a la izquierda`}
                disabled={isDisabled || index === 0}
                onClick={() => move(index, index - 1)}
                className="rounded-full p-0.5 text-muted hover:text-foreground disabled:opacity-30"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <button
                type="button"
                aria-label={`Mover ${label} a la derecha`}
                disabled={isDisabled || index === items.length - 1}
                onClick={() => move(index, index + 1)}
                className="rounded-full p-0.5 text-muted hover:text-foreground disabled:opacity-30"
              >
                <ChevronRight className="size-3.5" />
              </button>
              <button
                type="button"
                aria-label={`Quitar ${label}`}
                disabled={isDisabled}
                onClick={() => onChange(items.filter((_, i) => i !== index))}
                className="ml-0.5 rounded-full p-0.5 text-muted hover:text-danger disabled:opacity-30"
              >
                <X className="size-3.5" />
              </button>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
