"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Settings2,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AttributesTable } from "./attributes/attributes-table";
import { CreateAttributeModal } from "./attributes/create-attribute-modal";
import { AttributeDetailsModal } from "./attributes/attribute-details-modal";
import { DeleteAttributeModal } from "./attributes/delete-attribute-modal";
import { useQueryAttribute } from "@/app/api/queries";
import {
  useMutationAttribute,
  useMutationDeleteAttribute,
  useMutationUpdatedAttribute,
} from "@/app/api/mutations";
import { Attribute } from "@/interfaces/attributes";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { UpdateAttributeModal } from "./attributes/update-attribute-modal";

export function Atributos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(
    null,
  );
  const [attributeToDelete, setAttributeToDelete] = useState<Attribute | null>(
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
    data: attrData,
    isLoading,
    isFetching,
  } = useQueryAttribute(currentPage, debouncedSearch);

  const createMutation = useMutationAttribute();
  const deleteMutation = useMutationDeleteAttribute();
  const updateMutation = useMutationUpdatedAttribute();

  const handleViewDetails = (attribute: Attribute) => {
    setSelectedAttribute(attribute);
    setIsDetailsModalOpen(true);
  };

  const handleEditClick = (attribute: Attribute) => {
    setSelectedAttribute(attribute);
    setIsUpdateModalOpen(true);
  };

  const handleDeleteClick = (attribute: Attribute) => {
    setAttributeToDelete(attribute);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (attributeToDelete?.id) {
      deleteMutation.mutate(attributeToDelete.id, {
        onSuccess: () => {
          toast.success("Atributo eliminado correctamente");
          setIsDeleteModalOpen(false);
          setAttributeToDelete(null);
        },
        onError: () => {
          toast.error("Error al eliminar el atributo");
        },
      });
    }
  };

  const handleCreateAttribute = async (newAttribute: Omit<Attribute, "id">) => {
    createMutation.mutate(newAttribute as Attribute, {
      onSuccess: () => {
        toast.success("Atributo creado correctamente");
        setIsCreateModalOpen(false);
      },
      onError: () => {
        toast.error("Error al crear el atributo");
      },
    });
  };

  const handleUpdateAttribute = async (updatedAttr: Attribute) => {
    updateMutation.mutate(updatedAttr, {
      onSuccess: () => {
        toast.success("Atributo actualizado correctamente");
        setIsUpdateModalOpen(false);
        setSelectedAttribute(null);
      },
      onError: () => {
        toast.error("Error al actualizar el atributo");
      },
    });
  };

  const attributes = attrData?.attributes || [];
  const totalPages = attrData?.totalPages || 1;
  const totalItems = attrData?.total || 0;
  const startIndex = (currentPage - 1) * 5; // Assuming fixed size handled by backend
  const endIndex = startIndex + attributes.length;

  return (
    <div className="min-h-screen p-4 lg:p-8 pt-20 lg:pt-8">
      <div className="w-full mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Settings2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Atributos
              </h1>
              <p className="text-muted-foreground mt-1">
                Gestiona los atributos de tus productos
              </p>
            </div>
          </div>
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 w-full sm:w-auto"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Crear Atributo
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Buscar</CardTitle>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre de atributo..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          </CardHeader>
        </Card>

        <div className="overflow-x-auto bg-white rounded-md border">
          <AttributesTable
            attributes={attributes}
            onViewDetails={handleViewDetails}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            isLoading={isLoading || isFetching}
          />

          {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t px-4 py-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} a {endIndex} de {totalItems}{" "}
                atributos
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

        <CreateAttributeModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onCreateAttribute={handleCreateAttribute}
          isLoading={createMutation.isPending}
        />

        <UpdateAttributeModal
          attribute={selectedAttribute}
          open={isUpdateModalOpen}
          onOpenChange={setIsUpdateModalOpen}
          onUpdateAttribute={handleUpdateAttribute}
          isLoading={updateMutation.isPending}
        />

        <AttributeDetailsModal
          attribute={selectedAttribute}
          open={isDetailsModalOpen}
          onOpenChange={setIsDetailsModalOpen}
        />

        <DeleteAttributeModal
          attributeName={attributeToDelete?.attribute_name || null}
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          onConfirm={handleConfirmDelete}
          isLoading={deleteMutation.isPending}
        />
      </div>
    </div>
  );
}
