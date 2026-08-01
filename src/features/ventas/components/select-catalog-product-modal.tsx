"use client";

import { useEffect, useState } from "react";
import { Button, Input, Label, Modal, TextField, useOverlayState } from "@heroui/react";
import { ProductSelectGrid } from "@/components/shared/product-select-grid";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useQueryProducts } from "@/app/api/queries";
import type { Products } from "@/interfaces/products";

interface SelectCatalogProductModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAdd: (product: Products, quantity: number) => void;
}

/** Selector de un producto real del catálogo para armar una venta manual. */
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
  const [quantity, setQuantity] = useState("1");

  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setPage(1);
      setSelected(null);
      setQuantity("1");
    }
  }, [isOpen]);

  useEffect(() => setPage(1), [debouncedSearch]);

  const { data, isFetching } = useQueryProducts(page, debouncedSearch, isOpen);

  const handleSelect = (product: Products) =>
    setSelected((prev) => (prev?.id === product.id ? null : product));

  const parsedQuantity = parseInt(quantity, 10);
  const isValid = selected !== null && !isNaN(parsedQuantity) && parsedQuantity > 0;

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
                <div className="border-t border-border pt-4">
                  <TextField value={quantity} onChange={setQuantity} type="number">
                    <Label>Cantidad</Label>
                    <Input min={1} />
                  </TextField>
                </div>
              )}
            </Modal.Body>

            <Modal.Footer>
              <Button variant="ghost" onPress={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                isDisabled={!isValid}
                onPress={() => {
                  if (!selected) return;
                  onAdd(selected, parsedQuantity);
                }}
              >
                Agregar producto
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
