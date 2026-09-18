"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Input,
  Label,
  Modal,
  TextField,
  useOverlayState,
} from "@heroui/react";
import type { ImageItem } from "@/lib/types";
import { getFileName } from "../utils";
import { PendingButton } from "@/components/shared/pending-button";

interface RenameImagenModalProps {
  image: ImageItem | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onRename: (key: string, newName: string) => void;
  isPending: boolean;
}

export function RenameImagenModal({
  image,
  isOpen,
  onOpenChange,
  onRename,
  isPending,
}: RenameImagenModalProps) {
  const state = useOverlayState({ isOpen, onOpenChange });
  const [newName, setNewName] = useState("");

  // Sólo se edita el nombre del archivo; la carpeta (categoría) la conserva
  // el backend.
  useEffect(() => {
    if (isOpen && image) setNewName(getFileName(image.Key));
  }, [isOpen, image]);

  const currentName = image ? getFileName(image.Key) : "";
  const isUnchanged = newName.trim() === currentName;
  const isValid = newName.trim() !== "" && !newName.includes("/");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!image || !isValid || isUnchanged) return;
    onRename(image.Key, newName.trim());
  };

  return (
    <Modal state={state}>
      <Modal.Backdrop isDismissable={!isPending}>
        <Modal.Container size="sm">
          <Modal.Dialog>
            <form onSubmit={handleSubmit}>
              <Modal.Header>
                <Modal.Heading>Renombrar imagen</Modal.Heading>
              </Modal.Header>

              <Modal.Body>
                <TextField
                  value={newName}
                  onChange={setNewName}
                  isRequired
                  isInvalid={newName.includes("/")}
                  autoFocus
                >
                  <Label>Nuevo nombre</Label>
                  <Input placeholder="nuevo-nombre.jpg" />
                </TextField>
                <p className="mt-2 text-xs text-muted">
                  {newName.includes("/")
                    ? "El nombre no puede contener '/'."
                    : "Conserva la extensión del archivo (.jpg, .png...)."}
                </p>
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
                <PendingButton
                  variant="primary"
                  type="submit"
                   isDisabled={!isValid || isUnchanged} isPending={isPending}
                >
                  {"Guardar cambios"}
                </PendingButton>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
