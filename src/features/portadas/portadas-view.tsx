"use client";

import { useEffect, useState } from "react";
import { Button, Card, Chip, Tooltip, cn, toast } from "@heroui/react";
import { ArrowDown, ArrowUp, Edit2, ExternalLink, LayoutTemplate, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ImageWithSkeleton } from "@/components/shared/image-with-skeleton";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { SearchField } from "@/components/shared/search-field";
import { TablePagination } from "@/components/shared/table-pagination";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useQueryCovers } from "@/app/api/queries";
import {
  useMutationCreateCover,
  useMutationDeleteCover,
  useMutationReorderCovers,
  useMutationUpdateCover,
} from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import { useAuthStore } from "@/store/auth.store";
import type { Cover, CoverPayload } from "@/interfaces/covers";
import { PortadaFormModal } from "./components/portada-form-modal";
import { MAX_COVERS } from "./constants";

/** Total de portadas de la empresa (sin filtro), para saber si la lista está completa. */
const grandTotalOf = (data: { grandTotal: number } | undefined) => data?.grandTotal ?? 0;

export function PortadasView() {
  const canManage = useAuthStore((s) => s.user?.role) !== "viewer";

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selected, setSelected] = useState<Cover | null>(null);
  const [toDelete, setToDelete] = useState<Cover | null>(null);

  useEffect(() => setPage(1), [debouncedSearch]);

  const { data, isLoading, isPlaceholderData } = useQueryCovers(page, debouncedSearch);
  const createMutation = useMutationCreateCover();
  const updateMutation = useMutationUpdateCover();
  const deleteMutation = useMutationDeleteCover();
  const reorderMutation = useMutationReorderCovers();

  const covers = data?.covers ?? [];
  // El orden solo se puede cambiar viendo la lista completa (sin búsqueda; caben en una página).
  const canReorder = canManage && debouncedSearch === "" && covers.length === grandTotalOf(data);

  const moveCover = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= covers.length) return;
    const ids = covers.map((cover) => cover.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorderMutation.mutate(ids, {
      onError: (error) => handleAxiosError(error, "No se pudo cambiar el orden"),
    });
  };
  const maxCovers = data?.maxCovers ?? MAX_COVERS;
  const grandTotal = data?.grandTotal ?? 0;
  const isLimitReached = grandTotal >= maxCovers;

  const handleSubmit = (values: CoverPayload) => {
    if (selected) {
      updateMutation.mutate(
        { id: selected.id, ...values },
        {
          onSuccess: () => {
            toast.success("Portada actualizada correctamente");
            setIsFormOpen(false);
            setSelected(null);
          },
          onError: (error) => handleAxiosError(error, "Error al actualizar la portada"),
        },
      );
      return;
    }

    createMutation.mutate(values, {
      onSuccess: () => {
        toast.success("Portada creada correctamente");
        setIsFormOpen(false);
      },
      onError: (error) => handleAxiosError(error, "Error al crear la portada"),
    });
  };

  const handleConfirmDelete = () => {
    if (!toDelete) return;
    deleteMutation.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success("Portada eliminada correctamente");
        setToDelete(null);
      },
      onError: (error) => handleAxiosError(error, "Error al eliminar la portada"),
    });
  };

  const columns: DataTableColumn<Cover>[] = [
    {
      key: "order",
      label: "Orden",
      className: "w-24",
      render: (cover) => {
        const index = covers.findIndex((item) => item.id === cover.id);
        return (
          <div className="flex items-center gap-1">
            <span className="w-5 text-center text-sm font-medium tabular-nums text-muted">
              {index + 1}
            </span>
            <Button
              variant="ghost"
              size="sm"
              isIconOnly
              aria-label={`Subir ${cover.title}`}
              isDisabled={!canReorder || index === 0 || reorderMutation.isPending}
              onPress={() => moveCover(index, -1)}
            >
              <ArrowUp className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              isIconOnly
              aria-label={`Bajar ${cover.title}`}
              isDisabled={!canReorder || index === covers.length - 1 || reorderMutation.isPending}
              onPress={() => moveCover(index, 1)}
            >
              <ArrowDown className="size-4" />
            </Button>
          </div>
        );
      },
    },
    {
      key: "image",
      label: "Imagen",
      render: (cover) => (
        <ImageWithSkeleton
          src={cover.image}
          alt={cover.title}
          sizes="80px"
          className="h-12 w-20 rounded-md border border-border"
        />
      ),
    },
    {
      key: "title",
      label: "Título",
      isRowHeader: true,
      render: (cover) => <span className="font-medium">{cover.title}</span>,
    },
    {
      key: "description",
      label: "Descripción",
      render: (cover) =>
        cover.description ? (
          <span className="line-clamp-2 max-w-md text-muted" title={cover.description}>
            {cover.description}
          </span>
        ) : (
          <span className="text-muted">-</span>
        ),
    },
    {
      key: "link",
      label: "Enlace",
      render: (cover) =>
        cover.link ? (
          <a
            href={cover.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex max-w-xs items-center gap-1 truncate text-link hover:underline"
            title={cover.link}
          >
            <span className="truncate">{cover.link}</span>
            <ExternalLink className="size-3.5 shrink-0" />
          </a>
        ) : (
          <span className="text-muted">-</span>
        ),
    },
    {
      key: "actions",
      label: "Acciones",
      align: "end",
      render: (cover) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label={`Editar ${cover.title}`}
            isDisabled={!canManage}
            onPress={() => {
              setSelected(cover);
              setIsFormOpen(true);
            }}
          >
            <Edit2 className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label={`Eliminar ${cover.title}`}
            className="text-danger"
            isDisabled={!canManage}
            onPress={() => setToDelete(cover)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  const createButton = (
    <Button
      variant="primary"
      isDisabled={!canManage || isLimitReached}
      onPress={() => {
        setSelected(null);
        setIsFormOpen(true);
      }}
    >
      <Plus className="size-4" />
      Crear portada
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutTemplate}
        title="Portadas"
        description="Banners de la portada de tu tienda, en el orden en que se muestran"
        actions={
          <div className="flex items-center gap-3">
            <Chip size="sm" variant="soft" color={isLimitReached ? "warning" : "default"}>
              {grandTotal}/{maxCovers} portadas
            </Chip>
            {isLimitReached ? (
              <Tooltip>
                <Tooltip.Trigger>
                  <span className="inline-flex">{createButton}</span>
                </Tooltip.Trigger>
                <Tooltip.Content>
                  Has alcanzado el máximo de {maxCovers} portadas. Elimina una para crear otra.
                </Tooltip.Content>
              </Tooltip>
            ) : (
              createButton
            )}
          </div>
        }
      />

      <Card>
        <Card.Content className="p-4">
          <SearchField
            aria-label="Buscar portadas"
            placeholder="Buscar por título..."
            value={search}
            onChange={setSearch}
          />
        </Card.Content>
      </Card>

      {/* Al paginar o buscar, la página anterior sigue visible (atenuada) hasta que llega la nueva. */}
      <Card
        className={cn("overflow-hidden transition-opacity", isPlaceholderData && "opacity-60")}
        aria-busy={isPlaceholderData}
      >
        <DataTable
          aria-label="Portadas"
          items={covers}
          columns={columns}
          getRowId={(cover) => cover.id}
          isLoading={isLoading}
          loadingMessage="Cargando portadas..."
          emptyMessage={
            debouncedSearch ? "Ninguna portada coincide con la búsqueda" : "Aún no has creado portadas"
          }
        />
        <TablePagination
          currentPage={page}
          totalPages={data?.totalPages ?? 1}
          totalItems={data?.total ?? 0}
          itemsInPage={covers.length}
          itemLabel="portadas"
          onPageChange={setPage}
        />
      </Card>

      {isFormOpen && (
        <PortadaFormModal
          cover={selected}
          isOpen={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setSelected(null);
          }}
          onSubmit={handleSubmit}
          isPending={createMutation.isPending || updateMutation.isPending}
        />
      )}

      <ConfirmDialog
        isOpen={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar portada"
        description={
          <>
            ¿Seguro que deseas eliminar la portada{" "}
            <span className="font-semibold text-foreground">&quot;{toDelete?.title}&quot;</span>?
            Esta acción no se puede deshacer.
          </>
        }
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
