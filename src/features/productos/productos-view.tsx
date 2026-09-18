"use client";

import { useEffect, useState } from "react";
import { Button, Card, Chip, toast } from "@heroui/react";
import { Boxes, Edit2, Package, Plus, Star, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { SearchField } from "@/components/shared/search-field";
import { TablePagination } from "@/components/shared/table-pagination";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useQueryProducts } from "@/app/api/queries";
import {
  useMutationDeleteProduct,
  useMutationProduct,
  useMutationUpdatedProduct,
} from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import { useAuthStore } from "@/store/auth.store";
import type { Products } from "@/interfaces/products";
import { ProductoFormModal } from "./components/producto-form-modal";
import { StockQuickModal } from "./components/stock-quick-modal";
import { formatCOP } from "./utils";

/** Color del número de unidades: verde > 10, naranja 5–10, rojo 0–4. */
const stockTone = (quantity: number) =>
  quantity > 10 ? "text-success" : quantity >= 5 ? "text-warning" : "text-danger";

export function ProductosView() {
  const canManage = useAuthStore((s) => s.user?.role) !== "viewer";

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selected, setSelected] = useState<Products | null>(null);
  const [toDelete, setToDelete] = useState<Products | null>(null);
  const [stockTarget, setStockTarget] = useState<Products | null>(null);

  useEffect(() => setPage(1), [debouncedSearch]);

  const { data, isLoading, isPlaceholderData } = useQueryProducts(page, debouncedSearch);
  const createMutation = useMutationProduct();
  const updateMutation = useMutationUpdatedProduct();
  const deleteMutation = useMutationDeleteProduct();

  const products = data?.products ?? [];

  const handleSubmit = (id: string | null, formData: FormData) => {
    if (id) {
      updateMutation.mutate(
        { id, data: formData },
        {
          onSuccess: () => {
            toast.success("Producto actualizado correctamente");
            setIsFormOpen(false);
            setSelected(null);
          },
          onError: (error) => handleAxiosError(error, "Error al actualizar el producto"),
        },
      );
      return;
    }

    createMutation.mutate(formData, {
      onSuccess: () => {
        toast.success("Producto creado correctamente");
        setIsFormOpen(false);
      },
      onError: (error) => handleAxiosError(error, "Error al crear el producto"),
    });
  };

  const handleConfirmDelete = () => {
    if (!toDelete) return;
    deleteMutation.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success("Producto eliminado correctamente");
        setToDelete(null);
      },
      onError: (error) => handleAxiosError(error, "Error al eliminar el producto"),
    });
  };

  const columns: DataTableColumn<Products>[] = [
    {
      key: "image",
      label: "Imagen",
      render: (product) =>
        product.image_product ? (
          <img
            src={product.image_product}
            alt={product.title}
            className="size-12 rounded-md object-cover"
          />
        ) : (
          <div className="flex size-12 items-center justify-center rounded-md bg-surface-secondary text-xs text-muted">
            Sin img
          </div>
        ),
    },
    {
      key: "title",
      label: "Título",
      isRowHeader: true,
      render: (product) => (
        <span className="inline-flex items-center gap-2">
          <span className="font-medium">{product.title}</span>
          {product.featuredProduct && (
            <Chip size="sm" variant="soft" color="warning" title="Producto destacado">
              <Star className="mr-1 size-3 fill-current" />
              Star
            </Chip>
          )}
          {(product.bundle_size ?? 0) > 1 && (
            <Chip size="sm" variant="soft" color="accent" title="Se vende como set">
              Set x{product.bundle_size}
            </Chip>
          )}
        </span>
      ),
    },
    {
      key: "stock",
      label: "Stock",
      render: (product) => {
        const variants = product.variants ?? [];
        const soldOut = variants.filter((variant) => variant.quantity === 0).length;
        return (
          <div className="flex flex-col">
            <span className={product.quantity != null ? `font-semibold ${stockTone(product.quantity)}` : ""}>
              {product.quantity ?? (
                <span className="text-muted">{product.stock ? "Disponible" : "Agotado"}</span>
              )}
            </span>
            {variants.length > 0 && (
              <span className={`text-xs ${soldOut > 0 ? "text-warning" : "text-muted"}`}>
                {variants.length} variantes
                {soldOut > 0 ? ` · ${soldOut} agotada${soldOut === 1 ? "" : "s"}` : ""}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "price",
      label: "Precio",
      render: (product) => <span>{formatCOP(product.price) || product.price}</span>,
    },
    {
      key: "discount_price",
      label: "Precio descuento",
      render: (product) => (
        // Sin descuento, discount_price es igual al precio: se muestra solo la raya.
        <span className={product.discount ? "" : "text-muted"}>
          {product.discount ? formatCOP(product.discount_price) || product.discount_price : "-"}
        </span>
      ),
    },
    {
      key: "discount",
      label: "Descuento",
      render: (product) => (
        <Chip size="sm" variant="soft" color={product.discount ? "accent" : "default"}>
          {product.discount ? `${product.discount}%` : "-"}
        </Chip>
      ),
    },
    {
      key: "images",
      label: "Imágenes",
      render: (product) => <span>{product.images?.length ?? 0}</span>,
    },
    {
      key: "actions",
      label: "Acciones",
      align: "end",
      render: (product) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label={`Inventario de ${product.title}`}
            isDisabled={!canManage}
            onPress={() => setStockTarget(product)}
          >
            <Boxes className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label={`Editar ${product.title}`}
            isDisabled={!canManage}
            onPress={() => {
              setSelected(product);
              setIsFormOpen(true);
            }}
          >
            <Edit2 className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label={`Eliminar ${product.title}`}
            className="text-danger"
            isDisabled={!canManage}
            onPress={() => setToDelete(product)}
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
        icon={Package}
        title="Productos"
        description="Gestiona los productos de tu tienda"
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
            Crear producto
          </Button>
        }
      />

      <Card>
        <Card.Content className="p-4">
          <SearchField
            aria-label="Buscar productos"
            placeholder="Buscar por nombre de producto..."
            value={search}
            onChange={setSearch}
          />
        </Card.Content>
      </Card>

      {/* Al cambiar de página o filtro, la página anterior sigue visible (atenuada) hasta que llega la nueva. */}
      <Card
        className={`overflow-hidden transition-opacity ${isPlaceholderData ? "opacity-60" : ""}`}
        aria-busy={isPlaceholderData}
      >
        <DataTable
          aria-label="Productos"
          items={products}
          columns={columns}
          getRowId={(product) => product.id}
          isLoading={isLoading}
          loadingMessage="Cargando productos..."
          emptyMessage="No se encontraron productos"
        />
        <TablePagination
          currentPage={page}
          totalPages={data?.totalPages ?? 1}
          totalItems={data?.total ?? 0}
          itemsInPage={products.length}
          itemLabel="productos"
          onPageChange={setPage}
        />
      </Card>

      <ProductoFormModal
        product={selected}
        isOpen={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setSelected(null);
        }}
        onSubmit={handleSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      <StockQuickModal
        product={stockTarget}
        isOpen={stockTarget !== null}
        onOpenChange={(open) => !open && setStockTarget(null)}
      />

      <ConfirmDialog
        isOpen={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar producto"
        description={
          <>
            ¿Seguro que deseas eliminar el producto{" "}
            <span className="font-semibold text-foreground">
              &quot;{toDelete?.title}&quot;
            </span>
            ? Esta acción no se puede deshacer.
          </>
        }
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
