"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Package,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ProductsTable } from "./products/products-table";
import { CreateProductModal } from "./products/create-product-modal";
import { UpdateProductModal } from "./products/update-product-modal";
import { DeleteProductModal } from "./products/delete-product-modal";
import { useQueryProducts } from "@/app/api/queries";
import {
  useMutationProduct,
  useMutationDeleteProduct,
  useMutationUpdatedProduct,
} from "@/app/api/mutations";
import { Products } from "@/interfaces/products";
import { toast } from "sonner";
import { handleAxiosError } from "@/lib/error-handler";

export function Productos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Products | null>(null);
  const [productToDelete, setProductToDelete] = useState<Products | null>(null);

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
    data: prodData,
    isLoading,
    isFetching,
  } = useQueryProducts(currentPage, debouncedSearch);

  const createMutation = useMutationProduct();
  const deleteMutation = useMutationDeleteProduct();
  const updateMutation = useMutationUpdatedProduct();

  const handleEditClick = (product: Products) => {
    setSelectedProduct(product);
    setIsUpdateModalOpen(true);
  };

  const handleDeleteClick = (product: Products) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (productToDelete?.id) {
      deleteMutation.mutate(productToDelete.id, {
        onSuccess: () => {
          toast.success("Producto eliminado correctamente");
          setIsDeleteModalOpen(false);
          setProductToDelete(null);
        },
        onError: (error) => {
          handleAxiosError(error, "Error al eliminar el producto");
        },
      });
    }
  };

  const handleCreateProduct = async (formData: FormData) => {
    createMutation.mutate(formData, {
      onSuccess: () => {
        toast.success("Producto creado correctamente");
        setIsCreateModalOpen(false);
      },
      onError: (error) => {
        handleAxiosError(error, "Error al crear el producto");
      },
    });
  };

  const handleUpdateProduct = async (id: number, formData: FormData) => {
    updateMutation.mutate(
      { id, data: formData },
      {
        onSuccess: () => {
          toast.success("Producto actualizado correctamente");
          setIsUpdateModalOpen(false);
          setSelectedProduct(null);
        },
        onError: (error) => {
          handleAxiosError(error, "Error al actualizar el producto");
        },
      }
    );
  };

  const products = prodData?.products || [];
  const totalPages = prodData?.totalPages || 1;
  const totalItems = prodData?.total || 0;
  const startIndex = (currentPage - 1) * 5; // Assumes fixed size handled by backend
  const endIndex = Math.min(startIndex + products.length, totalItems);

  return (
    <div className="min-h-screen p-4 lg:p-8 pt-20 lg:pt-8">
      <div className="w-full mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Productos
              </h1>
              <p className="text-muted-foreground mt-1">
                Gestiona los productos de tu tienda
              </p>
            </div>
          </div>
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 w-full sm:w-auto"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Crear Producto
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Buscar</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre de producto..."
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
          <ProductsTable
            products={products}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            isLoading={isLoading || isFetching}
          />

          {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t px-4 py-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} a {endIndex} de {totalItems}{" "}
                productos
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

        <CreateProductModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onCreateProduct={handleCreateProduct}
          isLoading={createMutation.isPending}
        />

        <UpdateProductModal
          product={selectedProduct}
          open={isUpdateModalOpen}
          onOpenChange={setIsUpdateModalOpen}
          onUpdateProduct={handleUpdateProduct}
          isLoading={updateMutation.isPending}
        />

        <DeleteProductModal
          productTitle={productToDelete?.title || null}
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          onConfirm={handleConfirmDelete}
          isLoading={deleteMutation.isPending}
        />
      </div>
    </div>
  );
}
