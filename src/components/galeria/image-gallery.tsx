"use client";

import { useState, useCallback } from "react";
import { ImageCard } from "./image-card";
import { ImagePreview } from "./image-preview";
import { UploadDialog } from "./upload-dialog";
import { RenameDialog } from "./rename-dialog";
import { DeleteDialog } from "./delete-dialog";
import { GalleryHeader } from "./gallery-header";
import { Pagination } from "./pagination";
import { ImageListItem } from "./image-list-item";
import { useImages } from "@/hooks/use-images";
import { ImageIcon } from "lucide-react";
import { ImageItem } from "@/lib/types";

export function ImageGallery() {
  const {
    data,
    page,
    setPage,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    addImage,
    updateImage,
    deleteImage,
    deleteMultiple,
  } = useImages();

  const MAX_SELECTION = 10;

  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [previewImage, setPreviewImage] = useState<ImageItem | null>(null);
  const [editImage, setEditImage] = useState<ImageItem | null>(null);
  const [deleteKey, setDeleteKey] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
      deleteImage(deleteKey);
      setSelectedImages((prev) => {
        const newSet = new Set(prev);
        newSet.delete(deleteKey);
        return newSet;
      });
      setDeleteKey(null);
    }
  }, [deleteKey, deleteImage]);

  const handleBulkDeleteConfirm = useCallback(() => {
    deleteMultiple(Array.from(selectedImages));
    setSelectedImages(new Set());
    setShowBulkDelete(false);
  }, [selectedImages, deleteMultiple]);

  const handleRename = useCallback(
    (oldKey: string, newKey: string) => {
      updateImage(oldKey, newKey);
      setSelectedImages((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(oldKey)) {
          newSet.delete(oldKey);
          newSet.add(newKey);
        }
        return newSet;
      });
    },
    [updateImage],
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <GalleryHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCount={selectedImages.size}
          totalImages={data.grandTotal}
          onUpload={() => setShowUpload(true)}
          onDeleteSelected={() => setShowBulkDelete(true)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
        />

        {/* Gallery Grid or List */}
        {data.images.length > 0 ? (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 mt-8">
                {data.images.map((image: ImageItem) => (
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
                {data.images.map((image: ImageItem) => (
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
        ) : (
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
        )}

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
          onUpload={addImage}
        />

        <RenameDialog
          image={editImage}
          isOpen={!!editImage}
          onClose={() => setEditImage(null)}
          onRename={handleRename}
        />

        <DeleteDialog
          isOpen={!!deleteKey}
          onClose={() => setDeleteKey(null)}
          onConfirm={handleDeleteConfirm}
          count={1}
        />

        <DeleteDialog
          isOpen={showBulkDelete}
          onClose={() => setShowBulkDelete(false)}
          onConfirm={handleBulkDeleteConfirm}
          count={selectedImages.size}
        />
      </div>
    </div>
  );
}
