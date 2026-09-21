"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Chip, Input, Label, Modal, TextField, useOverlayState } from "@heroui/react";
import { ProductSelectGrid } from "@/components/shared/product-select-grid";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useQueryProducts } from "@/app/api/queries";
import type { ProductVariant, Products } from "@/interfaces/products";
import type { SelectedProduct } from "../types";
import {
  bundleSizeOf,
  bundleUnitsAvailable,
  describeVariant,
  findVariant,
  getVariantAttributes,
  type VariantSelection,
} from "../variant-choice";
import { VariantPicker } from "./variant-picker";

interface SelectCatalogProductModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAdd: (line: SelectedProduct) => void;
}

/**
 * Selector de un producto real del catálogo para armar una venta manual: se
 * elige la variante (o una por pieza si se vende como set) y la cantidad,
 * limitada a las unidades disponibles de esa combinación.
 */
export function SelectCatalogProductModal({
  isOpen,
  onOpenChange,
  onAdd,
}: SelectCatalogProductModalProps) {
  const state = useOverlayState({ isOpen, onOpenChange });

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Products | null>(null);
  const [selection, setSelection] = useState<VariantSelection>({});
  const [pieces, setPieces] = useState<VariantSelection[]>([]);
  const [quantity, setQuantity] = useState("1");

  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setPage(1);
      setSelected(null);
      setSelection({});
      setPieces([]);
      setQuantity("1");
    }
  }, [isOpen]);

  useEffect(() => setPage(1), [debouncedSearch]);

  const { data, isFetching } = useQueryProducts(page, debouncedSearch, isOpen);

  const handleSelect = (product: Products) => {
    const next = selected?.id === product.id ? null : product;
    setSelected(next);
    setSelection({});
    setPieces(next ? Array.from({ length: bundleSizeOf(next) }, () => ({})) : []);
    setQuantity("1");
  };

  const variants = useMemo(() => selected?.variants ?? [], [selected]);
  const attributes = useMemo(() => getVariantAttributes(variants), [variants]);
  const hasVariants = attributes.length > 0;
  const bundleSize = selected ? bundleSizeOf(selected) : 0;
  const isBundle = bundleSize > 0 && hasVariants;

  // Variante elegida (o una por pieza) y unidades que se pueden vender.
  const pieceVariants = isBundle
    ? pieces.map((piece) => findVariant(variants, attributes, piece))
    : [];
  const variant = !isBundle && hasVariants ? findVariant(variants, attributes, selection) : null;
  const isChoiceComplete = isBundle
    ? pieceVariants.every((piece): piece is ProductVariant => piece !== null)
    : !hasVariants || variant !== null;

  const available: number | null = !selected
    ? null
    : isBundle
      ? isChoiceComplete
        ? bundleUnitsAvailable(pieceVariants as ProductVariant[])
        : null
      : hasVariants
        ? (variant?.quantity ?? null)
        : selected.quantity;

  const parsedQuantity = parseInt(quantity, 10);
  const isQuantityValid =
    !isNaN(parsedQuantity) &&
    parsedQuantity > 0 &&
    (available === null || parsedQuantity <= available);
  const isValid =
    selected !== null && isChoiceComplete && isQuantityValid && available !== 0;

  const handleAdd = () => {
    if (!selected || !isValid) return;
    const bundle_items = isBundle
      ? (pieceVariants as ProductVariant[]).map((piece) => ({
          variant_key: piece.variant_key,
          variant_label: describeVariant(piece),
        }))
      : undefined;
    const variant_key = variant?.variant_key;
    const variant_label = bundle_items
      ? bundle_items.map((piece, index) => `Pieza ${index + 1}: ${piece.variant_label}`).join(" | ")
      : variant
        ? describeVariant(variant)
        : undefined;
    onAdd({
      ...selected,
      lineKey: `${selected.id}|${variant_key ?? bundle_items?.map((p) => p.variant_key).join(",") ?? ""}`,
      quantity: parsedQuantity,
      available,
      variant_key,
      variant_label,
      bundle_items,
    });
  };

  return (
    <Modal state={state}>
      <Modal.Backdrop>
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Seleccionar producto</Modal.Heading>
            </Modal.Header>

            <Modal.Body className="space-y-4">
              <TextField value={search} onChange={setSearch}>
                <Label>Buscar producto</Label>
                <Input placeholder="Buscar por nombre..." />
              </TextField>

              <ProductSelectGrid
                products={data?.products ?? []}
                selectedIds={selected ? [selected.id] : []}
                onSelect={handleSelect}
                currentPage={page}
                totalPages={data?.totalPages ?? 1}
                onPageChange={setPage}
                isLoading={isFetching}
              />

              {selected && (
                <div className="space-y-4 border-t border-border pt-4">
                  {isBundle ? (
                    <div className="space-y-3">
                      <p className="text-sm text-muted">
                        Se vende como set de {bundleSize}{" "}
                        {selected.bundle_item_label
                          ? `${selected.bundle_item_label.toLowerCase()}s`
                          : "piezas"}
                        : elige la variante de cada una.
                      </p>
                      {pieces.map((piece, index) => (
                        <VariantPicker
                          key={index}
                          variants={variants}
                          attributes={attributes}
                          selection={piece}
                          prefix={`Pieza ${index + 1}`}
                          onChange={(next) =>
                            setPieces((prev) => prev.map((item, i) => (i === index ? next : item)))
                          }
                        />
                      ))}
                    </div>
                  ) : hasVariants ? (
                    <VariantPicker
                      variants={variants}
                      attributes={attributes}
                      selection={selection}
                      onChange={setSelection}
                    />
                  ) : null}

                  <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2">
                    <TextField
                      value={quantity}
                      onChange={setQuantity}
                      type="number"
                      isDisabled={!isChoiceComplete || available === 0}
                      isInvalid={isChoiceComplete && !isQuantityValid}
                    >
                      <Label>Cantidad</Label>
                      <Input min={1} max={available ?? undefined} />
                    </TextField>
                    <div className="pb-2 text-sm">
                      {!isChoiceComplete ? (
                        <span className="text-muted">
                          Elige {isBundle ? "las variantes de cada pieza" : "la variante"} para
                          ver las unidades disponibles.
                        </span>
                      ) : available === null ? (
                        <span className="text-muted">Este producto no controla inventario.</span>
                      ) : available === 0 ? (
                        <Chip size="sm" variant="soft" color="danger">
                          Agotado
                        </Chip>
                      ) : (
                        <span>
                          Disponibles:{" "}
                          <span className="font-semibold tabular-nums">{available}</span>
                          {isBundle && " sets"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Modal.Body>

            <Modal.Footer>
              <Button variant="ghost" onPress={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button variant="primary" isDisabled={!isValid} onPress={handleAdd}>
                Agregar producto
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
