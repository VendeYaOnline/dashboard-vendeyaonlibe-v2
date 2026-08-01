"use client";

import { Button, Modal, useOverlayState } from "@heroui/react";
import type { Contacts } from "@/interfaces/contacts";

interface MensajeDetailsModalProps {
  contact: Contacts | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export function MensajeDetailsModal({
  contact,
  isOpen,
  onOpenChange,
}: MensajeDetailsModalProps) {
  const state = useOverlayState({ isOpen, onOpenChange });

  return (
    <Modal state={state}>
      <Modal.Backdrop>
        <Modal.Container size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Detalle del mensaje</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="space-y-4">
              {contact && (
                <>
                  <Field label="Asunto">
                    <span className="font-medium">{contact.subject}</span>
                  </Field>
                  <Field label="Email">
                    <a
                      href={`mailto:${contact.email}`}
                      className="font-medium text-link hover:underline"
                    >
                      {contact.email}
                    </a>
                  </Field>
                  <Field label="Mensaje">
                    <p className="whitespace-pre-wrap leading-relaxed text-muted">
                      {contact.message}
                    </p>
                  </Field>
                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="ghost" onPress={() => onOpenChange(false)}>
                Cerrar
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
