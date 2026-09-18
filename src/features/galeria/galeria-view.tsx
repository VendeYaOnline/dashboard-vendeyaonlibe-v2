"use client";

import { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { ImageIcon, Plus } from "lucide-react";
import { Button, Card, Spinner, cn, toast } from "@heroui/react";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TablePagination } from "@/components/shared/table-pagination";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useQueryAllCategories, useQueryImages } from "@/app/api/queries";
import {
  useMutationDeleteImage,
  useMutationImages,
  useMutationRenameImage,
} from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import { useAuthStore } from "@/store/auth.store";
import type { ImageItem } from "@/lib/types";
import { GaleriaToolbar, type ViewMode } from "./components/galeria-toolbar";
import { ImagenCard } from "./components/imagen-card";
import { ImagenListItem } from "./components/imagen-list-item";
import { ImagenPreviewModal } from "./components/imagen-preview-modal";
import { RenameImagenModal } from "./components/rename-imagen-modal";
import { UploadImagenModal } from "./components/upload-imagen-modal";
import { IMAGES_PER_PAGE, MAX_SELECTION, getFileName } from "./utils";

export function GaleriaView() {
  const canManage = useAuthStore((s) => s.user?.role) !== "viewer";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [previewImage, setPreviewImage] = useState<ImageItem | null>(null);
  const [imageToRename, setImageToRename] = useState<ImageItem | null>(null);
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  useEffect(() => setPage(1), [debouncedSearch, categoryFilter]);

  const { data, isLoading, isPlaceholderData } = useQueryImages(
    page,
    debouncedSearch,
    IMAGES_PER_PAGE,
    categoryFilter === "all" ? undefined : categoryFilter,
  );
  // Lista completa: el filtro y el modal de subida necesitan todas las categorías.
  const { data: categoriesData } = useQueryAllCategories();
  const categories = categoriesData?.categories ?? [];

  const uploadMutation = useMutationImages();
  const renameMutation = useMutationRenameImage();
  const deleteMutation = useMutationDeleteImage();

  const images = data?.images ?? [];

  const handleSelect = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        if (next.size >= MAX_SELECTION) return prev;
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleUpload = ({
    count,
    ...payload
  }: {
    categoryId: string;
    formData: FormData;
    count: number;
  }) => {
    uploadMutation.mutate(payload, {
      onSuccess: () => {
        toast.success(count > 1 ? `${count} imágenes subidas` : "Imagen subida");
        setIsUploadOpen(false);
        setPage(1);
      },
      onError: (error) => handleAxiosError(error, "Hubo un error al subir las imágenes"),
    });
  };

  const handleRename = (key: string, newName: string) => {
    renameMutation.mutate(
      { key, newName },
      {
        onSuccess: (response) => {
          const updatedProducts = response.data?.updatedProducts ?? 0;
          toast.success(
            updatedProducts > 0
              ? `Imagen renombrada y actualizada en ${updatedProducts} ${
                  updatedProducts === 1 ? "producto" : "productos"
                }`
              : "Imagen renombrada",
          );
          // La clave cambió: deja de estar seleccionada.
          setSelectedKeys((prev) => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
          setImageToRename(null);
        },
        onError: (error) => handleAxiosError(error, "Hubo un error al renombrar la imagen"),
      },
    );
  };

  const handleDeleteConfirm = () => {
    if (!keyToDelete) return;
    deleteMutation.mutate(keyToDelete, {
      onSuccess: (response) => {
        const updatedProducts = response.data?.updatedProducts ?? 0;
        toast.success(
          updatedProducts > 0
            ? `Imagen eliminada y quitada de ${updatedProducts} ${
                updatedProducts === 1 ? "producto" : "productos"
              }`
            : "Imagen eliminada",
        );
        setSelectedKeys((prev) => {
          const next = new Set(prev);
          next.delete(keyToDelete);
          return next;
        });
        setKeyToDelete(null);
      },
      onError: (error) => handleAxiosError(error, "Hubo un error al eliminar la imagen"),
    });
  };

  const handleBulkDeleteConfirm = async () => {
    const keys = Array.from(selectedKeys);
    setIsBulkDeleting(true);

    const results = await Promise.allSettled(
      keys.map((key) => deleteMutation.mutateAsync(key)),
    );

    // Las que fallaron siguen existiendo: se mantienen seleccionadas.
    const failedResults = results.filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    const failedKeys = keys.filter((_, index) => results[index].status === "rejected");
    const deletedCount = keys.length - failedKeys.length;

    setSelectedKeys(new Set(failedKeys));
    setIsBulkDeleting(false);

    if (deletedCount > 0) {
      toast.success(
        deletedCount > 1 ? `${deletedCount} imágenes eliminadas` : "Imagen eliminada",
      );
    }

    if (failedKeys.length > 0) {
      const allInUse = failedResults.every(
        (result) =>
          isAxiosError(result.reason) &&
          result.reason.response?.data?.code === "IMAGE_IN_USE",
      );

      toast.danger(
        allInUse
          ? failedKeys.length > 1
            ? `${failedKeys.length} imágenes están en uso como imagen principal de un producto`
            : "Esta imagen está en uso como imagen principal de un producto"
          : failedKeys.length > 1
            ? `No se pudieron eliminar ${failedKeys.length} imágenes`
            : "No se pudo eliminar una imagen",
      );
      return;
    }

    setIsBulkDeleteOpen(false);
  };

  // Solo bloquea la primera carga; al paginar o filtrar se atenúa la galería actual.
  const isBusy = isLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ImageIcon}
        title="Galería de imágenes"
        description={`${data?.grandTotal ?? 0} ${
          (data?.grandTotal ?? 0) === 1 ? "imagen" : "imágenes"
        } en total`}
        actions={
          <Button
            variant="primary"
            isDisabled={!canManage}
            onPress={() => setIsUploadOpen(true)}
          >
            <Plus className="size-4" />
            Subir imágenes
          </Button>
        }
      />

      <Card>
        <Card.Content className="p-4">
          <GaleriaToolbar
            search={search}
            onSearchChange={setSearch}
            categories={categories}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            selectedCount={selectedKeys.size}
            onDeleteSelected={() => setIsBulkDeleteOpen(true)}
            isDisabled={isBusy}
          />
        </Card.Content>
      </Card>

      {isBusy ? (
        <div className="flex flex-col items-center gap-3 py-20">
          <Spinner />
          <p className="text-sm text-muted">Cargando imágenes...</p>
        </div>
      ) : images.length > 0 ? (
        <div
          className={cn("space-y-6 transition-opacity", isPlaceholderData && "opacity-60")}
          aria-busy={isPlaceholderData}
        >
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {images.map((image) => (
                <ImagenCard
                  key={image.Key}
                  image={image}
                  categories={categories}
                  isSelected={selectedKeys.has(image.Key)}
                  onSelect={handleSelect}
                  onView={setPreviewImage}
                  onEdit={setImageToRename}
                  onDelete={setKeyToDelete}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {images.map((image) => (
                <ImagenListItem
                  key={image.Key}
                  image={image}
                  categories={categories}
                  isSelected={selectedKeys.has(image.Key)}
                  onSelect={handleSelect}
                  onView={setPreviewImage}
                  onEdit={setImageToRename}
                  onDelete={setKeyToDelete}
                />
              ))}
            </div>
          )}

          <Card>
            <TablePagination
              currentPage={page}
              totalPages={data?.totalPages ?? 1}
              totalItems={data?.total ?? 0}
              itemsInPage={images.length}
              itemLabel="imágenes"
              pageSize={IMAGES_PER_PAGE}
              onPageChange={setPage}
            />
          </Card>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-surface-secondary">
            <ImageIcon className="size-10 text-muted" />
          </div>
          <h3 className="text-lg font-medium">No se encontraron imágenes</h3>
          <p className="text-sm text-muted">
            {debouncedSearch
              ? "Intenta con otra búsqueda"
              : "Comienza subiendo tu primera imagen"}
          </p>
          {!debouncedSearch && canManage && (
            <Button variant="secondary" onPress={() => setIsUploadOpen(true)}>
              <Plus className="size-4" />
              Subir imágenes
            </Button>
          )}
        </div>
      )}

      <UploadImagenModal
        isOpen={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        onUpload={handleUpload}
        categories={categories}
        isPending={uploadMutation.isPending}
      />

      <ImagenPreviewModal
        image={previewImage}
        isOpen={previewImage !== null}
        onOpenChange={(open) => !open && setPreviewImage(null)}
        onDelete={setKeyToDelete}
      />

      <RenameImagenModal
        image={imageToRename}
        isOpen={imageToRename !== null}
        onOpenChange={(open) => !open && setImageToRename(null)}
        onRename={handleRename}
        isPending={renameMutation.isPending}
      />

      <ConfirmDialog
        isOpen={keyToDelete !== null}
        onOpenChange={(open) => !open && setKeyToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar imagen"
        description={
          <>
            ¿Seguro que deseas eliminar{" "}
            <span className="font-semibold text-foreground">
              &quot;{keyToDelete ? getFileName(keyToDelete) : ""}&quot;
            </span>
            ? Esta acción no se puede deshacer.
          </>
        }
        isPending={deleteMutation.isPending}
      />

      <ConfirmDialog
        isOpen={isBulkDeleteOpen}
        onOpenChange={(open) => !open && setIsBulkDeleteOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        title={`Eliminar ${selectedKeys.size} ${selectedKeys.size === 1 ? "imagen" : "imágenes"}`}
        description="¿Seguro que deseas eliminar las imágenes seleccionadas? Esta acción no se puede deshacer."
        isPending={isBulkDeleting}
      />
    </div>
  );
}
