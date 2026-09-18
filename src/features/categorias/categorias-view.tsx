"use client";

import { useEffect, useState } from "react";
import { Button, Card, Chip, toast } from "@heroui/react";
import { Edit2, FolderTree, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { SearchField } from "@/components/shared/search-field";
import { TablePagination } from "@/components/shared/table-pagination";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useQueryCategories } from "@/app/api/queries";
import {
  useMutationCreateCategory,
  useMutationDeleteCategory,
  useMutationUpdatedCategory,
} from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import { useAuthStore } from "@/store/auth.store";
import type { Category } from "@/interfaces/categories";
import { CategoriaFormModal } from "./components/categoria-form-modal";

export function CategoriasView() {
  const canManage = useAuthStore((s) => s.user?.role) !== "viewer";

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selected, setSelected] = useState<Category | null>(null);
  const [toDelete, setToDelete] = useState<Category | null>(null);

  useEffect(() => setPage(1), [debouncedSearch]);

  const { data, isLoading, isPlaceholderData } = useQueryCategories(page, debouncedSearch);
  const createMutation = useMutationCreateCategory();
  const updateMutation = useMutationUpdatedCategory();
  const deleteMutation = useMutationDeleteCategory();

  const categories = data?.categories ?? [];

  const handleSubmit = (name: string) => {
    if (selected) {
      updateMutation.mutate(
        { id: selected.id, name },
        {
          onSuccess: () => {
            toast.success("Categoría actualizada correctamente");
            setIsFormOpen(false);
            setSelected(null);
          },
          onError: (error) =>
            handleAxiosError(error, "Error al actualizar la categoría"),
        },
      );
      return;
    }

    createMutation.mutate(name, {
      onSuccess: () => {
        toast.success("Categoría creada correctamente");
        setIsFormOpen(false);
      },
      onError: (error) => handleAxiosError(error, "Error al crear la categoría"),
    });
  };

  const handleConfirmDelete = () => {
    if (!toDelete) return;
    deleteMutation.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success("Categoría eliminada correctamente");
        setToDelete(null);
      },
      onError: (error) => handleAxiosError(error, "Error al eliminar la categoría"),
    });
  };

  const columns: DataTableColumn<Category>[] = [
    {
      key: "name",
      label: "Nombre de la categoría",
      isRowHeader: true,
      render: (category) => <span className="font-medium">{category.name}</span>,
    },
    {
      key: "products",
      label: "Productos",
      render: (category) => {
        const count = category.productCount ?? 0;
        return (
          <Chip size="sm" variant="soft" color={count > 0 ? "accent" : "default"}>
            {count} {count === 1 ? "producto" : "productos"}
          </Chip>
        );
      },
    },
    {
      key: "actions",
      label: "Acciones",
      align: "end",
      render: (category) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label={`Editar ${category.name}`}
            isDisabled={!canManage}
            onPress={() => {
              setSelected(category);
              setIsFormOpen(true);
            }}
          >
            <Edit2 className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label={`Eliminar ${category.name}`}
            className="text-danger"
            isDisabled={!canManage}
            onPress={() => setToDelete(category)}
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
        icon={FolderTree}
        title="Categorías"
        description="Gestiona las categorías de tus productos"
        actions={
          <Button
            variant="primary"
            isDisabled={!canManage}
            onPress={() => {
              setSelected(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            Crear categoría
          </Button>
        }
      />

      <Card>
        <Card.Content className="p-4">
          <SearchField
            aria-label="Buscar categorías"
            placeholder="Buscar por nombre..."
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
          aria-label="Categorías"
          items={categories}
          columns={columns}
          getRowId={(category) => category.id}
          isLoading={isLoading}
          loadingMessage="Cargando categorías..."
          emptyMessage="No se encontraron categorías"
        />
        <TablePagination
          currentPage={page}
          totalPages={data?.totalPages ?? 1}
          totalItems={data?.total ?? 0}
          itemsInPage={categories.length}
          itemLabel="categorías"
          onPageChange={setPage}
        />
      </Card>

      <CategoriaFormModal
        category={selected}
        isOpen={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setSelected(null);
        }}
        onSubmit={handleSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        isOpen={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar categoría"
        description={
          <>
            ¿Seguro que deseas eliminar la categoría{" "}
            <span className="font-semibold text-foreground">
              &quot;{toDelete?.name}&quot;
            </span>
            ? Esta acción no se puede deshacer.
            {(toDelete?.productCount ?? 0) > 0 && (
              <span className="mt-2 block text-warning">
                Tiene {toDelete?.productCount}{" "}
                {toDelete?.productCount === 1 ? "producto asignado" : "productos asignados"}: no
                se podrá eliminar hasta que los cambies de categoría.
              </span>
            )}
          </>
        }
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
