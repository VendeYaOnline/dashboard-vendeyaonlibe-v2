"use client";

import { MessageCircle } from "lucide-react";
import { Button, Modal, Spinner, useOverlayState } from "@heroui/react";
import { ModalFormHeader } from "@/components/shared/modal-form-header";
import { useQueryMyWhatsappSettings, useQueryWhatsappSignupConfig } from "@/app/api/queries";
import { useMutationTestMyWhatsapp, useMutationUpdateMyWhatsapp } from "@/app/api/mutations";
import { useAuthStore } from "@/store/auth.store";
import { WhatsappConnect } from "./whatsapp-connect";
import { WhatsappSetup, WhatsappStatusBanner } from "./whatsapp-setup";

/**
 * La tienda conecta su propio WhatsApp Business (Cloud API) desde Marketing:
 * con la guía y el formulario (su app de Meta y un número aparte). Si algún
 * día el servidor tiene la app de Meta de VendeYaOnline (Tech Provider), se
 * usa en su lugar el botón «Conectar con Facebook» (mismo número de la app).
 */
export function WhatsappSetupModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const state = useOverlayState({ isOpen, onOpenChange: (open) => !open && onClose() });
  const isAdmin = useAuthStore((s) => s.user?.role) === "admin";
  const { data: settings, isLoading } = useQueryMyWhatsappSettings(isOpen);
  const { data: signup, isLoading: isSignupLoading } = useQueryWhatsappSignupConfig(isOpen);
  const update = useMutationUpdateMyWhatsapp();
  const test = useMutationTestMyWhatsapp();
  const withFacebook = Boolean(signup?.available);

  return (
    <Modal state={state}>
      <Modal.Backdrop isDismissable={!update.isPending && !test.isPending}>
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog className="max-w-3xl">
            <ModalFormHeader
              icon={MessageCircle}
              title="WhatsApp Business"
              description="Conecta tu número con la API de Meta para enviar las campañas y los recordatorios de WhatsApp automáticamente, sin abrir cada chat."
            />
            <Modal.Body className="space-y-4">
              {isLoading || isSignupLoading || !settings ? (
                <p className="flex items-center gap-2 text-sm text-muted">
                  <Spinner size="sm" /> Cargando...
                </p>
              ) : withFacebook ? (
                <>
                  <WhatsappStatusBanner settings={settings} />
                  <WhatsappConnect settings={settings} canEdit={isAdmin} />
                </>
              ) : (
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
