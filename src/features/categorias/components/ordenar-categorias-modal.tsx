"use client";

import { useEffect, useState } from "react";
import { ArrowUpDown, FolderTree } from "lucide-react";
import { Button, Modal, Spinner, useOverlayState } from "@heroui/react";
import { ModalFormHeader } from "@/components/shared/modal-form-header";
import { ImageWithSkeleton } from "@/components/shared/image-with-skeleton";
import { PendingButton } from "@/components/shared/pending-button";
import { SortableList } from "@/components/shared/sortable-list";
import type { Category } from "@/interfaces/categories";

interface OrdenarCategoriasModalProps {
  /** Todas las categorías de la empresa, en su orden actual. */
  categories: Category[];
  isLoading: boolean;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (ids: string[]) => void;
  isPending: boolean;
}

/**
 * Ordena todas las categorías (la tabla está paginada, así que el orden se
 * edita aquí con la lista completa). El orden es el que verá la tienda.
 */
export function OrdenarCategoriasModal({
  categories,
  isLoading,
  isOpen,
  onOpenChange,
  onSave,
  isPending,
}: OrdenarCategoriasModalProps) {
  const state = useOverlayState({ isOpen, onOpenChange });
  const [ordered, setOrdered] = useState<Category[]>([]);

  useEffect(() => {
    if (isOpen) setOrdered(categories);
  }, [isOpen, categories]);

  const isDirty = ordered.some((category, index) => category.id !== categories[index]?.id);

  return (
    <Modal state={state}>
      <Modal.Backdrop isDismissable={!isPending}>
        <Modal.Container size="md" scroll="inside">
          <Modal.Dialog>
            <ModalFormHeader
              icon={ArrowUpDown}
              title="Ordenar categorías"
              description="Arrastra las categorías (o usa las flechas) para definir el orden en que aparecen en la tienda."
            />
            <Modal.Body>
              {isLoading ? (
                <div className="flex items-center justify-center gap-3 py-10 text-sm text-muted">
                  <Spinner size="sm" />
                  Cargando categorías...
                </div>
              ) : ordered.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted">Aún no hay categorías</p>
              ) : (
                <SortableList
                  items={ordered}
                  getKey={(category) => category.id}
                  onChange={setOrdered}
                  isDisabled={isPending}
                  renderItem={(category) => (
                    <span className="flex items-center gap-2">
                      {category.image ? (
                        <ImageWithSkeleton
                          src={category.image}
                          alt=""
                          sizes="28px"
                          className="size-7 shrink-0 rounded-md border border-border"
                        />
                      ) : (
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-secondary">
                          <FolderTree className="size-3.5 text-muted" />
                        </span>
                      )}
                      <span className="truncate text-sm">{category.name}</span>
                    </span>
                  )}
                />
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="ghost" isDisabled={isPending} onPress={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <PendingButton
                variant="primary"
                isDisabled={!isDirty}
                isPending={isPending}
                pendingLabel="Guardando"
                onPress={() => onSave(ordered.map((category) => category.id))}
              >
                Guardar orden
              </PendingButton>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
