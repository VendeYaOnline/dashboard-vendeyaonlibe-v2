"use client";

import { Button, Card, Chip, Modal, useOverlayState } from "@heroui/react";
import type { SaleProduct } from "../types";

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
                  <Card key={`${item.product.id}-${index}`}>
                    <Card.Content className="flex gap-4 p-4">
                      <img
                        src={item.product.image_product}
                        alt={item.product.title}
                        className="size-20 shrink-0 rounded-md border border-border object-cover"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <h4
                          className="line-clamp-2 text-sm leading-tight font-semibold"
                          title={item.product.title}
                        >
                          {item.product.title}
                        </h4>
                        <p className="truncate text-xs text-muted">
                          Ref: {item.product.reference}
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <Chip size="sm" variant="soft">
                            Cant: {item.quantity}
                          </Chip>
                          <p className="font-bold text-accent">
                            {item.purchase_total
                              ? `$ ${Number(item.purchase_total).toLocaleString("es-CO")}`
                              : (item.total ?? item.product.price)}
                          </p>
                        </div>
                      </div>
                    </Card.Content>
                  </Card>
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
