"use client";

import { Eye, Trash2 } from "lucide-react";
import { Button, Modal, useOverlayState } from "@heroui/react";
import { ImageWithSkeleton } from "@/components/shared/image-with-skeleton";
import type { ImageItem } from "@/lib/types";
import { formatDateLong, formatFileSize, getFileName } from "../utils";

interface ImagenPreviewModalProps {
  image: ImageItem | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onDelete: (key: string) => void;
}

export function ImagenPreviewModal({
  image,
  isOpen,
  onOpenChange,
  onDelete,
}: ImagenPreviewModalProps) {
  const state = useOverlayState({ isOpen, onOpenChange });

  return (
    <Modal state={state}>
      <Modal.Backdrop>
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading className="wrap-break-word pr-8">
                {image ? getFileName(image.Key) : ""}
              </Modal.Heading>
              {/* X de cierre en la esquina superior derecha (HeroUI la posiciona). */}
              <Modal.CloseTrigger aria-label="Cerrar" />
            </Modal.Header>

            <Modal.Body className="space-y-6">
              {image && (
                <>
                  <div className="relative flex h-72 items-center justify-center overflow-hidden rounded-lg bg-surface-secondary">
                    <ImageWithSkeleton
                      src={image.Url}
                      alt={getFileName(image.Key)}
                      sizes="(max-width: 640px) 100vw, 768px"
                      className="absolute inset-0"
                      imageClassName="object-contain"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-xs text-muted">Tamaño</p>
                      <p className="font-medium">{formatFileSize(image.Size)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted">Última modificación</p>
                      <p className="font-medium">{formatDateLong(image.LastModified)}</p>
                    </div>
                  </div>
                </>
              )}
            </Modal.Body>

            <Modal.Footer>
              <Button
                variant="outline"
                onPress={() => image && window.open(image.Url, "_blank", "noopener")}
              >
                <Eye className="size-4" />
                Visualizar
              </Button>
              <Button
                variant="danger"
                onPress={() => {
                  if (!image) return;
                  onOpenChange(false);
                  onDelete(image.Key);
                }}
              >
                <Trash2 className="size-4" />
                Eliminar
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
