"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface DeleteAttributeModalProps {
  attributeName: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteAttributeModal({ attributeName, open, onOpenChange, onConfirm }: DeleteAttributeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="bg-primary text-primary-foreground p-6 mt-4 rounded-lg text-xl">
            Confirmar Eliminación
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <DialogDescription className="text-base">
              ¿Estás seguro de que deseas eliminar el atributo{" "}
              <span className="font-semibold text-foreground">"{attributeName}"</span>? Esta acción no se puede
              deshacer.
            </DialogDescription>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Eliminar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
