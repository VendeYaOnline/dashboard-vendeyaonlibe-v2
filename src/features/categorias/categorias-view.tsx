"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button, Card, Chip, toast } from "@heroui/react";
import { ArrowUpDown, Edit2, FolderTree, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { SearchField } from "@/components/shared/search-field";
import { TablePagination } from "@/components/shared/table-pagination";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useQueryAllCategories, useQueryCategories } from "@/app/api/queries";
import {
  useMutationCreateCategory,
  useMutationDeleteCategory,
  useMutationReorderCategories,
  useMutationUpdatedCategory,
} from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import { useAuthStore } from "@/store/auth.store";
import type { Category } from "@/interfaces/categories";
import { CategoriaFormModal, type CategoriaFormValues } from "./components/categoria-form-modal";
import { OrdenarCategoriasModal } from "./components/ordenar-categorias-modal";

export function CategoriasView() {
  const canManage = useAuthStore((s) => s.user?.role) !== "viewer";

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [selected, setSelected] = useState<Category | null>(null);
  const [toDelete, setToDelete] = useState<Category | null>(null);

  useEffect(() => setPage(1), [debouncedSearch]);

  const { data, isLoading, isPlaceholderData } = useQueryCategories(page, debouncedSearch);
  // Lista completa (hasta 100) para el modal de orden: la tabla está paginada.
  const { data: allData, isLoading: isLoadingAll } = useQueryAllCategories(isOrderOpen);
  const createMutation = useMutationCreateCategory();
  const updateMutation = useMutationUpdatedCategory();
  const deleteMutation = useMutationDeleteCategory();
  const reorderMutation = useMutationReorderCategories();

  const handleReorder = (ids: string[]) => {
    reorderMutation.mutate(ids, {
      onSuccess: () => {
        toast.success("Orden de las categorías actualizado");
        setIsOrderOpen(false);
      },
      onError: (error) => handleAxiosError(error, "No se pudo guardar el orden"),
    });
  };

  const categories = data?.categories ?? [];

  const handleSubmit = ({ name, image }: CategoriaFormValues) => {
    if (selected) {
      updateMutation.mutate(
        { id: selected.id, name, image },
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

    createMutation.mutate({ name, image }, {
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
      key: "position",
      label: "#",
      className: "w-12",
      render: (category) => (
        <span className="text-sm tabular-nums text-muted">
          {category.position != null ? category.position + 1 : "—"}
        </span>
      ),
    },
    {
      key: "name",
      label: "Nombre de la categoría",
      isRowHeader: true,
      render: (category) => (
        <span className="flex items-center gap-3">
          {category.image ? (
            <Image
              src={category.image}
              alt=""
              width={36}
              height={36}
              sizes="36px"
              className="size-9 shrink-0 rounded-md border border-border object-cover"
            />
          ) : (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-secondary">
              <FolderTree className="size-4 text-muted" />
            </span>
          )}
          <span className="font-medium">{category.name}</span>
        </span>
      ),
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
        description="Gestiona las categorías de tus productos, en el orden en que se muestran"
        actions={
          <>
            <Button
              variant="outline"
              isDisabled={!canManage || (data?.grandTotal ?? 0) < 2}
              onPress={() => setIsOrderOpen(true)}
            >
              <ArrowUpDown className="size-4" />
              Ordenar
            </Button>
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
          </>
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

      <OrdenarCategoriasModal
        categories={allData?.categories ?? []}
        isLoading={isLoadingAll}
        isOpen={isOrderOpen}
        onOpenChange={setIsOrderOpen}
        onSave={handleReorder}
        isPending={reorderMutation.isPending}
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
