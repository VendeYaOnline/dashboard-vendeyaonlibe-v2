"use client";

import { useEffect, useState } from "react";
import { ImageIcon, LayoutTemplate } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Modal,
  TextArea,
  TextField,
  useOverlayState,
} from "@heroui/react";
import { ModalFormHeader } from "@/components/shared/modal-form-header";
import { ImageWithSkeleton } from "@/components/shared/image-with-skeleton";
import { ImagePickerModal } from "@/components/shared/image-picker-modal";
import { CharCounter } from "@/features/productos/components/form-section";
import type { Cover, CoverPayload } from "@/interfaces/covers";
import {
  MAX_COVER_DESCRIPTION_LENGTH,
  MAX_COVER_LINK_LENGTH,
  MAX_COVER_TITLE_LENGTH,
  isValidCoverLink,
} from "../constants";
import { PendingButton } from "@/components/shared/pending-button";

interface PortadaFormModalProps {
  /** null = crear, con valor = editar */
  cover: Cover | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (values: CoverPayload) => void;
  isPending: boolean;
}

export function PortadaFormModal({
  cover,
  isOpen,
  onOpenChange,
  onSubmit,
  isPending,
}: PortadaFormModalProps) {
  const state = useOverlayState({ isOpen, onOpenChange });

  const [image, setImage] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

  // Precarga al abrir en modo edición; limpia todo al abrir en modo crear.
  useEffect(() => {
    if (!isOpen) return;
    setImage(cover?.image ?? "");
    setTitle(cover?.title ?? "");
    setDescription(cover?.description ?? "");
    setLink(cover?.link ?? "");
  }, [isOpen, cover]);

  const isLinkValid = isValidCoverLink(link.trim());
  const isValid = image !== "" && title.trim() !== "" && isLinkValid;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValid) return;
    onSubmit({
      image,
      title: title.trim(),
      description: description.trim(),
      link: link.trim(),
    });
  };

  return (
    <>
      <Modal state={state}>
        <Modal.Backdrop isDismissable={!isPending}>
          <Modal.Container size="lg" scroll="inside">
            <Modal.Dialog className="max-w-xl">
              <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                <ModalFormHeader
                  icon={LayoutTemplate}
                  title={cover ? "Editar portada" : "Crear portada"}
                  description="Imagen destacada de la tienda con un título, una descripción y el enlace al que lleva."
                />

                <Modal.Body className="space-y-5">
                  <div className="space-y-2">
                    <Label>Imagen de la portada *</Label>
                    <button
                      type="button"
                      onClick={() => setIsImagePickerOpen(true)}
                      className="relative flex h-40 w-full flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border transition-colors hover:bg-surface-secondary"
                    >
                      {image ? (
                        <ImageWithSkeleton
                          src={image}
                          alt="Imagen de la portada"
                          sizes="(max-width: 640px) 100vw, 576px"
                          className="absolute inset-0 size-full"
                        />
                      ) : (
                        <>
                          <ImageIcon className="mb-2 size-8 text-muted" />
                          <span className="text-xs text-muted">Seleccionar de la galería</span>
                        </>
                      )}
                    </button>
                    {image && (
                      <p className="text-xs text-muted">
                        Haz clic en la imagen para cambiarla. Se recomienda formato horizontal.
                      </p>
                    )}
                  </div>

                  <TextField
                    value={title}
                    onChange={(value) => setTitle(value.slice(0, MAX_COVER_TITLE_LENGTH))}
                    isRequired
                  >
                    <Label>Título *</Label>
                    <Input placeholder="Ej: Nueva colección de temporada" maxLength={MAX_COVER_TITLE_LENGTH} />
                    <CharCounter length={title.length} max={MAX_COVER_TITLE_LENGTH} />
                  </TextField>

                  <TextField
                    value={description}
                    onChange={(value) =>
                      setDescription(value.slice(0, MAX_COVER_DESCRIPTION_LENGTH))
                    }
                  >
                    <Label>Descripción</Label>
                    <TextArea
                      placeholder="Texto corto que acompaña a la portada..."
                      className="min-h-20"
                      maxLength={MAX_COVER_DESCRIPTION_LENGTH}
                    />
                    <CharCounter length={description.length} max={MAX_COVER_DESCRIPTION_LENGTH} />
                  </TextField>

                  <TextField
                    value={link}
                    onChange={(value) => setLink(value.slice(0, MAX_COVER_LINK_LENGTH))}
                    isInvalid={!isLinkValid}
                  >
                    <Label>Enlace</Label>
                    <Input
                      placeholder="https://... o /ruta-de-la-tienda"
                      inputMode="url"
                      maxLength={MAX_COVER_LINK_LENGTH}
                    />
                    <p className={`mt-1 text-xs ${isLinkValid ? "text-muted" : "text-danger"}`}>
                      {isLinkValid
                        ? "A dónde lleva la portada al hacer clic. Puede quedar vacío."
                        : "Debe empezar por https:// (o http://) o por / si es una ruta de la tienda."}
                    </p>
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
                  <PendingButton variant="primary" type="submit" isDisabled={!isValid} isPending={isPending} pendingLabel="Guardando">
                    {cover ? "Guardar cambios" : "Crear portada"}
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
