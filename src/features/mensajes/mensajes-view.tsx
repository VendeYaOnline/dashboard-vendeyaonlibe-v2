"use client";

import { useEffect, useState } from "react";
import { Button, Card, toast } from "@heroui/react";
import { Eye, MessageSquare, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { SearchField } from "@/components/shared/search-field";
import { TablePagination } from "@/components/shared/table-pagination";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useQueryContacts } from "@/app/api/queries";
import { useMutationDeleteContact } from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import { useAuthStore } from "@/store/auth.store";
import type { Contacts } from "@/interfaces/contacts";
import { MensajeDetailsModal } from "./components/mensaje-details-modal";

export function MensajesView() {
  const canManage = useAuthStore((s) => s.user?.role) !== "viewer";

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<Contacts | null>(null);
  const [toDelete, setToDelete] = useState<Contacts | null>(null);

  useEffect(() => setPage(1), [debouncedSearch]);

  const { data, isLoading, isFetching } = useQueryContacts(page, debouncedSearch);
  const deleteMutation = useMutationDeleteContact();

  const contacts = data?.contacts ?? [];

  const handleConfirmDelete = () => {
    if (!toDelete) return;
    deleteMutation.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success("Mensaje eliminado correctamente");
        setToDelete(null);
      },
      onError: (error) => handleAxiosError(error, "Error al eliminar el mensaje"),
    });
  };

  const columns: DataTableColumn<Contacts>[] = [
    {
      key: "subject",
      label: "Asunto",
      isRowHeader: true,
      render: (contact) => <span className="font-medium">{contact.subject}</span>,
    },
    {
      key: "email",
      label: "Email",
      render: (contact) => <span className="text-muted">{contact.email}</span>,
    },
    {
      key: "message",
      label: "Mensaje",
      render: (contact) => (
        <span className="line-clamp-1 max-w-md text-muted">{contact.message}</span>
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      align: "end",
      render: (contact) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label={`Ver mensaje ${contact.subject}`}
            onPress={() => setSelected(contact)}
          >
            <Eye className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label={`Eliminar mensaje ${contact.subject}`}
            className="text-danger"
            isDisabled={!canManage}
            onPress={() => setToDelete(contact)}
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
        icon={MessageSquare}
        title="Mensajes"
        description="Revisa los mensajes de contacto recibidos"
      />

      <Card>
        <Card.Content className="p-4">
          <SearchField
            aria-label="Buscar mensajes"
            placeholder="Buscar por asunto o email..."
            value={search}
            onChange={setSearch}
          />
        </Card.Content>
      </Card>

      <Card className="overflow-hidden">
        <DataTable
          aria-label="Mensajes de contacto"
          items={contacts}
          columns={columns}
          getRowId={(contact) => contact.id}
          isLoading={isLoading || isFetching}
          loadingMessage="Cargando mensajes..."
          emptyMessage="No se encontraron mensajes"
        />
        <TablePagination
          currentPage={page}
          totalPages={data?.totalPages ?? 1}
          totalItems={data?.total ?? 0}
          itemsInPage={contacts.length}
          itemLabel="mensajes"
          onPageChange={setPage}
        />
      </Card>

      <MensajeDetailsModal
        contact={selected}
        isOpen={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
      />

      <ConfirmDialog
        isOpen={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar mensaje"
        description={
          <>
            ¿Seguro que deseas eliminar el mensaje{" "}
            <span className="font-semibold text-foreground">
              &quot;{toDelete?.subject}&quot;
            </span>
            ? Esta acción no se puede deshacer.
          </>
        }
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
