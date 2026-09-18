"use client";

import { useEffect, useState } from "react";
import { Boxes, Minus, Plus } from "lucide-react";
import { Button, Input, Label, Modal, TextField, toast, useOverlayState } from "@heroui/react";
import { ModalFormHeader } from "@/components/shared/modal-form-header";
import { useMutationUpdateProductStock } from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import type { Products } from "@/interfaces/products";
import { VariantMatrix } from "./variant-matrix";
import { MAX_QUANTITY } from "./constants";
import { toDigits } from "../utils";
import { buildCombinations, getInventoryAttributes, sumQuantities, toVariantKey } from "../variants";
import { PendingButton } from "@/components/shared/pending-button";

interface StockQuickModalProps {
  product: Products | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const clamp = (value: number) => Math.max(0, Math.min(value, MAX_QUANTITY));

/**
 * Actualización rápida de inventario desde la tabla, sin abrir el formulario
 * completo: matriz de variantes con −/+ o la cantidad general.
 */
export function StockQuickModal({ product, isOpen, onOpenChange }: StockQuickModalProps) {
  const state = useOverlayState({ isOpen, onOpenChange });
  const mutation = useMutationUpdateProductStock();

  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState("");

  // Atributos con inventario del snapshot del producto (color primero).
  const inventoryAttributes = product
    ? getInventoryAttributes(
        (product.product_attributes ?? []).map((attr) => ({
          id: attr.id,
          name: attr.attribute_name,
          type: attr.attribute_type,
          values: attr.value ?? [],
        })),
        Object.fromEntries(
          (product.product_attributes ?? [])
            .filter((attr) => typeof attr.inventory === "boolean")
            .map((attr) => [attr.id, attr.inventory as boolean]),
        ),
      )
    : [];
  const hasVariants = Boolean(product?.variants?.length);
  const variantKeys = hasVariants ? buildCombinations(inventoryAttributes).map(toVariantKey) : [];
  const total = hasVariants
    ? sumQuantities(variantKeys, quantities)
    : parseInt(quantity, 10) || 0;

  useEffect(() => {
    if (!isOpen || !product) return;
    setQuantities(
      Object.fromEntries(
        (product.variants ?? []).map((variant) => [variant.variant_key, String(variant.quantity)]),
      ),
    );
    setQuantity(product.quantity != null ? String(product.quantity) : "");
  }, [isOpen, product]);

  const handleVariantChange = (variantKey: string, raw: string) => {
    const digits = toDigits(raw);
    setQuantities((prev) => ({
      ...prev,
      [variantKey]: digits === "" ? "" : String(clamp(Number(digits))),
    }));
  };

  const handleQuantityChange = (raw: string) => {
    const digits = toDigits(raw);
    setQuantity(digits === "" ? "" : String(clamp(Number(digits))));
  };

  const handleSave = () => {
    if (!product) return;
    const payload = hasVariants
      ? {
          id: product.id,
          variants: variantKeys.map((variant_key) => ({
            variant_key,
            quantity: parseInt(quantities[variant_key] ?? "", 10) || 0,
          })),
        }
      : { id: product.id, quantity: parseInt(quantity, 10) || 0 };

    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Inventario actualizado correctamente");
        onOpenChange(false);
      },
      onError: (error) => handleAxiosError(error, "Error al actualizar el inventario"),
    });
  };

  const currentQuantity = parseInt(quantity, 10) || 0;

  return (
    <Modal state={state}>
      <Modal.Backdrop isDismissable={!mutation.isPending}>
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog className="max-w-xl">
            <ModalFormHeader
              icon={Boxes}
              title="Actualizar inventario"
              description={
                product
                  ? `${product.title}: ajusta las unidades según lo que vendes o repones.`
                  : ""
              }
            />

            <Modal.Body className="space-y-4">
              {hasVariants ? (
                <VariantMatrix
                  attributes={inventoryAttributes}
                  quantities={quantities}
                  onChange={handleVariantChange}
                  stepper
                />
              ) : (
                <div className="space-y-2">
                  <TextField value={quantity} onChange={handleQuantityChange} type="number">
                    <Label>Cantidad disponible</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        isIconOnly
                        aria-label="Quitar una unidad"
                        isDisabled={currentQuantity <= 0}
                        onPress={() => setQuantity(String(clamp(currentQuantity - 1)))}
                      >
                        <Minus className="size-4" />
                      </Button>
                      <Input placeholder="0" min={0} max={MAX_QUANTITY} className="text-center" />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        isIconOnly
                        aria-label="Agregar una unidad"
                        isDisabled={currentQuantity >= MAX_QUANTITY}
                        onPress={() => setQuantity(String(clamp(currentQuantity + 1)))}
                      >
                        <Plus className="size-4" />
                      </Button>
                    </div>
                  </TextField>
                  <p className="text-xs text-muted">
                    {total > 0 ? "El producto quedará disponible en la tienda." : "Con 0 unidades el producto quedará sin stock."}
                  </p>
                </div>
              )}
            </Modal.Body>

            <Modal.Footer>
              <Button
                variant="ghost"
                type="button"
                isDisabled={mutation.isPending}
                onPress={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <PendingButton variant="primary" isPending={mutation.isPending} onPress={handleSave}>
                {"Guardar inventario"}
              </PendingButton>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
