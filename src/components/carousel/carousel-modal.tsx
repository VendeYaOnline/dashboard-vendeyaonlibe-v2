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
import { X } from "lucide-react";
import { toast } from "sonner";
import { ProductSelectGrid } from "@/components/shared/product-select-grid";
import { useQueryAvailableProducts } from "@/app/api/queries";
import { Products } from "@/interfaces/products";
import {
  Carousel,
  CarouselPayload,
  MAX_PRODUCTS_CAROUSEL,
  MIN_PRODUCTS_CAROUSEL,
} from "@/interfaces/carousel";

interface CarouselModalProps {
  /** null = crear, con valor = editar */
  carousel: Carousel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CarouselPayload) => void;
  isLoading: boolean;
}

export function CarouselModal({
  carousel,
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: CarouselModalProps) {
  const [name, setName] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Products[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Precarga los datos al abrir y limpia el formulario al cerrar
  useEffect(() => {
    if (open) {
      setName(carousel?.name || "");
      setSelectedProducts(carousel?.products || []);
    }
    setSearchTerm("");
    setDebouncedSearch("");
    setCurrentPage(1);
  }, [open, carousel]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, isFetching } = useQueryAvailableProducts(
    currentPage,
    debouncedSearch,
    [],
    open,
  );

  const handleSelectProduct = (product: Products) => {
    const isSelected = selectedProducts.some((item) => item.id === product.id);

    if (isSelected) {
      setSelectedProducts((prev) =>
        prev.filter((item) => item.id !== product.id),
      );
      return;
    }

    if (selectedProducts.length >= MAX_PRODUCTS_CAROUSEL) {
      toast.error(`Máximo ${MAX_PRODUCTS_CAROUSEL} productos por carrusel`);
      return;
    }

    setSelectedProducts((prev) => [...prev, product]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      idsProducts: selectedProducts.map((product) => product.id),
    });
  };

  const isValid =
    name.trim() !== "" &&
    selectedProducts.length >= MIN_PRODUCTS_CAROUSEL &&
    selectedProducts.length <= MAX_PRODUCTS_CAROUSEL;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="bg-primary text-primary-foreground p-6 mt-4 rounded-lg text-xl">
            {carousel ? "Editar carrusel" : "Crear carrusel"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="carouselName">Nombre del carrusel</Label>
            <Input
              id="carouselName"
              placeholder="Ej: Ofertas de temporada"
              value={name}
              maxLength={50}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Productos seleccionados ({selectedProducts.length}/
                {MAX_PRODUCTS_CAROUSEL})
              </Label>
              <span className="text-xs text-muted-foreground">
                Mínimo {MIN_PRODUCTS_CAROUSEL} y máximo {MAX_PRODUCTS_CAROUSEL}{" "}
                productos
              </span>
            </div>

            {selectedProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground border rounded-lg p-3">
                Aún no has seleccionado productos
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 border rounded-lg p-3">
                {selectedProducts.map((product) => (
                  <span
                    key={product.id}
                    className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary text-xs px-3 py-1"
                  >
                    {product.title}
                    <button
                      type="button"
                      onClick={() => handleSelectProduct(product)}
                      aria-label={`Quitar ${product.title}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="searchProduct">Buscar producto por título</Label>
            <Input
              id="searchProduct"
              placeholder="Buscar por título..."
              value={searchTerm}
              maxLength={30}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <ProductSelectGrid
              products={data?.products || []}
              selectedIds={selectedProducts.map((product) => product.id)}
              onSelect={handleSelectProduct}
              currentPage={currentPage}
              totalPages={data?.totalPages || 1}
              onPageChange={setCurrentPage}
              isLoading={isFetching}
              emptyMessage="No hay productos disponibles para asignar"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid || isLoading}>
              {isLoading
                ? "Guardando..."
                : carousel
                  ? "Guardar cambios"
                  : "Crear carrusel"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
