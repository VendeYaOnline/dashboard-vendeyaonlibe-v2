"use client";

import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";

interface DeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count: number;
}

export function DeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  count,
}: DeleteDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-foreground">
                Eliminar {count > 1 ? `${count} imágenes` : "imagen"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {count > 1
                  ? "¿Estás seguro de que deseas eliminar estas imágenes? Esta acción no se puede deshacer."
                  : "¿Estás seguro de que deseas eliminar esta imagen? Esta acción no se puede deshacer."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
