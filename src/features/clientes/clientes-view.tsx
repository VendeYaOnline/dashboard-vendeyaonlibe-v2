"use client";

import { useEffect, useState } from "react";
import { Clock, Contact, MessageCircle, Repeat, Wallet } from "lucide-react";
import {
  Button,
  Card,
  Chip,
  ListBox,
  ListBoxItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  cn,
} from "@heroui/react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { SearchField } from "@/components/shared/search-field";
import { TablePagination } from "@/components/shared/table-pagination";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useQueryCustomers } from "@/app/api/queries";
import { StatTile } from "@/features/analisis/components/stat-tile";
import { formatInteger, formatMoney } from "@/features/analisis/utils";
import type { Customer, CustomersFilters, CustomerSort, PaymentGroup } from "@/interfaces/customers";
import { CustomerDetailModal } from "./components/customer-detail-modal";
import { PAYMENT_GROUPS, PaymentChip } from "./payments";
import { formatRelative } from "./utils";

const PAGE_SIZE = 10;

const SORT_OPTIONS: { id: CustomerSort; label: string }[] = [
  { id: "last-purchase", label: "Compra más reciente" },
  { id: "spent", label: "Mayor total comprado" },
  { id: "orders", label: "Más compras" },
  { id: "name", label: "Nombre" },
];

const PAYMENT_OPTIONS: { id: PaymentGroup | "all"; label: string }[] = [
  { id: "all", label: "Todos los medios de pago" },
  ...(Object.keys(PAYMENT_GROUPS) as PaymentGroup[]).map((id) => ({ id, label: PAYMENT_GROUPS[id].label })),
];

export function ClientesView() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [filters, setFilters] = useState<Omit<CustomersFilters, "search">>({
    page: 1,
    segment: "all",
    payment: "all",
    pending: false,
    sort: "last-purchase",
  });
  const [selected, setSelected] = useState<Customer | null>(null);

  // Cualquier filtro nuevo vuelve a la primera página.
  const setFilter = <K extends keyof typeof filters>(key: K, value: (typeof filters)[K]) =>
    setFilters((current) => ({ ...current, [key]: value, page: key === "page" ? (value as number) : 1 }));
  useEffect(() => setFilters((current) => ({ ...current, page: 1 })), [debouncedSearch]);

  const { data, isLoading, isPlaceholderData } = useQueryCustomers({ ...filters, search: debouncedSearch });
  const summary = data?.summary;
  const rows = data?.items ?? [];

  const columns: DataTableColumn<Customer>[] = [
    {
      key: "customer",
      label: "Cliente",
      isRowHeader: true,
      render: (customer) => (
        <div className="min-w-0 space-y-1">
          <p className="truncate font-medium">{customer.name}</p>
          <div className="flex flex-wrap items-center gap-1">
            {customer.city && <span className="mr-1 text-xs text-muted">{customer.city}</span>}
            {customer.segments.recurring && (
              <Chip size="sm" variant="soft" color="success">
                Recurrente
              </Chip>
            )}
            {customer.segments.new && (
              <Chip size="sm" variant="soft" color="accent">
                Nuevo
              </Chip>
            )}
            {customer.segments.inactive && (
              <Chip size="sm" variant="soft">
                Inactivo
              </Chip>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      label: "Contacto",
      render: (customer) => (
        <div className="space-y-0.5 text-sm">
          <p className="flex items-center gap-2 whitespace-nowrap tabular-nums">
            {customer.phone ?? "—"}
            {customer.whatsapp && (
              <a
                href={`https://wa.me/${customer.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Escribir por WhatsApp a ${customer.name}`}
                title="Escribir por WhatsApp"
                className="text-success hover:opacity-80"
              >
                <MessageCircle className="size-4" />
              </a>
            )}
          </p>
          {customer.email && <p className="max-w-48 truncate text-xs text-muted">{customer.email}</p>}
        </div>
      ),
    },
    {
      key: "spent",
      label: "Compras",
      render: (customer) => (
        <div className="space-y-0.5">
          <p className="font-semibold tabular-nums">{formatMoney(customer.spent)}</p>
          <p className="whitespace-nowrap text-xs text-muted">
            {customer.orders} {customer.orders === 1 ? "compra" : "compras"}
            {customer.orders > 1 && ` · ${formatMoney(customer.averageTicket)} c/u`}
          </p>
          {customer.pendingOrders > 0 && (
            <p className="whitespace-nowrap text-xs text-warning">
              {customer.pendingOrders} por confirmar · {formatMoney(customer.pendingAmount)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "payments",
      label: "Cómo paga",
      render: (customer) =>
        customer.payments.length > 0 ? (
          <div className="flex max-w-64 flex-wrap gap-1">
            {customer.payments.map((payment) => (
              <PaymentChip key={payment.label} group={payment.group} label={payment.label} count={payment.orders} />
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted">Solo pagos por confirmar</span>
        ),
    },
    {
      key: "last",
      label: "Última compra",
      render: (customer) => (
        <span className="whitespace-nowrap text-sm">{formatRelative(customer.lastActivityAt)}</span>
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      align: "end",
      render: (customer) => (
        <Button variant="outline" size="sm" onPress={() => setSelected(customer)} aria-label={`Ver compras de ${customer.name}`}>
          Ver compras
        </Button>
      ),
    },
  ];

  const segmentOptions: { id: CustomersFilters["segment"]; label: string }[] = [
    { id: "all", label: "Todos" },
    { id: "recurring", label: `Recurrentes${summary ? ` (${summary.recurring})` : ""}` },
    { id: "new", label: `Nuevos${summary ? ` (${summary.new})` : ""}` },
    { id: "inactive", label: `Inactivos${summary ? ` (${summary.inactive})` : ""}` },
  ];

  return (
    <div className="space-y-6">
      <PageHeader icon={Contact} title="Clientes" description="Quién te compra, cuánto, cada cuánto y cómo paga" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Clientes"
          value={summary ? formatInteger(summary.customers) : "—"}
          icon={Contact}
          hint={summary && data ? `${formatInteger(summary.new)} nuevos en ${data.newCustomerDays} días` : undefined}
        />
        <StatTile
          label="Vuelven a comprar"
          value={summary ? formatInteger(summary.recurring) : "—"}
          icon={Repeat}
          hint={
            summary?.buyers
              ? `${Math.round((summary.recurring / summary.buyers) * 100)} % de quienes ya compraron`
              : "Clientes con 2 o más compras"
          }
        />
        <StatTile
          label="Ticket promedio"
          value={summary ? formatMoney(summary.averageTicket) : "—"}
          icon={Wallet}
          hint={summary ? `${formatMoney(summary.averageSpent)} en total por cliente` : undefined}
        />
        <StatTile
          label="Pagos por confirmar"
          value={summary ? formatInteger(summary.withPending) : "—"}
          icon={Clock}
          hint="Clientes con transferencias o llaves en «Pago pendiente»"
        />
      </div>

      {/* Cómo pagan: transferencia/llave vs Mercado Pago vs registrado a mano. */}
      {summary && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {(Object.keys(PAYMENT_GROUPS) as PaymentGroup[]).map((group) => {
            const config = PAYMENT_GROUPS[group];
            const Icon = config.icon;
            const isActive = filters.payment === group;
            return (
              <button
                key={group}
                type="button"
                aria-pressed={isActive}
                onClick={() => setFilter("payment", isActive ? "all" : group)}
                className={cn(
                  "flex items-start gap-3 rounded-xl border bg-surface p-4 text-left transition-colors hover:bg-surface-secondary",
                  isActive ? "border-accent ring-1 ring-accent" : "border-border",
                )}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-secondary">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{config.label}</span>
                  <span className="block text-xs text-muted">{config.hint}</span>
                </span>
                <span className="ml-auto text-right">
                  <span className="block text-lg font-semibold tabular-nums">{formatInteger(summary.byPayment[group])}</span>
                  <span className="block text-xs text-muted">clientes</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      <Card>
        <Card.Content className="flex flex-col gap-3 p-4 lg:flex-row lg:flex-wrap lg:items-center">
          <SearchField
            aria-label="Buscar clientes"
            placeholder="Nombre, cédula, teléfono o ciudad..."
            value={search}
            onChange={setSearch}
          />
          <ToggleButtonGroup
            aria-label="Tipo de cliente"
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={new Set([filters.segment])}
            onSelectionChange={(keys) => {
              const [next] = Array.from(keys, String);
              if (next) setFilter("segment", next as CustomersFilters["segment"]);
            }}
          >
            {segmentOptions.map((option) => (
              <ToggleButton key={option.id} id={option.id}>
                {option.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <div className="flex flex-wrap gap-3">
            <ToggleButton isSelected={filters.pending} onChange={(pending) => setFilter("pending", pending)}>
              <Clock className="size-4" />
              Con pago por confirmar{summary ? ` (${summary.withPending})` : ""}
            </ToggleButton>
            <Select
              aria-label="Medio de pago"
              selectedKey={filters.payment}
              onSelectionChange={(key) => setFilter("payment", String(key) as CustomersFilters["payment"])}
              className="w-56"
            >
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {PAYMENT_OPTIONS.map((option) => (
                    <ListBoxItem key={option.id} id={option.id}>
                      {option.label}
                    </ListBoxItem>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
            <Select
              aria-label="Ordenar"
              selectedKey={filters.sort}
              onSelectionChange={(key) => setFilter("sort", String(key) as CustomerSort)}
              className="w-52"
            >
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {SORT_OPTIONS.map((option) => (
                    <ListBoxItem key={option.id} id={option.id}>
                      {option.label}
                    </ListBoxItem>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>
        </Card.Content>
      </Card>

      <Card className={cn("overflow-hidden transition-opacity", isPlaceholderData && "opacity-60")} aria-busy={isPlaceholderData}>
        <DataTable
          aria-label="Clientes"
          items={rows}
          columns={columns}
          getRowId={(customer) => customer.key}
          isLoading={isLoading}
          loadingMessage="Cargando clientes..."
          emptyMessage="No hay clientes con estos filtros"
        />
        <TablePagination
          currentPage={filters.page}
          totalPages={data?.totalPages ?? 1}
          totalItems={data?.total ?? 0}
          itemsInPage={rows.length}
          itemLabel="clientes"
          pageSize={PAGE_SIZE}
          onPageChange={(page) => setFilter("page", page)}
        />
      </Card>

      <p className="text-xs text-muted">
        Los clientes se arman con las ventas, agrupadas por cédula (o por teléfono si no hay cédula). Las ventas en
        «Pago pendiente» no cuentan como compra hasta que confirmas el pago.
      </p>

      <CustomerDetailModal customer={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
