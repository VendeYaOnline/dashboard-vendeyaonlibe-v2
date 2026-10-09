"use client";

import { useEffect, useState } from "react";
import { PackageSearch } from "lucide-react";
import { Button, Input, Label, Modal, TextField, toast, useOverlayState } from "@heroui/react";
import { ModalFormHeader } from "@/components/shared/modal-form-header";
import { ProductSelectGrid } from "@/components/shared/product-select-grid";
import { useQueryProducts } from "@/app/api/queries";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { Products } from "@/interfaces/products";
import type { MarketingProduct } from "@/interfaces/marketing";

/** Producto del catálogo → como lo usa el correo (precio de venta y el normal si tiene descuento). */
export const toMarketingProduct = (product: Products): MarketingProduct => {
  const price = Number(product.price) || 0;
  const discounted = Number(product.discount) > 0 && Number(product.discount_price) > 0;
  return {
    id: product.id,
    title: product.title,
    image: product.image_product ?? "",
    price: discounted ? Number(product.discount_price) : price,
    regularPrice: discounted ? price : null,
  };
};

interface ProductPickerModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selected: MarketingProduct[];
  max: number;
  onConfirm: (products: MarketingProduct[]) => void;
}

/** Elegir los productos del correo desde el catálogo (en el orden en que se marcan). */
export function ProductPickerModal({ isOpen, onOpenChange, selected, max, onConfirm }: ProductPickerModalProps) {
  const state = useOverlayState({ isOpen, onOpenChange });
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(1);
  const [picked, setPicked] = useState<MarketingProduct[]>(selected);

  useEffect(() => {
    if (isOpen) {
      setPicked(selected);
      setSearch("");
      setPage(1);
    }
  }, [isOpen, selected]);
  useEffect(() => setPage(1), [debouncedSearch]);

  const { data, isLoading, isPlaceholderData } = useQueryProducts(page, debouncedSearch, isOpen);
  // Los ocultos no se muestran en la tienda: no tiene sentido promocionarlos.
  const products = (data?.products ?? []).filter((product) => !product.hidden);

  const toggle = (product: Products) => {
    if (picked.some((item) => item.id === product.id)) {
      setPicked((current) => current.filter((item) => item.id !== product.id));
      return;
    }
    if (max === 1) {
      setPicked([toMarketingProduct(product)]);
      return;
    }
    if (picked.length >= max) {
      toast.danger(`Este diseño admite hasta ${max} productos`);
      return;
    }
    setPicked((current) => [...current, toMarketingProduct(product)]);
  };

  return (
    <Modal state={state}>
      <Modal.Backdrop isDismissable>
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog>
            <ModalFormHeader
              icon={PackageSearch}
              title="Elegir productos"
              description={max === 1 ? "Elige el producto que quieres destacar." : `Elige hasta ${max} productos, en el orden en que quieres que aparezcan.`}
            />
            <Modal.Body className="space-y-3">
              <TextField value={search} onChange={setSearch}>
                <Label>Buscar producto</Label>
                <Input placeholder="Buscar por título..." maxLength={30} />
              </TextField>
              <ProductSelectGrid
                products={products}
                selectedIds={picked.map((product) => product.id)}
                onSelect={toggle}
                currentPage={page}
                totalPages={data?.totalPages ?? 1}
                onPageChange={setPage}
                isLoading={isLoading}
                isRefreshing={isPlaceholderData}
                emptyMessage="No hay productos con ese nombre"
              />
            </Modal.Body>
            <Modal.Footer>
              <span className="mr-auto text-sm text-muted">
                {picked.length} de {max} {max === 1 ? "producto" : "productos"}
              </span>
              <Button variant="ghost" onPress={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onPress={() => {
                  onConfirm(picked);
                  onOpenChange(false);
                }}
              >
                Usar estos productos
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
