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
import { Category } from "@/interfaces/categories";

interface UpdateCategoryModalProps {
  category: Category | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateCategory: (category: Category) => void;
  isLoading: boolean;
}

export function UpdateCategoryModal({
  category,
  open,
  onOpenChange,
  onUpdateCategory,
  isLoading,
}: UpdateCategoryModalProps) {
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
    if (category) {
      setCategoryName(category.name);
    }
  }, [category, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !categoryName.trim()) return;
    onUpdateCategory({ ...category, name: categoryName.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="bg-primary text-primary-foreground p-6 mt-4 rounded-lg text-xl">
            Actualizar Categoría
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="updateCategoryName">Nombre de la categoría</Label>
            <Input
              id="updateCategoryName"
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
              {isLoading ? "Actualizando..." : "Actualizar Categoría"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
