"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { FeaturedProductsTable } from "./featured-products/featured-products-table";
import { CreateFeaturedProductModal } from "./featured-products/create-featured-product-modal";
import { DeleteFeaturedProductModal } from "./featured-products/delete-featured-product-modal";
import { useQueryFeaturedProducts } from "@/app/api/queries";
import {
  useMutationFeaturedProduct,
  useMutationDeleteFeaturedProduct,
} from "@/app/api/mutations";
import {
  FeaturedProduct,
  MAX_FEATURED_PRODUCTS,
} from "@/interfaces/featured-products";
import { toast } from "sonner";
import { handleAxiosError } from "@/lib/error-handler";
import { useAuthStore } from "@/store/auth.store";

export function ProductosStart() {
  const { user: authUser } = useAuthStore();
  const canManage = authUser?.role !== "viewer";

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<FeaturedProduct | null>(
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
    data: featuredData,
    isLoading,
    isFetching,
  } = useQueryFeaturedProducts(currentPage, debouncedSearch);

  const createMutation = useMutationFeaturedProduct();
  const deleteMutation = useMutationDeleteFeaturedProduct();

  const handleDeleteClick = (featuredProduct: FeaturedProduct) => {
    setProductToDelete(featuredProduct);
    setIsDeleteModalOpen(true);
  };

  const handleCreateFeaturedProduct = (productId: string) => {
    createMutation.mutate(productId, {
      onSuccess: () => {
        toast.success("Producto destacado creado correctamente");
        setIsCreateModalOpen(false);
      },
      onError: (error) => {
        handleAxiosError(error, "Error al destacar el producto");
      },
    });
  };

  const handleConfirmDelete = () => {
    if (productToDelete?.id) {
      deleteMutation.mutate(productToDelete.id, {
        onSuccess: () => {
          toast.success("Producto destacado eliminado correctamente");
          setIsDeleteModalOpen(false);
          setProductToDelete(null);
        },
        onError: (error) => {
          handleAxiosError(error, "Error al eliminar el producto destacado");
        },
      });
    }
  };

  const featuredProducts = featuredData?.products || [];
  const totalPages = featuredData?.totalPages || 1;
  const totalItems = featuredData?.total || 0;
  const grandTotal = featuredData?.grandTotal || 0;
  const limitReached = grandTotal >= MAX_FEATURED_PRODUCTS;
  const startIndex = (currentPage - 1) * 10;
  const endIndex = Math.min(startIndex + featuredProducts.length, totalItems);

  return (
    <div className="min-h-screen p-4 lg:p-8 pt-20 lg:pt-8">
      <div className="w-full mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Star className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Productos Star
              </h1>
              <p className="text-muted-foreground mt-1">
                Gestiona los productos destacados de tu tienda ({grandTotal}/
                {MAX_FEATURED_PRODUCTS})
              </p>
            </div>
          </div>
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 w-full sm:w-auto"
            onClick={() => setIsCreateModalOpen(true)}
            disabled={limitReached || !canManage}
          >
            <Plus className="h-4 w-4" />
            {limitReached ? "Límite alcanzado" : "Destacar Producto"}
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Buscar</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título del producto..."
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
          <FeaturedProductsTable
            featuredProducts={featuredProducts}
            onDelete={handleDeleteClick}
            canManage={canManage}
            isLoading={isLoading || isFetching}
          />

          {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t px-4 py-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} a {endIndex} de {totalItems}{" "}
                productos destacados
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

        <CreateFeaturedProductModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onCreateFeaturedProduct={handleCreateFeaturedProduct}
          isLoading={createMutation.isPending}
        />

        <DeleteFeaturedProductModal
          productTitle={productToDelete?.product.title || null}
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          onConfirm={handleConfirmDelete}
          isLoading={deleteMutation.isPending}
        />
      </div>
    </div>
  );
}
