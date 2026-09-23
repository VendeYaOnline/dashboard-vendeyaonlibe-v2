"use client";

import { useEffect, useState } from "react";
import { Button, Card, Chip, toast } from "@heroui/react";
import { Edit2, Plus, Settings2, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { SearchField } from "@/components/shared/search-field";
import { TablePagination } from "@/components/shared/table-pagination";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useQueryAttribute } from "@/app/api/queries";
import {
  useMutationAttribute,
  useMutationDeleteAttribute,
  useMutationUpdatedAttribute,
} from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import { useAuthStore } from "@/store/auth.store";
import type { Attribute } from "@/interfaces/attributes";
import { AtributoFormModal } from "./components/atributo-form-modal";
import { isColorValue, toColorValue } from "./constants";

export function AtributosView() {
  const canManage = useAuthStore((s) => s.user?.role) !== "viewer";

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selected, setSelected] = useState<Attribute | null>(null);
  const [toDelete, setToDelete] = useState<Attribute | null>(null);

  useEffect(() => setPage(1), [debouncedSearch]);

  const { data, isLoading, isPlaceholderData } = useQueryAttribute(page, debouncedSearch);
  const createMutation = useMutationAttribute();
  const updateMutation = useMutationUpdatedAttribute();
  const deleteMutation = useMutationDeleteAttribute();

  const attributes = data?.attributes ?? [];

  const handleSubmit = (values: Omit<Attribute, "id">) => {
    if (selected?.id) {
      updateMutation.mutate(
        { ...values, id: selected.id },
        {
          onSuccess: (response) => {
            const updatedProducts = response.data?.updatedProducts ?? 0;
            toast.success(
              updatedProducts > 0
                ? `Atributo actualizado y aplicado a ${updatedProducts} ${
                    updatedProducts === 1 ? "producto" : "productos"
                  }`
                : "Atributo actualizado correctamente",
            );
            setIsFormOpen(false);
            setSelected(null);
          },
          onError: (error) => handleAxiosError(error, "Error al actualizar el atributo"),
        },
      );
      return;
    }

    createMutation.mutate(values, {
      onSuccess: () => {
        toast.success("Atributo creado correctamente");
        setIsFormOpen(false);
      },
      onError: (error) => handleAxiosError(error, "Error al crear el atributo"),
    });
  };

  const handleConfirmDelete = () => {
    if (!toDelete?.id) return;
    deleteMutation.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success("Atributo eliminado correctamente");
        setToDelete(null);
      },
      onError: (error) => handleAxiosError(error, "Error al eliminar el atributo"),
    });
  };

  const columns: DataTableColumn<Attribute>[] = [
    {
      key: "attribute_name",
      label: "Nombre",
      isRowHeader: true,
      render: (attribute) => (
        <span className="font-medium">{attribute.attribute_name}</span>
      ),
    },
    {
      key: "attribute_type",
      label: "Tipo",
      render: (attribute) => (
        <Chip size="sm" variant="soft">
          {attribute.attribute_type}
        </Chip>
      ),
    },
    {
      key: "values",
      label: "Valores",
      render: (attribute) => {
        const values = attribute.value ?? [];
        if (values.length === 0)
          return <span className="text-muted">Sin valores</span>;

        return (
          <div className="flex flex-wrap items-center gap-1.5">
            {values.slice(0, 6).map((value, index) =>
              isColorValue(value) ? (
                <span
                  key={`${value.name}-${index}`}
                  title={value.name}
                  style={{ backgroundColor: toColorValue(value).value }}
                  className="size-5 rounded-full border border-border"
                />
              ) : (
                <Chip key={`${String(value)}-${index}`} size="sm" variant="soft">
                  {String(value)}
                </Chip>
              ),
            )}
            {values.length > 6 && (
              <span className="text-xs text-muted">+{values.length - 6}</span>
            )}
          </div>
        );
      },
    },
    {
      key: "products",
      label: "Productos",
      render: (attribute) => {
        const count = attribute.productCount ?? 0;
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
      render: (attribute) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label={`Editar ${attribute.attribute_name}`}
            isDisabled={!canManage}
            onPress={() => {
              setSelected(attribute);
              setIsFormOpen(true);
            }}
          >
            <Edit2 className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label={`Eliminar ${attribute.attribute_name}`}
            className="text-danger"
            isDisabled={!canManage}
            onPress={() => setToDelete(attribute)}
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
        icon={Settings2}
        title="Atributos"
        description="Define los atributos que podrás asignar a tus productos"
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
            Crear atributo
          </Button>
        }
      />

      <Card>
        <Card.Content className="p-4">
          <SearchField
            aria-label="Buscar atributos"
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
          aria-label="Atributos"
          items={attributes}
          columns={columns}
          getRowId={(attribute) => attribute.id ?? attribute.attribute_name}
          isLoading={isLoading}
          loadingMessage="Cargando atributos..."
          emptyMessage="No se encontraron atributos"
        />
        <TablePagination
          currentPage={page}
          totalPages={data?.totalPages ?? 1}
          totalItems={data?.total ?? 0}
          itemsInPage={attributes.length}
          itemLabel="atributos"
          onPageChange={setPage}
        />
      </Card>

      {isFormOpen && (
        <AtributoFormModal
          attribute={selected}
          isOpen={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setSelected(null);
          }}
          onSubmit={handleSubmit}
          isPending={createMutation.isPending || updateMutation.isPending}
        />
      )}

      <ConfirmDialog
        isOpen={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar atributo"
        description={
          <>
            ¿Seguro que deseas eliminar el atributo{" "}
            <span className="font-semibold text-foreground">
              &quot;{toDelete?.attribute_name}&quot;
            </span>
            ? Esta acción no se puede deshacer.
            {(toDelete?.productCount ?? 0) > 0 && (
              <span className="mt-2 block text-warning">
                Lo usan {toDelete?.productCount}{" "}
                {toDelete?.productCount === 1 ? "producto" : "productos"}: no se podrá eliminar
                hasta que lo quites de ellos.
              </span>
            )}
          </>
        }
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
