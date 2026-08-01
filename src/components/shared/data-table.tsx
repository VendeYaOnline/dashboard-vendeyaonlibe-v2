"use client";

import type { ReactNode } from "react";
import { Spinner, Table, cn } from "@heroui/react";

/** React Aria acepta sólo string o number como clave de fila. */
type RowKey = string | number;

export interface DataTableColumn<T> {
  /** Identificador único de la columna. */
  key: string;
  label: string;
  /** Columna que identifica la fila (obligatoria para accesibilidad). */
  isRowHeader?: boolean;
  align?: "start" | "center" | "end";
  className?: string;
  render: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  items: T[];
  columns: DataTableColumn<T>[];
  getRowId: (item: T) => RowKey;
  isLoading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
  "aria-label": string;
}

const ALIGN_CLASS = {
  start: "text-start",
  center: "text-center",
  end: "text-end",
} as const;

/**
 * Envoltorio sobre la tabla de HeroUI que centraliza los estados de carga y
 * vacío, para que cada vista sólo declare sus columnas.
 */
export function DataTable<T>({
  items,
  columns,
  getRowId,
  isLoading,
  loadingMessage = "Cargando...",
  emptyMessage = "No se encontraron resultados",
  "aria-label": ariaLabel,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 py-16 text-sm text-muted">
        <Spinner size="sm" />
        {loadingMessage}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted">{emptyMessage}</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table.Root>
        {/* Table.Content es el `Table` de React Aria; header y body deben ir dentro. */}
        <Table.Content aria-label={ariaLabel}>
          <Table.Header>
            {columns.map((column) => (
              <Table.Column
                key={column.key}
                id={column.key}
                isRowHeader={column.isRowHeader}
                className={cn(ALIGN_CLASS[column.align ?? "start"], column.className)}
              >
                {column.label}
              </Table.Column>
            ))}
          </Table.Header>
          <Table.Body>
            {items.map((item) => (
              <Table.Row key={String(getRowId(item))} id={getRowId(item)}>
                {columns.map((column) => (
                  <Table.Cell
                    key={column.key}
                    className={cn(ALIGN_CLASS[column.align ?? "start"], column.className)}
                  >
                    {column.render(item)}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.Root>
    </div>
  );
}
