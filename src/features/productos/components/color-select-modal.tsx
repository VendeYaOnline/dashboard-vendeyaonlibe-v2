"use client";

import { useEffect, useState } from "react";
import { Palette } from "lucide-react";
import { Button, ListBox, ListBoxItem, Modal, useOverlayState } from "@heroui/react";
import { ModalFormHeader } from "@/components/shared/modal-form-header";
import type { ComponentProps } from "react";
import { ColorSwatch, type ColorOption } from "./attribute-values";
import { MAX_IMAGES_PER_COLOR } from "./constants";

type OnSelectionChange = ComponentProps<typeof ListBox>["onSelectionChange"];
type Selection = Parameters<NonNullable<OnSelectionChange>>[0];

export interface ColorChoice extends ColorOption {
  /** Imágenes ya relacionadas con este color. */
  count: number;
}

interface ColorSelectModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  attributeName: string;
  colors: ColorChoice[];
  /** Se invoca con el hex elegido y cierra el modal. */
  onSelect: (hex: string) => void;
}

/**
 * Paso previo al selector de imágenes cuando el producto tiene un atributo de
 * color: el usuario indica a qué color quiere relacionar las imágenes.
 */
export function ColorSelectModal({
  isOpen,
  onOpenChange,
  attributeName,
  colors,
  onSelect,
}: ColorSelectModalProps) {
  const state = useOverlayState({ isOpen, onOpenChange });
  const [selectedHex, setSelectedHex] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) setSelectedHex(null);
  }, [isOpen]);

  const handleSelectionChange = (keys: Selection) => {
    if (keys === "all") return;
    const [first] = Array.from(keys, String);
    setSelectedHex(first ?? null);
  };

  const handleContinue = () => {
    if (!selectedHex) return;
    onSelect(selectedHex);
    onOpenChange(false);
  };

  const fullColors = colors.filter((color) => color.count >= MAX_IMAGES_PER_COLOR);

  return (
    <Modal state={state}>
      <Modal.Backdrop>
        <Modal.Container size="sm" scroll="inside">
          <Modal.Dialog>
            <ModalFormHeader
              icon={Palette}
              title="¿A qué color pertenecen las imágenes?"
              description={`Elige un color de «${attributeName}». Cada color requiere entre 1 y ${MAX_IMAGES_PER_COLOR} imágenes.`}
            />

            <Modal.Body>
              <ListBox
                aria-label="Colores del atributo"
                selectionMode="single"
                selectedKeys={selectedHex ? new Set([selectedHex]) : new Set()}
                onSelectionChange={handleSelectionChange}
                disabledKeys={new Set(fullColors.map((color) => color.hex))}
                className="max-h-72 overflow-y-auto"
              >
                {colors.map((color) => (
                  <ListBoxItem key={color.hex} id={color.hex} textValue={color.name}>
                    <span className="flex min-w-0 flex-1 items-center gap-3">
                      <ColorSwatch hex={color.hex} className="size-6" />
                      <span className="truncate">{color.name}</span>
                      <span className="ml-auto shrink-0 text-xs text-muted">
                        {color.count}/{MAX_IMAGES_PER_COLOR}
                        {color.count >= MAX_IMAGES_PER_COLOR && " · completo"}
                      </span>
                    </span>
                  </ListBoxItem>
                ))}
              </ListBox>
            </Modal.Body>

            <Modal.Footer>
              <Button variant="ghost" onPress={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button variant="primary" isDisabled={!selectedHex} onPress={handleContinue}>
                Elegir imágenes
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
