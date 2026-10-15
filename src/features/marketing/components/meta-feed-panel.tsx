"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Copy, Power, RefreshCw, SlidersHorizontal, Store } from "lucide-react";
import { Button, Card, Spinner, toast } from "@heroui/react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useQueryMetaFeed } from "@/app/api/queries";
import { useMutationDisableMetaFeed, useMutationRotateMetaFeed } from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import { useAuthStore } from "@/store/auth.store";
import { ExportarCatalogoModal } from "@/features/productos/components/exportar-catalogo-modal";
import type { MetaCatalogFilters, MetaFeedSavedFilters } from "@/interfaces/catalog";
import { formatDateTime } from "./campaign-shared";

/** Filtros guardados → formulario del modal. */
const toFormFilters = (saved: MetaFeedSavedFilters): MetaCatalogFilters => ({
  grouping: saved.grouping,
  categoryIds: saved.categoryIds,
  includeOutOfStock: saved.includeOutOfStock,
  discountedOnly: saved.discountedOnly,
  minPrice: saved.minPrice === null ? "" : String(saved.minPrice),
  maxPrice: saved.maxPrice === null ? "" : String(saved.maxPrice),
  storeUrl: saved.storeUrl ?? "",
  brand: saved.brand,
});

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("URL copiada. Pégala en Meta Commerce Manager.");
  } catch {
    toast.danger("No se pudo copiar. Selecciónala y cópiala a mano.");
  }
};

/** Pasos en Meta Commerce Manager. */
function MetaSteps() {
  return (
    <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted">
      <li>
        Entra a <span className="font-medium text-foreground">Meta Commerce Manager</span> (business.facebook.com/commerce) y
        abre tu catálogo. Si no tienes uno, crea uno de tipo comercio electrónico.
      </li>
      <li>
        Ve a <span className="font-medium text-foreground">Orígenes de datos</span>, agrega productos con una{" "}
        <span className="font-medium text-foreground">fuente de datos</span> y elige{" "}
        <span className="font-medium text-foreground">«Usar una URL»</span>.
      </li>
      <li>Pega la URL de arriba. Deja vacíos el usuario y la contraseña.</li>
      <li>
        Programa la actualización <span className="font-medium text-foreground">cada hora</span> (o cada día) y, si Meta lo
        pregunta, elige <span className="font-medium text-foreground">«Reemplazar el archivo de datos»</span>: así los
        productos que ocultes en tu tienda también salen de Meta.
      </li>
    </ol>
  );
}

/**
 * Catálogo automático para Meta (parte de Marketing): una URL secreta que Meta
 * lee sola cada cierto tiempo, para que los anuncios de Facebook e Instagram
 * muestren siempre los precios, fotos y unidades al día. El admin la activa y
 * elige los productos; el editor la ve y la copia.
 */
export function MetaFeedPanel() {
  const isAdmin = useAuthStore((s) => s.user?.role) === "admin";
  const { data: feed, isLoading } = useQueryMetaFeed();
  const rotate = useMutationRotateMetaFeed();
  const disable = useMutationDisableMetaFeed();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [confirm, setConfirm] = useState<"rotate" | "disable" | null>(null);

  const handleConfirm = () => {
    const action = confirm === "rotate" ? rotate : disable;
    action.mutate(undefined, {
      onSuccess: () => {
        toast.success(
          confirm === "rotate"
            ? "URL nueva lista. Cámbiala en Meta: la anterior ya no funciona."
            : "Catálogo automático desactivado.",
        );
        setConfirm(null);
      },
      onError: (error) => handleAxiosError(error, "No se pudo guardar el cambio"),
    });
  };

  return (
    <Card>
      <Card.Content className="space-y-4 p-5">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            <Store className="size-4" /> Catálogo automático para Meta
          </h2>
          <p className="max-w-2xl text-xs text-muted">
            Conecta tu catálogo de Facebook e Instagram con una URL: Meta la lee sola cada hora y tus anuncios muestran
            siempre tus precios, fotos y unidades al día. Sin descargar ni subir archivos.
          </p>
        </div>

        {isLoading || !feed ? (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Spinner size="sm" /> Cargando...
          </p>
        ) : !feed.enabled || !feed.url ? (
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-secondary px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              {isAdmin
                ? "Elige qué productos quieres en Meta y obtén tu URL."
                : "Aún no está activo. Pídele al administrador de la tienda que lo active."}
            </p>
            {isAdmin && (
              <Button variant="primary" onPress={() => setIsFiltersOpen(true)}>
                <CheckCircle2 className="size-4" />
                Activar catálogo automático
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Tu URL para Meta</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  readOnly
                  value={feed.url}
                  aria-label="URL del catálogo para Meta"
                  onFocus={(event) => event.currentTarget.select()}
                  className="min-w-0 flex-1 rounded-lg border border-border bg-surface-secondary px-3 py-2 font-mono text-xs"
                />
                <Button variant="primary" onPress={() => copyToClipboard(feed.url ?? "")}>
                  <Copy className="size-4" />
                  Copiar URL
                </Button>
              </div>
              <p className="text-xs text-muted">Es privada: no la compartas fuera de Meta.</p>
            </div>

            {feed.last_fetched_at ? (
              <p className="flex items-center gap-2 text-sm text-success">
                <CheckCircle2 className="size-4 shrink-0" />
                Meta la leyó por última vez el {formatDateTime(feed.last_fetched_at)}
                {feed.last_rows ? ` (${feed.last_rows.toLocaleString("es-CO")} ${feed.last_rows === 1 ? "producto" : "productos"})` : ""}.
              </p>
            ) : (
              <p className="flex items-start gap-2 text-sm text-warning">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                Meta aún no la ha leído. Pégala en Commerce Manager siguiendo los pasos de abajo.
              </p>
            )}

            <details className="group rounded-lg border border-border p-4" open={!feed.last_fetched_at}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium">
                ¿Cómo la conecto en Meta?
                <ChevronDown className="size-4 text-muted transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-3">
                <MetaSteps />
              </div>
            </details>

            {isAdmin && (
              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                <Button variant="outline" onPress={() => setIsFiltersOpen(true)}>
                  <SlidersHorizontal className="size-4" />
                  Elegir productos
                </Button>
                <Button variant="ghost" onPress={() => setConfirm("rotate")}>
                  <RefreshCw className="size-4" />
                  Generar URL nueva
                </Button>
                <Button variant="ghost" className="text-danger" onPress={() => setConfirm("disable")}>
                  <Power className="size-4" />
                  Desactivar
                </Button>
              </div>
            )}
          </>
        )}

        <p className="text-xs text-muted">
          Incluido en Marketing. Si Marketing deja de estar activo, Meta deja de recibir actualizaciones pero conserva tus
          productos tal como estaban; al reactivarlo, la misma URL vuelve a funcionar.
        </p>
      </Card.Content>

      {isFiltersOpen && (
        <ExportarCatalogoModal
          isOpen={isFiltersOpen}
          onOpenChange={setIsFiltersOpen}
          mode="feed"
          initialFilters={feed?.enabled && feed.filters ? toFormFilters(feed.filters) : undefined}
        />
      )}

      <ConfirmDialog
        isOpen={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        onConfirm={handleConfirm}
        tone={confirm === "disable" ? "danger" : "accent"}
        title={confirm === "rotate" ? "¿Generar una URL nueva?" : "¿Desactivar el catálogo automático?"}
        description={
          confirm === "rotate"
            ? "La URL actual deja de funcionar al instante. Tendrás que pegar la nueva en Meta Commerce Manager. Úsalo si crees que alguien más tiene tu URL."
            : "Meta deja de recibir actualizaciones, pero conserva tus productos tal como estaban. Puedes volver a activarlo cuando quieras (con una URL nueva)."
        }
        confirmLabel={confirm === "rotate" ? "Generar URL nueva" : "Desactivar"}
        pendingLabel="Guardando"
        isPending={rotate.isPending || disable.isPending}
      />
    </Card>
  );
}
