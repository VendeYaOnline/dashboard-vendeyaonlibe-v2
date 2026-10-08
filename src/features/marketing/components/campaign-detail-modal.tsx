"use client";

import { Check, ExternalLink, Megaphone, RotateCcw } from "lucide-react";
import { Button, Chip, Modal, Spinner, buttonVariants, cn, useOverlayState } from "@heroui/react";
import { ModalFormHeader } from "@/components/shared/modal-form-header";
import { useQueryMarketingCampaign } from "@/app/api/queries";
import { useMutationMarkRecipient } from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import type { CampaignRecipient } from "@/interfaces/marketing";
import { CHANNELS, CampaignProgress, SEGMENT_LABELS } from "./campaign-shared";

const STATUS: Record<CampaignRecipient["status"], { label: string; color: "default" | "success" | "danger" }> = {
  pending: { label: "Pendiente", color: "default" },
  sent: { label: "Enviado", color: "success" },
  failed: { label: "Falló", color: "danger" },
  contacted: { label: "Contactado", color: "success" },
};

/** "573001234567" → "300 123 4567". */
const formatPhone = (number: string) => number.replace(/^57/, "").replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");

/** Detalle de una campaña. En WhatsApp es la lista de trabajo: abrir cada chat y marcarlo. */
export function CampaignDetailModal({ campaignId, onClose }: { campaignId: string | null; onClose: () => void }) {
  const state = useOverlayState({ isOpen: campaignId !== null, onOpenChange: (open) => !open && onClose() });
  const { data, isLoading } = useQueryMarketingCampaign(campaignId);
  const mark = useMutationMarkRecipient();
  const campaign = data?.campaign;
  const isWhatsapp = campaign?.channel === "whatsapp";

  const setContacted = (recipient: CampaignRecipient, contacted: boolean) =>
    campaign &&
    mark.mutate(
      { campaignId: campaign.id, recipientId: recipient.id, contacted },
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
                  ? `${CHANNELS[campaign.channel].label} · ${SEGMENT_LABELS[campaign.segment]} · ${campaign.total} clientes`
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
                  {isWhatsapp && data.message && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted">Mensaje (con el nombre de cada cliente)</p>
                      <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-surface-secondary p-3 font-sans text-sm">
                        {data.message}
                      </pre>
                      <p className="text-xs text-muted">
                        «Abrir WhatsApp» abre el chat con el mensaje listo: solo pulsa enviar en WhatsApp. Ábrelo desde el
                        celular o WhatsApp Web con el número de tu marca.
                      </p>
                    </div>
                  )}
                  <ul className="divide-y divide-border rounded-lg border border-border">
                    {data.recipients.map((recipient) => (
                      <li key={recipient.id} className="flex flex-wrap items-center gap-3 px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{recipient.name}</p>
                          <p className="truncate text-xs text-muted tabular-nums">
                            {isWhatsapp ? formatPhone(recipient.address) : recipient.address}
                            {recipient.error && <span className="text-danger"> · {recipient.error}</span>}
                          </p>
                        </div>
                        <Chip size="sm" variant="soft" color={STATUS[recipient.status].color}>
                          {STATUS[recipient.status].label}
                        </Chip>
                        {isWhatsapp && recipient.whatsapp_url && (
                          <>
                            <a
                              href={recipient.whatsapp_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              // Al abrir el chat se marca como contactado.
                              onClick={() => recipient.status !== "contacted" && setContacted(recipient, true)}
                              className={cn(buttonVariants({ variant: recipient.status === "contacted" ? "ghost" : "primary", size: "sm" }))}
                            >
                              <ExternalLink className="size-3.5" />
                              {recipient.status === "contacted" ? "Abrir otra vez" : "Abrir WhatsApp"}
                            </a>
                            {recipient.status === "contacted" ? (
                              <Button variant="ghost" size="sm" isIconOnly aria-label={`Marcar ${recipient.name} como pendiente`} onPress={() => setContacted(recipient, false)}>
                                <RotateCcw className="size-3.5" />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="sm" isIconOnly aria-label={`Marcar ${recipient.name} como contactado`} onPress={() => setContacted(recipient, true)}>
                                <Check className="size-3.5" />
                              </Button>
                            )}
                          </>
                        )}
                      </li>
                    ))}
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
