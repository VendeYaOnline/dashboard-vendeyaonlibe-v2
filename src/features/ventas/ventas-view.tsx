"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Select,
  TextField,
  toast,
} from "@heroui/react";
import { Eye, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { TablePagination } from "@/components/shared/table-pagination";
import { useQuerySales } from "@/app/api/queries";
import { useMutationCreateSale, useMutationDeleteSale } from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import { useAuthStore } from "@/store/auth.store";
import { getPaymentMethodLabel, SALE_STATUSES, type CreateSalePayload, type Sale } from "./types";
import { toBackendDate } from "./utils";
import { VentaDetailsModal } from "./components/venta-details-modal";
import { VentaFormModal } from "./components/venta-form-modal";
import { VentaStatusChip } from "./components/venta-status-chip";

export function VentasView() {
  const canManage = useAuthStore((s) => s.user?.role) !== "viewer";

  const [statusFilter, setStatusFilter] = useState("todos");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);

  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => setPage(1), [statusFilter, dateFilter]);

  const { data, isLoading, isFetching } = useQuerySales(
    page,
    toBackendDate(dateFilter),
    statusFilter === "todos" ? "" : statusFilter,
  );

  const sales = data?.sales ?? [];

  const createMutation = useMutationCreateSale();
  const deleteMutation = useMutationDeleteSale();

  const handleCreateSale = (payload: CreateSalePayload) => {
    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Venta creada correctamente");
        setIsFormOpen(false);
      },
      onError: (error) => handleAxiosError(error, "Error al crear la venta"),
    });
  };

  const handleConfirmDelete = () => {
    if (!saleToDelete) return;
    deleteMutation.mutate(saleToDelete.id, {
      onSuccess: () => {
        toast.success("Venta eliminada correctamente");
        setSaleToDelete(null);
      },
      onError: (error) => handleAxiosError(error, "Error al eliminar la venta"),
    });
  };

  const columns: DataTableColumn<Sale>[] = [
    {
      key: "purchase_date",
      label: "Fecha",
      isRowHeader: true,
      className: "whitespace-nowrap",
      render: (sale) => <span className="font-medium">{sale.purchase_date}</span>,
    },
    {
      key: "city",
      label: "Ciudad",
      className: "whitespace-nowrap",
      render: (sale) => <span>{sale.city}</span>,
    },
    {
      key: "phone",
      label: "Teléfono",
      className: "whitespace-nowrap",
      render: (sale) => <span className="font-mono text-sm">{sale.phone}</span>,
    },
    {
      key: "status",
      label: "Estado",
      render: (sale) => <VentaStatusChip status={sale.status} />,
    },
    {
      key: "order_number",
      label: "Número de orden",
      className: "whitespace-nowrap",
      render: (sale) => <span className="font-mono text-sm">{sale.order_number}</span>,
    },
    {
      key: "payment_method",
      label: "Método de pago",
      className: "whitespace-nowrap",
      render: (sale) => <span>{getPaymentMethodLabel(sale.payment_method)}</span>,
    },
    {
      key: "actions",
      label: "Acciones",
      align: "end",
      render: (sale) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label={`Ver detalles de la orden ${sale.order_number}`}
            onPress={() => setSelectedSale(sale)}
          >
            <Eye className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label={`Eliminar la orden ${sale.order_number}`}
            className="text-danger"
            isDisabled={!canManage}
            onPress={() => setSaleToDelete(sale)}
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
        icon={ShoppingCart}
        title="Ventas recibidas"
        description="Gestiona y monitorea todas tus ventas"
        actions={
          <Button
            variant="primary"
            isDisabled={!canManage}
            onPress={() => setIsFormOpen(true)}
          >
            <Plus className="size-4" />
            Crear venta
          </Button>
        }
      />

      <Card>
        <Card.Header>
          <Card.Title className="text-base">Filtros</Card.Title>
        </Card.Header>
        <Card.Content className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            selectedKey={statusFilter}
            onSelectionChange={(key) => setStatusFilter(String(key))}
          >
            <Label>Estado</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBoxItem id="todos">Todos</ListBoxItem>
                {SALE_STATUSES.map((status) => (
                  <ListBoxItem key={status.id} id={status.id}>
                    {status.label}
                  </ListBoxItem>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <TextField value={dateFilter} onChange={setDateFilter} type="date">
            <Label>Fecha</Label>
            <Input />
          </TextField>

          <Button
            variant="outline"
            className="sm:col-span-2 lg:col-span-1 lg:self-end"
            onPress={() => {
              setStatusFilter("todos");
              setDateFilter("");
            }}
          >
            Limpiar filtros
          </Button>
        </Card.Content>
      </Card>

      <Card className="overflow-hidden">
        <DataTable
          aria-label="Ventas recibidas"
          items={sales}
          columns={columns}
          getRowId={(sale) => sale.id}
          isLoading={isLoading || isFetching}
          loadingMessage="Cargando ventas..."
          emptyMessage="No se encontraron ventas con los filtros seleccionados"
        />
        <TablePagination
          currentPage={page}
          totalPages={data?.totalPages ?? 1}
          totalItems={data?.total ?? 0}
          itemsInPage={sales.length}
          itemLabel="ventas"
          onPageChange={setPage}
        />
      </Card>

      <VentaDetailsModal
        sale={selectedSale}
        isOpen={selectedSale !== null}
        onOpenChange={(open) => !open && setSelectedSale(null)}
      />

      <VentaFormModal
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleCreateSale}
        isPending={createMutation.isPending}
      />

      <ConfirmDialog
        isOpen={saleToDelete !== null}
        onOpenChange={(open) => !open && setSaleToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar venta"
        description={
          <>
            ¿Seguro que deseas eliminar la orden{" "}
            <span className="font-semibold text-foreground">
              {saleToDelete?.order_number}
            </span>
            ? Esta acción no se puede deshacer.
          </>
        }
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
