"use client";

import { useState } from "react";
import { History, RotateCcw } from "lucide-react";
import { Button, Card, Label, ListBox, ListBoxItem, Select } from "@heroui/react";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { DatePickerField } from "@/components/shared/date-picker-field";
import { TablePagination } from "@/components/shared/table-pagination";
import { useQueryAuditLog } from "@/app/api/queries";
import type { AuditCategory, AuditEntry, AuditFilters, PlatformCompany } from "@/interfaces/platform";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_CATEGORY_OPTIONS,
  describeAuditEntry,
  formatDateTime,
} from "../audit";

const ALL = "all";

const DEFAULT_FILTERS: AuditFilters = { page: 1, companyId: ALL, actor: ALL, category: ALL, from: "", to: "" };

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { id: string; label: string }[];
}

function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  return (
    <Select aria-label={label} selectedKey={value} onSelectionChange={(key) => onChange(String(key))} className="min-w-44">
      <Label>{label}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map((option) => (
            <ListBoxItem key={option.id} id={option.id} textValue={option.label}>
              {option.label}
            </ListBoxItem>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

/**
 * Registro de actividad de los superadministradores: qué hicieron, sobre qué
 * empresa o usuario y cuándo. Solo lo ve el propietario (el backend también lo
 * exige). Es solo de lectura: nadie puede editar ni borrar entradas.
 */
export function AuditLogCard({ companies }: { companies: PlatformCompany[] }) {
  const [filters, setFilters] = useState<AuditFilters>(DEFAULT_FILTERS);
  const { data, isLoading, isError, isPlaceholderData, refetch } = useQueryAuditLog(filters);

  // Cualquier filtro nuevo vuelve a la primera página.
  const setFilter = <K extends keyof AuditFilters>(key: K, value: AuditFilters[K]) =>
    setFilters((current) => ({ ...current, [key]: value, page: key === "page" ? (value as number) : 1 }));

  const isDefault = JSON.stringify({ ...filters, page: 1 }) === JSON.stringify(DEFAULT_FILTERS);
  const items = data?.items ?? [];

  const columns: DataTableColumn<AuditEntry>[] = [
    {
      key: "date",
      label: "Fecha",
      render: (entry) => <span className="whitespace-nowrap text-muted">{formatDateTime(entry.created_at)}</span>,
    },
    {
      key: "actor",
      label: "Quién",
      render: (entry) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{entry.actor_name}</p>
          <p className="truncate text-xs text-muted">{entry.actor_email}</p>
        </div>
      ),
    },
    {
      key: "action",
      label: "Acción",
      isRowHeader: true,
      render: (entry) => (
        <div className="min-w-0">
          <p className="font-medium">{AUDIT_ACTION_LABELS[entry.action] ?? entry.action}</p>
          <p className="max-w-md text-xs text-muted">{describeAuditEntry(entry)}</p>
        </div>
      ),
    },
    {
      key: "company",
      label: "Empresa",
      render: (entry) => (entry.company_name ? <span>{entry.company_name}</span> : <span className="text-muted">Toda la plataforma</span>),
    },
  ];

  return (
    <Card>
      <Card.Content className="space-y-4 p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft">
            <History className="size-4 text-accent" />
          </span>
          <div>
            <h2 className="font-semibold">Registro de actividad</h2>
            <p className="text-sm text-muted">
              Lo que han hecho los superadministradores sobre las empresas. Solo tú lo ves y no se puede editar ni borrar.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <FilterSelect
            label="Empresa"
            value={filters.companyId}
            onChange={(value) => setFilter("companyId", value)}
            options={[{ id: ALL, label: "Todas las empresas" }, ...companies.map((company) => ({ id: company.id, label: company.name }))]}
          />
          <FilterSelect
            label="Quién"
            value={filters.actor}
            onChange={(value) => setFilter("actor", value)}
            options={[
              { id: ALL, label: "Todos" },
              ...(data?.actors ?? []).map((actor) => ({ id: actor.email, label: actor.name })),
            ]}
          />
          <FilterSelect
            label="Tipo de acción"
            value={filters.category}
            onChange={(value) => setFilter("category", value as AuditCategory | typeof ALL)}
            options={AUDIT_CATEGORY_OPTIONS}
          />
          <div className="w-40">
            <DatePickerField label="Desde" value={filters.from} onChange={(value) => setFilter("from", value)} />
          </div>
          <div className="w-40">
            <DatePickerField label="Hasta" value={filters.to} onChange={(value) => setFilter("to", value)} />
          </div>
          <Button variant="ghost" isDisabled={isDefault} onPress={() => setFilters(DEFAULT_FILTERS)}>
            <RotateCcw className="size-4" />
            Restablecer
          </Button>
        </div>
      </Card.Content>

      {isError ? (
        <div className="flex flex-col items-center gap-3 border-t border-border py-10 text-center">
          <p className="text-sm text-muted">No se pudo cargar el registro.</p>
          <Button variant="secondary" onPress={() => refetch()}>
            Reintentar
          </Button>
        </div>
      ) : (
        <div className={isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={isPlaceholderData}>
          <DataTable
            aria-label="Registro de actividad"
            items={items}
            columns={columns}
            getRowId={(entry) => entry.id}
            isLoading={isLoading}
            loadingMessage="Cargando registro..."
            emptyMessage="Aún no hay actividad con estos filtros"
          />
          <TablePagination
            currentPage={data?.page ?? 1}
            totalPages={data?.totalPages ?? 1}
            totalItems={data?.total ?? 0}
            itemsInPage={items.length}
            itemLabel="acciones"
            onPageChange={(page) => setFilter("page", page)}
          />
        </div>
      )}
    </Card>
  );
}
