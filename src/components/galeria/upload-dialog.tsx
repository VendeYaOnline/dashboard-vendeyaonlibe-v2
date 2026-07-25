"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Upload, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category as CategoryData } from "@/interfaces/categories";

interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (payload: { categoryId: string; formData: FormData }) => void;
  categories?: CategoryData[];
  isUploading?: boolean;
}

export function UploadDialog({
  isOpen,
  onClose,
  onUpload,
  categories = [],
  isUploading = false,
}: UploadDialogProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const fileRef = useRef<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      processFile(file);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    fileRef.current = file;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (!fileName.trim() || !fileRef.current || !categoryId) return;

    // El backend guarda el archivo con su `originalname`, así que el nombre
    // editado sólo se respeta si se reconstruye el File.
    const file =
      fileName === fileRef.current.name
        ? fileRef.current
        : new File([fileRef.current], fileName.trim(), {
            type: fileRef.current.type,
          });

    const formData = new FormData();
    formData.append("images", file);

    onUpload({ categoryId, formData });
  };

  const handleReset = () => {
    setFileName("");
    setPreviewUrl("");
    setCategoryId("");
    fileRef.current = null;
  };

  // El diálogo lo cierra el padre cuando la subida termina bien
  useEffect(() => {
    if (!isOpen) handleReset();
  }, [isOpen]);

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Subir imagen</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Arrastra una imagen o haz clic para seleccionar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/50"
            }`}
          >
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-48 mx-auto rounded-lg object-contain"
                />
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleReset}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-foreground font-medium">
                    Arrastra tu imagen aquí
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    o haz clic para seleccionar
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isUploading}
                />
              </div>
            )}
          </div>

          {/* File Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fileName" className="text-foreground">
                Nombre del archivo
              </Label>
              <Input
                id="fileName"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="imagen.jpg"
                className="bg-muted border-border"
                disabled={isUploading}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Categoría</Label>
              <Select
                value={categoryId}
                onValueChange={setCategoryId}
                disabled={isUploading || categories.length === 0}
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue
                    placeholder={
                      categories.length === 0
                        ? "No hay categorías"
                        : "Seleccionar categoría"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!fileName.trim() || !categoryId || isUploading}
              className="min-w-30"
            >
              {isUploading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Subiendo...
                </span>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Subir
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
