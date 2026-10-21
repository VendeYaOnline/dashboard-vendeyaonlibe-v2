"use client";

import { useState } from "react";
import { History, TrendingUp } from "lucide-react";
import { Button, Card } from "@heroui/react";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { useQueryMarketingCampaigns } from "@/app/api/queries";
import { formatMoney } from "@/features/analisis/utils";
import type { MarketingCampaign, MarketingResponse } from "@/interfaces/marketing";
import { CampaignDetailModal } from "./campaign-detail-modal";
import { CHANNELS, CampaignProgress, SEGMENT_LABELS, formatDateTime } from "./campaign-shared";
import { ContactsPanel } from "./contacts-panel";
import { AbandonedCartsPanel } from "./abandoned-carts-panel";
import { NewCampaignCard } from "./new-campaign-card";

interface CampaignsPanelProps {
  data: MarketingResponse;
  /** Plantilla con la que se llega desde el paso "Diseña tu correo". */
  initialSlot?: number;
  /** Volver al paso de diseño. */
  onEditTemplates: () => void;
}

/** Paso "Envía": nueva campaña (plantilla, canal y grupo) e historial. */
export function CampaignsPanel({ data, initialSlot, onEditTemplates }: CampaignsPanelProps) {
  const [openCampaign, setOpenCampaign] = useState<string | null>(null);
  const { data: history, isLoading: isHistoryLoading } = useQueryMarketingCampaigns();

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
      key: "sales",
      label: "Compraron después",
      render: ({ sales }) =>
        !sales || sales.count === 0 ? (
          <span className="text-xs text-muted">Aún no</span>
        ) : (
          <div className="whitespace-nowrap">
            <p className="text-sm font-semibold tabular-nums text-success">{formatMoney(sales.total)}</p>
            <p className="text-xs text-muted">
              {sales.buyers} {sales.buyers === 1 ? "cliente" : "clientes"} · {sales.count} {sales.count === 1 ? "venta" : "ventas"}
              {sales.with_code > 0 && ` · ${sales.with_code} con el código`}
            </p>
          </div>
        ),
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
      <NewCampaignCard data={data} initialSlot={initialSlot} onEditTemplates={onEditTemplates} />

      <Card className="overflow-hidden" data-tour="send-history">
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4">
          <div>
            <h2 className="flex items-center gap-2 font-semibold">
              <History className="size-4" /> Historial
            </h2>
            <p className="max-w-xl text-xs text-muted">
              «Compraron después» cuenta las compras de quienes recibieron la campaña en los{" "}
              {history?.sales_summary?.attribution_days ?? 7} días siguientes. Cada venta cuenta para la campaña más
              reciente que recibió el cliente.
            </p>
          </div>
          {history?.sales_summary && history.sales_summary.count > 0 && (
            <div className="rounded-lg bg-success/10 px-3 py-2 text-right">
              <p className="flex items-center justify-end gap-1 text-xs text-muted">
                <TrendingUp className="size-3.5" /> Ventas después de tus campañas ({history.sales_summary.days} días)
              </p>
              <p className="font-semibold tabular-nums text-success">{formatMoney(history.sales_summary.total)}</p>
              <p className="text-xs text-muted">
                {history.sales_summary.buyers} {history.sales_summary.buyers === 1 ? "cliente" : "clientes"} ·{" "}
                {history.sales_summary.count} {history.sales_summary.count === 1 ? "venta" : "ventas"}
              </p>
            </div>
          )}
        </div>
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

      <div data-tour="send-contacts">
        <ContactsPanel />
      </div>

      <div data-tour="send-carts">
        <AbandonedCartsPanel />
      </div>

      <CampaignDetailModal campaignId={openCampaign} onClose={() => setOpenCampaign(null)} />
    </div>
  );
}
