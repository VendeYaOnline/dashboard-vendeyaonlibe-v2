"use client";

import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button, Dropdown } from "@heroui/react";
import type { ImageItem } from "@/lib/types";

interface ImagenActionsMenuProps {
  image: ImageItem;
  onView: (image: ImageItem) => void;
  onEdit: (image: ImageItem) => void;
  onDelete: (key: string) => void;
  className?: string;
}

/** Menú de acciones (ver / renombrar / eliminar) usado en la vista grilla y lista. */
export function ImagenActionsMenu({
  image,
  onView,
  onEdit,
  onDelete,
  className,
}: ImagenActionsMenuProps) {
  return (
    <Dropdown.Root>
      <Dropdown.Trigger>
        <Button
          variant="secondary"
          size="sm"
          isIconOnly
          aria-label={`Acciones para ${image.Key}`}
          className={className}
        >
          <MoreHorizontal className="size-4" />
        </Button>
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
          <Dropdown.Item onAction={() => onDelete(image.Key)} className="text-danger">
            <Trash2 className="size-4" />
            Eliminar
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}
