"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  Label,
  ListBox,
  ListBoxItem,
  Select,
  toast,
} from "@heroui/react";
import { Eye, Link as LinkIcon, Plus, ShoppingCart, Store, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { TablePagination } from "@/components/shared/table-pagination";
import { SearchField } from "@/components/shared/search-field";
import { DatePickerField } from "@/components/shared/date-picker-field";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useQuerySales } from "@/app/api/queries";
import {
  useMutationCreateSale,
  useMutationDeleteSale,
  useMutationUpdateSaleStatus,
} from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import { useAuthStore } from "@/store/auth.store";
import { getPaymentMethodLabel, SALE_STATUSES, type CreateSalePayload, type Sale } from "./types";
import { formatSaleTotal, toBackendDate } from "./utils";
import { VentaFormModal } from "./components/venta-form-modal";
import { VentaStatusMenu } from "./components/venta-status-menu";
import { VentaDetailsModal } from "./components/venta-details-modal";

export function VentasView() {
  const router = useRouter();
  const canManage = useAuthStore((s) => s.user?.role) !== "viewer";

  const [statusFilter, setStatusFilter] = useState("todos");
  const [dateFilter, setDateFilter] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(1);

  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => setPage(1), [statusFilter, dateFilter, debouncedSearch]);

  const { data, isLoading, isPlaceholderData } = useQuerySales(
    page,
    toBackendDate(dateFilter),
    statusFilter === "todos" ? "" : statusFilter,
    debouncedSearch,
  );

  const sales = data?.sales ?? [];
  const hasFilters = statusFilter !== "todos" || dateFilter !== "" || debouncedSearch !== "";

  const createMutation = useMutationCreateSale();
  const deleteMutation = useMutationDeleteSale();
  const statusMutation = useMutationUpdateSaleStatus();
  /** Venta cuyo estado se está guardando (para el spinner en su chip). */
  const [statusPendingId, setStatusPendingId] = useState<string | null>(null);

  const handleStatusChange = (sale: Sale, status: string) => {
    setStatusPendingId(sale.id);
    statusMutation.mutate(
      { id: sale.id, status },
      {
        onSuccess: () => {
          toast.success(`Orden ${sale.order_number}: ${status}`);
          setSelectedSale((current) =>
            current && current.id === sale.id ? { ...current, status } : current,
          );
        },
        onError: (error) => handleAxiosError(error, "No se pudo cambiar el estado"),
        onSettled: () => setStatusPendingId(null),
      },
    );
  };

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
      key: "order_number",
      label: "Orden",
      className: "whitespace-nowrap",
      render: (sale) => (
        <span className="flex items-center gap-2">
          <span className="font-mono text-sm">{sale.order_number}</span>
          {sale.type_purchase === "online" && (
            <span title="Venta desde la tienda en línea" className="text-muted">
              <Store className="size-3.5" />
            </span>
          )}
        </span>
      ),
    },
    {
      key: "customer",
      label: "Cliente",
      render: (sale) => (
        <div className="min-w-0">
          <p className="truncate">{[sale.first_name, sale.last_name].filter(Boolean).join(" ") || "—"}</p>
          <p className="truncate text-xs text-muted">
            {sale.city}
            {sale.phone ? ` · ${sale.phone}` : ""}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Estado",
      render: (sale) => (
        <VentaStatusMenu
          status={sale.status}
          isDisabled={!canManage}
          isPending={statusPendingId === sale.id}
          onChange={(status) => handleStatusChange(sale, status)}
        />
      ),
    },
    {
      key: "total",
      label: "Total",
      className: "whitespace-nowrap",
      render: (sale) => (
        <div>
          <p className="font-medium tabular-nums">{formatSaleTotal(sale.total)}</p>
          <p className="text-xs text-muted">
            {sale.quantity} {Number(sale.quantity) === 1 ? "unidad" : "unidades"}
          </p>
        </div>
      ),
    },
    {
      key: "payment_method",
      label: "Pago",
      className: "whitespace-nowrap",
      render: (sale) => <span className="text-muted">{getPaymentMethodLabel(sale.payment_method)}</span>,
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
            aria-label={`Abrir la página de la orden ${sale.order_number}`}
            onPress={() => router.push(`/ventas/${sale.id}`)}
          >
            <LinkIcon className="size-4" />
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
        <Card.Content className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label>Buscar</Label>
            <SearchField
              aria-label="Buscar ventas"
              placeholder="Orden, cliente, cédula, email o teléfono"
              value={search}
              onChange={setSearch}
            />
          </div>
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

          <DatePickerField label="Fecha" value={dateFilter} onChange={setDateFilter} />

          <Button
            variant="outline"
            className="sm:col-span-2 lg:col-span-1 lg:self-end"
            isDisabled={!hasFilters}
            onPress={() => {
              setStatusFilter("todos");
              setDateFilter("");
              setSearch("");
            }}
          >
            Limpiar filtros
          </Button>
        </Card.Content>
      </Card>

      {/* Al cambiar de página o filtro, la página anterior sigue visible (atenuada) hasta que llega la nueva. */}
      <Card
        className={`overflow-hidden transition-opacity ${isPlaceholderData ? "opacity-60" : ""}`}
        aria-busy={isPlaceholderData}
      >
        <DataTable
          aria-label="Ventas recibidas"
          items={sales}
          columns={columns}
          getRowId={(sale) => sale.id}
          isLoading={isLoading}
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

      {isFormOpen && (
        <VentaFormModal
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleCreateSale}
          isPending={createMutation.isPending}
        />
      )}

      {selectedSale && (
        <VentaDetailsModal
          sale={selectedSale}
          isOpen
          onOpenChange={(open) => !open && setSelectedSale(null)}
        />
      )}

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
