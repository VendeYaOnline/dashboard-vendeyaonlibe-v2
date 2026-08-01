"use client";

import { useState } from "react";
import { Eye, ShoppingBag } from "lucide-react";
import { Button, Modal, useOverlayState } from "@heroui/react";
import type { Sale } from "../types";
import { PurchasedProductsModal } from "./purchased-products-modal";
import { VentaStatusChip } from "./venta-status-chip";

interface VentaDetailsModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-muted">{label}</p>
      <div className="font-medium">{children}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="border-b border-border pb-2 text-lg font-semibold">{title}</h3>
      {children}
    </div>
  );
}

export function VentaDetailsModal({ sale, isOpen, onOpenChange }: VentaDetailsModalProps) {
  const state = useOverlayState({ isOpen, onOpenChange });
  const [showProducts, setShowProducts] = useState(false);

  return (
    <>
      <Modal state={state}>
        <Modal.Backdrop>
          <Modal.Container size="lg" scroll="inside">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Detalles de la venta</Modal.Heading>
              </Modal.Header>

              <Modal.Body className="space-y-6">
                {sale && (
                  <>
                    <div className="grid gap-6 md:grid-cols-2">
                      <Section title="Información del cliente">
                        <div className="space-y-3">
                          <Field label="Fecha de compra">{sale.date}</Field>
                          <Field label="Nombres">{sale.firstName}</Field>
                          <Field label="Apellidos">{sale.lastName}</Field>
                          <Field label="Email">
                            <span className="text-sm break-all">{sale.email}</span>
                          </Field>
                          <Field label="Número de cédula">{sale.idNumber}</Field>
                        </div>
                      </Section>

                      <Section title="Ubicación">
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Departamento">{sale.department}</Field>
                            <Field label="Ciudad">{sale.city}</Field>
                          </div>
                          <Field label="Dirección">{sale.address}</Field>
                          <Field label="Referencias adicionales">
                            {sale.additionalReferences}
                          </Field>
                          <Field label="Teléfono móvil">{sale.phone}</Field>
                        </div>
                      </Section>
                    </div>

                    <Section title="Detalles del pedido">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-3">
                          <Field label="Número de orden">
                            <span className="font-mono">{sale.orderNumber}</span>
                          </Field>
                          <Field label="Productos">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-2">
                                <ShoppingBag className="size-4 text-muted" />
                                {sale.productsCount} items
                              </span>
                              {sale.productsList && sale.productsList.length > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onPress={() => setShowProducts(true)}
                                >
                                  <Eye className="size-3.5" />
                                  Ver productos
                                </Button>
                              )}
                            </div>
                          </Field>
                          <Field label="Estado">
                            <VentaStatusChip status={sale.status} />
                          </Field>
                        </div>

                        <div className="space-y-3">
                          <Field label="Método de pago">{sale.paymentMethod}</Field>
                          <Field label="Cantidad total">{sale.quantity}</Field>
                          <Field label="Total pagado">{sale.totalPaid}</Field>
                        </div>
                      </div>
                    </Section>
                  </>
                )}
              </Modal.Body>

              <Modal.Footer>
                <Button variant="ghost" onPress={() => onOpenChange(false)}>
                  Cerrar
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {sale?.productsList && (
        <PurchasedProductsModal
          isOpen={showProducts}
          onOpenChange={setShowProducts}
          products={sale.productsList}
          orderNumber={sale.orderNumber}
        />
      )}
    </>
  );
}
