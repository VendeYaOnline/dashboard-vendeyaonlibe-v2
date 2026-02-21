"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateCategory: (name: string) => void;
  isLoading: boolean;
}

export function CreateCategoryModal({
  open,
  onOpenChange,
  onCreateCategory,
  isLoading,
}: CreateCategoryModalProps) {
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
    if (!open) {
      setCategoryName("");
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    onCreateCategory(categoryName.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="bg-primary text-primary-foreground p-6 mt-4 rounded-lg text-xl">
            Crear Nueva Categoría
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="categoryName">Nombre de la categoría</Label>
            <Input
              id="categoryName"
              placeholder="Ej: Electrónica, Ropa, Hogar..."
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !categoryName.trim()}>
              {isLoading ? "Creando..." : "Crear Categoría"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
