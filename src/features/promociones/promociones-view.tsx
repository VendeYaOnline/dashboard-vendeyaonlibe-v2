"use client";

import { useEffect, useState } from "react";
import { Button, Card, Chip, Switch, toast } from "@heroui/react";
import { IconAction } from "@/components/shared/icon-action";
import { Copy, Edit2, Plus, TicketPercent, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { SearchField } from "@/components/shared/search-field";
import { TablePagination } from "@/components/shared/table-pagination";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useQueryPromoCodes } from "@/app/api/queries";
import {
  useMutationCreatePromoCode,
  useMutationDeletePromoCode,
  useMutationTogglePromoCode,
  useMutationUpdatePromoCode,
} from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import { useAuthStore } from "@/store/auth.store";
import { formatCOP } from "@/features/productos/utils";
import type { PromoCode, PromoCodePayload } from "@/interfaces/promo-codes";
import { PromoCodeFormModal } from "./components/promo-code-form-modal";
import { PROMO_STATUS, describeDiscount, describeValidity } from "./utils";

const SCOPE_LABELS = {
  all: "Toda la tienda",
  categories: "Categorías",
  products: "Productos",
} as const;

export function PromocionesView() {
  const canManage = useAuthStore((s) => s.user?.role) !== "viewer";

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selected, setSelected] = useState<PromoCode | null>(null);
  const [toDelete, setToDelete] = useState<PromoCode | null>(null);

  useEffect(() => setPage(1), [debouncedSearch]);

  const { data, isLoading, isPlaceholderData } = useQueryPromoCodes(page, debouncedSearch);
  const createMutation = useMutationCreatePromoCode();
  const updateMutation = useMutationUpdatePromoCode();
  const toggleMutation = useMutationTogglePromoCode();
  const deleteMutation = useMutationDeletePromoCode();

  const promoCodes = data?.promoCodes ?? [];

  const closeForm = () => {
    setIsFormOpen(false);
    setSelected(null);
  };

  const handleSubmit = (payload: PromoCodePayload) => {
    if (selected) {
      updateMutation.mutate(
        { id: selected.id, ...payload },
        {
          onSuccess: () => {
            toast.success("Código promocional actualizado");
            closeForm();
          },
          onError: (error) => handleAxiosError(error, "Error al actualizar el código"),
        },
      );
      return;
    }
    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success(`Código ${payload.code} creado`);
        closeForm();
      },
      onError: (error) => handleAxiosError(error, "Error al crear el código"),
    });
  };

  const handleToggle = (promo: PromoCode, isActive: boolean) => {
    toggleMutation.mutate(
      { id: promo.id, isActive },
      {
        onSuccess: () => toast.success(isActive ? `${promo.code} activado` : `${promo.code} pausado`),
        onError: (error) => handleAxiosError(error, "No se pudo cambiar el estado"),
      },
    );
  };

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Código ${code} copiado`);
    } catch {
      toast.danger("No se pudo copiar el código");
    }
  };

  const handleConfirmDelete = () => {
    if (!toDelete) return;
    deleteMutation.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success("Código promocional eliminado");
        setToDelete(null);
      },
      onError: (error) => handleAxiosError(error, "Error al eliminar el código"),
    });
  };

  const columns: DataTableColumn<PromoCode>[] = [
    {
      key: "code",
      label: "Código",
      isRowHeader: true,
      render: (promo) => (
        <div className="flex flex-col">
          <span className="inline-flex items-center gap-1.5">
            <span className="font-mono font-semibold tracking-wide">{promo.code}</span>
            <button
              type="button"
              onClick={() => handleCopy(promo.code)}
              className="rounded p-0.5 text-muted hover:text-foreground"
              aria-label={`Copiar ${promo.code}`}
              title="Copiar código"
            >
              <Copy className="size-3.5" />
            </button>
          </span>
          {promo.description && (
            <span className="max-w-56 truncate text-xs text-muted" title={promo.description}>
              {promo.description}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "discount",
      label: "Descuento",
      render: (promo) => (
        <div className="flex flex-col">
          <span className="font-semibold">{describeDiscount(promo)}</span>
          {promo.min_purchase != null && (
            <span className="text-xs text-muted">Mínimo {formatCOP(promo.min_purchase)}</span>
          )}
        </div>
      ),
    },
    {
      key: "scope",
      label: "Aplica a",
      render: (promo) => (
        <div className="flex flex-col">
          <span>
            {SCOPE_LABELS[promo.scope]}
            {promo.scope === "categories" && ` (${promo.category_ids.length})`}
            {promo.scope === "products" && ` (${promo.products.length})`}
          </span>
          {promo.include_discounted && <span className="text-xs text-muted">Incluye productos en oferta</span>}
        </div>
      ),
    },
    {
      key: "validity",
      label: "Vigencia",
      render: (promo) => <span className="text-sm">{describeValidity(promo)}</span>,
    },
    {
      key: "uses",
      label: "Usos",
      render: (promo) => (
        <span className="tabular-nums">
          {promo.uses_count}
          <span className="text-muted"> / {promo.max_uses ?? "∞"}</span>
        </span>
      ),
    },
    {
      key: "status",
      label: "Estado",
      render: (promo) => {
        const status = PROMO_STATUS[promo.status];
        return (
          <Chip size="sm" variant="soft" color={status.color} title={status.hint}>
            {status.label}
          </Chip>
        );
      },
    },
    {
      key: "actions",
      label: "Acciones",
      align: "end",
      render: (promo) => (
        <div className="flex items-center justify-end gap-1">
          <Switch
            size="sm"
            isSelected={promo.is_active}
            isDisabled={!canManage || toggleMutation.isPending}
            onChange={(isActive) => handleToggle(promo, isActive)}
            aria-label={promo.is_active ? `Pausar ${promo.code}` : `Activar ${promo.code}`}
          >
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Content>
          </Switch>
          <IconAction
            tooltip="Editar código"
            aria-label={`Editar ${promo.code}`}
            isDisabled={!canManage}
            onPress={() => {
              setSelected(promo);
              setIsFormOpen(true);
            }}
          >
            <Edit2 className="size-4" />
          </IconAction>
          <IconAction
            tooltip="Eliminar código"
            aria-label={`Eliminar ${promo.code}`}
            className="text-danger"
            isDisabled={!canManage}
            onPress={() => setToDelete(promo)}
          >
            <Trash2 className="size-4" />
          </IconAction>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={TicketPercent}
        title="Códigos promocionales"
        description="Crea códigos de descuento que tus clientes aplican al pagar en tu tienda"
        actions={
          <Button
            variant="primary"
            isDisabled={!canManage}
            onPress={() => {
              setSelected(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            Crear código
          </Button>
        }
      />

      <Card>
        <Card.Content className="p-4">
          <SearchField
            aria-label="Buscar códigos"
            placeholder="Buscar por código..."
            value={search}
            onChange={setSearch}
          />
        </Card.Content>
      </Card>

      <Card
        className={`overflow-hidden transition-opacity ${isPlaceholderData ? "opacity-60" : ""}`}
        aria-busy={isPlaceholderData}
      >
        <DataTable
          aria-label="Códigos promocionales"
          items={promoCodes}
          columns={columns}
          getRowId={(promo) => promo.id}
          isLoading={isLoading}
          loadingMessage="Cargando códigos..."
          emptyMessage={
            debouncedSearch
              ? "No se encontraron códigos"
              : "Aún no tienes códigos promocionales. Crea el primero para ofrecer descuentos."
          }
        />
        <TablePagination
          currentPage={page}
          totalPages={data?.totalPages ?? 1}
          totalItems={data?.total ?? 0}
          itemsInPage={promoCodes.length}
          itemLabel="códigos"
          onPageChange={setPage}
        />
      </Card>

      {isFormOpen && (
        <PromoCodeFormModal
          promoCode={selected}
          isOpen={isFormOpen}
          onOpenChange={(open) => (open ? setIsFormOpen(true) : closeForm())}
          onSubmit={handleSubmit}
          isPending={createMutation.isPending || updateMutation.isPending}
        />
      )}

      <ConfirmDialog
        isOpen={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar código promocional"
        description={
          <>
            ¿Seguro que deseas eliminar el código{" "}
            <span className="font-semibold text-foreground">&quot;{toDelete?.code}&quot;</span>? Los clientes ya
            no podrán usarlo. Las ventas donde se usó conservan el registro del descuento.
            {toDelete?.is_active && " Si solo quieres detenerlo por un tiempo, puedes pausarlo."}
          </>
        }
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
