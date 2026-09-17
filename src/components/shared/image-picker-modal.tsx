"use client";

import { useEffect, useState } from "react";
import { CheckCircle, ImageIcon } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Modal,
  Spinner,
  TextField,
  cn,
  useOverlayState,
} from "@heroui/react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useQueryImages } from "@/app/api/queries";
import type { ImageItem } from "@/lib/types";

interface ImagePickerModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSelect: (urls: string[]) => void;
  multiple?: boolean;
  /** URLs ya asignadas, para mostrarlas marcadas al abrir. */
  currentSelected?: string[];
  maxSelection?: number;
  /** URLs que no se pueden elegir (p. ej. ya usada como imagen principal). */
  disabledUrls?: string[];
}

const LIMIT = 30;

/** Selector de imágenes de la galería S3, usado por el formulario de producto. */
export function ImagePickerModal({
  isOpen,
  onOpenChange,
  onSelect,
  multiple = false,
  currentSelected = [],
  maxSelection = 5,
  disabledUrls = [],
}: ImagePickerModalProps) {
  const state = useOverlayState({ isOpen, onOpenChange });

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => setPage(1), [debouncedSearch]);

  useEffect(() => {
    if (isOpen) setSelected(new Set(currentSelected));
    // Sólo se resincroniza al abrir; no se quiere pelear con la selección
    // del usuario mientras el modal está abierto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // El modal está montado aunque esté cerrado: la galería solo se pide al abrirlo.
  const { data, isLoading } = useQueryImages(page, debouncedSearch, LIMIT, undefined, isOpen);
  const images = data?.images ?? [];
  const totalPages = data?.totalPages ?? 0;

  const toggleSelect = (url: string) => {
    if (disabledUrls.includes(url)) return;

    setSelected((prev) => {
      const next = new Set(prev);
      if (multiple) {
        if (next.has(url)) {
          next.delete(url);
        } else {
          if (next.size >= maxSelection) return prev;
          next.add(url);
        }
      } else {
        next.clear();
        next.add(url);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    onSelect(Array.from(selected));
    onOpenChange(false);
  };

  return (
    <Modal state={state}>
      <Modal.Backdrop>
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>
                {multiple ? "Selección múltiple de imágenes" : "Seleccionar imagen"}
              </Modal.Heading>
            </Modal.Header>

            <Modal.Body className="space-y-4">
              <TextField value={search} onChange={setSearch}>
                <Label className="sr-only">Buscar imágenes</Label>
                <Input placeholder="Buscar imágenes..." />
              </TextField>

              {isLoading ? (
                <div className="flex flex-col items-center gap-3 py-16">
                  <Spinner />
                  <p className="text-sm text-muted">Cargando imágenes...</p>
                </div>
              ) : images.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {images.map((img: ImageItem) => {
                    const isSelected = selected.has(img.Url);
                    const isDisabled = disabledUrls.includes(img.Url);

                    return (
                      <button
                        key={img.Key}
                        type="button"
                        onClick={() => toggleSelect(img.Url)}
                        disabled={isDisabled}
                        className={cn(
                          "relative aspect-square overflow-hidden rounded-lg border-2 transition-all",
                          isDisabled
                            ? "cursor-not-allowed border-transparent opacity-50"
                            : isSelected
                              ? "border-accent"
                              : "border-transparent hover:border-accent/50",
                        )}
                      >
                        <img
                          src={img.Url}
                          alt="Imagen de galería"
                          className="size-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute top-2 right-2 rounded-full bg-accent text-accent-foreground">
                            <CheckCircle className="size-5" />
                          </div>
                        )}
                        {isDisabled && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/50 text-sm font-medium text-muted backdrop-blur-[1px]">
                            En uso
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <ImageIcon className="size-10 text-muted" />
                  <p className="text-sm font-medium">No se encontraron imágenes</p>
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    isDisabled={page === 1}
                    onPress={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm">
                    Página {page} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    isDisabled={page === totalPages}
                    onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </Modal.Body>

            <Modal.Footer className="justify-between">
              <span className="text-sm text-muted">
                Seleccionadas {selected.size}
                {multiple ? ` / ${maxSelection}` : ""}
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" onPress={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  isDisabled={selected.size === 0 && !multiple}
                  onPress={handleConfirm}
                >
                  Confirmar selección
                </Button>
              </div>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
