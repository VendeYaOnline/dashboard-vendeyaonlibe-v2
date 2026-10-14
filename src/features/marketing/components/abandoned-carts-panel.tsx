"use client";

import { useEffect, useState } from "react";
import { ExternalLink, ShoppingCart, X } from "lucide-react";
import {
  Button,
  Card,
  Chip,
  Label,
  ListBox,
  ListBoxItem,
  Select,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  buttonVariants,
  cn,
  toast,
} from "@heroui/react";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { TablePagination } from "@/components/shared/table-pagination";
import { useQueryAbandonedCarts } from "@/app/api/queries";
import { useMutationUpdateAbandonedCart, useMutationUpdateAbandonedCartSettings } from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import { useAuthStore } from "@/store/auth.store";
import { formatMoney } from "@/features/analisis/utils";
import type { AbandonedCart, AbandonedCartsFilter } from "@/interfaces/marketing";
import { formatDateTime } from "./campaign-shared";

const PAGE_SIZE = 10;

/** Estado de un carrito, en palabras. */
const cartState = (cart: AbandonedCart): { label: string; color: "default" | "success" | "warning" | "danger" | "accent" } => {
  if (cart.status === "recovered") return { label: "Compró", color: "success" };
  if (cart.status === "reminded") return { label: "Correo enviado", color: "accent" };
  if (cart.status === "contacted") return { label: "WhatsApp enviado", color: "accent" };
  if (cart.status === "dismissed") return { label: "Descartado", color: "default" };
  if (cart.promotions === "declined" || cart.promotions === "unsubscribed") return { label: "No recibe promociones", color: "danger" };
  return { label: "Sin recordar", color: "warning" };
};

/**
 * Carritos abandonados: quién llenó sus datos en el checkout y no compró.
 * Recordatorio automático por correo (configurable) y WhatsApp a mano con el
 * mensaje listo. Si el cliente compra, el carrito pasa a "Compró".
 */
export function AbandonedCartsPanel() {
  const isAdmin = useAuthStore((s) => s.user?.role) === "admin";
  const [filter, setFilter] = useState<AbandonedCartsFilter>("abandoned");
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [filter]);

  const { data, isLoading, isPlaceholderData } = useQueryAbandonedCarts({ page, status: filter });
  const update = useMutationUpdateAbandonedCart();
  const settings = useMutationUpdateAbandonedCartSettings();
  const rows = data?.items ?? [];
  const summary = data?.summary;
  const config = data?.config;

  const saveConfig = (next: { email_enabled: boolean; delay_hours: number }) =>
    settings.mutate(next, {
      onSuccess: () => toast.success("Configuración guardada"),
      onError: (error) => handleAxiosError(error, "No se pudo guardar"),
    });

  const setStatus = (cart: AbandonedCart, status: "contacted" | "dismissed" | "open") =>
    update.mutate({ id: cart.id, status }, { onError: (error) => handleAxiosError(error, "No se pudo actualizar") });

  const columns: DataTableColumn<AbandonedCart>[] = [
    {
      key: "customer",
      label: "Cliente",
      isRowHeader: true,
      render: (cart) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{cart.name}</p>
          <p className="max-w-52 truncate text-xs text-muted">{[cart.phone, cart.email].filter(Boolean).join(" · ")}</p>
        </div>
      ),
    },
    {
      key: "products",
      label: "Productos",
      render: (cart) => (
        <div className="max-w-64 text-xs">
          {cart.products.slice(0, 2).map((product) => (
            <p key={product.id} className="truncate">
              {product.quantity > 1 && <span className="text-muted">{product.quantity}× </span>}
              {product.title}
            </p>
          ))}
          {cart.products.length > 2 && <p className="text-muted">y {cart.products.length - 2} más</p>}
        </div>
      ),
    },
    {
      key: "total",
      label: "Total",
      render: (cart) => <span className="whitespace-nowrap text-sm font-semibold tabular-nums">{formatMoney(cart.total)}</span>,
    },
    {
      key: "when",
      label: "Cuándo",
      render: (cart) => (
        <div className="text-xs">
          <p className="whitespace-nowrap">{formatDateTime(cart.updated_at)}</p>
          {cart.reminded_at && cart.status !== "recovered" && (
            <p className="whitespace-nowrap text-muted">Recordado {formatDateTime(cart.reminded_at)}</p>
          )}
          {cart.recovered_at && <p className="whitespace-nowrap text-success">Compró {formatDateTime(cart.recovered_at)}</p>}
        </div>
      ),
    },
    {
      key: "state",
      label: "Estado",
      render: (cart) => {
        const state = cartState(cart);
        return (
          <Chip size="sm" variant="soft" color={state.color}>
            {state.label}
          </Chip>
        );
      },
    },
    {
      key: "actions",
      label: "Acciones",
      align: "end",
      render: (cart) =>
        cart.status === "recovered" ? null : (
          <div className="flex justify-end gap-1">
            {cart.whatsapp_url && cart.status !== "dismissed" && (
              <a
                href={cart.whatsapp_url}
                target="_blank"
                rel="noopener noreferrer"
                // Abrir el chat lo deja como "WhatsApp enviado".
                onClick={() => cart.status !== "contacted" && setStatus(cart, "contacted")}
                className={cn(buttonVariants({ variant: cart.status === "contacted" ? "ghost" : "primary", size: "sm" }))}
              >
                <ExternalLink className="size-3.5" />
                {cart.status === "contacted" ? "Abrir otra vez" : "Abrir WhatsApp"}
              </a>
            )}
            {cart.status === "dismissed" ? (
              <Button variant="ghost" size="sm" onPress={() => setStatus(cart, "open")}>
                Restaurar
              </Button>
            ) : (
              <Button variant="ghost" size="sm" isIconOnly aria-label={`Descartar el carrito de ${cart.name}`} onPress={() => setStatus(cart, "dismissed")}>
                <X className="size-3.5" />
              </Button>
            )}
          </div>
        ),
    },
  ];

  const options: { id: AbandonedCartsFilter; label: string }[] = [
    { id: "abandoned", label: `Abandonados${summary ? ` (${summary.abandoned})` : ""}` },
    { id: "recovered", label: `Compraron${summary ? ` (${summary.recovered})` : ""}` },
    { id: "all", label: "Todos" },
  ];

  return (
    <Card className={cn("overflow-hidden transition-opacity", isPlaceholderData && "opacity-60")} aria-busy={isPlaceholderData}>
      <div className="space-y-4 px-5 pt-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-semibold">
              <ShoppingCart className="size-4" /> Carritos abandonados
            </h2>
            <p className="max-w-2xl text-xs text-muted">
              Clientes que llenaron sus datos en el checkout de tu tienda y no terminaron la compra. Si compran después, pasan a
              «Compraron». Solo se les escribe si no rechazaron promociones.
            </p>
          </div>
          {summary && summary.recovered > 0 && (
            <div className="rounded-lg bg-success/10 px-3 py-2 text-right">
              <p className="text-xs text-muted">Recuperado en 30 días</p>
              <p className="font-semibold tabular-nums text-success">{formatMoney(summary.recovered_total)}</p>
            </div>
          )}
        </div>

        {config && (
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-secondary px-4 py-3 sm:flex-row sm:items-center">
            <Switch
              isSelected={config.email_enabled}
              isDisabled={!isAdmin || settings.isPending}
              onChange={(enabled) => saveConfig({ ...config, email_enabled: enabled })}
            >
              <Switch.Content>
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
                <Label className="text-sm">Recordatorio automático por correo</Label>
              </Switch.Content>
            </Switch>
            <div className="flex items-center gap-2 sm:ml-auto">
              <span className="text-xs text-muted">Esperar</span>
              <Select
                aria-label="Horas de espera"
                selectedKey={String(config.delay_hours)}
                isDisabled={!isAdmin || settings.isPending}
                onSelectionChange={(key) => saveConfig({ ...config, delay_hours: Number(key) })}
                className="w-32"
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {(data?.delay_options ?? []).map((hours) => (
                      <ListBoxItem key={hours} id={String(hours)}>
                        {hours === 1 ? "1 hora" : `${hours} horas`}
                      </ListBoxItem>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
            <p className="text-xs text-muted sm:basis-full">
              {config.email_enabled
                ? `Si no compra en ${config.delay_hours} ${config.delay_hours === 1 ? "hora" : "horas"}, se le envía un solo correo con sus productos. Por WhatsApp, ábrelo desde aquí.`
                : "El correo automático está desactivado: escríbeles por WhatsApp desde aquí."}
            </p>
          </div>
        )}

        <ToggleButtonGroup
          aria-label="Filtrar carritos"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={new Set([filter])}
          onSelectionChange={(keys) => {
            const [next] = Array.from(keys, String);
            if (next) setFilter(next as AbandonedCartsFilter);
          }}
        >
          {options.map((option) => (
            <ToggleButton key={option.id} id={option.id}>
              {option.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>
      <DataTable
        aria-label="Carritos abandonados"
        items={rows}
        columns={columns}
        getRowId={(cart) => cart.id}
        isLoading={isLoading}
        loadingMessage="Cargando carritos..."
        emptyMessage={filter === "recovered" ? "Aún no hay carritos recuperados" : "No hay carritos abandonados"}
      />
      <TablePagination
        currentPage={page}
        totalPages={data?.totalPages ?? 1}
        totalItems={data?.total ?? 0}
        itemsInPage={rows.length}
        itemLabel="carritos"
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </Card>
  );
}
