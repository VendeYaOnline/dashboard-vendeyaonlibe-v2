"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductSelectGrid } from "@/components/shared/product-select-grid";
import { useQueryProducts } from "@/app/api/queries";
import { Products } from "@/interfaces/products";

interface CreateFeaturedProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateFeaturedProduct: (productId: string) => void;
  isLoading: boolean;
}

export function CreateFeaturedProductModal({
  open,
  onOpenChange,
  onCreateFeaturedProduct,
  isLoading,
}: CreateFeaturedProductModalProps) {
  const [selectedProduct, setSelectedProduct] = useState<Products | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!open) {
      setSelectedProduct(null);
      setSearchTerm("");
      setDebouncedSearch("");
      setCurrentPage(1);
    }
  }, [open]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, isFetching } = useQueryProducts(
    currentPage,
    debouncedSearch,
    open,
  );

  const handleSelectProduct = (product: Products) => {
    setSelectedProduct((prev) => (prev?.id === product.id ? null : product));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    onCreateFeaturedProduct(selectedProduct.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="bg-primary text-primary-foreground p-6 mt-4 rounded-lg text-xl">
            Crear Producto Destacado
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="searchFeaturedProduct">
              Buscar producto por título
            </Label>
            <Input
              id="searchFeaturedProduct"
              placeholder="Buscar por título..."
              value={searchTerm}
              maxLength={30}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          <ProductSelectGrid
            products={data?.products || []}
            selectedIds={selectedProduct ? [selectedProduct.id] : []}
            onSelect={handleSelectProduct}
            currentPage={currentPage}
            totalPages={data?.totalPages || 1}
            onPageChange={setCurrentPage}
            isLoading={isFetching}
          />

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!selectedProduct || isLoading}>
              {isLoading ? "Creando..." : "Destacar Producto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
