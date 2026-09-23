"use client";

import { useEffect, useState } from "react";
import { Button, Card, toast } from "@heroui/react";
import { Edit2, GalleryHorizontal, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ImageWithSkeleton } from "@/components/shared/image-with-skeleton";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { SearchField } from "@/components/shared/search-field";
import { TablePagination } from "@/components/shared/table-pagination";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useQueryCarousels } from "@/app/api/queries";
import {
  useMutationCarousel,
  useMutationDeleteCarousel,
  useMutationUpdatedCarousel,
} from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import { useAuthStore } from "@/store/auth.store";
import {
  MAX_CAROUSELS,
  MAX_PRODUCTS_CAROUSEL,
  type Carousel,
  type CarouselPayload,
} from "@/interfaces/carousel";

/** Miniaturas que se muestran en la tabla antes de resumir con "+N". */
const MAX_PREVIEW_IMAGES = 3;
import { CarouselFormModal } from "./components/carousel-form-modal";

export function CarruselView() {
  const canManage = useAuthStore((s) => s.user?.role) !== "viewer";

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selected, setSelected] = useState<Carousel | null>(null);
  const [toDelete, setToDelete] = useState<Carousel | null>(null);

  useEffect(() => setPage(1), [debouncedSearch]);

  const { data, isLoading, isPlaceholderData } = useQueryCarousels(page, debouncedSearch);
  const createMutation = useMutationCarousel();
  const updateMutation = useMutationUpdatedCarousel();
  const deleteMutation = useMutationDeleteCarousel();

  const carousels = data?.carousels ?? [];
  const grandTotal = data?.grandTotal ?? 0;
  const limitReached = grandTotal >= MAX_CAROUSELS;

  const handleSubmit = (payload: CarouselPayload) => {
    if (selected) {
      updateMutation.mutate(
        { ...payload, id: selected.id },
        {
          onSuccess: () => {
            toast.success("Carrusel actualizado correctamente");
            setIsFormOpen(false);
            setSelected(null);
          },
          onError: (error) => handleAxiosError(error, "Error al actualizar el carrusel"),
        },
      );
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Carrusel creado correctamente");
        setIsFormOpen(false);
      },
      onError: (error) => handleAxiosError(error, "Error al crear el carrusel"),
    });
  };

  const handleConfirmDelete = () => {
    if (!toDelete) return;
    deleteMutation.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success("Carrusel eliminado correctamente");
        setToDelete(null);
      },
      onError: (error) => handleAxiosError(error, "Error al eliminar el carrusel"),
    });
  };

  const columns: DataTableColumn<Carousel>[] = [
    {
      key: "name",
      label: "Nombre del carrusel",
      isRowHeader: true,
      render: (carousel) => <span className="font-medium">{carousel.name}</span>,
    },
    {
      key: "products",
      label: "Productos",
      render: (carousel) =>
        carousel.products.length === 0 ? (
          <span className="text-sm text-muted">Sin productos</span>
        ) : (
          <div className="flex items-center gap-2">
            {carousel.products.slice(0, MAX_PREVIEW_IMAGES).map((product) =>
              product.image_product ? (
                <ImageWithSkeleton
                  key={product.id}
                  src={product.image_product}
                  alt={product.title}
                  sizes="40px"
                  className="size-10 rounded-md border border-border"
                />
              ) : (
                <span
                  key={product.id}
                  title={`${product.title} sin imagen`}
                  className="flex size-10 items-center justify-center rounded-md bg-surface-secondary text-[10px] text-muted"
                >
                  Sin img
                </span>
              ),
            )}
            {carousel.products.length > MAX_PREVIEW_IMAGES && (
              <span className="flex size-10 items-center justify-center rounded-md bg-surface-secondary text-xs font-medium text-muted">
                +{carousel.products.length - MAX_PREVIEW_IMAGES}
              </span>
            )}
            <span className="ml-1 text-xs text-muted">
              {carousel.products.length}/{MAX_PRODUCTS_CAROUSEL}
            </span>
          </div>
        ),
    },
    {
      key: "actions",
      label: "Acciones",
      align: "end",
      render: (carousel) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label={`Editar ${carousel.name}`}
            isDisabled={!canManage}
            onPress={() => {
              setSelected(carousel);
              setIsFormOpen(true);
            }}
          >
            <Edit2 className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label={`Eliminar ${carousel.name}`}
            className="text-danger"
            isDisabled={!canManage}
            onPress={() => setToDelete(carousel)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={GalleryHorizontal}
        title="Carrusel"
        description={`Gestiona los carruseles de promociones de tu tienda (${grandTotal}/${MAX_CAROUSELS})`}
        actions={
          <Button
            variant="primary"
            isDisabled={limitReached || !canManage}
            onPress={() => {
              setSelected(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            {limitReached ? "Límite alcanzado" : "Crear carrusel"}
          </Button>
        }
      />

      <Card>
        <Card.Content className="p-4">
          <SearchField
            aria-label="Buscar carruseles"
            placeholder="Buscar por nombre de carrusel..."
            value={search}
            onChange={setSearch}
          />
        </Card.Content>
      </Card>

      <Card
        className={`overflow-hidden transition-opacity ${isPlaceholderData ? "opacity-60" : ""}`}
        aria-busy={isPlaceholderData}
      >
        <DataTable
          aria-label="Carruseles"
          items={carousels}
          columns={columns}
          getRowId={(carousel) => carousel.id}
          isLoading={isLoading}
          loadingMessage="Cargando carruseles..."
          emptyMessage="No se encontraron carruseles"
        />
        <TablePagination
          currentPage={page}
          totalPages={data?.totalPages ?? 1}
          totalItems={data?.total ?? 0}
          itemsInPage={carousels.length}
          itemLabel="carruseles"
          onPageChange={setPage}
        />
      </Card>

      {isFormOpen && (
        <CarouselFormModal
          carousel={selected}
          isOpen
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setSelected(null);
          }}
          onSubmit={handleSubmit}
          isPending={createMutation.isPending || updateMutation.isPending}
        />
      )}

      <ConfirmDialog
        isOpen={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar carrusel"
        description={
          <>
            ¿Seguro que deseas eliminar el carrusel{" "}
            <span className="font-semibold text-foreground">
              &quot;{toDelete?.name}&quot;
            </span>
            ? Esta acción no se puede deshacer.
          </>
        }
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
