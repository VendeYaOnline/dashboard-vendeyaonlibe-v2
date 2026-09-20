"use client";

import { useEffect, useState } from "react";
import { GalleryHorizontal, X } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Modal,
  TextField,
  toast,
  useOverlayState,
} from "@heroui/react";
import { ModalFormHeader } from "@/components/shared/modal-form-header";
import { CharCounter } from "@/features/productos/components/form-section";
import { ProductSelectGrid } from "@/components/shared/product-select-grid";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useQueryAvailableProducts } from "@/app/api/queries";
import type { Products } from "@/interfaces/products";
import {
  MAX_CAROUSEL_NAME_LENGTH,
  MAX_PRODUCTS_CAROUSEL,
  MIN_PRODUCTS_CAROUSEL,
  type Carousel,
  type CarouselPayload,
} from "@/interfaces/carousel";
import { PendingButton } from "@/components/shared/pending-button";

interface CarouselFormModalProps {
  /** null = crear, con valor = editar */
  carousel: Carousel | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (payload: CarouselPayload) => void;
  isPending: boolean;
}

export function CarouselFormModal({
  carousel,
  isOpen,
  onOpenChange,
  onSubmit,
  isPending,
}: CarouselFormModalProps) {
  const state = useOverlayState({ isOpen, onOpenChange });

  const [name, setName] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Products[]>([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(1);

  // Precarga los datos al abrir y limpia el formulario al cerrar
  useEffect(() => {
    if (isOpen) {
      setName(carousel?.name ?? "");
      setSelectedProducts(carousel?.products ?? []);
    }
    setSearch("");
    setPage(1);
  }, [isOpen, carousel]);

  useEffect(() => setPage(1), [debouncedSearch]);

  // Al editar, los productos del propio carrusel también aparecen en la lista
  // (así se pueden quitar y volver a agregar); los de otros carruseles no.
  const { data, isLoading, isPlaceholderData } = useQueryAvailableProducts(
    page,
    debouncedSearch,
    [],
    isOpen,
    carousel?.id,
  );

  const handleSelectProduct = (product: Products) => {
    const isSelected = selectedProducts.some((item) => item.id === product.id);

    if (isSelected) {
      setSelectedProducts((prev) => prev.filter((item) => item.id !== product.id));
      return;
    }

    if (selectedProducts.length >= MAX_PRODUCTS_CAROUSEL) {
      toast.danger(`Máximo ${MAX_PRODUCTS_CAROUSEL} productos por carrusel`);
      return;
    }

    setSelectedProducts((prev) => [...prev, product]);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
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
    <Modal state={state}>
      <Modal.Backdrop isDismissable={!isPending}>
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog>
            <form onSubmit={handleSubmit}>
              <ModalFormHeader
                icon={GalleryHorizontal}
                title={carousel ? "Editar carrusel" : "Crear carrusel"}
                description="Agrupa productos en una promoción destacada para la portada de tu tienda."
              />

              <Modal.Body className="space-y-5">
                <TextField
                  value={name}
                  onChange={(value) => setName(value.slice(0, MAX_CAROUSEL_NAME_LENGTH))}
                  isRequired
                  autoFocus
                >
                  <Label>Nombre del carrusel</Label>
                  <Input placeholder="Ej: Ofertas de temporada" maxLength={MAX_CAROUSEL_NAME_LENGTH} />
                  <CharCounter length={name.length} max={MAX_CAROUSEL_NAME_LENGTH} />
                </TextField>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>
                      Productos seleccionados ({selectedProducts.length}/
                      {MAX_PRODUCTS_CAROUSEL})
                    </Label>
                    <span className="text-xs text-muted">
                      Mínimo {MIN_PRODUCTS_CAROUSEL} y máximo {MAX_PRODUCTS_CAROUSEL}
                    </span>
                  </div>

                  {selectedProducts.length === 0 ? (
                    <p className="rounded-lg border border-border p-3 text-sm text-muted">
                      Aún no has seleccionado productos
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2 rounded-lg border border-border p-3">
                      {selectedProducts.map((product) => (
                        <span
                          key={product.id}
                          className="inline-flex max-w-full items-center gap-2 rounded-full bg-accent-soft py-1 pr-2 pl-1 text-xs text-accent-soft-foreground"
                        >
                          <img
                            src={product.image_product}
                            alt=""
                            className="size-6 shrink-0 rounded-full object-cover"
                          />
                          <span className="truncate">{product.title}</span>
                          {product.stock === false && (
                            <span className="shrink-0 rounded-full bg-danger/10 px-1.5 text-[10px] font-medium text-danger">
                              Agotado
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleSelectProduct(product)}
                            aria-label={`Quitar ${product.title}`}
                          >
                            <X className="size-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <TextField value={search} onChange={setSearch}>
                    <Label>Buscar producto por título</Label>
                    <Input placeholder="Buscar por título..." maxLength={30} />
                  </TextField>

                  <ProductSelectGrid
                    products={data?.products ?? []}
                    selectedIds={selectedProducts.map((product) => product.id)}
                    onSelect={handleSelectProduct}
                    currentPage={page}
                    totalPages={data?.totalPages ?? 1}
                    onPageChange={setPage}
                    isLoading={isLoading}
                    isRefreshing={isPlaceholderData}
                    emptyMessage="No hay productos disponibles para asignar"
                  />
                  <p className="text-xs text-muted">
                    Solo se listan productos que no pertenecen a otro carrusel. Los agotados
                    se muestran igualmente en la tienda, marcados como agotados.
                  </p>
                </div>
              </Modal.Body>

              <Modal.Footer>
                <Button
                  variant="ghost"
                  type="button"
                  isDisabled={isPending}
                  onPress={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <PendingButton variant="primary" type="submit" isDisabled={!isValid} isPending={isPending} pendingLabel="Guardando">
                  {carousel
                      ? "Guardar cambios"
                      : "Crear carrusel"}
                </PendingButton>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
