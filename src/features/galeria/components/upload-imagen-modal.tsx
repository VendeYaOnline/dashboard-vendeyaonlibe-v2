"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImageUp, Upload, X } from "lucide-react";
import {
  Button,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Modal,
  Select,
  TextField,
  cn,
  useOverlayState,
} from "@heroui/react";
import { ModalFormHeader } from "@/components/shared/modal-form-header";
import type { Category } from "@/interfaces/categories";

interface UploadImagenModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUpload: (payload: { categoryId: string; formData: FormData }) => void;
  categories: Category[];
  isPending: boolean;
}

export function UploadImagenModal({
  isOpen,
  onOpenChange,
  onUpload,
  categories,
  isPending,
}: UploadImagenModalProps) {
  const state = useOverlayState({ isOpen, onOpenChange });

  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const fileRef = useRef<File | null>(null);

  const reset = useCallback(() => {
    setFileName("");
    setPreviewUrl("");
    setCategoryId("");
    setIsDragging(false);
    fileRef.current = null;
  }, []);

  // El padre cierra el modal cuando la subida termina bien.
  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  const processFile = (file: File) => {
    fileRef.current = file;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => setPreviewUrl(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) processFile(file);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!fileName.trim() || !fileRef.current || !categoryId) return;

    // El backend guarda con el `originalname` del archivo, así que el nombre
    // editado sólo se respeta reconstruyendo el File.
    const file =
      fileName === fileRef.current.name
        ? fileRef.current
        : new File([fileRef.current], fileName.trim(), { type: fileRef.current.type });

    const formData = new FormData();
    // El campo debe llamarse `images`: el backend usa multer.array("images").
    formData.append("images", file);

    onUpload({ categoryId, formData });
  };

  const isValid = fileName.trim() !== "" && fileRef.current !== null && categoryId !== "";

  return (
    <Modal state={state}>
      <Modal.Backdrop isDismissable={!isPending}>
        <Modal.Container size="md" scroll="inside">
          <Modal.Dialog>
            <form onSubmit={handleSubmit}>
              <ModalFormHeader
                icon={ImageUp}
                title="Subir imagen"
                description="Se guardará dentro de la categoría que elijas y podrás usarla en tus productos."
              />

              <Modal.Body className="space-y-5">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={handleDrop}
                  className={cn(
                    "relative rounded-xl border-2 border-dashed p-8 text-center transition-colors",
                    isDragging ? "border-accent bg-accent-soft" : "border-border",
                  )}
                >
                  {previewUrl ? (
                    <div className="relative">
                      <img
                        src={previewUrl}
                        alt="Previsualización"
                        className="mx-auto max-h-48 rounded-lg object-contain"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        isIconOnly
                        aria-label="Quitar imagen"
                        className="absolute top-2 right-2"
                        isDisabled={isPending}
                        onPress={reset}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-surface-secondary">
                        <Upload className="size-8 text-muted" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Arrastra tu imagen aquí</p>
                        <p className="mt-1 text-xs text-muted">o haz clic para seleccionar</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        aria-label="Seleccionar imagen"
                        disabled={isPending}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) processFile(file);
                        }}
                        className="absolute inset-0 size-full cursor-pointer opacity-0"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextField
                    value={fileName}
                    onChange={setFileName}
                    isDisabled={isPending}
                    isRequired
                  >
                    <Label>Nombre del archivo</Label>
                    <Input placeholder="imagen.jpg" />
                  </TextField>

                  <Select
                    selectedKey={categoryId || null}
                    onSelectionChange={(key) => setCategoryId(key ? String(key) : "")}
                    isDisabled={isPending || categories.length === 0}
                  >
                    <Label>Categoría</Label>
                    <Select.Trigger>
                      {categoryId ? (
                        <Select.Value />
                      ) : (
                        <span className="text-muted">
                          {categories.length === 0
                            ? "No hay categorías"
                            : "Seleccionar categoría"}
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
                <Button variant="primary" type="submit" isDisabled={!isValid || isPending}>
                  {isPending ? "Subiendo..." : "Subir"}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
