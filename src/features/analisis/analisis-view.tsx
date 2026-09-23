"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  MessageSquare,
  Package,
  Receipt,
  ShoppingCart,
  Tags,
} from "lucide-react";
import {
  Button,
  Card,
  Chip,
  Spinner,
  ToggleButton,
  ToggleButtonGroup,
  buttonVariants,
  cn,
} from "@heroui/react";
import { PageHeader } from "@/components/layout/page-header";
import { ImageWithSkeleton } from "@/components/shared/image-with-skeleton";
import { useQueryAnalytics } from "@/app/api/queries";
import type { AnalyticsPeriod } from "@/interfaces/analytics";
import { VentaStatusChip } from "@/features/ventas/components/venta-status-chip";
import { BarList } from "./components/bar-list";
import { RevenueChart } from "./components/revenue-chart";
import { StatTile } from "./components/stat-tile";
import {
  PERIOD_OPTIONS,
  channelLabel,
  formatInteger,
  formatMoney,
  formatMoneyCompact,
  paymentLabel,
} from "./utils";

export function AnalisisView() {
  const [period, setPeriod] = useState<AnalyticsPeriod>(30);
  const { data, isLoading, isError, isPlaceholderData, refetch } = useQueryAnalytics(period);

  const periodOption = PERIOD_OPTIONS.find((option) => option.id === period) ?? PERIOD_OPTIONS[1];
  const kpis = data?.kpis;
  const hasSales = (kpis?.orders ?? 0) > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BarChart3}
        title="Análisis"
        description="Rendimiento de tus ventas, productos e inventario"
        actions={
          <ToggleButtonGroup
            aria-label="Periodo"
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={new Set([String(period)])}
            onSelectionChange={(keys) => {
              const [next] = Array.from(keys, Number);
              const match = PERIOD_OPTIONS.find((option) => option.id === next);
              if (match) setPeriod(match.id);
            }}
          >
            {PERIOD_OPTIONS.map((option) => (
              <ToggleButton key={option.id} id={String(option.id)}>
                {option.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        }
      />

      {isLoading ? (
        <div className="flex flex-col items-center gap-3 py-24">
          <Spinner />
          <p className="text-sm text-muted">Calculando métricas...</p>
        </div>
      ) : isError || !data ? (
        <Card>
          <Card.Content className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertTriangle className="size-8 text-warning" />
            <p className="text-sm text-muted">No se pudieron cargar las métricas.</p>
            <Button variant="secondary" onPress={() => refetch()}>
              Reintentar
            </Button>
          </Card.Content>
        </Card>
      ) : (
        <div
          className={cn("space-y-6 transition-opacity", isPlaceholderData && "opacity-60")}
          aria-busy={isPlaceholderData}
        >
          {/* KPIs del periodo */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Ingresos"
              value={formatMoneyCompact(kpis!.revenue)}
              icon={Receipt}
              change={kpis!.revenueChange}
              compareLabel={periodOption.compare}
            />
            <StatTile
              label="Pedidos"
              value={formatInteger(kpis!.orders)}
              icon={ShoppingCart}
              change={kpis!.ordersChange}
              compareLabel={periodOption.compare}
            />
            <StatTile
              label="Ticket promedio"
              value={formatMoneyCompact(kpis!.averageTicket)}
              icon={Package}
              hint={
                kpis!.units > 0
                  ? `${formatInteger(kpis!.units)} ${kpis!.units === 1 ? "unidad vendida" : "unidades vendidas"}`
                  : "Sin unidades vendidas"
              }
            />
            <StatTile
              label="Pagos pendientes"
              value={formatInteger(kpis!.pendingOrders)}
              icon={AlertTriangle}
              hint={`${formatInteger(kpis!.deliveredOrders)} ${
                kpis!.deliveredOrders === 1 ? "pedido entregado" : "pedidos entregados"
              }`}
            />
          </div>

          {/* Ingresos en el tiempo */}
          <Card>
            <Card.Header className="flex flex-row items-start justify-between gap-3">
              <div>
                <Card.Title className="text-base">
                  Ingresos por {data.period.granularity === "month" ? "mes" : "día"}
                </Card.Title>
                <p className="text-xs text-muted">
                  {formatMoney(kpis!.revenue)} en los últimos {periodOption.label}
                </p>
              </div>
            </Card.Header>
            <Card.Content>
              <RevenueChart series={data.series} granularity={data.period.granularity} />
            </Card.Content>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Productos más vendidos */}
            <Card>
              <Card.Header>
                <Card.Title className="text-base">Productos más vendidos</Card.Title>
                <p className="text-xs text-muted">Unidades vendidas en el periodo</p>
              </Card.Header>
              <Card.Content>
                <BarList
                  unit="unidades"
                  emptyMessage="Aún no hay ventas en este periodo"
                  items={data.topProducts.map((product, index) => ({
                    key: product.id ?? `${product.title}-${index}`,
                    label: (
                      <span className="flex items-center gap-2">
                        {product.image ? (
                          <ImageWithSkeleton
                            src={product.image}
                            alt=""
                            className="size-7 shrink-0 rounded-md"
                            sizes="28px"
                          />
                        ) : (
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-secondary">
                            <Package className="size-4 text-muted" />
                          </span>
                        )}
                        <span className="truncate">{product.title}</span>
                      </span>
                    ),
                    value: product.units,
                    display: `${formatInteger(product.units)} ud.`,
                    secondary: formatMoney(product.revenue),
                  }))}
                />
              </Card.Content>
            </Card>

            {/* Estado de los pedidos */}
            <Card>
              <Card.Header>
                <Card.Title className="text-base">Pedidos por estado</Card.Title>
                <p className="text-xs text-muted">
                  {hasSales
                    ? `${formatInteger(kpis!.orders)} ${kpis!.orders === 1 ? "pedido" : "pedidos"} en el periodo`
                    : "Sin pedidos en el periodo"}
                </p>
              </Card.Header>
              <Card.Content>
                <BarList
                  unit="pedidos"
                  emptyMessage="Aún no hay pedidos en este periodo"
                  items={data.byStatus.map((item) => ({
                    key: item.status,
                    label: <VentaStatusChip status={item.status} />,
                    value: item.orders,
                    display: formatInteger(item.orders),
                  }))}
                />
              </Card.Content>
            </Card>

            {/* Medios de pago */}
            <Card>
              <Card.Header>
                <Card.Title className="text-base">Medios de pago</Card.Title>
                <p className="text-xs text-muted">Pedidos e ingresos por método</p>
              </Card.Header>
              <Card.Content>
                <BarList
                  unit="pedidos"
                  emptyMessage="Aún no hay pagos en este periodo"
                  items={data.byPaymentMethod.map((item) => ({
                    key: item.method,
                    label: paymentLabel(item.method),
                    value: item.orders,
                    display: formatInteger(item.orders),
                    secondary: formatMoney(item.revenue),
                  }))}
                />
                {data.byChannel.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                    {data.byChannel.map((item) => (
                      <Chip key={item.channel} size="sm" variant="soft">
                        {channelLabel(item.channel)}: {formatInteger(item.orders)}
                      </Chip>
                    ))}
                  </div>
                )}
              </Card.Content>
            </Card>

            {/* Inventario y catálogo */}
            <Card>
              <Card.Header className="flex flex-row items-start justify-between gap-3">
                <div>
                  <Card.Title className="text-base">Inventario</Card.Title>
                  <p className="text-xs text-muted">
                    Productos con {data.lowStockThreshold} unidades o menos
                  </p>
                </div>
                <Link
                  href="/productos"
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "shrink-0")}
                >
                  Ver productos
                </Link>
              </Card.Header>
              <Card.Content className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <CatalogStat icon={Boxes} label="Productos" value={data.catalog.products} />
                  <CatalogStat icon={Tags} label="Categorías" value={data.catalog.categories} />
                  <CatalogStat
                    icon={AlertTriangle}
                    label="Agotados"
                    value={data.catalog.outOfStock}
                    tone={data.catalog.outOfStock > 0 ? "danger" : "default"}
                  />
                </div>

                {data.lowStock.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted">
                    Ningún producto con stock bajo
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {data.lowStock.map((product) => (
                      <li key={product.id} className="flex items-center gap-3 py-2 text-sm">
                        {product.image ? (
                          <ImageWithSkeleton
                            src={product.image}
                            alt=""
                            className="size-8 shrink-0 rounded-md"
                            sizes="32px"
                          />
                        ) : (
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-secondary">
                            <Package className="size-4 text-muted" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1 truncate">{product.title}</span>
                        <Chip
                          size="sm"
                          variant="soft"
                          color={product.quantity === 0 ? "danger" : "warning"}
                        >
                          {product.quantity === 0
                            ? "Agotado"
                            : `${product.quantity} ${product.quantity === 1 ? "unidad" : "unidades"}`}
                        </Chip>
                      </li>
                    ))}
                  </ul>
                )}

                {data.unreadMessages > 0 && (
                  <Link
                    href="/mensajes"
                    className="flex items-center gap-2 rounded-lg border border-accent/20 bg-accent-soft px-3 py-2 text-sm text-accent hover:underline"
                  >
                    <MessageSquare className="size-4" />
                    {data.unreadMessages}{" "}
                    {data.unreadMessages === 1 ? "mensaje sin leer" : "mensajes sin leer"}
                  </Link>
                )}
              </Card.Content>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function CatalogStat({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof Boxes;
  label: string;
  value: number;
  tone?: "default" | "danger";
}) {
  return (
    <div className="rounded-lg bg-surface-secondary px-2 py-3">
      <Icon
        className={cn("mx-auto mb-1 size-4", tone === "danger" ? "text-danger" : "text-muted")}
      />
      <p className="text-lg font-semibold tabular-nums">{formatInteger(value)}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
