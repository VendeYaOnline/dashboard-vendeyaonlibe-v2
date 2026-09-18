"use client";

import { Eye, FolderInput, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Dropdown, buttonVariants, cn } from "@heroui/react";
import type { ImageItem } from "@/lib/types";

interface ImagenActionsMenuProps {
  image: ImageItem;
  onView: (image: ImageItem) => void;
  onEdit: (image: ImageItem) => void;
  onMove: (image: ImageItem) => void;
  onDelete: (key: string) => void;
  className?: string;
}

/**
 * Menú de acciones (ver / renombrar / mover / eliminar) usado en la vista grilla y lista.
 *
 * `Dropdown.Trigger` ya renderiza un <button>, así que se le aplican las
 * clases del botón en lugar de anidar un <Button> (HTML no permite un botón
 * dentro de otro y React lanzaba un error de hidratación).
 */
export function ImagenActionsMenu({
  image,
  onView,
  onEdit,
  onMove,
  onDelete,
  className,
}: ImagenActionsMenuProps) {
  return (
    <Dropdown.Root>
      <Dropdown.Trigger
        aria-label={`Acciones para ${image.Key}`}
        className={cn(
          buttonVariants({ variant: "secondary", size: "sm", isIconOnly: true }),
          // El trigger no hereda el centrado del Button: se fuerza aquí.
          "inline-flex items-center justify-center p-0 leading-none",
          className,
        )}
      >
        <MoreHorizontal className="size-4" />
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom end">
        <Dropdown.Menu aria-label="Acciones de la imagen">
          <Dropdown.Item onAction={() => onView(image)}>
            <Eye className="size-4" />
            Ver
          </Dropdown.Item>
          <Dropdown.Item onAction={() => onEdit(image)}>
            <Pencil className="size-4" />
            Renombrar
          </Dropdown.Item>
          <Dropdown.Item onAction={() => onMove(image)}>
            <FolderInput className="size-4" />
            Mover a categoría
          </Dropdown.Item>
          <Dropdown.Item onAction={() => onDelete(image.Key)} className="text-danger">
            <Trash2 className="size-4" />
            Eliminar
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}
