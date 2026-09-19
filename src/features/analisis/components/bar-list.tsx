"use client";

import type { ReactNode } from "react";
import { cn } from "@heroui/react";

export interface BarListItem {
  key: string;
  label: ReactNode;
  value: number;
  /** Texto a la derecha (si falta se muestra `value`). */
  display?: string;
  /** Detalle bajo la etiqueta (p. ej. importe). */
  secondary?: string;
}

interface BarListProps {
  items: BarListItem[];
  emptyMessage?: string;
  /** Sufijo del tooltip nativo del valor. */
  unit?: string;
}

/**
 * Barras horizontales de una sola serie, ordenadas de mayor a menor. Cada
 * barra es proporcional al máximo; el valor va a la derecha (texto, no color).
 */
export function BarList({ items, emptyMessage = "Sin datos", unit }: BarListProps) {
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">{emptyMessage}</p>;
  }

  const max = Math.max(...items.map((item) => item.value), 0) || 1;

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.key} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-sm">
            <div className="min-w-0 flex-1">
              <div className="truncate">{item.label}</div>
              {item.secondary && <p className="text-xs text-muted">{item.secondary}</p>}
            </div>
            <span
              className="shrink-0 font-medium tabular-nums"
              title={unit ? `${item.value} ${unit}` : undefined}
            >
              {item.display ?? item.value}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-secondary">
            <div
              className={cn("h-full rounded-full bg-accent transition-[width] duration-500")}
              style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
