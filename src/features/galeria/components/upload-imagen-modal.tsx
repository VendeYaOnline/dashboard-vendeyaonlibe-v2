"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImageUp, Plus, Upload, X } from "lucide-react";
import {
  Button,
  Chip,
  InputGroup,
  Label,
  ListBox,
  ListBoxItem,
  Modal,
  Select,
  cn,
  toast,
  useOverlayState,
} from "@heroui/react";
import { ModalFormHeader } from "@/components/shared/modal-form-header";
import type { Category } from "@/interfaces/categories";
import { MAX_UPLOAD_IMAGES, formatFileSize } from "../utils";
import { PendingButton } from "@/components/shared/pending-button";

interface UploadImagenModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUpload: (payload: { categoryId: string; formData: FormData; count: number }) => void;
  categories: Category[];
  isPending: boolean;
}

/** Archivo elegido con su previsualización y el nombre con el que se guardará. */
interface PendingFile {
  id: string;
  file: File;
  name: string;
  previewUrl: string;
}

const splitName = (fileName: string) => {
  const dot = fileName.lastIndexOf(".");
  return dot > 0
    ? { base: fileName.slice(0, dot), ext: fileName.slice(dot) }
    : { base: fileName, ext: "" };
};

export function UploadImagenModal({
  isOpen,
  onOpenChange,
  onUpload,
  categories,
  isPending,
}: UploadImagenModalProps) {
  const state = useOverlayState({ isOpen, onOpenChange });

  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const reset = useCallback(() => {
    setFiles((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return [];
    });
    setCategoryId("");
    setIsDragging(false);
  }, []);

  // El padre cierra el modal cuando la subida termina bien.
  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  const addFiles = (incoming: FileList | File[]) => {
    const images = Array.from(incoming).filter((file) => file.type.startsWith("image/"));
    if (images.length === 0) {
      toast.danger("Solo se pueden subir archivos de imagen.");
      return;
    }
    setFiles((prev) => {
      const room = MAX_UPLOAD_IMAGES - prev.length;
      if (room <= 0) {
        toast.warning(`Puedes subir como máximo ${MAX_UPLOAD_IMAGES} imágenes a la vez.`);
        return prev;
      }
      if (images.length > room) {
        toast.warning(
          `Solo se agregaron ${room} de ${images.length}: el máximo es ${MAX_UPLOAD_IMAGES} por subida.`,
        );
      }
      const accepted = images.slice(0, room).map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        name: file.name,
        previewUrl: URL.createObjectURL(file),
      }));
      return [...prev, ...accepted];
    });
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const renameFile = (id: string, base: string) => {
    setFiles((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const { ext } = splitName(item.file.name);
        return { ...item, name: base.trim() === "" ? "" : `${base}${ext}` };
      }),
    );
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    if (isPending) return;
    addFiles(event.dataTransfer.files);
  };

  const names = files.map((item) => item.name.trim().toLowerCase());
  const hasEmptyName = names.some((name) => name === "");
  const duplicated = new Set(names.filter((name, index) => name && names.indexOf(name) !== index));
  const isValid =
    files.length > 0 && categoryId !== "" && !hasEmptyName && duplicated.size === 0;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValid) return;

    const formData = new FormData();
    for (const item of files) {
      // El backend guarda con el `originalname`, así que el nombre editado
      // solo se respeta reconstruyendo el File.
      const file =
        item.name === item.file.name
          ? item.file
          : new File([item.file], item.name.trim(), { type: item.file.type });
      // El campo debe llamarse `images`: el backend usa multer.array("images").
      formData.append("images", file);
    }
    onUpload({ categoryId, formData, count: files.length });
  };

  const totalSize = files.reduce((sum, item) => sum + item.file.size, 0);
  const isFull = files.length >= MAX_UPLOAD_IMAGES;

  return (
    <Modal state={state}>
      <Modal.Backdrop isDismissable={!isPending}>
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog className="max-w-2xl">
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <ModalFormHeader
                icon={ImageUp}
                title="Subir imágenes"
                description={`Hasta ${MAX_UPLOAD_IMAGES} imágenes por subida. Se guardan en la categoría que elijas y quedan disponibles para tus productos y portadas.`}
              />

              <Modal.Body className="space-y-5">
                {/* Zona de arrastre */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!isPending) setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={handleDrop}
                  className={cn(
                    "relative rounded-xl border-2 border-dashed p-6 text-center transition-colors",
                    isDragging
                      ? "border-accent bg-accent-soft"
                      : isFull
                        ? "border-border bg-surface-secondary"
                        : "border-border hover:border-accent/50 hover:bg-surface-secondary",
                  )}
                >
                  <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
                    <div className="flex size-12 items-center justify-center rounded-full bg-accent-soft">
                      <Upload className="size-6 text-accent" />
                    </div>
                    <div className="sm:text-left">
                      <p className="text-sm font-medium">
                        {isFull
                          ? `Ya tienes ${MAX_UPLOAD_IMAGES} imágenes listas`
                          : "Arrastra tus imágenes aquí"}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {isFull
                          ? "Quita alguna para agregar otra."
                          : "o haz clic para seleccionarlas · JPG, PNG, WEBP"}
                      </p>
                    </div>
                  </div>
                  {!isFull && (
                    <input
                      ref={inputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      aria-label="Seleccionar imágenes"
                      disabled={isPending}
                      onChange={(e) => {
                        if (e.target.files) addFiles(e.target.files);
                        e.target.value = "";
                      }}
                      className="absolute inset-0 size-full cursor-pointer opacity-0"
                    />
                  )}
                </div>

                {/* Archivos elegidos */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Imágenes seleccionadas</Label>
                    <div className="flex items-center gap-2 text-xs text-muted">
                      {files.length > 0 && <span>{formatFileSize(totalSize)}</span>}
                      <Chip size="sm" variant="soft" color={isFull ? "warning" : "default"}>
                        {files.length}/{MAX_UPLOAD_IMAGES}
                      </Chip>
                    </div>
                  </div>

                  {files.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border px-4 py-5 text-center text-sm text-muted">
                      Aún no has elegido imágenes.
                    </p>
                  ) : (
                    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {files.map((item) => {
                        const { base, ext } = splitName(item.name || item.file.name);
                        const isDuplicated = duplicated.has(item.name.trim().toLowerCase());
                        const isEmpty = item.name.trim() === "";
                        return (
                          <li
                            key={item.id}
                            className={cn(
                              "flex min-w-0 items-start gap-2 rounded-lg border bg-surface p-2 pr-1",
                              isDuplicated || isEmpty ? "border-danger/60" : "border-border",
                            )}
                          >
                            <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-surface-secondary">
                              <img
                                src={item.previewUrl}
                                alt={item.name}
                                className="size-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              {/* La extensión va como sufijo dentro del campo: no se sale de la tarjeta. */}
                              <InputGroup className="h-8 w-full min-w-0">
                                <InputGroup.Input
                                  aria-label={`Nombre de ${item.file.name}`}
                                  value={item.name === "" ? "" : base}
                                  placeholder="nombre"
                                  disabled={isPending}
                                  onChange={(e) => renameFile(item.id, e.target.value)}
                                  className="min-w-0 text-sm"
                                />
                                {ext && (
                                  <InputGroup.Suffix>
                                    <span className="text-xs text-muted">{ext}</span>
                                  </InputGroup.Suffix>
                                )}
                              </InputGroup>
                              <p className="text-xs text-muted">
                                {formatFileSize(item.file.size)}
                                {isDuplicated && (
                                  <span className="ml-2 text-danger">Nombre repetido</span>
                                )}
                                {isEmpty && <span className="ml-2 text-danger">Falta el nombre</span>}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              isIconOnly
                              aria-label={`Quitar ${item.file.name}`}
                              className="shrink-0 text-muted hover:text-danger"
                              isDisabled={isPending}
                              onPress={() => removeFile(item.id)}
                            >
                              <X className="size-4" />
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {files.length > 0 && !isFull && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      isDisabled={isPending}
                      onPress={() => inputRef.current?.click()}
                    >
                      <Plus className="size-4" />
                      Agregar más
                    </Button>
                  )}
                </div>

                <Select
                  selectedKey={categoryId || null}
                  onSelectionChange={(key) => setCategoryId(key ? String(key) : "")}
                  isDisabled={isPending || categories.length === 0}
                >
                  <Label>Categoría *</Label>
                  <Select.Trigger>
                    {categoryId ? (
                      <Select.Value />
                    ) : (
                      <span className="text-muted">
                        {categories.length === 0 ? "No hay categorías" : "Seleccionar categoría"}
                      </span>
                    )}
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {categories.map((category) => (
                        <ListBoxItem key={category.id} id={category.id}>
                          {category.name}
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
                <PendingButton variant="primary" type="submit" isDisabled={!isValid} isPending={isPending} pendingLabel="Subiendo">
                  {files.length > 1
                      ? `Subir ${files.length} imágenes`
                      : "Subir imagen"}
                </PendingButton>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
