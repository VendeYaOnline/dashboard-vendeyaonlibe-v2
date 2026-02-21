"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DeleteCategoryModalProps {
  categoryName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export function DeleteCategoryModal({
  categoryName,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: DeleteCategoryModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="bg-red-500 text-white p-6 mt-4 rounded-lg text-xl">
            Confirmar Eliminación
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <DialogDescription className="text-base">
              ¿Estás seguro de que deseas eliminar la categoría{" "}
              <span className="font-semibold text-foreground">
                "{categoryName}"
              </span>
              ? Esta acción no se puede deshacer.
            </DialogDescription>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
