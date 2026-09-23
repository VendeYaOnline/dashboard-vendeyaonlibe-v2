"use client";

import { useEffect, useState } from "react";
import { FolderTree, ImageIcon, X } from "lucide-react";
import { Button, Input, Label, Modal, TextField, useOverlayState } from "@heroui/react";
import { ModalFormHeader } from "@/components/shared/modal-form-header";
import { ImageWithSkeleton } from "@/components/shared/image-with-skeleton";
import { ImagePickerModal } from "@/components/shared/image-picker-modal";
import { PendingButton } from "@/components/shared/pending-button";
import { CharCounter } from "@/features/productos/components/form-section";
import { MAX_CATEGORY_NAME_LENGTH, type Category } from "@/interfaces/categories";

export interface CategoriaFormValues {
  name: string;
  /** null = sin imagen (o quitarla al editar). */
  image: string | null;
}

interface CategoriaFormModalProps {
  /** null = crear, con valor = editar */
  category: Category | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (values: CategoriaFormValues) => void;
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
  const [image, setImage] = useState<string | null>(null);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const state = useOverlayState({ isOpen, onOpenChange });

  useEffect(() => {
    if (!isOpen) return;
    setName(category?.name ?? "");
    setImage(category?.image ?? null);
  }, [isOpen, category]);

  const isValid = name.trim().length > 0;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValid) return;
    onSubmit({ name: name.trim(), image });
  };

  return (
    <>
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
                <Modal.Body className="space-y-4">
                  <TextField
                    value={name}
                    onChange={(value) => setName(value.slice(0, MAX_CATEGORY_NAME_LENGTH))}
                    isRequired
                    autoFocus
                  >
                    <Label>Nombre de la categoría</Label>
                    <Input
                      placeholder="Ej: Electrónica, Ropa, Hogar..."
                      maxLength={MAX_CATEGORY_NAME_LENGTH}
                    />
                    <CharCounter length={name.length} max={MAX_CATEGORY_NAME_LENGTH} />
                  </TextField>

                  {/* Imagen opcional que representa la categoría (se elige de la galería). */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Imagen de la categoría</Label>
                      <span className="text-xs text-muted">Opcional</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsImagePickerOpen(true)}
                        disabled={isPending}
                        aria-label={image ? "Cambiar imagen" : "Seleccionar imagen de la galería"}
                        className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-surface-secondary transition-colors hover:border-accent disabled:cursor-not-allowed"
                      >
                        {image ? (
                          <ImageWithSkeleton
                            src={image}
                            alt=""
                            sizes="80px"
                            className="absolute inset-0 size-full"
                          />
                        ) : (
                          <ImageIcon className="size-6 text-muted" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-xs text-muted">
                          {image
                            ? "Haz clic en la imagen para cambiarla."
                            : "Elige una imagen de la galería para mostrarla junto a la categoría en la tienda."}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            isDisabled={isPending}
                            onPress={() => setIsImagePickerOpen(true)}
                          >
                            {image ? "Cambiar" : "Seleccionar"}
                          </Button>
                          {image && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              isDisabled={isPending}
                              onPress={() => setImage(null)}
                            >
                              <X className="size-4" />
                              Quitar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
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
                    isDisabled={!isValid}
                    isPending={isPending}
                    pendingLabel="Guardando"
                  >
                    {category ? "Guardar cambios" : "Crear categoría"}
                  </PendingButton>
                </Modal.Footer>
              </form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <ImagePickerModal
        isOpen={isImagePickerOpen}
        onOpenChange={setIsImagePickerOpen}
        multiple={false}
        currentSelected={image ? [image] : []}
        onSelect={(urls) => {
          if (urls.length > 0) setImage(urls[0]);
        }}
      />
    </>
  );
}
