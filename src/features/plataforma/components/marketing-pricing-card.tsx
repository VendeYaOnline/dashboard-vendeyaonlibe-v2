"use client";

import { useState } from "react";
import { AlertTriangle, BadgeDollarSign, CalendarClock, CheckCircle2, RotateCcw, X } from "lucide-react";
import { Button, Card, Chip, Input, Label, TextField, toast } from "@heroui/react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PendingButton } from "@/components/shared/pending-button";
import { useQueryAddonPricing } from "@/app/api/queries";
import { useMutationCancelAddonPricing, useMutationRetryAddonPricing, useMutationScheduleAddonPricing } from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import { formatMoney } from "@/features/analisis/utils";
import { useAuthStore } from "@/store/auth.store";

const DAY_MS = 24 * 60 * 60 * 1000;
const toDigits = (value: string) => value.replace(/\D/g, "").slice(0, 8);
const longDay = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Bogota" });
/** "AAAA-MM-DD" en hora de Colombia, para el selector de fecha. */
const dateInput = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(date);

/**
 * Precio de Marketing para todas las tiendas que lo pagan en su plan. Subirlo
 * se programa con al menos 30 días: cada tienda recibe un correo y un aviso en
 * Marketing y puede cancelar antes. En la fecha se cobra solo. Bajarlo aplica
 * ya, solo a quien paga más que el precio nuevo. Solo el propietario de la
 * plataforma lo cambia.
 */
export function MarketingPricingCard() {
  const isOwner = useAuthStore((s) => s.user?.is_owner) === true;
  const { data: pricing, isLoading, isError } = useQueryAddonPricing("marketing");
  const schedule = useMutationScheduleAddonPricing();
  const cancel = useMutationCancelAddonPricing();
  const retry = useMutationRetryAddonPricing();
  const [price, setPrice] = useState("");
  const [date, setDate] = useState("");
  const [confirm, setConfirm] = useState<"schedule" | "cancel" | null>(null);

  const minNotice = pricing?.min_notice_days ?? 30;
  const minDate = dateInput(new Date(Date.now() + minNotice * DAY_MS + DAY_MS));
  const newPrice = Number(price);
  const isIncrease = !!pricing && newPrice > pricing.price;
  const isDecrease = !!pricing && newPrice > 0 && newPrice < pricing.price;
  const dateValid = !isIncrease || (date !== "" && date >= minDate);
  const canSubmit = !!pricing && price !== "" && newPrice >= 1000 && newPrice !== pricing.price && dateValid;
  // Mediodía de Colombia: el cambio cae ese día aunque la hora varíe.
  const effectiveAt = date ? new Date(`${date}T12:00:00-05:00`).toISOString() : undefined;

  const handleSchedule = () =>
    schedule.mutate(
      { feature: "marketing", price: newPrice, effective_at: isIncrease ? effectiveAt : undefined },
      {
        onSuccess: (result) => {
          setConfirm(null);
          setPrice("");
          setDate("");
          if (result.immediate) toast.success(`Precio bajado a ${formatMoney(newPrice)}: ya se aplicó a todas las tiendas.`);
          else
            toast.success(
              `Subida programada. Avisamos por correo a ${result.notified?.emailed ?? 0} de ${result.notified?.stores ?? 0} tiendas.`,
            );
        },
        onError: (error) => {
          setConfirm(null);
          handleAxiosError(error, "No se pudo cambiar el precio");
        },
      },
    );

  const handleCancel = () =>
    cancel.mutate("marketing", {
      onSuccess: () => {
        setConfirm(null);
        toast.success("Subida cancelada: el precio sigue igual.");
      },
      onError: (error) => handleAxiosError(error, "No se pudo cancelar la subida"),
    });

  const results = pricing?.last?.results;

  return (
    <Card>
      <Card.Content className="space-y-4 p-5">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            <BadgeDollarSign className="size-4" /> Precio de Marketing
          </h2>
          <p className="text-xs text-muted">
            Lo que se suma a la mensualidad de las tiendas que activan Marketing. Para subirlo hay que avisar con {minNotice} días:
            cada tienda recibe un correo y un aviso en Marketing, y puede cancelarlo antes. Bajarlo se aplica de inmediato a quien
            paga más; quien paga menos conserva su precio.
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted">Consultando el precio…</p>
        ) : isError || !pricing ? (
          <p className="flex items-center gap-2 text-sm text-warning">
            <AlertTriangle className="size-4" /> No pudimos consultar el precio con VendeYaOnline.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-xs text-muted">Precio para quien lo active hoy</p>
                <p className="text-2xl font-bold tabular-nums">{formatMoney(pricing.price)}</p>
                <p className="text-xs text-muted">al mes</p>
              </div>
              <div>
                <p className="text-xs text-muted">Tiendas que lo pagan</p>
                <p className="text-2xl font-bold tabular-nums">{pricing.subscribers.total}</p>
                <ul className="text-xs text-muted">
                  {pricing.subscribers.by_price.map((row) => (
                    <li key={row.price}>
                      {row.count} {row.count === 1 ? "paga" : "pagan"} {formatMoney(row.price)} al mes
                      {row.price !== pricing.price && " (precio con el que lo activó)"}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {pricing.subscribers.by_price.some((row) => row.price !== pricing.price) && (
              <p className="text-xs text-muted">
                Quien lo activó antes sigue pagando su precio. Una subida programada (con el aviso de {minNotice} días) pasa a
                todas las tiendas al precio nuevo. Una rebaja solo baja a quien paga más: nadie sube sin aviso.
              </p>
            )}

            {pricing.scheduled && (
              <div className="flex flex-col gap-3 rounded-lg border border-warning/30 bg-warning/10 p-3 sm:flex-row sm:items-center">
                <p className="flex flex-1 items-start gap-2 text-sm">
                  <CalendarClock className="mt-0.5 size-4 shrink-0 text-warning" />
                  <span>
                    Subida programada a <strong>{formatMoney(pricing.scheduled.new_price)}</strong> desde el{" "}
                    <strong>{longDay(pricing.scheduled.effective_at)}</strong>. Ese día se cobra solo en cada suscripción.
                  </span>
                </p>
                {isOwner && (
                  <Button variant="outline" size="sm" onPress={() => setConfirm("cancel")}>
                    <X className="size-3.5" /> Cancelar subida
                  </Button>
                )}
              </div>
            )}

            {pricing.last && results && (
              <div className="space-y-2 rounded-lg border border-border p-3 text-sm">
                <p className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="size-4 text-success" />
                  Último cambio: {formatMoney(pricing.last.old_price)} → {formatMoney(pricing.last.new_price)}
                  {pricing.last.applied_at && <span className="text-xs font-normal text-muted">({longDay(pricing.last.applied_at)})</span>}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Chip size="sm" variant="soft" color="success">{results.updated.length} actualizadas</Chip>
                  {results.paused.length > 0 && (
                    <Chip size="sm" variant="soft" color="warning">{results.paused.length} pausadas (sin cambio)</Chip>
                  )}
                  {(results.kept?.length ?? 0) > 0 && (
                    <Chip size="sm" variant="soft">{results.kept!.length} ya pagaban menos (conservan su precio)</Chip>
                  )}
                  {results.failed.length > 0 && (
                    <Chip size="sm" variant="soft" color="danger">{results.failed.length} fallidas</Chip>
                  )}
                </div>
                {results.failed.length > 0 && (
                  <div className="space-y-1">
                    <ul className="list-disc space-y-0.5 pl-5 text-xs text-danger">
                      {results.failed.map((item) => (
                        <li key={item.subscription_id}>
                          {item.email ?? `Suscripción ${item.subscription_id}`}: {item.error}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-muted">Esas tiendas siguen pagando el precio anterior.</p>
                    {isOwner && (
                      <PendingButton
                        variant="outline"
                        size="sm"
                        isPending={retry.isPending}
                        pendingLabel="Reintentando"
                        onPress={() =>
                          retry.mutate("marketing", {
                            onSuccess: () => toast.success("Reintento terminado"),
                            onError: (error) => handleAxiosError(error, "No se pudo reintentar"),
                          })
                        }
                      >
                        <RotateCcw className="size-3.5" /> Reintentar las fallidas
                      </PendingButton>
                    )}
                  </div>
                )}
                {results.paused.length > 0 && (
                  <p className="text-xs text-muted">
                    Las suscripciones pausadas conservan su precio; revísalas cuando se reactiven.
                  </p>
                )}
              </div>
            )}

            {isOwner ? (
              <div className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
                <TextField
                  value={price ? Number(price).toLocaleString("es-CO") : ""}
                  onChange={(value) => setPrice(toDigits(value))}
                  className="w-40"
                >
                  <Label>Precio nuevo</Label>
                  <Input inputMode="numeric" placeholder={pricing.price.toLocaleString("es-CO")} />
                </TextField>
                {isIncrease && (
                  <TextField value={date} onChange={setDate} type="date" isInvalid={date !== "" && !dateValid} className="w-44">
                    <Label>Desde el</Label>
                    <Input min={minDate} />
                    <p className="mt-1 text-xs text-muted">Mínimo {minNotice} días de aviso.</p>
                  </TextField>
                )}
                <PendingButton
                  variant="primary"
                  isDisabled={!canSubmit}
                  isPending={schedule.isPending}
                  pendingLabel="Guardando"
                  onPress={() => setConfirm("schedule")}
                  className={isIncrease ? "mb-6" : undefined}
                >
                  {isDecrease ? "Bajar precio ahora" : "Programar subida"}
                </PendingButton>
              </div>
            ) : (
              <p className="text-xs text-muted">Solo el propietario de la plataforma puede cambiar el precio.</p>
            )}
          </>
        )}
      </Card.Content>

      <ConfirmDialog
        isOpen={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        onConfirm={confirm === "cancel" ? handleCancel : handleSchedule}
        tone={confirm === "cancel" ? "danger" : "accent"}
        title={confirm === "cancel" ? "¿Cancelar la subida?" : isDecrease ? "¿Bajar el precio ahora?" : "¿Programar la subida?"}
        description={
          confirm === "cancel"
            ? "El precio se queda igual. Las tiendas ya avisadas dejarán de ver el aviso (el correo ya se envió)."
            : isDecrease
              ? `Marketing pasará a ${formatMoney(newPrice)} al mes desde ya: para quien lo active y para las tiendas que pagan más. Quien paga menos conserva su precio.`
              : `Marketing costará ${formatMoney(newPrice)} al mes desde el ${date ? longDay(effectiveAt!) : ""}. Se enviará un correo a cada tienda que lo paga (${pricing?.panel_stores ?? 0}) y lo verán en Marketing. Ese día se cobrará solo.`
        }
        confirmLabel={confirm === "cancel" ? "Cancelar subida" : isDecrease ? "Bajar precio" : "Programar y avisar"}
        pendingLabel="Guardando"
        isPending={schedule.isPending || cancel.isPending}
      />
    </Card>
  );
}
