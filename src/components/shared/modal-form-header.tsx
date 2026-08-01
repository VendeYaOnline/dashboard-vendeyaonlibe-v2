import type { LucideIcon } from "lucide-react";
import { Modal } from "@heroui/react";

interface ModalFormHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

/**
 * Encabezado de los modales de formulario.
 *
 * Va a sangre (anula el padding del diálogo) para formar una banda clara sobre
 * el fondo gris del modal, con el icono en el degradado de marca. Se comparte
 * entre todos los modales de crear/editar para no repetir el maquetado.
 */
export function ModalFormHeader({
  icon: Icon,
  title,
  description,
}: ModalFormHeaderProps) {
  return (
    <Modal.Header className="-mx-6 -mt-6 mb-2 rounded-t-[inherit] border-b border-border bg-surface px-6 pt-6 pb-5">
      <div className="flex items-start gap-4">
        <div className="bg-accent-gradient flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-[var(--accent-shadow)]">
          <Icon className="size-5 text-accent-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <Modal.Heading className="text-lg font-semibold">{title}</Modal.Heading>
          {description && (
            <p className="mt-0.5 text-sm text-muted">{description}</p>
          )}
        </div>
      </div>
    </Modal.Header>
  );
}
