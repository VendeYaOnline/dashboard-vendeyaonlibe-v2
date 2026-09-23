"use client";

import { Check, ChevronLeft, ChevronRight, Star } from "lucide-react";
import Image from "next/image";
import { Button, Chip, Spinner, cn } from "@heroui/react";
import type { Products } from "@/interfaces/products";
import { formatCOP } from "@/features/productos/utils";

interface ProductSelectGridProps {
  products: Products[];
  selectedIds: string[];
  onSelect: (product: Products) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  /** Cambio de página/búsqueda: se atenúa la grilla actual mientras llega la nueva. */
  isRefreshing?: boolean;
  emptyMessage?: string;
  /** Ids que no se pueden elegir (p. ej. productos ya destacados). */
  disabledIds?: string[];
  disabledLabel?: string;
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
  isRefreshing = false,
  emptyMessage = "No se encontraron productos",
  disabledIds = [],
  disabledLabel = "No disponible",
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
    <div className={cn("space-y-4 transition-opacity", isRefreshing && "opacity-60")} aria-busy={isRefreshing}>
      {/* p-1.5: el anillo de selección (ring) sobresale 2 px y el contenedor recorta lo que se desborda. */}
      <div className="grid max-h-80 grid-cols-1 gap-3 overflow-y-auto p-1.5 md:grid-cols-2">
        {products.map((product) => {
          const isSelected = selectedIds.includes(product.id);
          const isDisabled = disabledIds.includes(product.id);

          return (
            <button
              key={product.id}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelect(product)}
              className={cn(
                "flex gap-3 rounded-lg border border-border p-3 text-left transition-all",
                isSelected
                  ? "border-accent bg-accent-soft ring-2 ring-accent"
                  : isDisabled
                    ? "cursor-not-allowed opacity-60"
                    : "hover:border-accent/50 hover:bg-surface-secondary",
              )}
            >
              {product.image_product ? (
                <Image
                  src={product.image_product}
                  alt={product.title}
                  width={64}
                  height={64}
                  sizes="64px"
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
                  {formatCOP(product.discount_price || product.price) ||
                    product.discount_price ||
                    product.price}
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-muted">
                    {product.stock ? "Con stock" : "Sin stock"}
                  </span>
                  {isDisabled && (
                    <Chip size="sm" variant="soft" color="warning">
                      <Star className="mr-1 size-3 fill-current" />
                      {disabledLabel}
                    </Chip>
                  )}
                </div>
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
