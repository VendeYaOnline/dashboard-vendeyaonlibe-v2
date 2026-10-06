"use client";

import Link from "next/link";
import { ChevronRight, Mail, MapPin, MessageCircle, Phone, UserRound, type LucideIcon } from "lucide-react";
import { Button, Modal, useOverlayState } from "@heroui/react";
import { ModalFormHeader } from "@/components/shared/modal-form-header";
import { VentaStatusChip } from "@/features/ventas/components/venta-status-chip";
import { formatInteger, formatMoney } from "@/features/analisis/utils";
import type { Customer } from "@/interfaces/customers";
import { PaymentChip } from "../payments";
import { formatDate } from "../utils";

interface CustomerDetailModalProps {
  /** Cliente a mostrar; null = cerrado. */
  customer: Customer | null;
  onClose: () => void;
}

function ContactLine({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <p className="flex min-w-0 items-center gap-2 text-sm">
      <Icon className="size-4 shrink-0 text-muted" aria-hidden />
      <span className="min-w-0 break-words">{children}</span>
    </p>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-secondary px-3 py-2">
      <p className="text-xs text-muted">{label}</p>
      <p className="font-semibold tabular-nums">{value}</p>
    </div>
  );
}

/** Ficha del cliente: contacto, cifras, medios de pago y todas sus compras. */
export function CustomerDetailModal({ customer, onClose }: CustomerDetailModalProps) {
  const state = useOverlayState({ isOpen: customer !== null, onOpenChange: (open) => !open && onClose() });

  return (
    <Modal state={state}>
      <Modal.Backdrop isDismissable>
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog>
            {customer && (
              <>
                <ModalFormHeader
                  icon={UserRound}
                  title={customer.name}
                  description={
                    customer.firstPurchaseAt
                      ? `Cliente desde el ${formatDate(customer.firstPurchaseAt)}`
                      : "Aún sin compras confirmadas"
                  }
                />
                <Modal.Body className="space-y-5">
                  <section className="grid gap-2 sm:grid-cols-2">
                    {customer.document && <ContactLine icon={UserRound}>CC {customer.document}</ContactLine>}
                    {customer.phone && (
                      <ContactLine icon={Phone}>
                        {customer.phone}
                        {customer.whatsapp && (
                          <a
                            href={`https://wa.me/${customer.whatsapp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-success hover:underline"
                          >
                            <MessageCircle className="size-3.5" aria-hidden />
                            WhatsApp
                          </a>
                        )}
                      </ContactLine>
                    )}
                    {customer.email && <ContactLine icon={Mail}>{customer.email}</ContactLine>}
                    {(customer.city || customer.department) && (
                      <ContactLine icon={MapPin}>
                        {[customer.city, customer.department].filter(Boolean).join(", ")}
                      </ContactLine>
                    )}
                  </section>

                  <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Stat label="Compras" value={formatInteger(customer.orders)} />
                    <Stat label="Total comprado" value={formatMoney(customer.spent)} />
                    <Stat label="Ticket promedio" value={customer.orders ? formatMoney(customer.averageTicket) : "—"} />
                    <Stat
                      label="Por confirmar"
                      value={customer.pendingOrders ? formatMoney(customer.pendingAmount) : "—"}
                    />
                  </section>

                  {customer.payments.length > 0 && (
                    <section className="space-y-2">
                      <h3 className="text-sm font-medium">Cómo paga</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {customer.payments.map((payment) => (
                          <PaymentChip key={payment.label} group={payment.group} label={payment.label} count={payment.orders} />
                        ))}
                      </div>
                    </section>
                  )}

                  <section className="space-y-2">
                    <h3 className="text-sm font-medium">Compras ({customer.sales.length})</h3>
                    <ul className="divide-y divide-border rounded-lg border border-border">
                      {customer.sales.map((sale) => (
                        <li key={sale.id}>
                          <Link
                            href={`/ventas/${sale.id}`}
                            className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-surface-secondary"
                          >
                            <div className="min-w-0 flex-1 space-y-1">
                              <p className="text-sm">
                                <span className="font-medium">{sale.date ? formatDate(sale.date) : "Sin fecha"}</span>
                                {sale.orderNumber && <span className="text-muted"> · {sale.orderNumber}</span>}
                              </p>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <PaymentChip group={sale.payment.group} label={sale.payment.label} />
                                <VentaStatusChip status={sale.status} />
                              </div>
                            </div>
                            <span className="shrink-0 font-semibold tabular-nums">{formatMoney(sale.total)}</span>
                            <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="ghost" onPress={onClose}>
                    Cerrar
                  </Button>
                </Modal.Footer>
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
