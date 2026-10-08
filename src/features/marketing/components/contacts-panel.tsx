"use client";

import { useEffect, useState } from "react";
import { Mail, MessageCircle, UserCheck } from "lucide-react";
import { Card, Chip, ToggleButton, ToggleButtonGroup, cn } from "@heroui/react";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { SearchField } from "@/components/shared/search-field";
import { TablePagination } from "@/components/shared/table-pagination";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useQueryMarketingContacts } from "@/app/api/queries";
import type { ContactLastSend, ContactsFilter, MarketingContact } from "@/interfaces/marketing";
import { RECIPIENT_STATUS, formatDateTime } from "./campaign-shared";

const PAGE_SIZE = 10;

const BLOCKED: Record<NonNullable<NonNullable<MarketingContact["email_state"]>["blocked"]>, string> = {
  unsubscribed: "Se dio de baja",
  bounced: "Correo inválido (rebotó)",
  complained: "Lo marcó como spam",
};

/** Último envío por un canal: estado y fecha. */
function LastSend({ last }: { last: ContactLastSend | null }) {
  if (!last) return <span className="text-xs text-muted">Sin enviar</span>;
  const status = RECIPIENT_STATUS[last.status];
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <Chip size="sm" variant="soft" color={status.color}>
        {status.label}
      </Chip>
      <span className="whitespace-nowrap text-xs text-muted">{formatDateTime(last.at)}</span>
    </span>
  );
}

/** Clientes y notificaciones: a quién se le escribió, por qué canal, y quién está en espera. */
export function ContactsPanel() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [filter, setFilter] = useState<ContactsFilter>("all");
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [debouncedSearch, filter]);

  const { data, isLoading, isPlaceholderData } = useQueryMarketingContacts({ page, search: debouncedSearch, filter });
  const summary = data?.summary;
  const rows = data?.items ?? [];

  const columns: DataTableColumn<MarketingContact>[] = [
    {
      key: "customer",
      label: "Cliente",
      isRowHeader: true,
      render: (contact) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{contact.name}</p>
          <p className="max-w-56 truncate text-xs text-muted">{contact.email ?? contact.phone ?? "Sin contacto"}</p>
        </div>
      ),
    },
    {
      key: "email",
      label: "Correo",
      render: ({ email_state: state }) => {
        if (!state) return <span className="text-xs text-muted">Sin correo</span>;
        return (
          <div className="space-y-1">
            <LastSend last={state.last} />
            {state.blocked ? (
              <p className="text-xs text-danger">{BLOCKED[state.blocked]}</p>
            ) : (
              state.available_at && (
                <p className="whitespace-nowrap text-xs text-warning">Disponible el {formatDateTime(state.available_at)}</p>
              )
            )}
          </div>
        );
      },
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      render: ({ whatsapp_state: state }) =>
        state ? <LastSend last={state.last} /> : <span className="text-xs text-muted">Sin celular</span>,
    },
  ];

  const options: { id: ContactsFilter; label: string }[] = [
    { id: "all", label: `Todos${summary ? ` (${summary.total})` : ""}` },
    { id: "never", label: `Sin notificar${summary ? ` (${summary.never})` : ""}` },
    { id: "notified", label: `Notificados${summary ? ` (${summary.notified})` : ""}` },
    { id: "email_cooldown", label: `En espera de correo${summary ? ` (${summary.email_cooldown})` : ""}` },
  ];

  return (
    <Card className={cn("overflow-hidden transition-opacity", isPlaceholderData && "opacity-60")} aria-busy={isPlaceholderData}>
      <div className="space-y-3 px-5 pt-4">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            <UserCheck className="size-4" /> Clientes y notificaciones
          </h2>
          <p className="text-xs text-muted">
            Último mensaje de cada cliente por canal. Un cliente recibe máximo un correo cada 7 días; WhatsApp no tiene
            espera.
          </p>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchField aria-label="Buscar clientes" placeholder="Nombre, correo o teléfono..." value={search} onChange={setSearch} />
          <ToggleButtonGroup
            aria-label="Filtrar clientes"
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={new Set([filter])}
            onSelectionChange={(keys) => {
              const [next] = Array.from(keys, String);
              if (next) setFilter(next as ContactsFilter);
            }}
            className="flex-wrap"
          >
            {options.map((option) => (
              <ToggleButton key={option.id} id={option.id}>
                {option.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <span className="flex items-center gap-1">
            <Mail className="size-3.5" /> Enviado = el servidor de correo lo aceptó; Entregado = llegó al buzón.
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="size-3.5" /> Chat abierto = se abrió WhatsApp; Enviado (confirmado) = la tienda
            confirmó el envío.
          </span>
        </p>
      </div>
      <DataTable
        aria-label="Clientes y notificaciones"
        items={rows}
        columns={columns}
        getRowId={(contact) => contact.key}
        isLoading={isLoading}
        loadingMessage="Cargando clientes..."
        emptyMessage="No hay clientes con este filtro"
      />
      <TablePagination
        currentPage={page}
        totalPages={data?.totalPages ?? 1}
        totalItems={data?.total ?? 0}
        itemsInPage={rows.length}
        itemLabel="clientes"
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </Card>
  );
}
