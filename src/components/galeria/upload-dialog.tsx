"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, Image as ImageIcon, Check } from "lucide-react";
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
import type { Category } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";

interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (formData: FormData) => void;
  isUploading?: boolean;
}

export function UploadDialog({
  isOpen,
  onClose,
  onUpload,
  isUploading: isUploadingProp,
}: UploadDialogProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [category, setCategory] = useState<Category>("productos");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const fileRef = useRef<File | null>(null);

  const isLoading = isUploadingProp || isUploading;

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

  const handleUpload = async () => {
    if (!fileName || !fileRef.current) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", fileRef.current);
      formData.append("categoryId", category);
      formData.append("name", fileName);

      onUpload(formData);

      setUploadComplete(true);

      setTimeout(() => {
        handleReset();
        onClose();
      }, 1000);
    } catch (error) {
      console.error("Upload error:", error);
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFileName("");
    setPreviewUrl("");
    setCategory("productos");
    setIsUploading(false);
    setUploadComplete(false);
    fileRef.current = null;
  };

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
                  disabled={isLoading}
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
                  disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Categoría</Label>
              <Select
                value={category}
                onValueChange={(value) => setCategory(value as Category)}
                disabled={isLoading}
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter((c) => c.value !== "all").map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
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
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!fileName || isLoading || uploadComplete}
              className="min-w-30"
            >
              {uploadComplete ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Completado
                </>
              ) : isLoading ? (
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
