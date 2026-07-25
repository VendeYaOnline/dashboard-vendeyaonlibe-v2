"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GalleryHorizontal,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { CarouselTable } from "./carousel/carousel-table";
import { CarouselModal } from "./carousel/carousel-modal";
import { DeleteCarouselModal } from "./carousel/delete-carousel-modal";
import { useQueryCarousels } from "@/app/api/queries";
import {
  useMutationCarousel,
  useMutationDeleteCarousel,
  useMutationUpdatedCarousel,
} from "@/app/api/mutations";
import { Carousel, CarouselPayload, MAX_CAROUSELS } from "@/interfaces/carousel";
import { toast } from "sonner";
import { handleAxiosError } from "@/lib/error-handler";
import { useAuthStore } from "@/store/auth.store";

export function Carrusel() {
  const { user: authUser } = useAuthStore();
  const canManage = authUser?.role !== "viewer";

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCarousel, setSelectedCarousel] = useState<Carousel | null>(
    null,
  );
  const [carouselToDelete, setCarouselToDelete] = useState<Carousel | null>(
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
    data: carouselData,
    isLoading,
    isFetching,
  } = useQueryCarousels(currentPage, debouncedSearch);

  const createMutation = useMutationCarousel();
  const updateMutation = useMutationUpdatedCarousel();
  const deleteMutation = useMutationDeleteCarousel();

  const handleCreateClick = () => {
    setSelectedCarousel(null);
    setIsFormModalOpen(true);
  };

  const handleEditClick = (carousel: Carousel) => {
    setSelectedCarousel(carousel);
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (carousel: Carousel) => {
    setCarouselToDelete(carousel);
    setIsDeleteModalOpen(true);
  };

  const handleSubmitCarousel = (payload: CarouselPayload) => {
    if (selectedCarousel) {
      updateMutation.mutate(
        { ...payload, id: selectedCarousel.id },
        {
          onSuccess: () => {
            toast.success("Carrusel actualizado correctamente");
            setIsFormModalOpen(false);
            setSelectedCarousel(null);
          },
          onError: (error) => {
            handleAxiosError(error, "Error al actualizar el carrusel");
          },
        },
      );
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Carrusel creado correctamente");
        setIsFormModalOpen(false);
      },
      onError: (error) => {
        handleAxiosError(error, "Error al crear el carrusel");
      },
    });
  };

  const handleConfirmDelete = () => {
    if (carouselToDelete?.id) {
      deleteMutation.mutate(carouselToDelete.id, {
        onSuccess: () => {
          toast.success("Carrusel eliminado correctamente");
          setIsDeleteModalOpen(false);
          setCarouselToDelete(null);
        },
        onError: (error) => {
          handleAxiosError(error, "Error al eliminar el carrusel");
        },
      });
    }
  };

  const carousels = carouselData?.carousels || [];
  const totalPages = carouselData?.totalPages || 1;
  const totalItems = carouselData?.total || 0;
  const grandTotal = carouselData?.grandTotal || 0;
  const limitReached = grandTotal >= MAX_CAROUSELS;
  const startIndex = (currentPage - 1) * 10;
  const endIndex = Math.min(startIndex + carousels.length, totalItems);

  return (
    <div className="min-h-screen p-4 lg:p-8 pt-20 lg:pt-8">
      <div className="w-full mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <GalleryHorizontal className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Carrusel
              </h1>
              <p className="text-muted-foreground mt-1">
                Gestiona los carruseles de promociones de tu tienda (
                {grandTotal}/{MAX_CAROUSELS})
              </p>
            </div>
          </div>
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 w-full sm:w-auto"
            onClick={handleCreateClick}
            disabled={limitReached || !canManage}
          >
            <Plus className="h-4 w-4" />
            {limitReached ? "Límite alcanzado" : "Crear Carrusel"}
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Buscar</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre de carrusel..."
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
          <CarouselTable
            carousels={carousels}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            canManage={canManage}
            isLoading={isLoading || isFetching}
          />

          {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t px-4 py-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} a {endIndex} de {totalItems}{" "}
                carruseles
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

        <CarouselModal
          carousel={selectedCarousel}
          open={isFormModalOpen}
          onOpenChange={(open) => {
            setIsFormModalOpen(open);
            if (!open) setSelectedCarousel(null);
          }}
          onSubmit={handleSubmitCarousel}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />

        <DeleteCarouselModal
          carouselName={carouselToDelete?.name || null}
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          onConfirm={handleConfirmDelete}
          isLoading={deleteMutation.isPending}
        />
      </div>
    </div>
  );
}
