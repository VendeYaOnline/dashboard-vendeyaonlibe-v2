"use client";

import { useEffect, useState } from "react";
import { FolderTree } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Modal,
  TextField,
  useOverlayState,
} from "@heroui/react";
import { ModalFormHeader } from "@/components/shared/modal-form-header";
import type { Category } from "@/interfaces/categories";

interface CategoriaFormModalProps {
  /** null = crear, con valor = editar */
  category: Category | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (name: string) => void;
  isPending: boolean;
}

export function CategoriaFormModal({
  category,
  isOpen,
  onOpenChange,
  onSubmit,
  isPending,
}: CategoriaFormModalProps) {
  const [name, setName] = useState("");
  const state = useOverlayState({ isOpen, onOpenChange });

  useEffect(() => {
    if (isOpen) setName(category?.name ?? "");
  }, [isOpen, category]);

  const isValid = name.trim().length > 0;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValid) return;
    onSubmit(name.trim());
  };

  return (
    <Modal state={state}>
      <Modal.Backdrop isDismissable={!isPending}>
        <Modal.Container size="sm">
          <Modal.Dialog>
            <form onSubmit={handleSubmit}>
              <ModalFormHeader
                icon={FolderTree}
                title={category ? "Editar categoría" : "Crear categoría"}
                description="Organiza tus productos para que sean más fáciles de encontrar en la tienda."
              />
              <Modal.Body>
                <TextField value={name} onChange={setName} isRequired autoFocus>
                  <Label>Nombre de la categoría</Label>
                  <Input placeholder="Ej: Electrónica, Ropa, Hogar..." />
                </TextField>
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
                  {isPending
                    ? "Guardando..."
                    : category
                      ? "Guardar cambios"
                      : "Crear categoría"}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
