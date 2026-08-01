"use client";

import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button, Spinner, cn } from "@heroui/react";
import type { Products } from "@/interfaces/products";

interface ProductSelectGridProps {
  products: Products[];
  selectedIds: string[];
  onSelect: (product: Products) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

/**
 * Grilla de selección de productos usada por los modales de carrusel y
 * productos destacados (selección múltiple y única respectivamente).
 */
export function ProductSelectGrid({
  products,
  selectedIds,
  onSelect,
  currentPage,
  totalPages,
  onPageChange,
  isLoading,
  emptyMessage = "No se encontraron productos",
}: ProductSelectGridProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 py-8 text-sm text-muted">
        <Spinner size="sm" />
        Cargando productos...
      </div>
    );
  }

  if (products.length === 0) {
    return <div className="py-8 text-center text-sm text-muted">{emptyMessage}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid max-h-80 grid-cols-1 gap-3 overflow-y-auto pr-1 md:grid-cols-2">
        {products.map((product) => {
          const isSelected = selectedIds.includes(product.id);

          return (
            <button
              key={product.id}
              type="button"
              onClick={() => onSelect(product)}
              className={cn(
                "flex gap-3 rounded-lg border border-border p-3 text-left transition-all",
                isSelected
                  ? "border-accent bg-accent-soft ring-2 ring-accent"
                  : "hover:border-accent/50 hover:bg-surface-secondary",
              )}
            >
              {product.image_product ? (
                <img
                  src={product.image_product}
                  alt={product.title}
                  className="size-16 shrink-0 rounded object-cover"
                />
              ) : (
                <div className="flex size-16 shrink-0 items-center justify-center rounded bg-surface-secondary text-xs text-muted">
                  Sin img
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium">{product.title}</p>
                <p className="mt-1 text-sm font-semibold text-accent">
                  ${product.discount_price || product.price}
                </p>
                <p className="text-xs text-muted">
                  {product.stock ? "Con stock" : "Sin stock"}
                </p>
              </div>

              {isSelected && <Check className="size-4 shrink-0 text-accent" />}
            </button>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm text-muted">
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              isDisabled={currentPage === 1}
              onPress={() => onPageChange(Math.max(currentPage - 1, 1))}
            >
              <ChevronLeft className="size-4" />
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              isDisabled={currentPage === totalPages}
              onPress={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            >
              Siguiente
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
