"use client";

import { useEffect, useState } from "react";
import { Button, Card, Chip, ToggleButton, ToggleButtonGroup, cn, toast } from "@heroui/react";
import { Eye, Mail, MailOpen, MessageSquare, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { SearchField } from "@/components/shared/search-field";
import { TablePagination } from "@/components/shared/table-pagination";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useQueryContacts } from "@/app/api/queries";
import { useMutationContactRead, useMutationDeleteContact } from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import { useAuthStore } from "@/store/auth.store";
import type { ContactStatusFilter, Contacts } from "@/interfaces/contacts";
import { MensajeDetailsModal } from "./components/mensaje-details-modal";
import { formatReceivedAt } from "./utils";

const STATUS_FILTERS: { id: ContactStatusFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "unread", label: "Sin leer" },
  { id: "read", label: "Leídos" },
];

export function MensajesView() {
  const canManage = useAuthStore((s) => s.user?.role) !== "viewer";

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState<ContactStatusFilter>("all");
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<Contacts | null>(null);
  const [toDelete, setToDelete] = useState<Contacts | null>(null);

  useEffect(() => setPage(1), [debouncedSearch, statusFilter]);

  const { data, isLoading, isPlaceholderData } = useQueryContacts(
    page,
    debouncedSearch,
    statusFilter,
  );
  const readMutation = useMutationContactRead();
  const deleteMutation = useMutationDeleteContact();

  const contacts = data?.contacts ?? [];
  const unread = data?.unread ?? 0;
  const grandTotal = data?.grandTotal ?? 0;

  const setRead = (contact: Contacts, isRead: boolean) => {
    if (Boolean(contact.is_read) === isRead) return;
    readMutation.mutate(
      { id: contact.id, isRead },
      { onError: (error) => handleAxiosError(error, "No se pudo actualizar el mensaje") },
    );
  };

  // Abrir el detalle marca el mensaje como leído.
  const openContact = (contact: Contacts) => {
    setSelected(contact);
    setRead(contact, true);
  };

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
      key: "status",
      label: "",
      className: "w-10",
      render: (contact) => (
        <span
          className="flex items-center justify-center"
          title={contact.is_read ? "Leído" : "Sin leer"}
        >
          {contact.is_read ? (
            <MailOpen className="size-4 text-muted" />
          ) : (
            <Mail className="size-4 text-accent" />
          )}
        </span>
      ),
    },
    {
      key: "subject",
      label: "Asunto",
      isRowHeader: true,
      render: (contact) => (
        <div className="flex items-center gap-2">
          <span className={cn("line-clamp-1", !contact.is_read && "font-semibold")}>
            {contact.subject}
          </span>
          {!contact.is_read && (
            <Chip size="sm" variant="soft" color="accent">
              Nuevo
            </Chip>
          )}
        </div>
      ),
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
      key: "created_at",
      label: "Recibido",
      render: (contact) => (
        <span className="whitespace-nowrap text-muted">
          {formatReceivedAt(contact.created_at) ?? "—"}
        </span>
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
            onPress={() => openContact(contact)}
          >
            <Eye className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label={
              contact.is_read
                ? `Marcar como no leído ${contact.subject}`
                : `Marcar como leído ${contact.subject}`
            }
            onPress={() => setRead(contact, !contact.is_read)}
          >
            {contact.is_read ? <Mail className="size-4" /> : <MailOpen className="size-4" />}
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
        description={
          grandTotal === 0
            ? "Aún no has recibido mensajes de contacto"
            : `${grandTotal} ${grandTotal === 1 ? "mensaje" : "mensajes"} · ${
                unread === 0 ? "todo leído" : `${unread} sin leer`
              }`
        }
      />

      <Card>
        <Card.Content className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchField
            aria-label="Buscar mensajes"
            placeholder="Buscar por asunto, email o mensaje..."
            value={search}
            onChange={setSearch}
          />
          <ToggleButtonGroup
            aria-label="Filtrar por estado"
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={new Set([statusFilter])}
            onSelectionChange={(keys) => {
              const [next] = Array.from(keys, String);
              const match = STATUS_FILTERS.find((filter) => filter.id === next);
              if (match) setStatusFilter(match.id);
            }}
          >
            {STATUS_FILTERS.map((filter) => (
              <ToggleButton key={filter.id} id={filter.id}>
                {filter.label}
                {filter.id === "unread" && unread > 0 && (
                  <Chip size="sm" variant="soft" color="accent" className="ml-1">
                    {unread}
                  </Chip>
                )}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Card.Content>
      </Card>

      {/* Al paginar o filtrar, la página anterior sigue visible (atenuada) hasta que llega la nueva. */}
      <Card
        className={cn("overflow-hidden transition-opacity", isPlaceholderData && "opacity-60")}
        aria-busy={isPlaceholderData}
      >
        <DataTable
          aria-label="Mensajes de contacto"
          items={contacts}
          columns={columns}
          getRowId={(contact) => contact.id}
          isLoading={isLoading}
          loadingMessage="Cargando mensajes..."
          emptyMessage={
            debouncedSearch || statusFilter !== "all"
              ? "No hay mensajes que coincidan con la búsqueda o el filtro"
              : "No se encontraron mensajes"
          }
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
        onMarkUnread={(contact) => {
          setRead(contact, false);
          setSelected(null);
        }}
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
