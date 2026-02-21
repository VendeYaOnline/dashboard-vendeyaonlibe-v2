"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FolderTree,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { CategoriesTable } from "./categories/categories-table";
import { CreateCategoryModal } from "./categories/create-category-modal";
import { UpdateCategoryModal } from "./categories/update-category-modal";
import { DeleteCategoryModal } from "./categories/delete-category-modal";
import { useQueryCategories } from "@/app/api/queries";
import {
  useMutationCreateCategory,
  useMutationDeleteCategory,
  useMutationUpdatedCategory,
} from "@/app/api/mutations";
import { Category } from "@/interfaces/categories";
import { toast } from "sonner";

export function Categorias() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  );

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 1000);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const {
    data: catData,
    isLoading,
    isFetching,
  } = useQueryCategories(currentPage, debouncedSearch);

  const createMutation = useMutationCreateCategory();
  const deleteMutation = useMutationDeleteCategory();
  const updateMutation = useMutationUpdatedCategory();

  const handleEditClick = (category: Category) => {
    setSelectedCategory(category);
    setIsUpdateModalOpen(true);
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (categoryToDelete?.id) {
      deleteMutation.mutate(categoryToDelete.id, {
        onSuccess: () => {
          toast.success("Categoría eliminada correctamente");
          setIsDeleteModalOpen(false);
          setCategoryToDelete(null);
        },
        onError: () => {
          toast.error("Error al eliminar la categoría");
        },
      });
    }
  };

  const handleCreateCategory = async (name: string) => {
    createMutation.mutate(name, {
      onSuccess: () => {
        toast.success("Categoría creada correctamente");
        setIsCreateModalOpen(false);
      },
      onError: () => {
        toast.error("Error al crear la categoría");
      },
    });
  };

  const handleUpdateCategory = async (updatedCat: Category) => {
    updateMutation.mutate(updatedCat, {
      onSuccess: () => {
        toast.success("Categoría actualizada correctamente");
        setIsUpdateModalOpen(false);
        setSelectedCategory(null);
      },
      onError: () => {
        toast.error("Error al actualizar la categoría");
      },
    });
  };

  const categories = catData?.categories || [];
  const totalPages = catData?.totalPages || 1;
  const totalItems = catData?.total || 0;
  const startIndex = (currentPage - 1) * 5; // Assuming fixed size handled by backend
  const endIndex = Math.min(startIndex + categories.length, totalItems);

  return (
    <div className="min-h-screen p-4 lg:p-8 pt-20 lg:pt-8">
      <div className="w-full mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <FolderTree className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Categorías
              </h1>
              <p className="text-muted-foreground mt-1">
                Gestiona las categorías de tus productos
              </p>
            </div>
          </div>
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 w-full sm:w-auto"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Crear Categoría
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Buscar</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre de categoría..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 w-[300px]"
              />
            </div>
          </CardHeader>
        </Card>

        <div className="overflow-x-auto bg-white rounded-md border">
          <CategoriesTable
            categories={categories}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            isLoading={isLoading || isFetching}
          />

          {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t px-4 py-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} a {endIndex} de {totalItems}{" "}
                categorías
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Anterior</span>
                </Button>
                <div className="text-sm font-medium">
                  Página {currentPage} de {totalPages || 1}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <CreateCategoryModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onCreateCategory={handleCreateCategory}
          isLoading={createMutation.isPending}
        />

        <UpdateCategoryModal
          category={selectedCategory}
          open={isUpdateModalOpen}
          onOpenChange={setIsUpdateModalOpen}
          onUpdateCategory={handleUpdateCategory}
          isLoading={updateMutation.isPending}
        />

        <DeleteCategoryModal
          categoryName={categoryToDelete?.name || null}
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          onConfirm={handleConfirmDelete}
          isLoading={deleteMutation.isPending}
        />
      </div>
    </div>
  );
}
