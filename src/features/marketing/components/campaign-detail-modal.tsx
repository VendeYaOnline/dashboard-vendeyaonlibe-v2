"use client";

import { Check, ExternalLink, Megaphone, RotateCcw } from "lucide-react";
import { Button, Chip, Modal, Spinner, buttonVariants, cn, useOverlayState } from "@heroui/react";
import { ModalFormHeader } from "@/components/shared/modal-form-header";
import { useQueryMarketingCampaign } from "@/app/api/queries";
import { useMutationMarkRecipient } from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
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
