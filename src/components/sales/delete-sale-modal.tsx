import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface DeleteSaleModalProps {
  orderNumber: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteSaleModal({ orderNumber, open, onOpenChange, onConfirm }: DeleteSaleModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Confirmar eliminación</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            ¿Estás seguro de que deseas eliminar la venta{" "}
            <span className="font-mono font-semibold text-foreground">{orderNumber}</span>?
          </p>
          <p className="text-sm text-destructive font-medium">Esta acción no se puede deshacer.</p>
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={onConfirm}>
              Eliminar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
