"use client";

import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button, Modal, useOverlayState } from "@heroui/react";
import { PendingButton } from "@/components/shared/pending-button";

interface ConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description: ReactNode;
  confirmLabel?: string;
  /** Texto junto al loader mientras se ejecuta ("Eliminando"). */
  pendingLabel?: string;
  isPending?: boolean;
  /** `danger` para acciones destructivas. */
  tone?: "danger" | "accent";
}

/**
 * Diálogo de confirmación reutilizable: sustituye a los modales de borrado
 * que antes se duplicaban en cada módulo.
 */
export function ConfirmDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  title = "Confirmar acción",
  description,
  confirmLabel = "Eliminar",
  pendingLabel = "Eliminando",
  isPending = false,
  tone = "danger",
}: ConfirmDialogProps) {
  const state = useOverlayState({ isOpen, onOpenChange });

  return (
    <Modal state={state}>
      <Modal.Backdrop isDismissable={!isPending}>
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Icon>
                <AlertTriangle
                  className={tone === "danger" ? "text-danger" : "text-accent"}
                />
              </Modal.Icon>
              <Modal.Heading>{title}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div className="text-sm text-muted">{description}</div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="ghost"
                isDisabled={isPending}
                onPress={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <PendingButton
                variant={tone === "danger" ? "danger" : "primary"}
                isPending={isPending}
                pendingLabel={pendingLabel}
                onPress={onConfirm}
              >
                {confirmLabel}
              </PendingButton>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
