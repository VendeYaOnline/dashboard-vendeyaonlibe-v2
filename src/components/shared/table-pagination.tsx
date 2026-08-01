"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@heroui/react";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  /** Elementos mostrados en la página actual. */
  itemsInPage: number;
  itemLabel: string;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  itemsInPage,
  itemLabel,
  pageSize = 10,
  onPageChange,
}: TablePaginationProps) {
  if (totalItems === 0) return null;

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + itemsInPage, totalItems);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
      <p className="text-sm text-muted">
        Mostrando {startIndex + 1} a {endIndex} de {totalItems} {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          isDisabled={currentPage === 1}
          onPress={() => onPageChange(Math.max(currentPage - 1, 1))}
        >
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">Anterior</span>
        </Button>
        <span className="px-1 text-sm font-medium">
          Página {currentPage} de {totalPages || 1}
        </span>
        <Button
          variant="outline"
          size="sm"
          isDisabled={currentPage >= totalPages}
          onPress={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
