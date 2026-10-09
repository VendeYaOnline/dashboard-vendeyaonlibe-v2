"use client";

import { Mail, MessageCircle } from "lucide-react";
import { Chip, Spinner } from "@heroui/react";
import type { CampaignChannel, CampaignSegment, MarketingCampaign, RecipientStatus } from "@/interfaces/marketing";

/** Lo que comparten el formulario de campañas, el historial y el detalle. */

export const SEGMENTS: { id: CampaignSegment; label: string; hint: string }[] = [
  { id: "all", label: "Todos", hint: "Todos tus clientes" },
  { id: "recurring", label: "Recurrentes", hint: "Compraron 2 o más veces" },
  { id: "new", label: "Nuevos", hint: "Primera compra hace poco" },
  { id: "inactive", label: "Inactivos", hint: "No compran hace tiempo" },
];

export const CHANNELS: Record<CampaignChannel, { label: string; icon: typeof Mail }> = {
  email: { label: "Correo", icon: Mail },
  whatsapp: { label: "WhatsApp", icon: MessageCircle },
};

export const SEGMENT_LABELS = Object.fromEntries(SEGMENTS.map((segment) => [segment.id, segment.label])) as Record<CampaignSegment, string>;

type ChipColor = "default" | "accent" | "success" | "warning" | "danger";

/** Estado de un destinatario: sent = el proveedor lo aceptó; delivered = llegó al buzón. */
export const RECIPIENT_STATUS: Record<RecipientStatus, { label: string; color: ChipColor }> = {
  pending: { label: "Pendiente", color: "default" },
  sent: { label: "Enviado", color: "success" },
  delivered: { label: "Entregado", color: "success" },
  bounced: { label: "Rebotó", color: "danger" },
  complained: { label: "Marcado spam", color: "danger" },
  failed: { label: "Falló", color: "danger" },
  opened: { label: "Chat abierto", color: "warning" },
  contacted: { label: "Enviado (confirmado)", color: "success" },
};

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" });

const count = (campaign: MarketingCampaign, status: RecipientStatus) => campaign.counts?.[status] ?? 0;

/** label: [singular, plural]. */
const StatusChip = ({ value, label, color }: { value: number; label: [string, string]; color: ChipColor }) =>
  value > 0 ? (
    <Chip size="sm" variant="soft" color={color}>
      {value} {value === 1 ? label[0] : label[1]}
    </Chip>
  ) : null;

/**
 * Resultado de una campaña por estado. Correo: enviados / entregados / rebotes /
 * fallidos. WhatsApp manual: chats abiertos y confirmados. WhatsApp API:
 * enviados y fallidos. Un error nunca cuenta como enviado.
 */
export function CampaignProgress({ campaign }: { campaign: MarketingCampaign }) {
  if (campaign.channel === "whatsapp" && campaign.delivery !== "whatsapp_api") {
    const contacted = count(campaign, "contacted");
    const opened = count(campaign, "opened");
    return (
      <span className="flex flex-wrap items-center gap-1.5 text-sm tabular-nums">
        <span>
          {contacted} de {campaign.total} confirmados
        </span>
        <StatusChip value={opened} label={["chat abierto", "chats abiertos"]} color="warning" />
      </span>
    );
  }

  const pending = count(campaign, "pending");
  if (campaign.status === "sending") {
    const paused = campaign.paused_until && new Date(campaign.paused_until) > new Date();
    return (
      <span className="flex flex-wrap items-center gap-2 text-sm tabular-nums">
        <Spinner size="sm" aria-label="Enviando" />
        {paused
          ? `En pausa por el límite por hora · sigue a las ${formatTime(campaign.paused_until as string)}`
          : `Enviando ${campaign.total - pending} de ${campaign.total}`}
      </span>
    );
  }

  const accepted = count(campaign, "sent");
  const delivered = count(campaign, "delivered");
  return (
    <span className="flex flex-wrap items-center gap-1.5 text-sm tabular-nums">
      <StatusChip value={accepted} label={["enviado", "enviados"]} color="success" />
      <StatusChip value={delivered} label={["entregado", "entregados"]} color="success" />
      <StatusChip value={count(campaign, "bounced")} label={["rebote", "rebotes"]} color="danger" />
      <StatusChip value={count(campaign, "complained")} label={["spam", "spam"]} color="danger" />
      <StatusChip value={count(campaign, "failed")} label={["fallido", "fallidos"]} color="danger" />
      <StatusChip value={pending} label={["pendiente", "pendientes"]} color="default" />
    </span>
  );
}
