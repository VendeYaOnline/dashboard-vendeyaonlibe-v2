"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Boxes, EyeOff, Package, PackageX, Wallet } from "lucide-react";
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
import { ImageWithSkeleton } from "@/components/shared/image-with-skeleton";
import { SearchField } from "@/components/shared/search-field";
import { TablePagination } from "@/components/shared/table-pagination";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useQueryAllCategories, useQueryInventory } from "@/app/api/queries";
import { useAuthStore } from "@/store/auth.store";
import { StatTile } from "@/features/analisis/components/stat-tile";
import { formatInteger, formatMoney, formatMoneyCompact } from "@/features/analisis/utils";
import type { InventoryFilters, InventoryRow, InventorySort, StockStatus } from "@/interfaces/inventory";
import { AdjustStockModal } from "./components/adjust-stock-modal";

const PAGE_SIZE = 20;

const STATUS_CHIP: Record<StockStatus, { label: string; color: "danger" | "warning" | "success" | "default" }> = {
  out: { label: "Agotado", color: "danger" },
  low: { label: "Stock bajo", color: "warning" },
  ok: { label: "Disponible", color: "success" },
  untracked: { label: "Sin cantidad", color: "default" },
};

const SORT_OPTIONS: { id: InventorySort; label: string }[] = [
  { id: "stock", label: "Menos unidades primero" },
  { id: "-stock", label: "Más unidades primero" },
  { id: "value", label: "Mayor valor" },
  { id: "last-sale", label: "Sin vender hace más tiempo" },
  { id: "title", label: "Nombre" },
];

const STALE_OPTIONS = [
  { id: 0, label: "Con o sin ventas" },
  { id: 30, label: "Sin ventas en 30 días" },
  { id: 60, label: "Sin ventas en 60 días" },
  { id: 90, label: "Sin ventas en 90 días" },
] as const;

const formatLastSale = (iso: string | null) => {
  if (!iso) return "Nunca";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 30) return `Hace ${days} días`;
  return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Bogota" });
};

export function InventarioView() {
  const canManage = useAuthStore((s) => s.user?.role) !== "viewer";
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [filters, setFilters] = useState<Omit<InventoryFilters, "search">>({
    page: 1,
    status: "all",
    categoryId: "all",
    staleDays: 0,
    sort: "stock",
  });
  const [adjusting, setAdjusting] = useState<InventoryRow | null>(null);

  // Cualquier filtro nuevo vuelve a la primera página.
  const setFilter = <K extends keyof typeof filters>(key: K, value: (typeof filters)[K]) =>
    setFilters((current) => ({ ...current, [key]: value, page: key === "page" ? (value as number) : 1 }));
  useEffect(() => setFilters((current) => ({ ...current, page: 1 })), [debouncedSearch]);

  const { data, isLoading, isPlaceholderData } = useQueryInventory({ ...filters, search: debouncedSearch });
  const { data: categoriesData } = useQueryAllCategories();
  const categories = categoriesData?.categories ?? [];
  const summary = data?.summary;
  const rows = data?.items ?? [];

  const columns: DataTableColumn<InventoryRow>[] = [
    {
      key: "product",
      label: "Producto",
      isRowHeader: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.image ? (
            <ImageWithSkeleton src={row.image} alt="" sizes="40px" className="size-10 shrink-0 rounded-md" />
          ) : (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-secondary">
              <Package className="size-4 text-muted" />
            </span>
          )}
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate font-medium">
              {row.title}
              {row.hidden && <EyeOff className="size-3.5 shrink-0 text-muted" aria-label="Oculto en la tienda" />}
            </p>
            <p className="truncate text-xs text-muted">
              {row.variantLabel ?? (row.categories.map((c) => c.name).join(", ") || "Sin variantes")}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "quantity",
      label: "Unidades",
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className={cn("w-10 text-lg font-semibold tabular-nums", row.status === "out" && "text-danger", row.status === "low" && "text-warning")}>
            {row.quantity ?? "—"}
          </span>
          <Chip size="sm" variant="soft" color={STATUS_CHIP[row.status].color}>
            {STATUS_CHIP[row.status].label}
          </Chip>
        </div>
      ),
    },
    {
      key: "value",
      label: "Valor",
      render: (row) => (
        <div>
          <p className="tabular-nums">{formatMoney(row.value)}</p>
          <p className="text-xs text-muted tabular-nums">{formatMoney(row.unitPrice)} c/u</p>
        </div>
      ),
    },
    {
      key: "lastSale",
      label: "Última venta",
      render: (row) => (
        <span className={cn("whitespace-nowrap text-sm", row.lastSoldAt ? "" : "text-muted")}>{formatLastSale(row.lastSoldAt)}</span>
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      align: "end",
      render: (row) => (
        <Button variant="ghost" size="sm" isDisabled={!canManage} onPress={() => setAdjusting(row)} aria-label={`Ajustar unidades de ${row.title}${row.variantLabel ? ` ${row.variantLabel}` : ""}`}>
          <Boxes className="size-4" />
          Ajustar
        </Button>
      ),
    },
  ];

  const statusOptions: { id: InventoryFilters["status"]; label: string }[] = [
    { id: "all", label: "Todos" },
    { id: "out", label: `Agotados${summary ? ` (${summary.out})` : ""}` },
    { id: "low", label: `Stock bajo${summary ? ` (${summary.low})` : ""}` },
    ...(summary?.untracked ? [{ id: "untracked" as const, label: `Sin cantidad (${summary.untracked})` }] : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader icon={Boxes} title="Inventario" description="Cuántas unidades te quedan de cada producto, talla y color" />

      {/* Resumen de toda la tienda */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Unidades en stock"
          value={summary ? formatInteger(summary.units) : "—"}
          icon={Boxes}
          hint={summary ? `${formatInteger(summary.products)} productos · ${formatInteger(summary.rows)} variantes` : undefined}
        />
        <StatTile
          label="Valor del inventario"
          value={summary ? formatMoneyCompact(summary.value) : "—"}
          icon={Wallet}
          hint="Unidades × precio de venta"
        />
        <StatTile
          label="Agotados"
          value={summary ? formatInteger(summary.out) : "—"}
          icon={PackageX}
          hint="Variantes con 0 unidades"
        />
        <StatTile
          label="Stock bajo"
          value={summary ? formatInteger(summary.low) : "—"}
          icon={AlertTriangle}
          hint={data ? `Con ${data.lowStockThreshold} unidades o menos` : undefined}
        />
      </div>

      <Card>
        <Card.Content className="flex flex-col gap-3 p-4 lg:flex-row lg:flex-wrap lg:items-center">
          <SearchField
            aria-label="Buscar en el inventario"
            placeholder="Buscar producto, talla o color..."
            value={search}
            onChange={setSearch}
          />
          <ToggleButtonGroup
            aria-label="Estado del stock"
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={new Set([filters.status])}
            onSelectionChange={(keys) => {
              const [next] = Array.from(keys, String);
              if (next) setFilter("status", next as InventoryFilters["status"]);
            }}
          >
            {statusOptions.map((option) => (
              <ToggleButton key={option.id} id={option.id}>
                {option.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <div className="flex flex-wrap gap-3">
            <Select aria-label="Categoría" selectedKey={filters.categoryId} onSelectionChange={(key) => setFilter("categoryId", String(key))} className="w-44">
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox className="max-h-56 overflow-y-auto">
                  <ListBoxItem id="all">Todas las categorías</ListBoxItem>
                  {categories.map((category) => (
                    <ListBoxItem key={category.id} id={category.id}>
                      {category.name}
                    </ListBoxItem>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
            <Select aria-label="Ventas" selectedKey={String(filters.staleDays)} onSelectionChange={(key) => setFilter("staleDays", Number(key) as InventoryFilters["staleDays"])} className="w-48">
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {STALE_OPTIONS.map((option) => (
                    <ListBoxItem key={option.id} id={String(option.id)}>
                      {option.label}
                    </ListBoxItem>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
            <Select aria-label="Ordenar" selectedKey={filters.sort} onSelectionChange={(key) => setFilter("sort", String(key) as InventorySort)} className="w-56">
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

      {/* Al cambiar de página o filtro, la página anterior sigue visible (atenuada) hasta que llega la nueva. */}
      <Card className={cn("overflow-hidden transition-opacity", isPlaceholderData && "opacity-60")} aria-busy={isPlaceholderData}>
        <DataTable
          aria-label="Inventario"
          items={rows}
          columns={columns}
          getRowId={(row) => row.key}
          isLoading={isLoading}
          loadingMessage="Cargando inventario..."
          emptyMessage="No hay productos con estos filtros"
        />
        <TablePagination
          currentPage={filters.page}
          totalPages={data?.totalPages ?? 1}
          totalItems={data?.total ?? 0}
          itemsInPage={rows.length}
          itemLabel="variantes"
          pageSize={PAGE_SIZE}
          onPageChange={(page) => setFilter("page", page)}
        />
      </Card>

      <AdjustStockModal row={adjusting} onClose={() => setAdjusting(null)} />
    </div>
  );
}
