"use client";

import { useState } from "react";
import { Check, Copy, Reply } from "lucide-react";
import { Button, Chip, Modal, useOverlayState } from "@heroui/react";
import type { Contacts } from "@/interfaces/contacts";
import { buildReplyLink, formatReceivedAt } from "../utils";

interface MensajeDetailsModalProps {
  contact: Contacts | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** Marca el mensaje como no leído y cierra el modal. */
  onMarkUnread?: (contact: Contacts) => void;
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
  onMarkUnread,
}: MensajeDetailsModalProps) {
  const state = useOverlayState({ isOpen, onOpenChange });
  const [copied, setCopied] = useState(false);

  const receivedAt = formatReceivedAt(contact?.created_at);

  const copyEmail = async () => {
    if (!contact) return;
    try {
      await navigator.clipboard.writeText(contact.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Sin permiso de portapapeles: el email sigue visible para copiarlo a mano.
    }
  };

  return (
    <Modal state={state}>
      <Modal.Backdrop>
        <Modal.Container size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Detalle del mensaje</Modal.Heading>
              {receivedAt && (
                <p className="mt-1 text-xs text-muted">Recibido el {receivedAt}</p>
              )}
            </Modal.Header>
            <Modal.Body className="space-y-4">
              {contact && (
                <>
                  <Field label="Asunto">
                    <span className="font-medium">{contact.subject}</span>
                  </Field>
                  <Field label="Email">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={`mailto:${contact.email}`}
                        className="font-medium text-link hover:underline"
                      >
                        {contact.email}
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        isIconOnly
                        aria-label="Copiar email"
                        onPress={copyEmail}
                      >
                        {copied ? (
                          <Check className="size-4 text-success" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </Button>
                      {copied && (
                        <Chip size="sm" variant="soft" color="success">
                          Copiado
                        </Chip>
                      )}
                    </div>
                  </Field>
                  <Field label="Mensaje">
                    <p className="max-h-72 overflow-y-auto whitespace-pre-wrap leading-relaxed text-muted">
                      {contact.message}
                    </p>
                  </Field>
                </>
              )}
            </Modal.Body>
            <Modal.Footer className="justify-between">
              <div>
                {contact && onMarkUnread && (
                  <Button variant="ghost" size="sm" onPress={() => onMarkUnread(contact)}>
                    Marcar como no leído
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onPress={() => onOpenChange(false)}>
                  Cerrar
                </Button>
                {contact && (
                  <Button
                    variant="primary"
                    onPress={() => {
                      window.location.href = buildReplyLink(contact.email, contact.subject);
                    }}
                  >
                    <Reply className="size-4" />
                    Responder
                  </Button>
                )}
              </div>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
