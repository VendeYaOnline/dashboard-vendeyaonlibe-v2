"use client";

import { useEffect, useState } from "react";
import { GalleryHorizontal, X } from "lucide-react";
import {
  Button,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Modal,
  Select,
  TextField,
  toast,
  useOverlayState,
} from "@heroui/react";
import { ModalFormHeader } from "@/components/shared/modal-form-header";
import { ImageWithSkeleton } from "@/components/shared/image-with-skeleton";
import { CharCounter } from "@/features/productos/components/form-section";
import { ProductSelectGrid } from "@/components/shared/product-select-grid";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useQueryAllCategories, useQueryAvailableProducts } from "@/app/api/queries";
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
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [showOnHome, setShowOnHome] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Products[]>([]);
  const [search, setSearch] = useState("");
  const [discount, setDiscount] = useState<"all" | "with" | "without">("all");
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(1);
  // El diálogo aparece antes de iniciar el trabajo de la grilla y la consulta
  // de productos; evita que la animación de apertura se sienta bloqueada.
  const [isCatalogReady, setIsCatalogReady] = useState(false);

  // Precarga los datos al abrir y limpia el formulario al cerrar
  useEffect(() => {
    if (isOpen) {
      setName(carousel?.name ?? "");
      setCategoryId(carousel?.category_id ?? null);
      setShowOnHome(carousel?.show_on_home ?? false);
      setSelectedProducts(carousel?.products ?? []);
    }
    setSearch("");
    setDiscount("all");
    setPage(1);
  }, [isOpen, carousel]);

  useEffect(() => setPage(1), [debouncedSearch, discount]);

  useEffect(() => {
    if (!isOpen) {
      setIsCatalogReady(false);
      return;
    }

    const frame = window.requestAnimationFrame(() => setIsCatalogReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen]);

  // Se listan todos los productos de la tienda (pueden repetirse entre carruseles).
  const { data, isLoading, isPlaceholderData } = useQueryAvailableProducts(
    page,
    debouncedSearch,
    [],
    isOpen && isCatalogReady,
    carousel?.id,
    discount,
  );
  const { data: categoriesData } = useQueryAllCategories(isOpen);
  const categories = categoriesData?.categories ?? [];

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
      categoryId,
      showOnHome,
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

                <Select
                  selectedKey={categoryId ?? "none"}
                  onSelectionChange={(key) => setCategoryId(String(key) === "none" ? null : String(key))}
                >
                  <Label>Categoría asociada</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBoxItem id="none">Sin categoría (promoción general)</ListBoxItem>
                      {categories.map((category) => (
                        <ListBoxItem key={category.id} id={category.id}>
                          {category.name}
                        </ListBoxItem>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
                <p className="-mt-3 text-xs text-muted">
                  La ficha de los productos de esta categoría mostrará este carrusel, aunque cambies su nombre.
                </p>

                <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border bg-surface-secondary/50 p-3 text-sm">
                  <input
                    type="checkbox"
                    checked={showOnHome}
                    onChange={(event) => setShowOnHome(event.target.checked)}
                    className="mt-0.5 size-4 accent-primary"
                  />
                  <span>
                    <span className="block font-medium">Mostrar debajo de las categorías</span>
                    <span className="text-xs text-muted">Solo puede haber un carrusel en esta ubicación de la portada.</span>
                  </span>
                </label>

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
                          {product.image_product ? (
                            <ImageWithSkeleton
                              src={product.image_product}
                              alt=""
                              sizes="24px"
                              className="size-6 shrink-0 rounded-full"
                            />
                          ) : (
                            <span className="size-6 shrink-0 rounded-full bg-surface-secondary" />
                          )}
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
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
                    <TextField value={search} onChange={setSearch}>
                      <Label>Buscar producto por título</Label>
                      <Input placeholder="Buscar por título..." maxLength={30} />
                    </TextField>
                    <Select selectedKey={discount} onSelectionChange={(key) => setDiscount(String(key) as typeof discount)}>
                      <Label>Descuento</Label>
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          <ListBoxItem id="all">Todos</ListBoxItem>
                          <ListBoxItem id="with">Con descuento</ListBoxItem>
                          <ListBoxItem id="without">Sin descuento</ListBoxItem>
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>

                  <ProductSelectGrid
                    products={data?.products ?? []}
                    selectedIds={selectedProducts.map((product) => product.id)}
                    onSelect={handleSelectProduct}
                    currentPage={page}
                    totalPages={data?.totalPages ?? 1}
                    onPageChange={setPage}
                    isLoading={isLoading || !isCatalogReady}
                    isRefreshing={isPlaceholderData}
                    emptyMessage="No hay productos disponibles para asignar"
                  />
                  <p className="text-xs text-muted">
                    Un producto puede estar en varios carruseles. Evita incluir productos
                    agotados: aparecerán en la promoción sin poder comprarse.
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
