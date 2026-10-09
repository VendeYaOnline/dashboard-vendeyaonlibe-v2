"use client";

import { MessageCircle } from "lucide-react";
import { Button, Modal, useOverlayState } from "@heroui/react";
import { ModalFormHeader } from "@/components/shared/modal-form-header";
import { useQueryMyWhatsappSettings } from "@/app/api/queries";
import { useMutationTestMyWhatsapp, useMutationUpdateMyWhatsapp } from "@/app/api/mutations";
import { useAuthStore } from "@/store/auth.store";
import { WhatsappSetup } from "./whatsapp-setup";

/** La tienda conecta su propio WhatsApp Business (Cloud API) desde Marketing. */
export function WhatsappSetupModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const state = useOverlayState({ isOpen, onOpenChange: (open) => !open && onClose() });
  const isAdmin = useAuthStore((s) => s.user?.role) === "admin";
  const { data: settings, isLoading } = useQueryMyWhatsappSettings(isOpen);
  const update = useMutationUpdateMyWhatsapp();
  const test = useMutationTestMyWhatsapp();

  return (
    <Modal state={state}>
      <Modal.Backdrop isDismissable={!update.isPending && !test.isPending}>
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog className="max-w-3xl">
            <ModalFormHeader
              icon={MessageCircle}
              title="WhatsApp Business"
              description="Conecta tu número con la API de Meta para enviar las campañas de WhatsApp automáticamente, sin abrir cada chat."
            />
            <Modal.Body>
              <WhatsappSetup
                settings={settings}
                isLoading={isLoading}
                canEdit={isAdmin}
                onSave={(data) => update.mutateAsync(data)}
                onTest={() => test.mutateAsync()}
                isSaving={update.isPending}
                isTesting={test.isPending}
                guideOpen
              />
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
