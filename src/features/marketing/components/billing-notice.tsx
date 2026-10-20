"use client";

import { useState } from "react";
import { BadgeDollarSign, CalendarClock } from "lucide-react";
import { Button, Card } from "@heroui/react";
import { CancelFeatureModal } from "@/components/layout/feature-billing-dialogs";
import { formatMoney } from "@/features/analisis/utils";
import type { MarketingResponse } from "@/interfaces/marketing";
import { useAuthStore } from "@/store/auth.store";

const longDay = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Bogota" });

/**
 * Aviso del cobro de Marketing: subida de precio programada (con la opción de
 * cancelar antes) o cancelación al terminar el mes (con la de reactivar).
 */
export function BillingNotice({ notice }: { notice: MarketingResponse["billing_notice"] }) {
  const isAdmin = useAuthStore((s) => s.user?.role) === "admin";
  const [isOpen, setIsOpen] = useState(false);
  if (!notice || (!notice.cancel_at && !notice.price_change)) return null;

  const change = notice.price_change;
  return (
    <Card>
      <Card.Content className="flex flex-col gap-3 p-4 text-sm sm:flex-row sm:items-center">
        {notice.cancel_at ? (
          <p className="flex flex-1 items-start gap-3">
            <CalendarClock className="mt-0.5 size-4 shrink-0 text-warning" />
            <span>
              <strong>Cancelaste Marketing.</strong> Lo puedes seguir usando hasta el {longDay(notice.cancel_at)}; tu próxima
              mensualidad ya no lo incluye. Tus plantillas e historial se guardan por si vuelves.
            </span>
          </p>
        ) : (
          change && (
            <p className="flex flex-1 items-start gap-3">
              <BadgeDollarSign className="mt-0.5 size-4 shrink-0 text-accent" />
              <span>
                <strong>Cambio en el precio de Marketing.</strong> Desde el {longDay(change.effective_at)}, Marketing costará{" "}
                <strong>{formatMoney(change.price)} al mes</strong>
                {change.current_price ? ` (hoy ${formatMoney(change.current_price)})` : ""}. Se aplicará en tu primera mensualidad
                desde esa fecha. Si no quieres continuar, puedes cancelarlo antes: lo sigues usando hasta terminar el mes que ya
                pagaste.
              </span>
            </p>
          )
        )}
        {isAdmin && (
          <Button variant="outline" size="sm" className="shrink-0" onPress={() => setIsOpen(true)}>
            {notice.cancel_at ? "Reactivar Marketing" : "Ver mi plan"}
          </Button>
        )}
      </Card.Content>
      {isAdmin && <CancelFeatureModal feature="marketing" isOpen={isOpen} onClose={() => setIsOpen(false)} />}
    </Card>
  );
}
