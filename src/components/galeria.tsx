"use client";

import { useState, useCallback, useEffect } from "react";
import { isAxiosError } from "axios";
import { ImageIcon } from "lucide-react";
import { useQueryImages, useQueryCategories } from "@/app/api/queries";
import {
  useMutationDeleteImage,
  useMutationImages,
  useMutationRenameImage,
} from "@/app/api/mutations";
import { GalleryHeader } from "./galeria/gallery-header";
import { ImageCard } from "./galeria/image-card";
import { ImageListItem } from "./galeria/image-list-item";
import { Pagination } from "./galeria/pagination";
import { ImagePreview } from "./galeria/image-preview";
import { UploadDialog } from "./galeria/upload-dialog";
import { RenameDialog } from "./galeria/rename-dialog";
import { DeleteDialog } from "./galeria/delete-dialog";
import type { ImageItem, Category } from "@/lib/types";
import { toast } from "sonner";
import { handleAxiosError } from "@/lib/error-handler";

export function Galeria() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [categoryFilter, setCategoryFilter] = useState<Category>("all");
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [previewImage, setPreviewImage] = useState<ImageItem | null>(null);
  const [editImage, setEditImage] = useState<ImageItem | null>(null);
  const [deleteKey, setDeleteKey] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Debounce search query (500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset to page 1 when search changes (debounced search query)
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  // Reset to page 1 immediately when filter changes (no delay)
  useEffect(() => {
    setPage(1);
  }, [categoryFilter]);

  const MAX_SELECTION = 10;
  const LIMIT = 60;

  // Use the real API queries and mutations
  const { data: imagesData, isLoading } = useQueryImages(
    page,
    searchQuery,
    LIMIT,
    categoryFilter === "all" ? undefined : categoryFilter,
  );
  const { data: categoriesData } = useQueryCategories(1, "");
  const deleteImageMutation = useMutationDeleteImage();
  const uploadMutation = useMutationImages();
  const renameMutation = useMutationRenameImage();

  // Default empty data structure
  const data = imagesData || {
    images: [],
    total: 0,
    grandTotal: 0,
    page: 1,
    totalPages: 0,
  };

  const categories = categoriesData?.categories || [];

  const handleSelect = useCallback((key: string) => {
    setSelectedImages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        if (newSet.size >= MAX_SELECTION) {
          return prev;
        }
        newSet.add(key);
      }
      return newSet;
    });
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteKey) {
      deleteImageMutation.mutate(deleteKey, {
        onSuccess: (response) => {
          const updatedProducts = response.data?.updatedProducts || 0;
          toast.success(
            updatedProducts > 0
              ? `Imagen eliminada y quitada de ${updatedProducts} ${
                  updatedProducts === 1 ? "producto" : "productos"
                }`
              : "Imagen eliminada",
          );
          setSelectedImages((prev) => {
            const newSet = new Set(prev);
            newSet.delete(deleteKey);
            return newSet;
          });
          setDeleteKey(null);
        },
        onError: (error) => {
          handleAxiosError(error, "Hubo un error al eliminar la imagen");
        },
      });
    }
  }, [deleteKey, deleteImageMutation]);

  const handleBulkDeleteConfirm = useCallback(async () => {
    const keys = Array.from(selectedImages);
    setIsBulkDeleting(true);

    const results = await Promise.allSettled(
      keys.map((key) => deleteImageMutation.mutateAsync(key)),
    );

    // Las que fallaron siguen existiendo: se mantienen seleccionadas
    const failedResults = results.filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    const failedKeys = keys.filter(
      (_, index) => results[index].status === "rejected",
    );
    const deletedCount = keys.length - failedKeys.length;

    setSelectedImages(new Set(failedKeys));
    setIsBulkDeleting(false);

    if (deletedCount > 0) {
      toast.success(
        deletedCount > 1
          ? `${deletedCount} imágenes eliminadas`
          : "Imagen eliminada",
      );
    }

    if (failedKeys.length > 0) {
      const allInUse = failedResults.every(
        (result) =>
          isAxiosError(result.reason) &&
          result.reason.response?.data?.code === "IMAGE_IN_USE",
      );

      toast.error(
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

    setShowBulkDelete(false);
  }, [selectedImages, deleteImageMutation]);

  const handleRename = useCallback(
    (key: string, newName: string) => {
      renameMutation.mutate(
        { key, newName },
        {
          onSuccess: (response) => {
            const updatedProducts = response.data?.updatedProducts || 0;
            toast.success(
              updatedProducts > 0
                ? `Imagen renombrada y actualizada en ${updatedProducts} ${
                    updatedProducts === 1 ? "producto" : "productos"
                  }`
                : "Imagen renombrada",
            );
            // La clave cambió: deja de estar seleccionada
            setSelectedImages((prev) => {
              const newSet = new Set(prev);
              newSet.delete(key);
              return newSet;
            });
            setEditImage(null);
          },
          onError: (error) => {
            handleAxiosError(error, "Hubo un error al renombrar la imagen");
          },
        },
      );
    },
    [renameMutation],
  );

  const handleUpload = useCallback(
    (payload: { categoryId: string; formData: FormData }) => {
      uploadMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Imagen subida");
          setShowUpload(false);
          setPage(1); // Reset to first page
        },
        onError: (error) => {
          handleAxiosError(error, "Hubo un error al subir la imagen");
        },
      });
    },
    [uploadMutation],
  );

  return (
    <div className="min-h-screen bg-background w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <GalleryHeader
          searchQuery={searchInput}
          onSearchChange={setSearchInput}
          selectedCount={selectedImages.size}
          totalImages={data.grandTotal}
          onUpload={() => setShowUpload(true)}
          onDeleteSelected={() => setShowBulkDelete(true)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          categories={categories}
          isLoading={isLoading}
        />

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4 animate-pulse">
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Cargando imágenes...</h3>
            <p className="text-sm text-muted-foreground">Por favor espera mientras se cargan tus imágenes</p>
          </div>
        )}

        {/* Gallery Grid or List */}
        {data.images.length > 0 ? (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 mt-8">
                {data.images.map((image) => (
                  <ImageCard
                    key={image.Key}
                    image={image}
                    isSelected={selectedImages.has(image.Key)}
                    onSelect={handleSelect}
                    onView={setPreviewImage}
                    onEdit={setEditImage}
                    onDelete={setDeleteKey}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-8 space-y-2">
                {data.images.map((image) => (
                  <ImageListItem
                    key={image.Key}
                    image={image}
                    isSelected={selectedImages.has(image.Key)}
                    onSelect={handleSelect}
                    onView={setPreviewImage}
                    onEdit={setEditImage}
                    onDelete={setDeleteKey}
                  />
                ))}
              </div>
            )}

            <Pagination
              page={page}
              totalPages={data.totalPages}
              onPageChange={setPage}
              total={data.total}
              grandTotal={data.grandTotal}
            />
          </>
        ) : !isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No se encontraron imágenes
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {searchQuery
                ? "Intenta con otra búsqueda"
                : "Comienza subiendo tu primera imagen"}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowUpload(true)}
                className="text-primary hover:underline text-sm font-medium"
              >
                Subir imagen
              </button>
            )}
          </div>
        ) : null}

        {/* Dialogs */}
        <ImagePreview
          image={previewImage}
          isOpen={!!previewImage}
          onClose={() => setPreviewImage(null)}
          onDelete={(key) => {
            setPreviewImage(null);
            setDeleteKey(key);
          }}
        />

        <UploadDialog
          isOpen={showUpload}
          onClose={() => setShowUpload(false)}
          onUpload={handleUpload}
          categories={categories}
          isUploading={uploadMutation.isPending}
        />

        <RenameDialog
          image={editImage}
          isOpen={!!editImage}
          onClose={() => setEditImage(null)}
          onRename={handleRename}
          isRenaming={renameMutation.isPending}
        />

        <DeleteDialog
          isOpen={!!deleteKey}
          onClose={() => setDeleteKey(null)}
          onConfirm={handleDeleteConfirm}
          count={1}
          isDeleting={deleteImageMutation.isPending}
        />

        <DeleteDialog
          isOpen={showBulkDelete}
          onClose={() => setShowBulkDelete(false)}
          onConfirm={handleBulkDeleteConfirm}
          count={selectedImages.size}
          isDeleting={isBulkDeleting}
        />
      </div>
    </div>
  );
}
