"use client";

import { Check, ExternalLink, Megaphone, RotateCcw, Ticket, TrendingUp } from "lucide-react";
import { Button, Chip, Modal, Spinner, buttonVariants, cn, useOverlayState } from "@heroui/react";
import { ModalFormHeader } from "@/components/shared/modal-form-header";
import { useQueryMarketingCampaign } from "@/app/api/queries";
import { useMutationMarkRecipient } from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import { formatMoney } from "@/features/analisis/utils";
import type { CampaignRecipient } from "@/interfaces/marketing";
import { CHANNELS, CampaignProgress, RECIPIENT_STATUS, SEGMENT_LABELS, formatDateTime } from "./campaign-shared";

/** "573001234567" → "300 123 4567". */
const formatPhone = (number: string) => number.replace(/^57/, "").replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");

/**
 * Detalle de una campaña. En WhatsApp manual es la lista de trabajo: abrir el
 * chat lo deja como "Chat abierto" y la tienda confirma con ✓ cuando lo envió
 * (abrir el chat no garantiza que se haya enviado). Por API solo muestra estados.
 */
export function CampaignDetailModal({ campaignId, onClose }: { campaignId: string | null; onClose: () => void }) {
  const state = useOverlayState({ isOpen: campaignId !== null, onOpenChange: (open) => !open && onClose() });
  const { data, isLoading } = useQueryMarketingCampaign(campaignId);
  const mark = useMutationMarkRecipient();
  const campaign = data?.campaign;
  const isWhatsapp = campaign?.channel === "whatsapp";
  const isManual = isWhatsapp && campaign?.delivery !== "whatsapp_api";

  const setStatus = (recipient: CampaignRecipient, status: "opened" | "contacted" | "pending") =>
    campaign &&
    mark.mutate(
      { campaignId: campaign.id, recipientId: recipient.id, status },
      { onError: (error) => handleAxiosError(error, "No se pudo actualizar") },
    );

  return (
    <Modal state={state}>
      <Modal.Backdrop isDismissable>
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog>
            <ModalFormHeader
              icon={campaign ? CHANNELS[campaign.channel].icon : Megaphone}
              title={campaign ? campaign.template_name : "Campaña"}
              description={
                campaign
                  ? `${CHANNELS[campaign.channel].label}${isWhatsapp ? (isManual ? " (enlaces)" : " (API)") : ""} · ${SEGMENT_LABELS[campaign.segment]} · ${campaign.total} clientes`
                  : ""
              }
            />
            <Modal.Body className="space-y-4">
              {isLoading || !data || !campaign ? (
                <div className="flex justify-center py-12">
                  <Spinner aria-label="Cargando campaña" />
                </div>
              ) : (
                <>
                  <CampaignProgress campaign={campaign} />
                  <section className="space-y-2 rounded-lg border border-border p-3">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <TrendingUp className="size-4 text-success" />
                      Compraron después de recibirla
                      {data.sales && data.sales.length > 0 && (
                        <span className="ml-auto font-semibold tabular-nums text-success">
                          {formatMoney(data.sales.reduce((sum, sale) => sum + sale.total, 0))}
                        </span>
                      )}
                    </p>
                    {!data.sales || data.sales.length === 0 ? (
                      <p className="text-xs text-muted">
                        Aún nadie que la recibió ha comprado. Se cuentan las compras de los 7 días siguientes al envío.
                      </p>
                    ) : (
                      <ul className="divide-y divide-border">
                        {data.sales.map((sale) => (
                          <li key={sale.id} className="flex flex-wrap items-center gap-2 py-1.5 text-sm">
                            <span className="min-w-0 flex-1 truncate">
                              {sale.name}
                              <span className="text-xs text-muted">
                                {" "}· {formatDateTime(sale.purchase_date)}
                                {sale.order_number ? ` · ${sale.order_number}` : ""} · {sale.status}
                              </span>
                            </span>
                            {sale.used_code && (
                              <Chip size="sm" variant="soft" color="success">
                                <Ticket className="size-3" /> Usó el código
                              </Chip>
                            )}
                            <span className="font-medium tabular-nums">{formatMoney(sale.total)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {data.discount_code && (
                      <p className="text-xs text-muted">
                        Código de la campaña: <span className="font-medium text-foreground">{data.discount_code}</span>
                      </p>
                    )}
                  </section>
                  {isManual && data.message && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted">Mensaje (con el nombre de cada cliente)</p>
                      <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-surface-secondary p-3 font-sans text-sm">
                        {data.message}
                      </pre>
                      <p className="text-xs text-muted">
                        «Abrir WhatsApp» abre el chat con el mensaje listo. Después de enviarlo en WhatsApp, pulsa ✓ para
                        confirmarlo: así el historial distingue los chats abiertos de los mensajes enviados.
                      </p>
                    </div>
                  )}
                  <ul className="divide-y divide-border rounded-lg border border-border">
                    {data.recipients.map((recipient) => {
                      const status = RECIPIENT_STATUS[recipient.status];
                      const confirmed = recipient.status === "contacted";
                      return (
                        <li key={recipient.id} className="flex flex-wrap items-center gap-3 px-3 py-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{recipient.name}</p>
                            <p className="truncate text-xs text-muted tabular-nums">
                              {isWhatsapp ? formatPhone(recipient.address) : recipient.address}
                              {recipient.sent_at && ` · ${formatDateTime(recipient.sent_at)}`}
                              {recipient.error && <span className="text-danger"> · {recipient.error}</span>}
                            </p>
                          </div>
                          <Chip size="sm" variant="soft" color={status.color}>
                            {status.label}
                          </Chip>
                          {isManual && recipient.whatsapp_url && (
                            <>
                              <a
                                href={recipient.whatsapp_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                // Abrir el chat no confirma el envío: queda como "Chat abierto".
                                onClick={() => recipient.status === "pending" && setStatus(recipient, "opened")}
                                className={cn(buttonVariants({ variant: recipient.status === "pending" ? "primary" : "ghost", size: "sm" }))}
                              >
                                <ExternalLink className="size-3.5" />
                                {recipient.status === "pending" ? "Abrir WhatsApp" : "Abrir otra vez"}
                              </a>
                              {confirmed ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  isIconOnly
                                  aria-label={`Marcar ${recipient.name} como pendiente`}
                                  isDisabled={mark.isPending}
                                  onPress={() => setStatus(recipient, "pending")}
                                >
                                  <RotateCcw className="size-3.5" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  isIconOnly
                                  aria-label={`Confirmar que se envió a ${recipient.name}`}
                                  isDisabled={mark.isPending}
                                  onPress={() => setStatus(recipient, "contacted")}
                                >
                                  <Check className="size-3.5" />
                                </Button>
                              )}
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="ghost" onPress={onClose}>
                Cerrar
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
