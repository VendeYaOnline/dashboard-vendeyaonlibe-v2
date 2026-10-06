"use client";

import { useEffect, useState } from "react";
import { Boxes, Minus, Plus } from "lucide-react";
import { Button, Input, Label, Modal, TextField, toast, useOverlayState } from "@heroui/react";
import { ModalFormHeader } from "@/components/shared/modal-form-header";
import { PendingButton } from "@/components/shared/pending-button";
import { useMutationUpdateProductStock } from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import { MAX_QUANTITY } from "@/features/productos/components/constants";
import type { InventoryRow } from "@/interfaces/inventory";

interface AdjustStockModalProps {
  /** Fila a ajustar; null = cerrado. */
  row: InventoryRow | null;
  onClose: () => void;
}

const clamp = (value: number) => Math.max(0, Math.min(value, MAX_QUANTITY));

/**
 * Ajuste de unidades de UNA variante (o de un producto sin variantes). Usa el
 * mismo endpoint que el inventario rápido de Productos.
 */
export function AdjustStockModal({ row, onClose }: AdjustStockModalProps) {
  const state = useOverlayState({ isOpen: row !== null, onOpenChange: (open) => !open && onClose() });
  const mutation = useMutationUpdateProductStock();
  const [value, setValue] = useState("");

  useEffect(() => {
    if (row) setValue(row.quantity != null ? String(row.quantity) : "");
  }, [row]);

  const quantity = Number.parseInt(value, 10);
  const isValid = Number.isInteger(quantity) && quantity >= 0 && quantity <= MAX_QUANTITY;
  const change = isValid && row?.quantity != null ? quantity - row.quantity : null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!row || !isValid) return;
    mutation.mutate(
      row.variantKey
        ? { id: row.productId, variants: [{ variant_key: row.variantKey, quantity }] }
        : { id: row.productId, quantity },
      {
        onSuccess: () => {
          toast.success(`${row.title}${row.variantLabel ? ` (${row.variantLabel})` : ""}: ${quantity} unidades`);
          onClose();
        },
        onError: (error) => handleAxiosError(error, "No se pudo actualizar el inventario"),
      },
    );
  };

  return (
    <Modal state={state}>
      <Modal.Backdrop isDismissable={!mutation.isPending}>
        <Modal.Container size="md">
          <Modal.Dialog>
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <ModalFormHeader
                icon={Boxes}
                title="Ajustar unidades"
                description={row ? `${row.title}${row.variantLabel ? ` · ${row.variantLabel}` : ""}` : ""}
              />
              <Modal.Body className="space-y-3">
                <Label>Unidades disponibles</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    isIconOnly
                    aria-label="Restar una unidad"
                    isDisabled={!isValid || quantity <= 0}
                    onPress={() => setValue(String(clamp(quantity - 1)))}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <TextField
                    value={value}
                    onChange={(next) => setValue(next.replace(/\D/g, "").slice(0, 4))}
                    isInvalid={value !== "" && !isValid}
                    aria-label="Unidades"
                    className="w-28"
                    autoFocus
                  >
                    <Input inputMode="numeric" className="text-center text-lg font-semibold tabular-nums" />
                  </TextField>
                  <Button
                    type="button"
                    variant="outline"
                    isIconOnly
                    aria-label="Sumar una unidad"
                    isDisabled={isValid && quantity >= MAX_QUANTITY}
                    onPress={() => setValue(String(clamp((isValid ? quantity : 0) + 1)))}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted">
                  {row?.quantity == null
                    ? "Este producto no tenía cantidad guardada."
                    : change === null || change === 0
                      ? `Antes: ${row.quantity}`
                      : `Antes: ${row.quantity} · ${change > 0 ? `+${change}` : change}`}
                  {" · "}Máximo {MAX_QUANTITY}. Con 0 queda agotado en la tienda.
                </p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" type="button" isDisabled={mutation.isPending} onPress={onClose}>
                  Cancelar
                </Button>
                <PendingButton variant="primary" type="submit" isDisabled={!isValid} isPending={mutation.isPending} pendingLabel="Guardando">
                  Guardar
                </PendingButton>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
