"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Button, Input, Label, Modal, TextField, useOverlayState } from "@heroui/react";
import { ModalFormHeader } from "@/components/shared/modal-form-header";
import { ProductSelectGrid } from "@/components/shared/product-select-grid";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useQueryProducts } from "@/app/api/queries";
import type { Products } from "@/interfaces/products";
import { PendingButton } from "@/components/shared/pending-button";

interface FeaturedProductFormModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (productId: string) => void;
  isPending: boolean;
}

export function FeaturedProductFormModal({
  isOpen,
  onOpenChange,
  onSubmit,
  isPending,
}: FeaturedProductFormModalProps) {
  const state = useOverlayState({ isOpen, onOpenChange });

  const [selectedProduct, setSelectedProduct] = useState<Products | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!isOpen) {
      setSelectedProduct(null);
      setSearch("");
      setPage(1);
    }
  }, [isOpen]);

  useEffect(() => setPage(1), [debouncedSearch]);

  const { data, isFetching } = useQueryProducts(page, debouncedSearch, isOpen);

  const handleSelectProduct = (product: Products) => {
    setSelectedProduct((prev) => (prev?.id === product.id ? null : product));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedProduct) return;
    onSubmit(selectedProduct.id);
  };

  return (
    <Modal state={state}>
      <Modal.Backdrop isDismissable={!isPending}>
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog>
            <form onSubmit={handleSubmit}>
              <ModalFormHeader
                icon={Star}
                title="Destacar producto"
                description="Elige el producto que quieres resaltar en la portada de tu tienda."
              />

              <Modal.Body className="space-y-4">
                <TextField value={search} onChange={setSearch} autoFocus>
                  <Label>Buscar producto por título</Label>
                  <Input placeholder="Buscar por título..." maxLength={30} />
                </TextField>

                <ProductSelectGrid
                  products={data?.products ?? []}
                  selectedIds={selectedProduct ? [selectedProduct.id] : []}
                  disabledIds={(data?.products ?? [])
                    .filter((product) => product.featuredProduct)
                    .map((product) => product.id)}
                  disabledLabel="Ya destacado"
                  onSelect={handleSelectProduct}
                  currentPage={page}
                  totalPages={data?.totalPages ?? 1}
                  onPageChange={setPage}
                  isLoading={isFetching}
                />
              </Modal.Body>

              <Modal.Footer>
                <Button
                  variant="ghost"
                  type="button"
                  isDisabled={isPending}
                  onPress={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <PendingButton
                  variant="primary"
                  type="submit"
                   isDisabled={!selectedProduct} isPending={isPending}
                >
                  {"Destacar producto"}
                </PendingButton>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
