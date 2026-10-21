"use client";

import { useRef, useState, type ReactNode } from "react";
import { AlertTriangle, Info, Lock, MessageCircle, Send, Settings2, Users } from "lucide-react";
import { Button, Card, ToggleButton, ToggleButtonGroup, cn, toast } from "@heroui/react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useQueryMarketingAudience, useQueryMyWhatsappSettings } from "@/app/api/queries";
import { useMutationCreateCampaign } from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import { formatInteger } from "@/features/analisis/utils";
import type { CampaignChannel, CampaignSegment, MarketingResponse, QuotaWindow } from "@/interfaces/marketing";
import { CHANNELS, SEGMENTS, SEGMENT_LABELS, formatDateTime } from "./campaign-shared";
import { whatsappStatus } from "../whatsapp/whatsapp-setup";
import { WhatsappSetupModal } from "../whatsapp/whatsapp-setup-modal";
import { WhatsappPreview } from "../whatsapp/whatsapp-preview";

const clients = (count: number) => `${formatInteger(count)} ${count === 1 ? "cliente" : "clientes"}`;

const resetsLabel = (window: QuotaWindow) => (window.resets_at ? `Se restablece el ${formatDateTime(window.resets_at)}.` : "");

/** Uso de un límite de correos: "35 de 100". */
function QuotaBar({ label, window }: { label: string; window: QuotaWindow }) {
  const full = window.remaining === 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted">{label}</span>
        <span className={cn("tabular-nums", full && "text-danger")}>
          {formatInteger(window.used)} / {formatInteger(window.limit)}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface">
        <div
          className={cn("h-full rounded-full", full ? "bg-danger" : "bg-accent")}
          style={{ width: `${Math.min(100, (window.used / Math.max(window.limit, 1)) * 100)}%` }}
        />
      </div>
      {full && <p className="text-xs text-danger">Límite alcanzado. {resetsLabel(window)}</p>}
    </div>
  );
}

/** Un paso del formulario: número, título y contenido alineado bajo el título. */
function Step({ number, title, hint, tour, children }: { number: number; title: string; hint?: string; tour?: string; children: ReactNode }) {
  return (
    <section data-tour={tour} className="flex gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
        {number}
      </span>
      <div className="min-w-0 flex-1 space-y-3">
        <div className="pt-0.5">
          <h3 className="text-sm font-semibold">{title}</h3>
          {hint && <p className="text-xs text-muted">{hint}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}

function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 truncate text-right font-medium">{children}</dd>
    </div>
  );
}

interface NewCampaignCardProps {
  data: MarketingResponse;
  /** Plantilla con la que se llega desde el paso "Diseña tu correo". */
  initialSlot?: number;
  /** Volver al paso de diseño. */
  onEditTemplates: () => void;
}

/** Nueva campaña: plantilla, canal y grupo a la izquierda; resumen y envío a la derecha. */
export function NewCampaignCard({ data, initialSlot, onEditTemplates }: NewCampaignCardProps) {
  const savedTemplates = data.templates.filter((template) => template.saved);
  const [slot, setSlot] = useState<number | null>(initialSlot ?? savedTemplates[0]?.slot ?? null);
  const [channel, setChannel] = useState<CampaignChannel>("email");
  const [segment, setSegment] = useState<CampaignSegment>("all");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isWhatsappOpen, setIsWhatsappOpen] = useState(false);
  const { data: whatsapp } = useQueryMyWhatsappSettings();

  const { data: audience, isLoading: isAudienceLoading } = useQueryMarketingAudience();
  const create = useMutationCreateCampaign();

  const count = audience?.segments[segment][channel] ?? 0;
  const cooldownCount = channel === "email" ? (audience?.segments[segment].email_cooldown ?? 0) : 0;
  /** No aceptaron promociones en su última compra: no reciben por ningún canal. */
  const optedOutCount = audience?.segments[segment].opted_out ?? 0;
  const quota = audience?.quota;
  const whatsappApi = audience?.whatsapp_mode === "api";
  const ChannelIcon = CHANNELS[channel].icon;
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
      : channel === "email" && data.pause
        ? "Tus campañas de correo están pausadas. Puedes seguir enviando por WhatsApp."
      : channel === "email" && !data.sender.configured
        ? "El envío de correos no está configurado en el servidor."
        : channel === "whatsapp" && !whatsappApi
          ? "Conecta WhatsApp Business para enviar campañas por WhatsApp."
        : count === 0
          ? channel === "email"
            ? cooldownCount > 0
              ? `Los clientes de este grupo ya recibieron un correo en los últimos ${audience?.cooldown_days ?? 7} días.`
              : "Ningún cliente de este grupo tiene correo."
            : "Ningún cliente de este grupo tiene un celular válido."
          : quotaBlocker;

  /** Avisos sobre quiénes quedan fuera del grupo elegido. */
  const audienceNotes = audience
    ? [
        channel === "email"
          ? `Solo cuentan los clientes con correo que pueden recibir hoy${audience.unsubscribed ? ` (${audience.unsubscribed} no reciben: baja o correo inválido)` : ""}.`
          : "Solo cuentan los clientes con un celular colombiano válido.",
        cooldownCount > 0 &&
          `${formatInteger(cooldownCount)} ${cooldownCount === 1 ? "está" : "están"} en espera: ya ${cooldownCount === 1 ? "recibió" : "recibieron"} un correo en los últimos ${audience.cooldown_days} días.`,
        optedOutCount > 0 &&
          `${formatInteger(optedOutCount)} no ${optedOutCount === 1 ? "recibe" : "reciben"} promociones: no aceptaron al comprar o se dieron de baja.`,
      ].filter((note): note is string => Boolean(note))
    : [];

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
            toast.success(`Enviando por WhatsApp a ${campaign.total} clientes.`);
          } else {
            const omitted = skipped.cooldown + skipped.suppressed + (skipped.opted_out ?? 0) + (skipped.invalid ?? 0);
            toast.success(
              `Enviando a ${campaign.total} clientes. Puedes seguir trabajando.${omitted ? ` ${omitted} se omitieron (espera de 7 días, baja, sin permiso o correo inválido).` : ""}`,
            );
          }
        },
        onError: (error) => {
          setIsConfirmOpen(false);
          handleAxiosError(error, "No se pudo crear la campaña");
        },
      },
    );
  };

  const status = whatsapp ? whatsappStatus(whatsapp) : null;
  /** Ya empezó a configurarlo: mostrar en qué va. */
  const whatsappStarted = Boolean(whatsapp && (whatsapp.has_token || whatsapp.phone_number_id));

  return (
    <Card data-tour="send-new">
      <Card.Content className="p-5">
        <header className="mb-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <Send className="size-4" /> Nueva campaña
          </h2>
          <p className="text-xs text-muted">Elige qué enviar, por dónde y a quién. Revisa el resumen y envía.</p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-6">
            <Step number={1} title="Plantilla" hint="El contenido que recibirán tus clientes.">
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
            </Step>

            <Step number={2} title="Canal" tour="send-channel">
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

              {channel === "email" && (
                <p className="text-xs text-muted">
                  Sale desde {data.sender.email ?? "el correo de VendeYaOnline"} con el nombre «{data.brand.sender_name}». Cada
                  correo lleva un enlace para darse de baja.
                </p>
              )}

              {channel === "whatsapp" && !whatsappApi && (
                <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-secondary p-4">
                  <span className="hidden size-9 shrink-0 items-center justify-center rounded-lg bg-surface sm:flex">
                    <Lock className="size-4 text-muted" />
                  </span>
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Conecta WhatsApp Business para enviar por WhatsApp</p>
                      <p className="text-xs text-muted">
                        Con la API oficial de Meta tus campañas salen solas, con tus productos en carrusel: foto, precio y botón
                        «Comprar». Tu número no corre riesgo de bloqueo por mensajes masivos.
                      </p>
                    </div>
                    {whatsappStarted && status && (
                      <p className="flex items-center gap-1.5 text-xs text-warning">
                        <AlertTriangle className="size-3.5 shrink-0" /> {status.title}
                      </p>
                    )}
                    {whatsapp && (
                      <Button
                        variant="primary"
                        size="sm"
                        onPress={() => setIsWhatsappOpen(true)}
                        className="h-auto min-h-8 w-full whitespace-normal py-1.5 leading-snug sm:w-auto"
                      >
                        <MessageCircle className="size-4 shrink-0" />
                        {whatsappStarted ? "Continuar configuración" : "Configurar WhatsApp Business"}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {channel === "whatsapp" && whatsappApi && (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2">
                    <p className="min-w-0 text-xs">
                      <span className="font-semibold">{status?.title ?? "WhatsApp Business conectado"}.</span>{" "}
                      <span className="text-muted">
                        {whatsapp?.carousel_template_name
                          ? `Con ${whatsapp.carousel_cards} o más productos se envía en carrusel con foto, precio y botón «Comprar».`
                          : "Configura el carrusel para mostrar tus productos con foto."}
                      </span>
                    </p>
                    <Button variant="ghost" size="sm" onPress={() => setIsWhatsappOpen(true)}>
                      <Settings2 className="size-4" /> Configuración
                    </Button>
                  </div>
                  <WhatsappPreview slot={slot} onEditTemplates={onEditTemplates} />
                </>
              )}
            </Step>

            <Step number={3} title="A quién" hint="El número es cuántos clientes de cada grupo pueden recibirla hoy.">
              <div className="grid gap-2 sm:grid-cols-2">
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
              {audienceNotes.length > 0 && (
                <ul className="space-y-1">
                  {audienceNotes.map((note) => (
                    <li key={note} className="flex gap-1.5 text-xs text-muted">
                      <Info className="mt-0.5 size-3 shrink-0" /> {note}
                    </li>
                  ))}
                </ul>
              )}
            </Step>
          </div>

          <aside className="h-fit space-y-4 rounded-xl border border-border bg-surface-secondary p-4 lg:sticky lg:top-4">
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">Resumen</p>

            <dl className="space-y-2">
              <SummaryRow label="Plantilla">{template?.saved ? template.name : "—"}</SummaryRow>
              <SummaryRow label="Canal">
                <span className="inline-flex items-center gap-1.5">
                  <ChannelIcon className="size-3.5 text-muted" /> {CHANNELS[channel].label}
                </span>
              </SummaryRow>
              <SummaryRow label="Grupo">{SEGMENT_LABELS[segment]}</SummaryRow>
            </dl>

            <div className="rounded-lg bg-surface p-3 text-center">
              <p className="text-3xl font-semibold tabular-nums">{isAudienceLoading ? "…" : formatInteger(count)}</p>
              <p className="text-xs text-muted">{count === 1 ? "cliente la recibirá" : "clientes la recibirán"}</p>
            </div>

            {channel === "email" && quota && (
              <div className="space-y-2.5">
                <QuotaBar label="Correos hoy" window={quota.daily} />
                <QuotaBar label="En esta hora" window={quota.hourly} />
                <QuotaBar label="Este mes" window={quota.monthly} />
              </div>
            )}
            {channel === "whatsapp" && whatsappApi && (
              <p className="text-xs text-muted">Meta cobra cada mensaje directamente en tu cuenta.</p>
            )}

            {blocker && (
              <p className="flex gap-2 rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" /> {blocker}
              </p>
            )}

            <Button
              variant="primary"
              className="w-full"
              isDisabled={isAudienceLoading || Boolean(blocker) || create.isPending}
              onPress={openConfirm}
            >
              <Users className="size-4" />
              {`Enviar a ${clients(count)}`}
            </Button>
          </aside>
        </div>
      </Card.Content>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={handleCreate}
        tone="accent"
        title={channel === "email" ? "¿Enviar la campaña?" : "¿Enviar la campaña por WhatsApp?"}
        description={
          channel === "email"
            ? `Se enviará «${template?.name}» a ${count} ${count === 1 ? "cliente" : "clientes"} (${SEGMENT_LABELS[segment].toLowerCase()}). No se puede deshacer.`
            : `Se enviará «${template?.name}» por WhatsApp a ${count} ${count === 1 ? "cliente" : "clientes"} (${SEGMENT_LABELS[segment].toLowerCase()}). Meta cobra cada mensaje en tu cuenta. No se puede deshacer.`
        }
        confirmLabel="Enviar ahora"
        pendingLabel="Creando"
        isPending={create.isPending}
      />
      <WhatsappSetupModal isOpen={isWhatsappOpen} onClose={() => setIsWhatsappOpen(false)} />
    </Card>
  );
}
