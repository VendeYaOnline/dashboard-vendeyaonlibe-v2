"use client";

import { useEffect, useState } from "react";
import { Eye, MapPin, Package, ReceiptText, UserRound } from "lucide-react";
import { Button, Modal, useOverlayState } from "@heroui/react";
import { getPaymentMethodLabel, type Sale } from "../types";
import { formatSaleTotal } from "../utils";
import { PurchasedProductsModal } from "./purchased-products-modal";
import { VentaStatusChip } from "./venta-status-chip";

interface VentaDetailsModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

function DetailField({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="text-xs font-medium tracking-wide text-muted">{label}</p>
      <div className="mt-1 break-words text-sm font-semibold">{children || "—"}</div>
    </div>
  );
}

function DetailCard({ icon: Icon, title, children }: { icon: typeof UserRound; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-bold">
        <span className="flex size-7 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <Icon className="size-4" />
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function OrderMetric({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg bg-surface-secondary p-3 ${className}`}>
      <p className="text-xs font-medium text-muted">{label}</p>
      <div className="mt-1 text-sm font-semibold">{children}</div>
    </div>
  );
}

export function VentaDetailsModal({ sale, isOpen, onOpenChange }: VentaDetailsModalProps) {
  const state = useOverlayState({ isOpen, onOpenChange });
  const [showProducts, setShowProducts] = useState(false);

  useEffect(() => {
    if (!isOpen) setShowProducts(false);
  }, [isOpen]);

  const productCount = sale?.products.length ?? 0;

  return (
    <>
      <Modal state={state}>
        <Modal.Backdrop>
          <Modal.Container size="lg" scroll="inside">
            <Modal.Dialog className="max-w-4xl">
              <Modal.Header>
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <ReceiptText className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <Modal.Heading>Detalles de la venta</Modal.Heading>
                    {sale && <p className="mt-0.5 truncate text-sm text-muted">Orden {sale.order_number}</p>}
                  </div>
                </div>
              </Modal.Header>

              <Modal.Body className="space-y-5">
                {sale && (
                  <>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <DetailCard icon={UserRound} title="Cliente">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <DetailField label="Nombre completo" className="sm:col-span-2">
                            {[sale.first_name, sale.last_name].filter(Boolean).join(" ")}
                          </DetailField>
                          <DetailField label="Documento">{sale.id_number}</DetailField>
                          <DetailField label="Fecha de compra">{sale.purchase_date}</DetailField>
                          <DetailField label="Correo" className="sm:col-span-2">
                            <span className="break-all">{sale.email}</span>
                          </DetailField>
                        </div>
                      </DetailCard>

                      <DetailCard icon={MapPin} title="Entrega">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <DetailField label="Departamento">{sale.department}</DetailField>
                          <DetailField label="Ciudad">{sale.city}</DetailField>
                          <DetailField label="Dirección" className="sm:col-span-2">{sale.address}</DetailField>
                          <DetailField label="Referencias" className="sm:col-span-2">{sale.additional_info}</DetailField>
                          <DetailField label="Teléfono móvil">{sale.phone}</DetailField>
                        </div>
                      </DetailCard>
                    </div>

                    <DetailCard icon={Package} title="Resumen del pedido">
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <OrderMetric label="Número de orden">
                          <span className="font-mono text-xs">{sale.order_number}</span>
                        </OrderMetric>
                        <OrderMetric label="Estado"><VentaStatusChip status={sale.status} /></OrderMetric>
                        <OrderMetric label="Método de pago">{getPaymentMethodLabel(sale.payment_method)}</OrderMetric>
                        <OrderMetric label="Total pagado">
                          <span className="text-base tabular-nums">{formatSaleTotal(sale.total)}</span>
                        </OrderMetric>
                        <OrderMetric label="Productos" className="sm:col-span-2 xl:col-span-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="flex items-center gap-2">
                              <Package className="size-4 text-muted" />
                              {productCount} {productCount === 1 ? "producto" : "productos"} · {sale.quantity} unidades
                            </span>
                            {productCount > 0 && (
                              <Button size="sm" variant="outline" onPress={() => setShowProducts(true)}>
                                <Eye className="size-3.5" />
                                Ver productos
                              </Button>
                            )}
                          </div>
                        </OrderMetric>
                      </div>
                    </DetailCard>
                  </>
                )}
              </Modal.Body>

              <Modal.Footer>
                <Button variant="ghost" onPress={() => onOpenChange(false)}>Cerrar</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {sale && showProducts && (
        <PurchasedProductsModal
          isOpen
          onOpenChange={setShowProducts}
          products={sale.products}
          orderNumber={sale.order_number}
        />
      )}
    </>
  );
}
