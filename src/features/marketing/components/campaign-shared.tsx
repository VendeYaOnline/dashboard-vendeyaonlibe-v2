"use client";

import { Mail, MessageCircle } from "lucide-react";
import { Chip, Spinner } from "@heroui/react";
import type { CampaignChannel, CampaignSegment, MarketingCampaign } from "@/interfaces/marketing";

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

/** Resultado: correo = enviados (con indicador mientras se envía); WhatsApp = contactados. */
export function CampaignProgress({ campaign }: { campaign: MarketingCampaign }) {
  if (campaign.channel === "whatsapp") {
    const done = campaign.contacted ?? 0;
    return (
      <span className="text-sm tabular-nums">
        {done} de {campaign.total} contactados
      </span>
    );
  }
  if (campaign.status === "sending") {
    return (
      <span className="flex items-center gap-2 text-sm tabular-nums">
        <Spinner size="sm" aria-label="Enviando" />
        Enviando {campaign.sent} de {campaign.total}
      </span>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-1.5 text-sm tabular-nums">
      <Chip size="sm" variant="soft" color={campaign.status === "failed" ? "danger" : "success"}>
        {campaign.sent} enviados
      </Chip>
      {campaign.failed > 0 && (
        <Chip size="sm" variant="soft" color="danger">
          {campaign.failed} fallidos
        </Chip>
      )}
    </span>
  );
}
