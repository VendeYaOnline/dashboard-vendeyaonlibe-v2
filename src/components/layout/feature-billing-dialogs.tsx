"use client";

import { useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, Info, Sparkles } from "lucide-react";
import { Button, Checkbox, Label, Modal, Spinner, toast, useOverlayState } from "@heroui/react";
import { ModalFormHeader } from "@/components/shared/modal-form-header";
import { PendingButton } from "@/components/shared/pending-button";
import { useQueryFeatureBilling } from "@/app/api/queries";
import { useMutationActivateFeature, useMutationCancelFeature } from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import { PAID_FEATURES, type PaidFeature } from "@/config/navigation";
import { formatMoney } from "@/features/analisis/utils";
import type { FeatureBilling, FeatureBillingReason } from "@/interfaces/platform";
import { useAuthStore } from "@/store/auth.store";

/**
 * Desbloquear y cancelar una vista de pago sumándola (o quitándola) de la
 * mensualidad del plan de VendeYaOnline. El cobro aplica desde el siguiente
 * mes; la vista se activa o se bloquea al instante.
 */

const formatDay = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Bogota" })
    : null;

/** Por qué la tienda no puede hacerlo sola, en palabras. */
export const FEATURE_BILLING_REASONS: Record<FeatureBillingReason, string> = {
  ACCOUNT_NOT_LINKED: "Tu tienda aún no está vinculada a tu cuenta de VendeYaOnline.",
  ACCOUNT_NOT_FOUND: "No encontramos tu cuenta de VendeYaOnline.",
  NO_SUBSCRIPTION: "Tu cuenta de VendeYaOnline no tiene un plan activo.",
  SUBSCRIPTION_NOT_ACTIVE: "Tu plan de VendeYaOnline no está activo en este momento.",
  MANAGED_BY_PLATFORM: "Esta vista la activó el equipo de VendeYaOnline.",
  BILLING_NOT_CONFIGURED: "La activación automática no está disponible en este momento.",
  BILLING_UNAVAILABLE: "No pudimos consultar tu plan en este momento.",
};

/** Plan actual → nuevo total, con la fecha del próximo cobro. */
function PlanChange({ billing, mode }: { billing: FeatureBilling; mode: "activate" | "cancel" }) {
  const plan = billing.plan;
  if (!plan) return null;
  const price = billing.addon_price ?? 0;
  const nextDay = formatDay(plan.next_payment_date);
  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface-secondary p-4 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted">Tu plan {plan.type} hoy</span>
        <span className="tabular-nums">{formatMoney(plan.current_total)} al mes</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted">{billing.label}</span>
        <span className={mode === "activate" ? "font-medium tabular-nums text-accent" : "font-medium tabular-nums text-danger"}>
          {mode === "activate" ? "+" : "−"}
          {formatMoney(price)} al mes
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <span className="font-semibold">Nuevo total</span>
        <span className="text-lg font-bold tabular-nums">{formatMoney(plan.new_total)} al mes</span>
      </div>
      <p className="flex gap-2 text-xs text-muted">
        <CalendarClock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <span>
          {mode === "activate"
            ? `Hoy no se te cobra nada: el nuevo total se aplica desde tu próxima mensualidad${nextDay ? ` (${nextDay})` : ""}, con la misma tarjeta de tu plan.`
            : `Tu próxima mensualidad${nextDay ? ` (${nextDay})` : ""} ya no incluirá ${billing.label}. Lo sigues usando hasta ese día.`}
        </span>
      </p>
    </div>
  );
}

/** Confirmación para desbloquear: beneficios, cambio en el plan y aceptación explícita. */
export function UnlockFeatureModal({ feature, isOpen, onClose }: { feature: PaidFeature; isOpen: boolean; onClose: () => void }) {
  const state = useOverlayState({ isOpen, onOpenChange: (open) => !open && onClose() });
  const { label, highlights } = PAID_FEATURES[feature];
  const { data: billing, isLoading, refetch } = useQueryFeatureBilling(feature, isOpen);
  const activate = useMutationActivateFeature();
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAccepted(false);
      refetch();
    }
  }, [isOpen, refetch]);

  const price = billing?.addon_price ?? PAID_FEATURES[feature].price;
  const canActivate = Boolean(billing?.self_service && billing.plan && !billing.active);

  const handleActivate = () =>
    activate.mutate(feature, {
      onSuccess: () => {
        toast.success(`¡${label} desbloqueado! Ya puedes usarlo.`);
        onClose();
      },
      onError: (error) => handleAxiosError(error, `No se pudo desbloquear ${label}`),
    });

  return (
    <Modal state={state}>
      <Modal.Backdrop isDismissable={!activate.isPending}>
        <Modal.Container size="md" scroll="inside">
          <Modal.Dialog>
            <ModalFormHeader
              icon={Sparkles}
              title={`Desbloquear ${label}`}
              description={`Se suma a tu plan por ${formatMoney(price)} al mes y se activa de inmediato.`}
            />
            <Modal.Body className="space-y-4">
              <ul className="space-y-2 text-sm">
                {highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>

              {isLoading || !billing ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted">
                  <Spinner size="sm" />
                  Consultando tu plan...
                </div>
              ) : canActivate ? (
                <>
                  <PlanChange billing={billing} mode="activate" />
                  <p className="flex gap-2 text-xs text-muted">
                    <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    Puedes cancelarla cuando quieras desde la misma vista; tus datos se guardan por si vuelves.
                  </p>
                  <Checkbox isSelected={accepted} onChange={setAccepted}>
                    <Checkbox.Content>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Label className="text-sm">
                        Entiendo que se sumarán {formatMoney(price)} a mi mensualidad desde el próximo cobro.
                      </Label>
                    </Checkbox.Content>
                  </Checkbox>
                </>
              ) : (
                <p className="rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
                  {billing.reason ? FEATURE_BILLING_REASONS[billing.reason] : "No es posible desbloquearla en este momento."} Escríbenos y
                  lo activamos por ti.
                </p>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="ghost" isDisabled={activate.isPending} onPress={onClose}>
                Cancelar
              </Button>
              <PendingButton
                variant="primary"
                isDisabled={!canActivate || !accepted}
                isPending={activate.isPending}
                pendingLabel="Desbloqueando"
                onPress={handleActivate}
              >
                <Sparkles className="size-4" />
                Desbloquear {label}
              </PendingButton>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

/**
 * Tu plan · la vista: cancelarla (la sigue usando hasta el próximo cobro, que
 * ya no la incluye) o, si ya la canceló, reactivarla antes de esa fecha.
 */
export function CancelFeatureModal({ feature, isOpen, onClose }: { feature: PaidFeature; isOpen: boolean; onClose: () => void }) {
  const state = useOverlayState({ isOpen, onOpenChange: (open) => !open && onClose() });
  const { label } = PAID_FEATURES[feature];
  const { data: billing, isLoading } = useQueryFeatureBilling(feature, isOpen);
  const cancel = useMutationCancelFeature();
  const reactivate = useMutationActivateFeature();
  const canceledUntil = billing?.cancel_at ? formatDay(billing.cancel_at) : null;
  const isPending = cancel.isPending || reactivate.isPending;

  const handleCancel = () =>
    cancel.mutate(feature, {
      onSuccess: () => {
        toast.success(`${label} cancelado. Lo sigues usando hasta tu próximo cobro, que ya no lo incluye.`);
        onClose();
      },
      onError: (error) => handleAxiosError(error, `No se pudo cancelar ${label}`),
    });

  const handleReactivate = () =>
    reactivate.mutate(feature, {
      onSuccess: () => {
        toast.success(`${label} reactivado. Se sigue sumando a tu mensualidad.`);
        onClose();
      },
      onError: (error) => handleAxiosError(error, `No se pudo reactivar ${label}`),
    });

  return (
    <Modal state={state}>
      <Modal.Backdrop isDismissable={!isPending}>
        <Modal.Container size="md" scroll="inside">
          <Modal.Dialog>
            <ModalFormHeader icon={Sparkles} title={`Tu plan · ${label}`} description={`${label} está sumado a tu mensualidad de VendeYaOnline.`} />
            <Modal.Body className="space-y-4">
              {isLoading || !billing ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted">
                  <Spinner size="sm" />
                  Consultando tu plan...
                </div>
              ) : billing.billed && billing.plan && canceledUntil ? (
                <>
                  <p className="rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
                    Cancelaste {label}: lo puedes usar hasta el <strong>{canceledUntil}</strong> y ya no se cobra en tu próxima
                    mensualidad. Si cambias de opinión, reactívalo antes de esa fecha.
                  </p>
                  <PlanChange billing={billing} mode="activate" />
                </>
              ) : billing.billed && billing.plan ? (
                <>
                  {billing.since && <p className="text-sm text-muted">Activo desde el {formatDay(billing.since)}.</p>}
                  {billing.price_change && (
                    <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm">
                      Desde el {formatDay(billing.price_change.effective_at)}, {label} costará{" "}
                      <strong>{formatMoney(billing.price_change.price)} al mes</strong> (hoy {formatMoney(billing.addon_price ?? 0)}).
                    </p>
                  )}
                  <PlanChange billing={billing} mode="cancel" />
                  <p className="rounded-lg bg-surface-secondary px-3 py-2 text-sm text-muted">
                    Si lo cancelas, lo sigues usando hasta tu próximo cobro y después se bloquea. Tu marca, plantillas e
                    historial se guardan por si lo vuelves a activar.
                  </p>
                </>
              ) : (
                <p className="rounded-lg bg-surface-secondary px-3 py-2 text-sm text-muted">
                  {billing.reason ? FEATURE_BILLING_REASONS[billing.reason] : ""} Para cancelarla, escríbenos.
                </p>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="ghost" isDisabled={isPending} onPress={onClose}>
                Cerrar
              </Button>
              {billing?.billed && billing.plan && canceledUntil && (
                <PendingButton variant="primary" isPending={reactivate.isPending} pendingLabel="Reactivando" onPress={handleReactivate}>
                  Reactivar {label}
                </PendingButton>
              )}
              {billing?.billed && billing.plan && !canceledUntil && (
                <PendingButton variant="danger" isPending={cancel.isPending} pendingLabel="Cancelando" onPress={handleCancel}>
                  Cancelar {label}
                </PendingButton>
              )}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

/**
 * Botón "Tu plan" de una vista activa que se cobra en la suscripción: abre
 * la cancelación. Solo lo ve el admin; si la activó el equipo a mano, no aparece.
 */
export function FeaturePlanButton({ feature }: { feature: PaidFeature }) {
  const isAdmin = useAuthStore((s) => s.user?.role) === "admin";
  const { data: billing } = useQueryFeatureBilling(feature, isAdmin);
  const [isOpen, setIsOpen] = useState(false);
  if (!isAdmin || !billing?.active || !billing.billed) return null;
  return (
    <>
      <Button variant="outline" size="sm" onPress={() => setIsOpen(true)}>
        <Sparkles className="size-4 text-accent" aria-hidden />
        {billing.cancel_at
          ? `${billing.label} · hasta el ${formatDay(billing.cancel_at)}`
          : `${billing.label} · +${formatMoney(billing.addon_price ?? PAID_FEATURES[feature].price)} al mes`}
      </Button>
      <CancelFeatureModal feature={feature} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
