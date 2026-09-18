"use client";

import { useEffect, useState } from "react";
import { FolderInput } from "lucide-react";
import {
  Button,
  Label,
  ListBox,
  ListBoxItem,
  Modal,
  Select,
  useOverlayState,
} from "@heroui/react";
import type { Category } from "@/interfaces/categories";
import { getCategoryId, getCategoryName, getFileName } from "../utils";

interface MoveImagenModalProps {
  /** Claves de S3 de las imágenes a mover (una o varias). */
  keys: string[];
  categories: Category[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onMove: (keys: string[], categoryId: string) => void;
  isPending: boolean;
}

/**
 * Mueve una o varias imágenes a la carpeta de otra categoría. Las imágenes
 * ya usadas por productos o portadas se repuntan en el backend.
 */
export function MoveImagenModal({
  keys,
  categories,
  isOpen,
  onOpenChange,
  onMove,
  isPending,
}: MoveImagenModalProps) {
  const state = useOverlayState({ isOpen, onOpenChange });
  const [categoryId, setCategoryId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) setCategoryId(null);
  }, [isOpen]);

  const single = keys.length === 1 ? keys[0] : null;
  // Con una sola imagen, su categoría actual no tiene sentido como destino.
  const currentCategoryId = single ? getCategoryId(single) : null;
  const currentCategoryName = single ? getCategoryName(single, categories) : null;
  const isValid = categoryId !== null && categoryId !== currentCategoryId;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValid || categoryId === null) return;
    onMove(keys, categoryId);
  };

  return (
    <Modal state={state}>
      <Modal.Backdrop isDismissable={!isPending}>
        <Modal.Container size="sm">
          <Modal.Dialog>
            <form onSubmit={handleSubmit}>
              <Modal.Header>
                <Modal.Heading className="flex items-center gap-2">
                  <FolderInput className="size-5 text-accent" />
                  Mover a categoría
                </Modal.Heading>
              </Modal.Header>

              <Modal.Body className="space-y-4">
                <p className="text-sm text-muted">
                  {single ? (
                    <>
                      <span className="font-medium text-foreground">{getFileName(single)}</span>
                      {currentCategoryName
                        ? ` está en ${currentCategoryName}.`
                        : " no tiene categoría."}
                    </>
                  ) : (
                    `Se moverán ${keys.length} imágenes.`
                  )}{" "}
                  Los productos y portadas que las usan se actualizan solos.
                </p>

                <Select
                  aria-label="Categoría de destino"
                  selectedKey={categoryId}
                  onSelectionChange={(key) => setCategoryId(key === null ? null : String(key))}
                  placeholder="Selecciona una categoría"
                  isRequired
                  isDisabled={isPending}
                >
                  <Label>Categoría de destino</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    {/* Lista acotada con scroll para no desbordar el modal. */}
                    <ListBox className="max-h-56 overflow-y-auto">
                      {categories.map((category) => (
                        <ListBoxItem
                          key={category.id}
                          id={category.id}
                          isDisabled={category.id === currentCategoryId}
                        >
                          {category.name}
                          {category.id === currentCategoryId ? " (actual)" : ""}
                        </ListBoxItem>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              </Modal.Body>

              <Modal.Footer>
                <Button
                  variant="ghost"
                  type="button"
                  isDisabled={isPending}
                  onPress={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button variant="primary" type="submit" isDisabled={!isValid || isPending}>
                  {isPending ? "Moviendo..." : keys.length > 1 ? "Mover imágenes" : "Mover imagen"}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
