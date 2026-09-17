"use client";

import { useEffect, useState } from "react";
import { Button, Card, Chip, toast } from "@heroui/react";
import { Plus, Star, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { SearchField } from "@/components/shared/search-field";
import { TablePagination } from "@/components/shared/table-pagination";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useQueryFeaturedProducts } from "@/app/api/queries";
import {
  useMutationDeleteFeaturedProduct,
  useMutationFeaturedProduct,
} from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import { useAuthStore } from "@/store/auth.store";
import { MAX_FEATURED_PRODUCTS, type FeaturedProduct } from "@/interfaces/featured-products";
import { FeaturedProductFormModal } from "./components/featured-product-form-modal";
import { formatCOP } from "@/features/productos/utils";

export function ProductosDestacadosView() {
  const canManage = useAuthStore((s) => s.user?.role) !== "viewer";

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<FeaturedProduct | null>(null);

  useEffect(() => setPage(1), [debouncedSearch]);

  const { data, isLoading, isFetching } = useQueryFeaturedProducts(page, debouncedSearch);
  const createMutation = useMutationFeaturedProduct();
  const deleteMutation = useMutationDeleteFeaturedProduct();

  const featuredProducts = data?.products ?? [];
  const grandTotal = data?.grandTotal ?? 0;
  const limitReached = grandTotal >= MAX_FEATURED_PRODUCTS;

  const handleCreate = (productId: string) => {
    createMutation.mutate(productId, {
      onSuccess: () => {
        toast.success("Producto destacado creado correctamente");
        setIsFormOpen(false);
      },
      onError: (error) => handleAxiosError(error, "Error al destacar el producto"),
    });
  };

  const handleConfirmDelete = () => {
    if (!toDelete) return;
    deleteMutation.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success("Producto destacado eliminado correctamente");
        setToDelete(null);
      },
      onError: (error) =>
        handleAxiosError(error, "Error al eliminar el producto destacado"),
    });
  };

  const columns: DataTableColumn<FeaturedProduct>[] = [
    {
      key: "image",
      label: "Imagen",
      render: ({ product }) =>
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
      render: ({ product }) => <span className="font-medium">{product.title}</span>,
    },
    {
      key: "stock",
      label: "Stock",
      render: ({ product }) => (
        <Chip size="sm" variant="soft" color={product.stock ? "success" : "danger"}>
          {product.stock ? "Con stock" : "Sin stock"}
        </Chip>
      ),
    },
    {
      key: "price",
      label: "Precio",
      render: ({ product }) => <span>{formatCOP(product.price) || product.price}</span>,
    },
    {
      key: "discount_price",
      label: "Precio descuento",
      // Solo hay precio con descuento cuando el producto tiene un descuento aplicado.
      render: ({ product }) => (
        <span className={product.discount ? "" : "text-muted"}>
          {product.discount ? formatCOP(product.discount_price) || product.discount_price : "-"}
        </span>
      ),
    },
    {
      key: "discount",
      label: "Descuento",
      render: ({ product }) => (
        <span>{product.discount ? `${product.discount}%` : "-"}</span>
      ),
    },
    {
      key: "reference",
      label: "Referencia",
      render: ({ product }) => <span>{product.reference || "-"}</span>,
    },
    {
      key: "images",
      label: "Imágenes",
      render: ({ product }) => <span>{product.images?.length ?? 0}</span>,
    },
    {
      key: "actions",
      label: "Acciones",
      align: "end",
      render: (featured) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label={`Quitar ${featured.product.title} de destacados`}
            className="text-danger"
            isDisabled={!canManage}
            onPress={() => setToDelete(featured)}
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
        icon={Star}
        title="Productos Star"
        description={`Gestiona los productos destacados de tu tienda (${grandTotal}/${MAX_FEATURED_PRODUCTS})`}
        actions={
          <Button
            variant="primary"
            isDisabled={limitReached || !canManage}
            onPress={() => setIsFormOpen(true)}
          >
            <Plus className="size-4" />
            {limitReached ? "Límite alcanzado" : "Destacar producto"}
          </Button>
        }
      />

      <Card>
        <Card.Content className="p-4">
          <SearchField
            aria-label="Buscar productos destacados"
            placeholder="Buscar por título del producto..."
            value={search}
            onChange={setSearch}
          />
        </Card.Content>
      </Card>

      <Card className="overflow-hidden">
        <DataTable
          aria-label="Productos destacados"
          items={featuredProducts}
          columns={columns}
          getRowId={(featured) => featured.id}
          isLoading={isLoading || isFetching}
          loadingMessage="Cargando productos destacados..."
          emptyMessage="No se encontraron productos destacados"
        />
        <TablePagination
          currentPage={page}
          totalPages={data?.totalPages ?? 1}
          totalItems={data?.total ?? 0}
          itemsInPage={featuredProducts.length}
          itemLabel="productos destacados"
          onPageChange={setPage}
        />
      </Card>

      <FeaturedProductFormModal
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleCreate}
        isPending={createMutation.isPending}
      />

      <ConfirmDialog
        isOpen={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Quitar producto destacado"
        description={
          <>
            ¿Seguro que deseas quitar{" "}
            <span className="font-semibold text-foreground">
              &quot;{toDelete?.product.title}&quot;
            </span>{" "}
            de los productos destacados?
          </>
        }
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
