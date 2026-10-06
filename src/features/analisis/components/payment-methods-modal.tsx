"use client";

import { CreditCard } from "lucide-react";
import { Button, Chip, Modal, useOverlayState } from "@heroui/react";
import { ModalFormHeader } from "@/components/shared/modal-form-header";
import type { AnalyticsResponse } from "@/interfaces/analytics";
import { BarList } from "./bar-list";
import { channelLabel, formatInteger, formatMoney, paymentLabel } from "../utils";

interface PaymentMethodsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  byPaymentMethod: AnalyticsResponse["byPaymentMethod"];
  byChannel: AnalyticsResponse["byChannel"];
  /** "30 días", "12 meses"... */
  periodLabel: string;
}

/** Ventas e ingresos por medio de pago y por canal en el periodo elegido. */
export function PaymentMethodsModal({
  isOpen,
  onOpenChange,
  byPaymentMethod,
  byChannel,
  periodLabel,
}: PaymentMethodsModalProps) {
  const state = useOverlayState({ isOpen, onOpenChange });

  return (
    <Modal state={state}>
      <Modal.Backdrop isDismissable>
        <Modal.Container size="md" scroll="inside">
          <Modal.Dialog>
            <ModalFormHeader
              icon={CreditCard}
              title="Medios de pago"
              description={`Ventas e ingresos por método en los últimos ${periodLabel}.`}
            />
            <Modal.Body className="space-y-4">
              <BarList
                unit="ventas"
                emptyMessage="Aún no hay pagos en este periodo"
                items={byPaymentMethod.map((item) => ({
                  key: item.method,
                  label: paymentLabel(item.method),
                  value: item.orders,
                  display: `${formatInteger(item.orders)} ${item.orders === 1 ? "venta" : "ventas"}`,
                  secondary: formatMoney(item.revenue),
                }))}
              />
              {byChannel.length > 0 && (
                <div className="space-y-2 border-t border-border pt-4">
                  <p className="text-xs font-medium text-muted">Por canal</p>
                  <div className="flex flex-wrap gap-2">
                    {byChannel.map((item) => (
                      <Chip key={item.channel} size="sm" variant="soft">
                        {channelLabel(item.channel)}: {formatInteger(item.orders)}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onPress={() => onOpenChange(false)}>
                Cerrar
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
