"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Attribute } from "@/interfaces/attributes";

interface ColorValue {
  name: string;
  value: string;
}

interface AttributeDetailsModalProps {
  attribute: Attribute | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AttributeDetailsModal({
  attribute,
  open,
  onOpenChange,
}: AttributeDetailsModalProps) {
  if (!attribute) return null;

  const isColorType = attribute.attribute_type === "Color";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="bg-primary text-primary-foreground p-6 mt-4 rounded-lg text-xl">
            Detalles del Atributo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nombre</p>
              <p className="font-semibold">{attribute.attribute_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm font-medium">
                {attribute.attribute_type}
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Valores ({attribute.value.length})
            </p>

            {isColorType ? (
              <div className="grid grid-cols-2 gap-2">
                {(attribute.value as ColorValue[]).map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg"
                  >
                    <div
                      className="w-8 h-8 rounded-full border shadow-sm"
                      style={{ backgroundColor: item.value }}
                    />
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(attribute.value as string[]).map((val, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-muted rounded-lg text-sm font-medium"
                  >
                    {val}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
