"use client";

import { useEffect, useMemo, useState } from "react";
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
import { useMutationCreateSale } from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import { useAuthStore } from "@/store/auth.store";
import { MOCK_SALES } from "./mock-data";
import { SALE_STATUSES, type CreateSalePayload, type Sale } from "./types";
import { VentaDetailsModal } from "./components/venta-details-modal";
import { VentaFormModal } from "./components/venta-form-modal";
import { VentaStatusChip } from "./components/venta-status-chip";

const ITEMS_PER_PAGE = 5;

export function VentasView() {
  const canManage = useAuthStore((s) => s.user?.role) !== "viewer";

  const [statusFilter, setStatusFilter] = useState("todos");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);

  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => setPage(1), [statusFilter, dateFilter]);

  // Los datos son locales, así que el filtrado y la paginación son en memoria.
  const filteredSales = useMemo(
    () =>
      MOCK_SALES.filter((sale) => {
        const statusMatch = statusFilter === "todos" || sale.status === statusFilter;
        const dateMatch = !dateFilter || sale.date === dateFilter;
        return statusMatch && dateMatch;
      }),
    [statusFilter, dateFilter],
  );

  const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const paginatedSales = filteredSales.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const createMutation = useMutationCreateSale();

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
    // TODO: cablear a DELETE /delete-sale/:id (ver nota en mock-data.ts).
    console.info("Eliminar venta", saleToDelete?.id);
    toast.warning("Eliminar ventas todavía no está conectado al servidor");
    setSaleToDelete(null);
  };

  const columns: DataTableColumn<Sale>[] = [
    {
      key: "date",
      label: "Fecha",
      isRowHeader: true,
      className: "whitespace-nowrap",
      render: (sale) => <span className="font-medium">{sale.date}</span>,
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
      key: "orderNumber",
      label: "Número de orden",
      className: "whitespace-nowrap",
      render: (sale) => <span className="font-mono text-sm">{sale.orderNumber}</span>,
    },
    {
      key: "paymentMethod",
      label: "Método de pago",
      className: "whitespace-nowrap",
      render: (sale) => <span>{sale.paymentMethod}</span>,
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
            aria-label={`Ver detalles de la orden ${sale.orderNumber}`}
            onPress={() => setSelectedSale(sale)}
          >
            <Eye className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label={`Eliminar la orden ${sale.orderNumber}`}
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
          items={paginatedSales}
          columns={columns}
          getRowId={(sale) => String(sale.id)}
          emptyMessage="No se encontraron ventas con los filtros seleccionados"
        />
        <TablePagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={filteredSales.length}
          itemsInPage={paginatedSales.length}
          itemLabel="ventas"
          pageSize={ITEMS_PER_PAGE}
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
              {saleToDelete?.orderNumber}
            </span>
            ? Esta acción no se puede deshacer.
          </>
        }
      />
    </div>
  );
}
