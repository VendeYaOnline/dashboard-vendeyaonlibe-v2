"use client";

import { useRef, useState } from "react";
import { History, Send, Users } from "lucide-react";
import { Button, Card, ToggleButton, ToggleButtonGroup, cn, toast } from "@heroui/react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { useQueryMarketingAudience, useQueryMarketingCampaigns } from "@/app/api/queries";
import { useMutationCreateCampaign } from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import { formatInteger } from "@/features/analisis/utils";
import type {
  CampaignChannel,
  CampaignSegment,
  MarketingCampaign,
  MarketingResponse,
  QuotaWindow,
} from "@/interfaces/marketing";
import { CampaignDetailModal } from "./campaign-detail-modal";
import { CHANNELS, CampaignProgress, SEGMENTS, SEGMENT_LABELS, formatDateTime } from "./campaign-shared";
import { ContactsPanel } from "./contacts-panel";

const clients = (count: number) => `${formatInteger(count)} ${count === 1 ? "cliente" : "clientes"}`;

const resetsLabel = (window: QuotaWindow) => (window.resets_at ? `Se restablece el ${formatDateTime(window.resets_at)}.` : "");

/** Uso de un límite de correos: "35 de 100 · quedan 65". */
function QuotaBar({ label, window }: { label: string; window: QuotaWindow }) {
  const full = window.remaining === 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted">{label}</span>
        <span className="tabular-nums">
          {formatInteger(window.used)} de {formatInteger(window.limit)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-secondary">
        <div
          className={cn("h-full rounded-full", full ? "bg-danger" : "bg-accent")}
          style={{ width: `${Math.min(100, (window.used / Math.max(window.limit, 1)) * 100)}%` }}
        />
      </div>
      <p className={cn("text-xs", full ? "text-danger" : "text-muted")}>
        {full ? `Límite alcanzado. ${resetsLabel(window)}` : `${formatInteger(window.remaining)} disponibles`}
      </p>
    </div>
  );
}

interface CampaignsPanelProps {
  data: MarketingResponse;
  /** Plantilla con la que se llega desde el paso "Diseña tu correo". */
  initialSlot?: number;
  /** Volver al paso de diseño. */
  onEditTemplates: () => void;
}

/** Paso "Envía": nueva campaña (plantilla, canal y grupo) e historial. */
export function CampaignsPanel({ data, initialSlot, onEditTemplates }: CampaignsPanelProps) {
  const savedTemplates = data.templates.filter((template) => template.saved);
  const [slot, setSlot] = useState<number | null>(initialSlot ?? savedTemplates[0]?.slot ?? null);
  const [channel, setChannel] = useState<CampaignChannel>("email");
  const [segment, setSegment] = useState<CampaignSegment>("all");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [openCampaign, setOpenCampaign] = useState<string | null>(null);

  const { data: audience, isLoading: isAudienceLoading } = useQueryMarketingAudience();
  const { data: history, isLoading: isHistoryLoading } = useQueryMarketingCampaigns();
  const create = useMutationCreateCampaign();

  const count = audience?.segments[segment][channel] ?? 0;
  const cooldownCount = channel === "email" ? (audience?.segments[segment].email_cooldown ?? 0) : 0;
  const quota = audience?.quota;
  const whatsappApi = audience?.whatsapp_mode === "api";
  const quotaBlocker =
    channel !== "email" || !quota || count === 0
      ? null
      : count > quota.daily.remaining
        ? `Esta campaña necesita ${count} correos y te quedan ${quota.daily.remaining} hoy. ${resetsLabel(quota.daily)}`
        : count > quota.monthly.remaining
          ? `Esta campaña necesita ${count} correos y te quedan ${quota.monthly.remaining} este mes. ${resetsLabel(quota.monthly)}`
          : null;
  const template = data.templates.find((item) => item.slot === slot);
  const blocker = isAudienceLoading
    ? null
    : !data.brandSaved
    ? "Primero guarda tu marca en la pestaña Marca."
    : !template?.saved
      ? "Guarda al menos una plantilla para poder enviarla."
      : channel === "email" && !data.sender.configured
        ? "El envío de correos no está configurado en el servidor."
        : count === 0
          ? channel === "email"
            ? cooldownCount > 0
              ? `Los clientes de este grupo ya recibieron un correo en los últimos ${audience?.cooldown_days ?? 7} días.`
              : "Ningún cliente de este grupo tiene correo."
            : "Ningún cliente de este grupo tiene un celular válido."
          : quotaBlocker;

  // Un id por confirmación: si la petición se repite (doble clic, reintento) no se crea otra campaña.
  const requestId = useRef<string | null>(null);
  const openConfirm = () => {
    requestId.current = crypto.randomUUID();
    setIsConfirmOpen(true);
  };

  const handleCreate = () => {
    if (!slot || !requestId.current || create.isPending) return;
    create.mutate(
      { slot, segment, channel, request_id: requestId.current },
      {
        onSuccess: ({ campaign, duplicate, skipped }) => {
          setIsConfirmOpen(false);
          requestId.current = null;
          if (duplicate) {
            toast.info("Esta campaña ya se había creado; no se envió de nuevo.");
          } else if (campaign.channel === "whatsapp") {
            toast.success(
              campaign.delivery === "whatsapp_api"
                ? `Enviando por WhatsApp a ${campaign.total} clientes.`
                : "Lista lista: abre cada chat desde aquí",
            );
          } else {
            const omitted = skipped.cooldown + skipped.suppressed;
            toast.success(
              `Enviando a ${campaign.total} clientes. Puedes seguir trabajando.${omitted ? ` ${omitted} se omitieron (espera de 7 días o baja).` : ""}`,
            );
          }
          if (campaign.channel === "whatsapp" && campaign.delivery !== "whatsapp_api") setOpenCampaign(campaign.id);
        },
        onError: (error) => {
          setIsConfirmOpen(false);
          handleAxiosError(error, "No se pudo crear la campaña");
        },
      },
    );
  };

  const columns: DataTableColumn<MarketingCampaign>[] = [
    {
      key: "date",
      label: "Fecha",
      isRowHeader: true,
      render: (campaign) => <span className="whitespace-nowrap text-sm">{formatDateTime(campaign.created_at)}</span>,
    },
    {
      key: "template",
      label: "Plantilla",
      render: (campaign) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{campaign.template_name}</p>
          <p className="truncate text-xs text-muted">{campaign.subject}</p>
        </div>
      ),
    },
    {
      key: "channel",
      label: "Canal y grupo",
      render: (campaign) => {
        const Icon = CHANNELS[campaign.channel].icon;
        return (
          <span className="flex items-center gap-1.5 whitespace-nowrap text-sm">
            <Icon className="size-4 text-muted" />
            {CHANNELS[campaign.channel].label} · {SEGMENT_LABELS[campaign.segment]}
          </span>
        );
      },
    },
    {
      key: "progress",
      label: "Resultado",
      render: (campaign) => <CampaignProgress campaign={campaign} />,
    },
    {
      key: "actions",
      label: "Acciones",
      align: "end",
      render: (campaign) => (
        <Button variant="outline" size="sm" onPress={() => setOpenCampaign(campaign.id)}>
          {campaign.channel === "whatsapp" ? "Abrir lista" : "Ver detalle"}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <Card.Content className="space-y-5 p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <Send className="size-4" /> Nueva campaña
          </h2>

          <div className="space-y-2">
            <p className="text-sm font-medium">1. Plantilla</p>
            {savedTemplates.length === 0 ? (
              <p className="text-sm text-muted">
                Aún no tienes plantillas guardadas.{" "}
                <button type="button" onClick={onEditTemplates} className="font-medium text-accent underline">
                  Diseña tu primer correo
                </button>
                .
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-3">
                {data.templates.map((item) => (
                  <button
                    key={item.slot}
                    type="button"
                    disabled={!item.saved}
                    aria-pressed={item.slot === slot}
                    onClick={() => setSlot(item.slot)}
                    className={cn(
                      "rounded-lg border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                      item.slot === slot ? "border-accent ring-1 ring-accent" : "border-border hover:bg-surface-secondary",
                    )}
                  >
                    <span className="block truncate text-sm font-medium">{item.name}</span>
                    <span className="block truncate text-xs text-muted">{item.saved ? item.content.subject : "Sin guardar"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">2. Canal</p>
            <ToggleButtonGroup
              aria-label="Canal"
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={new Set([channel])}
              onSelectionChange={(keys) => {
                const [next] = Array.from(keys, String);
                if (next) setChannel(next as CampaignChannel);
              }}
            >
              {(Object.keys(CHANNELS) as CampaignChannel[]).map((key) => {
                const Icon = CHANNELS[key].icon;
                return (
                  <ToggleButton key={key} id={key}>
                    <Icon className="size-4" />
                    {CHANNELS[key].label}
                  </ToggleButton>
                );
              })}
            </ToggleButtonGroup>
            <p className="text-xs text-muted">
              {channel === "email"
                ? `Sale desde ${data.sender.email ?? "el correo de VendeYaOnline"} con el nombre «${data.brand.sender_name}». Cada correo lleva un enlace para darse de baja.`
                : whatsappApi
                  ? "Se envía automáticamente desde el WhatsApp de tu marca con la plantilla aprobada por Meta."
                  : "Se arma una lista con un botón por cliente que abre WhatsApp con el mensaje ya escrito; lo envías tú desde el WhatsApp de tu marca."}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">3. A quién</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {SEGMENTS.map((item) => {
                const reach = audience?.segments[item.id][channel];
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={item.id === segment}
                    onClick={() => setSegment(item.id)}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-lg border p-3 text-left transition-colors",
                      item.id === segment ? "border-accent ring-1 ring-accent" : "border-border hover:bg-surface-secondary",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{item.label}</span>
                      <span className="block truncate text-xs text-muted">{item.hint}</span>
                    </span>
                    <span className="text-lg font-semibold tabular-nums">
                      {isAudienceLoading ? "…" : formatInteger(reach ?? 0)}
                    </span>
                  </button>
                );
              })}
            </div>
            {audience && (
              <p className="text-xs text-muted">
                {channel === "email"
                  ? `Solo cuentan los clientes con correo que pueden recibir hoy${audience.unsubscribed ? ` (${audience.unsubscribed} no reciben: baja o correo inválido)` : ""}.`
                  : "Solo cuentan los clientes con un celular colombiano válido."}
                {cooldownCount > 0 &&
                  ` ${formatInteger(cooldownCount)} de este grupo ${cooldownCount === 1 ? "está" : "están"} en espera: ya ${cooldownCount === 1 ? "recibió" : "recibieron"} un correo en los últimos ${audience.cooldown_days} días.`}
              </p>
            )}
          </div>

          {channel === "email" && quota && (
            <div className="grid gap-3 sm:grid-cols-3">
              <QuotaBar label="Correos enviados hoy" window={quota.daily} />
              <QuotaBar label="En esta hora" window={quota.hourly} />
              <QuotaBar label="Este mes" window={quota.monthly} />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <Button variant="primary" isDisabled={isAudienceLoading || Boolean(blocker) || create.isPending} onPress={openConfirm}>
              <Users className="size-4" />
              {channel === "email" ? `Enviar a ${clients(count)}` : `Preparar lista de ${clients(count)}`}
            </Button>
            {blocker && <p className="text-sm text-warning">{blocker}</p>}
          </div>
        </Card.Content>
      </Card>

      <Card className="overflow-hidden">
        <h2 className="flex items-center gap-2 px-5 pt-4 font-semibold">
          <History className="size-4" /> Historial
        </h2>
        <DataTable
          aria-label="Historial de campañas"
          items={history?.campaigns ?? []}
          columns={columns}
          getRowId={(campaign) => campaign.id}
          isLoading={isHistoryLoading}
          loadingMessage="Cargando campañas..."
          emptyMessage="Aún no has enviado campañas"
        />
      </Card>

      <ContactsPanel />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={handleCreate}
        tone="accent"
        title={channel === "email" ? "¿Enviar la campaña?" : "¿Preparar la lista de WhatsApp?"}
        description={
          channel === "email"
            ? `Se enviará «${template?.name}» a ${count} ${count === 1 ? "cliente" : "clientes"} (${SEGMENT_LABELS[segment].toLowerCase()}). No se puede deshacer.`
            : `Se armará la lista de ${count} ${count === 1 ? "cliente" : "clientes"} con el mensaje de «${template?.name}».`
        }
        confirmLabel={channel === "email" ? "Enviar ahora" : "Preparar lista"}
        pendingLabel="Creando"
        isPending={create.isPending}
      />

      <CampaignDetailModal campaignId={openCampaign} onClose={() => setOpenCampaign(null)} />
    </div>
  );
}
