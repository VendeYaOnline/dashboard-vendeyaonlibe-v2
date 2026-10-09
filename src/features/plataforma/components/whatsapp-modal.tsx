"use client";

import { MessageCircle } from "lucide-react";
import { Button, Modal, useOverlayState } from "@heroui/react";
import { ModalFormHeader } from "@/components/shared/modal-form-header";
import { useQueryWhatsappSettings } from "@/app/api/queries";
import { useMutationTestWhatsapp, useMutationUpdateWhatsappSettings } from "@/app/api/mutations";
import { WhatsappSetup } from "@/features/marketing/whatsapp/whatsapp-setup";
import type { PlatformCompany } from "@/interfaces/platform";

interface WhatsappModalProps {
  /** Empresa a configurar; null = cerrado. */
  company: PlatformCompany | null;
  onClose: () => void;
}

/**
 * WhatsApp Cloud API de una empresa (superadmin). La tienda también puede
 * configurarlo ella misma desde Marketing; ambos ven el mismo estado.
 */
export function WhatsappModal({ company, onClose }: WhatsappModalProps) {
  const state = useOverlayState({ isOpen: company !== null, onOpenChange: (open) => !open && onClose() });
  const { data: settings, isLoading } = useQueryWhatsappSettings(company?.id ?? null);
  const update = useMutationUpdateWhatsappSettings();
  const test = useMutationTestWhatsapp();

  return (
    <Modal state={state}>
      <Modal.Backdrop isDismissable={!update.isPending && !test.isPending}>
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog className="max-w-3xl">
            <ModalFormHeader
              icon={MessageCircle}
              title={`WhatsApp · ${company?.name ?? ""}`}
              description="WhatsApp Cloud API de Meta para enviar las campañas automáticamente desde el número de la tienda."
            />
            <Modal.Body>
              {company && (
                <WhatsappSetup
                  settings={settings}
                  isLoading={isLoading}
                  canEdit
                  onSave={(data) => update.mutateAsync({ id: company.id, data })}
                  onTest={() => test.mutateAsync(company.id)}
                  isSaving={update.isPending}
                  isTesting={test.isPending}
                />
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
