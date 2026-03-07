"use client";

import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
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

import type { ImageItem } from "@/lib/types";

interface RenameDialogProps {
  image: ImageItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRename: (oldKey: string, newKey: string) => void;
}

export function RenameDialog({
  image,
  isOpen,
  onClose,
  onRename,
}: RenameDialogProps) {
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (image) {
      setNewName(image.Key);
    }
  }, [image]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (image && newName.trim()) {
      onRename(image.Key, newName.trim());
      onClose();
    }
  };

  if (!image) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Renombrar imagen
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Ingresa el nuevo nombre para la imagen
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="newName" className="text-foreground">
              Nuevo nombre
            </Label>
            <Input
              id="newName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="nuevo-nombre.jpg"
              className="bg-muted border-border"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!newName.trim()}>
              Guardar cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
