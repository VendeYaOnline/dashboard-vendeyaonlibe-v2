"use client";

import { useEffect, useState } from "react";
import { MessageCircle, RotateCcw, ShoppingCart, X } from "lucide-react";
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
import type { AbandonedCart, AbandonedCartConfig, AbandonedCartsFilter, AbandonedCartWhatsappTarget } from "@/interfaces/marketing";
import { formatDateTime } from "./campaign-shared";

const PAGE_SIZE = 10;

const WHATSAPP_TARGETS: { id: AbandonedCartWhatsappTarget; label: string }[] = [
  { id: "no_email", label: "Solo a quien no recibe el correo" },
  { id: "all", label: "A todos, además del correo" },
];

/** Recordatorio automático, en palabras según el canal. */
const reminderLabel = (channel: string | null) => {
  const channels = (channel ?? "email").split(",");
  if (channels.includes("email") && channels.includes("whatsapp")) return "Correo y WhatsApp enviados";
  return channels.includes("whatsapp") ? "WhatsApp enviado" : "Correo enviado";
};

/** Estado de un carrito, en palabras. */
const cartState = (cart: AbandonedCart): { label: string; color: "default" | "success" | "warning" | "danger" | "accent" } => {
  if (cart.status === "recovered") return { label: "Compró", color: "success" };
  if (cart.status === "reminded") return { label: reminderLabel(cart.reminder_channel), color: "accent" };
  if (cart.status === "contacted") return { label: "WhatsApp enviado", color: "accent" };
  if (cart.status === "dismissed") return { label: "Descartado", color: "default" };
  if (cart.promotions === "declined" || cart.promotions === "unsubscribed") return { label: "No recibe promociones", color: "danger" };
  return { label: "Sin recordar", color: "warning" };
};

/**
 * Carritos abandonados: quién llenó sus datos en el checkout y no compró.
 * Recordatorio automático por correo y, con WhatsApp Business conectado, por
 * WhatsApp (los dos configurables); también WhatsApp a mano con el mensaje
 * listo. Si el cliente compra, el carrito pasa a "Compró".
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

  const saveConfig = (next: AbandonedCartConfig) =>
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
        cart.status === "recovered" ? (
          <span className="text-xs text-muted">Sin acciones</span>
        ) : cart.status === "dismissed" ? (
          <Button variant="outline" size="sm" onPress={() => setStatus(cart, "open")}>
            <RotateCcw className="size-3.5" />
            Restaurar
          </Button>
        ) : (
          <div className="flex items-center justify-end gap-2">
            {cart.whatsapp_url ? (
              <a
                href={cart.whatsapp_url}
                target="_blank"
                rel="noopener noreferrer"
                // Abrir el chat lo deja como "WhatsApp enviado".
                onClick={() => cart.status !== "contacted" && setStatus(cart, "contacted")}
                className={cn(
                  buttonVariants({ variant: cart.status === "contacted" ? "outline" : "primary", size: "sm" }),
                  "whitespace-nowrap",
                )}
              >
                <MessageCircle className="size-3.5" />
                {cart.status === "contacted" ? "Escribir otra vez" : "Escribir por WhatsApp"}
              </a>
            ) : (
              <span className="text-xs text-muted">{cart.phone ? "No recibe promociones" : "Sin celular"}</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              isIconOnly
              aria-label={`Descartar el carrito de ${cart.name}`}
              onPress={() => setStatus(cart, "dismissed")}
            >
              <X className="size-4" />
            </Button>
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
          <div className="grid gap-4 rounded-lg border border-border bg-surface-secondary px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="space-y-1">
            <Switch
              isSelected={config.email_enabled}
              isDisabled={!isAdmin || settings.isPending}
              onChange={(enabled) => saveConfig({ ...config, email_enabled: enabled })}
            >
              <Switch.Content>
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
                <Label className="text-sm font-medium">Recordatorio automático por correo</Label>
              </Switch.Content>
            </Switch>
            <p className="text-xs text-muted">
              {config.email_enabled
                ? `Si no compra en ${config.delay_hours} ${config.delay_hours === 1 ? "hora" : "horas"}, se le envía un solo correo con sus productos.`
                : "El correo automático está desactivado."}
            </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">Enviar después de</span>
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

            <div className="space-y-1 border-t border-border pt-3 sm:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Switch
                  isSelected={config.whatsapp_enabled}
                  isDisabled={!isAdmin || settings.isPending || (!data?.whatsapp_api && !config.whatsapp_enabled)}
                  onChange={(enabled) => saveConfig({ ...config, whatsapp_enabled: enabled })}
                >
                  <Switch.Content>
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                    <Label className="text-sm font-medium">Recordatorio automático por WhatsApp</Label>
                  </Switch.Content>
                </Switch>
                {config.whatsapp_enabled && (
                  <Select
                    aria-label="A quién se le envía el WhatsApp"
                    selectedKey={config.whatsapp_target}
                    isDisabled={!isAdmin || settings.isPending}
                    onSelectionChange={(key) => saveConfig({ ...config, whatsapp_target: key as AbandonedCartWhatsappTarget })}
                    className="w-full sm:w-72"
                  >
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {WHATSAPP_TARGETS.map((target) => (
                          <ListBoxItem key={target.id} id={target.id}>
                            {target.label}
                          </ListBoxItem>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                )}
              </div>
              <p className="text-xs text-muted">
                {!data?.whatsapp_api
                  ? "Conecta WhatsApp Business (en «Nueva campaña», canal WhatsApp) para activarlo. Mientras tanto, escríbeles desde la tabla."
                  : config.whatsapp_enabled
                    ? `Le llega un WhatsApp con sus productos y el enlace para terminar la compra, con tu plantilla aprobada en Meta. ${
                        config.whatsapp_target === "all" ? "Le llega aunque también reciba el correo." : "Solo si no dejó correo o el correo no se le puede enviar."
                      } Meta le cobra cada mensaje a tu cuenta.`
                    : "Envía el recordatorio por WhatsApp sin abrir cada chat. Meta le cobra cada mensaje a tu cuenta."}
              </p>
              {config.whatsapp_enabled && !data?.whatsapp_api && (
                <p className="text-xs text-warning">WhatsApp Business ya no está conectado: no se están enviando recordatorios por WhatsApp.</p>
              )}
            </div>
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
