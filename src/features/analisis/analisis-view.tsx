"use client";

import { useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CreditCard,
  Package,
  Receipt,
  ShoppingCart,
} from "lucide-react";
import {
  Button,
  Card,
  Spinner,
  ToggleButton,
  ToggleButtonGroup,
  cn,
} from "@heroui/react";
import { PageHeader } from "@/components/layout/page-header";
import { ImageWithSkeleton } from "@/components/shared/image-with-skeleton";
import { useQueryAnalytics } from "@/app/api/queries";
import type { AnalyticsPeriod } from "@/interfaces/analytics";
import { VentaStatusChip } from "@/features/ventas/components/venta-status-chip";
import { BarList } from "./components/bar-list";
import { PaymentMethodsModal } from "./components/payment-methods-modal";
import { SalesChart } from "./components/sales-chart";
import { StatTile } from "./components/stat-tile";
import {
  PERIOD_OPTIONS,
  formatBucketLong,
  formatInteger,
  formatMoney,
  formatMoneyCompact,
} from "./utils";

const plural = (count: number, singular: string, pluralForm: string) =>
  `${formatInteger(count)} ${count === 1 ? singular : pluralForm}`;

const formatSince = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", { month: "long", year: "numeric", timeZone: "America/Bogota" });

export function AnalisisView() {
  const [period, setPeriod] = useState<AnalyticsPeriod>(30);
  const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);
  const { data, isLoading, isError, isPlaceholderData, refetch } = useQueryAnalytics(period);

  const periodOption = PERIOD_OPTIONS.find((option) => option.id === period) ?? PERIOD_OPTIONS[1];
  const kpis = data?.kpis;
  const hasSales = (kpis?.orders ?? 0) > 0;

  // Ventas por mes: los 12 meses y el mejor mes (para el resumen).
  const months = data?.monthlySales ?? [];
  const monthsTotal = months.reduce((sum, month) => sum + month.orders, 0);
  const bestMonth = months.reduce<(typeof months)[number] | null>(
    (best, month) => (month.orders > (best?.orders ?? 0) ? month : best),
    null,
  );
  const thisMonth = months.at(-1);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BarChart3}
        title="Análisis"
        description="Cuánto vendes y qué se vende más"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onPress={() => setIsPaymentsOpen(true)} isDisabled={!data}>
              <CreditCard className="size-4" />
              Medios de pago
            </Button>
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
          </div>
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
          {/* Resumen del periodo elegido */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Ventas"
              value={formatInteger(kpis!.orders)}
              icon={ShoppingCart}
              change={kpis!.ordersChange}
              compareLabel={periodOption.compare}
            />
            <StatTile
              label="Ingresos"
              value={formatMoneyCompact(kpis!.revenue)}
              icon={Receipt}
              change={kpis!.revenueChange}
              compareLabel={periodOption.compare}
            />
            <StatTile
              label="Venta promedio"
              value={formatMoneyCompact(kpis!.averageTicket)}
              icon={Package}
              hint={kpis!.units > 0 ? `${plural(kpis!.units, "unidad vendida", "unidades vendidas")}` : "Sin unidades vendidas"}
            />
            <StatTile
              label="Pagos pendientes"
              value={formatInteger(kpis!.pendingOrders)}
              icon={AlertTriangle}
              hint={plural(kpis!.deliveredOrders, "venta entregada", "ventas entregadas")}
            />
          </div>

          {/* Ventas por mes: siempre los últimos 12 meses */}
          <Card>
            <Card.Header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Card.Title className="text-base">Ventas por mes</Card.Title>
                <p className="text-xs text-muted">
                  {plural(monthsTotal, "venta", "ventas")} en los últimos 12 meses
                  {bestMonth && ` · mejor mes: ${formatBucketLong(bestMonth.month, "month")} (${plural(bestMonth.orders, "venta", "ventas")})`}
                </p>
              </div>
              <div className="flex shrink-0 gap-3">
                <MiniStat label="Este mes" value={plural(thisMonth?.orders ?? 0, "venta", "ventas")} />
                <MiniStat
                  icon={CalendarDays}
                  label={data.totalSales.since ? `Desde ${formatSince(data.totalSales.since)}` : "En total"}
                  value={plural(data.totalSales.orders, "venta", "ventas")}
                />
              </div>
            </Card.Header>
            <Card.Content>
              <SalesChart
                series={months.map((month) => ({ date: month.month, orders: month.orders, revenue: month.revenue }))}
                granularity="month"
                metric="orders"
                showValues
              />
            </Card.Content>
          </Card>

          {/* Ingresos del periodo elegido */}
          <Card>
            <Card.Header>
              <Card.Title className="text-base">
                Ingresos por {data.period.granularity === "month" ? "mes" : "día"}
              </Card.Title>
              <p className="text-xs text-muted">
                {formatMoney(kpis!.revenue)} en los últimos {periodOption.label}
              </p>
            </Card.Header>
            <Card.Content>
              <SalesChart series={data.series} granularity={data.period.granularity} />
            </Card.Content>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Productos más vendidos */}
            <Card>
              <Card.Header>
                <Card.Title className="text-base">Productos más vendidos</Card.Title>
                <p className="text-xs text-muted">Unidades vendidas en los últimos {periodOption.label}</p>
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

            {/* Estado de las ventas */}
            <Card>
              <Card.Header>
                <Card.Title className="text-base">Ventas por estado</Card.Title>
                <p className="text-xs text-muted">
                  {hasSales ? `${plural(kpis!.orders, "venta", "ventas")} en los últimos ${periodOption.label}` : "Sin ventas en el periodo"}
                </p>
              </Card.Header>
              <Card.Content>
                <BarList
                  unit="ventas"
                  emptyMessage="Aún no hay ventas en este periodo"
                  items={data.byStatus.map((item) => ({
                    key: item.status,
                    label: <VentaStatusChip status={item.status} />,
                    value: item.orders,
                    display: formatInteger(item.orders),
                  }))}
                />
              </Card.Content>
            </Card>
          </div>

          <PaymentMethodsModal
            isOpen={isPaymentsOpen}
            onOpenChange={setIsPaymentsOpen}
            byPaymentMethod={data.byPaymentMethod}
            byChannel={data.byChannel}
            periodLabel={periodOption.label}
          />
        </div>
      )}
    </div>
  );
}

/** Dato pequeño en el encabezado de una tarjeta. */
function MiniStat({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof CalendarDays }) {
  return (
    <div className="rounded-lg bg-surface-secondary px-3 py-2">
      <p className="flex items-center gap-1 text-xs text-muted">
        {Icon && <Icon className="size-3" />}
        {label}
      </p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
