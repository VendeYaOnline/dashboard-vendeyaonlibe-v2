"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Products } from "@/interfaces/products";

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
      <div className="py-8 text-center text-sm text-muted-foreground">
        Cargando productos...
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
        {products.map((product) => {
          const isSelected = selectedIds.includes(product.id);

          return (
            <button
              key={product.id}
              type="button"
              onClick={() => onSelect(product)}
              className={`flex gap-3 text-left border rounded-lg p-3 transition-all ${
                isSelected
                  ? "border-primary bg-primary/5 ring-2 ring-primary"
                  : "hover:border-primary/50 hover:bg-muted/30"
              }`}
            >
              {product.image_product ? (
                <img
                  src={product.image_product}
                  alt={product.title}
                  className="h-16 w-16 rounded object-cover shrink-0"
                />
              ) : (
                <div className="h-16 w-16 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground shrink-0">
                  Sin img
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-2">
                  {product.title}
                </p>
                <p className="text-sm font-semibold text-primary mt-1">
                  ${product.discount_price || product.price}
                </p>
                <p className="text-xs text-muted-foreground">
                  {product.stock ? "Con stock" : "Sin stock"}
                </p>
              </div>

              {isSelected && (
                <Check className="h-4 w-4 text-primary shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
