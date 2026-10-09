"use client";

import { useState } from "react";
import { Building2, CreditCard, Edit2, Folder, MessageCircle, Plus, ShieldCheck, ShieldOff, Users } from "lucide-react";
import { Button, Card, Chip, Spinner, cn, toast } from "@heroui/react";
import { IconAction } from "@/components/shared/icon-action";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { useQueryPlatformCompanies, useQueryPlatformConfig } from "@/app/api/queries";
import { useMutationCreateCompany, useMutationUpdateCompany } from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import { useAuthStore } from "@/store/auth.store";
import { PAID_FEATURES, SUPERADMIN_ROLE } from "@/config/navigation";
import type { PlatformCompany } from "@/interfaces/platform";
import { EmpresaFormModal } from "./components/empresa-form-modal";
import { EmpresaUsuariosModal } from "./components/empresa-usuarios-modal";
import { MarketingLimitsCard } from "./components/marketing-limits-card";
import { MercadoPagoModal } from "./components/mercadopago-modal";
import { WhatsappModal } from "./components/whatsapp-modal";
import { MERCADOPAGO_SOURCE_LABELS, formatDate } from "./utils";

/** "38 / 50" con color según lo cerca que esté del tope; "sin límite" si no hay. */
function Usage({ used, limit }: { used: number | null; limit: number | null }) {
  if (used === null) return <span className="text-muted">—</span>;
  if (limit === null) {
    return (
      <span className="tabular-nums">
        {used} <span className="text-xs text-muted">· sin límite</span>
      </span>
    );
  }
  const ratio = used / limit;
  return (
    <Chip
      size="sm"
      variant="soft"
      color={ratio >= 1 ? "danger" : ratio >= 0.8 ? "warning" : "default"}
      className="tabular-nums"
    >
      {used} / {limit}
    </Chip>
  );
}

export function PlataformaView() {
  const role = useAuthStore((s) => s.user?.role);
  const isSuperadmin = role === SUPERADMIN_ROLE;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selected, setSelected] = useState<PlatformCompany | null>(null);
  const [paymentsCompany, setPaymentsCompany] = useState<PlatformCompany | null>(null);
  const [whatsappCompany, setWhatsappCompany] = useState<PlatformCompany | null>(null);
  const [usersCompany, setUsersCompany] = useState<PlatformCompany | null>(null);

  const { data, isLoading, isError, refetch } = useQueryPlatformCompanies(isSuperadmin);
  const { data: config } = useQueryPlatformConfig(isSuperadmin);
  const createMutation = useMutationCreateCompany();
  const updateMutation = useMutationUpdateCompany();

  const companies = data?.companies ?? [];

  if (!isSuperadmin) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-danger-soft">
          <ShieldOff className="size-10 text-danger" />
        </div>
        <h2 className="text-2xl font-bold">Acceso restringido</h2>
        <p className="max-w-sm text-muted">
          Solo el <strong>superadministrador</strong> de la plataforma puede gestionar las empresas.
        </p>
      </div>
    );
  }

  const columns: DataTableColumn<PlatformCompany>[] = [
    {
      key: "name",
      label: "Empresa",
      isRowHeader: true,
      render: (company) => (
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft">
            <Building2 className="size-4 text-accent" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{company.name}</p>
            <p className="flex items-center gap-1 text-xs text-muted">
              <Folder className="size-3" />
              {company.s3_prefix ? `${company.s3_prefix}/` : "raíz del bucket"}
            </p>
            {company.features.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {company.features.map((feature) => (
                  <Chip key={feature} size="sm" variant="soft" color="accent">
                    {PAID_FEATURES[feature]?.label ?? feature}
                  </Chip>
                ))}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "admin",
      label: "Administrador",
      render: (company) =>
        company.admin ? (
          <div className="min-w-0">
            <p className="truncate">{company.admin.username}</p>
            <p className="truncate text-xs text-muted">{company.admin.email}</p>
            {company.admins > 1 && <p className="text-xs text-muted">+{company.admins - 1} más</p>}
          </div>
        ) : (
          <Chip size="sm" variant="soft" color="danger">
            Sin admin
          </Chip>
        ),
    },
    {
      key: "products",
      label: "Productos",
      render: (company) => <Usage used={company.products} limit={company.max_products} />,
    },
    {
      key: "images",
      label: "Imágenes",
      render: (company) => <Usage used={company.images} limit={company.max_images} />,
    },
    {
      key: "users",
      label: "Usuarios",
      render: (company) => <span className="tabular-nums">{company.users}</span>,
    },
    {
      key: "mercadopago",
      label: "Mercado Pago",
      render: (company) => (
        <Chip
          size="sm"
          variant="soft"
          color={company.mercadopago === "company" ? "success" : company.mercadopago === "legacy" ? "warning" : "default"}
        >
          {MERCADOPAGO_SOURCE_LABELS[company.mercadopago] ?? "—"}
        </Chip>
      ),
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      render: (company) => (
        <Chip
          size="sm"
          variant="soft"
          color={company.whatsapp === "verified" ? "success" : company.whatsapp === "api" ? "warning" : "default"}
        >
          {company.whatsapp === "verified" ? "Configurado ✓" : company.whatsapp === "api" ? "Sin verificar" : "Enlaces"}
        </Chip>
      ),
    },
    {
      key: "created_at",
      label: "Alta",
      render: (company) => (
        <span className="whitespace-nowrap text-muted">{formatDate(company.created_at)}</span>
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      align: "end",
      render: (company) => (
        <div className="flex justify-end gap-1">
          <IconAction
            tooltip="Usuarios de la empresa"
            aria-label={`Usuarios de ${company.name}`}
            onPress={() => setUsersCompany(company)}
          >
            <Users className="size-4" />
          </IconAction>
          <IconAction
            tooltip="Configurar Mercado Pago"
            aria-label={`Mercado Pago de ${company.name}`}
            onPress={() => setPaymentsCompany(company)}
          >
            <CreditCard className="size-4" />
          </IconAction>
          <IconAction
            tooltip="Configurar WhatsApp"
            aria-label={`WhatsApp de ${company.name}`}
            onPress={() => setWhatsappCompany(company)}
          >
            <MessageCircle className="size-4" />
          </IconAction>
          <IconAction
            tooltip="Editar empresa"
            aria-label={`Editar ${company.name}`}
            onPress={() => {
              setSelected(company);
              setIsFormOpen(true);
            }}
          >
            <Edit2 className="size-4" />
          </IconAction>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ShieldCheck}
        title="Plataforma"
        description={
          companies.length === 0
            ? "Empresas (clientes) y su plan"
            : `${companies.length} ${companies.length === 1 ? "empresa" : "empresas"} en la plataforma`
        }
        actions={
          <Button
            variant="primary"
            onPress={() => {
              setSelected(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            Nueva empresa
          </Button>
        }
      />

      {isError ? (
        <Card>
          <Card.Content className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm text-muted">No se pudieron cargar las empresas.</p>
            <Button variant="secondary" onPress={() => refetch()}>
              Reintentar
            </Button>
          </Card.Content>
        </Card>
      ) : (
        <Card className={cn("overflow-hidden")}>
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-sm text-muted">
              <Spinner size="sm" />
              Cargando empresas...
            </div>
          ) : (
            <DataTable
              aria-label="Empresas"
              items={companies}
              columns={columns}
              getRowId={(company) => company.id}
              emptyMessage="Aún no hay empresas"
            />
          )}
        </Card>
      )}

      <MarketingLimitsCard />

      <MercadoPagoModal company={paymentsCompany} onClose={() => setPaymentsCompany(null)} />
      <WhatsappModal company={whatsappCompany} onClose={() => setWhatsappCompany(null)} />
      <EmpresaUsuariosModal company={usersCompany} onClose={() => setUsersCompany(null)} />

      <EmpresaFormModal
        company={selected}
        config={config}
        isOpen={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setSelected(null);
        }}
        isPending={createMutation.isPending || updateMutation.isPending}
        onCreate={(payload) =>
          createMutation.mutate(payload, {
            onSuccess: () => {
              toast.success(`Empresa "${payload.name}" creada con su administrador`);
              setIsFormOpen(false);
            },
            onError: (error) => handleAxiosError(error, "No se pudo crear la empresa"),
          })
        }
        onUpdate={(id, payload) =>
          updateMutation.mutate(
            { id, data: payload },
            {
              onSuccess: () => {
                toast.success("Empresa actualizada");
                setIsFormOpen(false);
                setSelected(null);
              },
              onError: (error) => handleAxiosError(error, "No se pudo actualizar la empresa"),
            },
          )
        }
      />
    </div>
  );
}
