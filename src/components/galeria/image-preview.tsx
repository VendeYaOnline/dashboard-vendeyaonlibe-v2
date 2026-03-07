"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Download, Trash2, Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import type { ImageItem } from "@/lib/types";

interface ImagePreviewProps {
  image: ImageItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (key: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ImagePreview({
  image,
  isOpen,
  onClose,
  onDelete,
}: ImagePreviewProps) {
  const [copied, setCopied] = useState(false);

  if (!image) return null;

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(image.Url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    window.open(image.Url, "_blank");
  };

  const handleDelete = () => {
    onDelete(image.Key);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full bg-card border-border p-0 overflow-hidden max-h-[90vh]">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start justify-between min-w-0">
            <DialogTitle className="text-base font-semibold text-foreground wrap-break-word pr-4 min-w-0">
              {image.Key}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-6 pt-4 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Image */}
          <div className="relative aspect-video w-full max-h-72 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
            <Image
              src={image.Url}
              alt={image.Key}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 100vw, 640px"
              priority
            />
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Tamaño</p>
              <p className="font-medium text-foreground wrap-break-word">
                {formatFileSize(image.Size)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">
                Última modificación
              </p>
              <p className="font-medium text-foreground wrap-break-word">
                {formatDate(image.LastModified)}
              </p>
            </div>
          </div>

          {/* URL */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">URL</p>
            <div className="flex flex-col gap-2">
              <code className="text-xs bg-muted px-3 py-2 rounded-lg text-muted-foreground break-all max-h-20 overflow-y-auto">
                {image.Url}
              </code>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyUrl}
                className="w-full"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-primary" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar URL
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleDownload}
              className="w-full sm:w-auto gap-2"
            >
              <Download className="h-4 w-4" />
              Descargar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="w-full sm:w-auto gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
