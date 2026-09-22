"use client";

import { Button, Card, Chip, Modal, useOverlayState } from "@heroui/react";
import { getSaleProductVariantLabel, type SaleProduct } from "../types";
import { formatSaleTotal } from "../utils";

interface PurchasedProductsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  products: SaleProduct[];
  orderNumber: string;
}

export function PurchasedProductsModal({
  isOpen,
  onOpenChange,
  products,
  orderNumber,
}: PurchasedProductsModalProps) {
  const state = useOverlayState({ isOpen, onOpenChange });
  const totalUnits = products.reduce((total, item) => total + item.quantity, 0);

  return (
    <Modal state={state}>
      <Modal.Backdrop>
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Productos de la orden {orderNumber}</Modal.Heading>
            </Modal.Header>

            <Modal.Body>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {products.map((item, index) => (
                  <ProductRow key={item.id ?? index} item={item} />
                ))}
              </div>
            </Modal.Body>

            <Modal.Footer className="justify-between">
              <div>
                <p className="text-sm text-muted">Total productos</p>
                <p className="text-xl font-bold">{totalUnits}</p>
              </div>
              <Button variant="ghost" onPress={() => onOpenChange(false)}>
                Cerrar
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function ProductRow({ item }: { item: SaleProduct }) {
  const variantLabel = getSaleProductVariantLabel(item);
  return (
    <Card>
      <Card.Content className="flex gap-4 p-4">
        {item.image_product ? (
          <img src={item.image_product} alt={item.title} className="size-20 shrink-0 rounded-md border border-border object-cover" />
        ) : (
          <div className="flex size-20 shrink-0 items-center justify-center rounded-md border border-border bg-surface-secondary text-[10px] text-muted">Sin img</div>
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <h4 className="line-clamp-2 text-sm leading-tight font-semibold" title={item.title}>{item.title}</h4>
          {variantLabel && <p className="text-xs text-muted" title={variantLabel}>{variantLabel}</p>}
          <p className="text-xs text-muted">
            {item.discount > 0 ? <><span className="line-through">${item.price}</span>{" "}<span className="text-danger">-{item.discount}%</span></> : <>${item.price}</>}
          </p>
          <div className="flex items-center justify-between pt-1">
            <Chip size="sm" variant="soft">Cant: {item.quantity}</Chip>
            <p className="font-bold text-accent">{formatSaleTotal(item.purchase_total)}</p>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
