"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpDown, ChevronDown, ChevronUp, ImageOff, Search } from "lucide-react";
import {
  Button,
  InputGroup,
  Label,
  ListBox,
  ListBoxItem,
  Modal,
  Select,
  Spinner,
  TextField,
  toast,
  useOverlayState,
} from "@heroui/react";
import { ModalFormHeader } from "@/components/shared/modal-form-header";
import { ImageWithSkeleton } from "@/components/shared/image-with-skeleton";
import { PendingButton } from "@/components/shared/pending-button";
import { SortableList } from "@/components/shared/sortable-list";
import { useQueryAllCategories, useQueryCategoryProducts } from "@/app/api/queries";
import { useMutationReorderCategoryProducts } from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import type { CategoryProduct } from "@/interfaces/categories";

interface OrdenarProductosModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

/** Minúsculas y sin tildes, para buscar "cafe" y encontrar "Café". */
const normalize = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/**
 * Ordena los productos de una categoría: se elige la categoría y se arrastran
 * sus productos. Es el orden en que la tienda los muestra en esa categoría.
 * Categoría y buscador quedan fijos arriba; solo la lista hace scroll.
 */
export function OrdenarProductosModal({ isOpen, onOpenChange }: OrdenarProductosModalProps) {
  const state = useOverlayState({ isOpen, onOpenChange });
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [ordered, setOrdered] = useState<CategoryProduct[]>([]);
  const [search, setSearch] = useState("");
  const [matchIndex, setMatchIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const { data: categoriesData, isLoading: isLoadingCategories } = useQueryAllCategories(isOpen);
  const { data, isLoading, isFetching } = useQueryCategoryProducts(categoryId);
  const reorderMutation = useMutationReorderCategoryProducts();

  const categories = categoriesData?.categories ?? [];
  const products = data?.category.id === categoryId ? data.products : undefined;

  useEffect(() => {
    setOrdered(products ?? []);
  }, [products]);

  // El buscador no filtra (rompería el orden): resalta coincidencias y salta entre ellas.
  const query = normalize(search);
  const matches = useMemo(
    () => (query ? ordered.filter((product) => normalize(product.title).includes(query)) : []),
    [ordered, query],
  );
  const currentMatch = matches.length > 0 ? matches[Math.min(matchIndex, matches.length - 1)] : null;
  const highlightedKey = currentMatch?.id ?? null;
  const highlightedPosition = highlightedKey
    ? ordered.findIndex((product) => product.id === highlightedKey)
    : -1;

  useEffect(() => setMatchIndex(0), [query, categoryId]);

  // Lleva la lista hasta el resultado actual, también cuando éste cambia de posición.
  useEffect(() => {
    if (!highlightedKey) return;
    listRef.current
      ?.querySelector(`[data-sortable-key="${CSS.escape(highlightedKey)}"]`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [highlightedKey, highlightedPosition]);

  const goToMatch = (step: 1 | -1) => {
    if (matches.length === 0) return;
    const current = Math.min(matchIndex, matches.length - 1);
    setMatchIndex((current + step + matches.length) % matches.length);
  };

  const isDirty = ordered.some((product, index) => product.id !== products?.[index]?.id);
  const isPending = reorderMutation.isPending;
  const hasList = categoryId !== null && ordered.length > 0;

  const handleSave = () => {
    if (!categoryId) return;
    reorderMutation.mutate(
      { categoryId, ids: ordered.map((product) => product.id) },
      {
        onSuccess: () => toast.success("Orden de los productos actualizado"),
        onError: (error) => handleAxiosError(error, "No se pudo guardar el orden"),
      },
    );
  };

  return (
    <Modal state={state}>
      <Modal.Backdrop isDismissable={!isPending}>
        <Modal.Container size="md" scroll="inside">
          <Modal.Dialog>
            <ModalFormHeader
              icon={ArrowUpDown}
              title="Ordenar productos por categoría"
              description="Elige una categoría y arrastra sus productos (o usa las flechas) para definir el orden en que aparecen en la tienda."
            />

            {/* Fuera de Modal.Body: no se desplaza con la lista. */}
            <div className="shrink-0 space-y-3 pb-3">
              <Select
                aria-label="Categoría"
                selectedKey={categoryId}
                onSelectionChange={(key) => setCategoryId(key === null ? null : String(key))}
                placeholder={isLoadingCategories ? "Cargando categorías..." : "Selecciona una categoría"}
                isDisabled={isPending || isLoadingCategories}
              >
                <Label>Categoría</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox className="max-h-56 overflow-y-auto">
                    {categories.map((category) => {
                      const count = category.productCount ?? 0;
                      return (
                        <ListBoxItem
                          key={category.id}
                          id={category.id}
                          textValue={category.name}
                          isDisabled={count < 2}
                        >
                          {category.name} ({count} {count === 1 ? "producto" : "productos"})
                        </ListBoxItem>
                      );
                    })}
                  </ListBox>
                </Select.Popover>
              </Select>

              {hasList && (
                <div className="flex items-center gap-2">
                  <TextField
                    aria-label="Buscar producto en la lista"
                    value={search}
                    onChange={setSearch}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;
                      event.preventDefault();
                      goToMatch(event.shiftKey ? -1 : 1);
                    }}
                    className="min-w-0 flex-1"
                  >
                    <InputGroup>
                      <InputGroup.Prefix>
                        <Search className="size-4 text-muted" />
                      </InputGroup.Prefix>
                      <InputGroup.Input placeholder="Buscar producto en la lista..." />
                    </InputGroup>
                  </TextField>
                  {query && (
                    <>
                      <span className="shrink-0 text-xs tabular-nums text-muted" aria-live="polite">
                        {matches.length === 0
                          ? "Sin resultados"
                          : `${Math.min(matchIndex, matches.length - 1) + 1} de ${matches.length}`}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        isIconOnly
                        aria-label="Resultado anterior"
                        isDisabled={matches.length < 2}
                        onPress={() => goToMatch(-1)}
                      >
                        <ChevronUp className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        isIconOnly
                        aria-label="Resultado siguiente"
                        isDisabled={matches.length < 2}
                        onPress={() => goToMatch(1)}
                      >
                        <ChevronDown className="size-4" />
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>

            <Modal.Body>
              {categoryId === null ? (
                <p className="py-8 text-center text-sm text-muted">
                  Selecciona una categoría para ver sus productos
                </p>
              ) : isLoading || (isFetching && !products) ? (
                <div className="flex items-center justify-center gap-3 py-10 text-sm text-muted">
                  <Spinner size="sm" />
                  Cargando productos...
                </div>
              ) : ordered.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">Esta categoría no tiene productos</p>
              ) : (
                <div ref={listRef}>
                  <SortableList
                    items={ordered}
                    getKey={(product) => product.id}
                    onChange={setOrdered}
                    isDisabled={isPending}
                    showEdgeButtons
                    highlightedKey={highlightedKey}
                    renderItem={(product) => (
                      <span className="flex items-center gap-2">
                        {product.image_product ? (
                          <ImageWithSkeleton
                            src={product.image_product}
                            alt=""
                            sizes="32px"
                            className="size-8 shrink-0 rounded-md border border-border"
                          />
                        ) : (
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-secondary" title="Sin imagen">
                            <ImageOff className="size-3.5 text-muted" aria-hidden="true" />
                          </span>
                        )}
                        <span className="truncate text-sm">{product.title}</span>
                      </span>
                    )}
                  />
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="ghost" isDisabled={isPending} onPress={() => onOpenChange(false)}>
                Cerrar
              </Button>
              <PendingButton
                variant="primary"
                isDisabled={!isDirty}
                isPending={isPending}
                pendingLabel="Guardando"
                onPress={handleSave}
              >
                Guardar orden
              </PendingButton>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
