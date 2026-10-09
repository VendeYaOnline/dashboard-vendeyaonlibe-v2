"use client";

import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { Card, Input, Label, TextField, toast } from "@heroui/react";
import { PendingButton } from "@/components/shared/pending-button";
import { useQueryMarketingLimits } from "@/app/api/queries";
import { useMutationUpdateMarketingLimits } from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import type { MarketingLimits } from "@/interfaces/platform";

/** Topes del backend (MAX_*_LIMIT en marketing.constants.js). */
export const MARKETING_LIMIT_FIELDS: { key: keyof MarketingLimits; label: string; max: number }[] = [
  { key: "daily", label: "Por día", max: 50000 },
  { key: "hourly", label: "Por hora", max: 10000 },
  { key: "monthly", label: "Por mes", max: 100000 },
];

const toDigits = (value: string) => value.replace(/\D/g, "").slice(0, 6);

/** Límites de correos de Marketing que usan las tiendas sin límite propio. */
export function MarketingLimitsCard() {
  const { data, isLoading } = useQueryMarketingLimits();
  const mutation = useMutationUpdateMarketingLimits();
  const [draft, setDraft] = useState<Record<keyof MarketingLimits, string>>({ daily: "", hourly: "", monthly: "" });

  useEffect(() => {
    if (!data) return;
    setDraft({ daily: String(data.limits.daily), hourly: String(data.limits.hourly), monthly: String(data.limits.monthly) });
  }, [data]);

  const invalid = (key: keyof MarketingLimits) => {
    const field = MARKETING_LIMIT_FIELDS.find((item) => item.key === key)!;
    const value = Number(draft[key]);
    return draft[key] === "" || !Number.isInteger(value) || value > field.max;
  };
  const isValid = MARKETING_LIMIT_FIELDS.every(({ key }) => !invalid(key));
  const isDirty = !!data && MARKETING_LIMIT_FIELDS.some(({ key }) => draft[key] !== String(data.limits[key]));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValid) return;
    mutation.mutate(
      { daily: Number(draft.daily), hourly: Number(draft.hourly), monthly: Number(draft.monthly) },
      {
        onSuccess: () => toast.success("Límites de Marketing guardados"),
        onError: (error) => handleAxiosError(error, "No se pudieron guardar los límites"),
      },
    );
  };

  return (
    <Card>
      <Card.Content className="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <h2 className="flex items-center gap-2 font-semibold">
              <Mail className="size-4" /> Límites de correos de Marketing
            </h2>
            <p className="text-xs text-muted">
              Para todas las tiendas que no tengan un límite propio (se cambia en Editar empresa). Hora de Colombia. Si
              se alcanza el límite por hora, el envío se pausa y sigue solo; los de día y mes impiden crear campañas.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            {MARKETING_LIMIT_FIELDS.map(({ key, label, max }) => (
              <TextField
                key={key}
                value={draft[key]}
                onChange={(value) => setDraft((current) => ({ ...current, [key]: toDigits(value) }))}
                isInvalid={!isLoading && invalid(key)}
                isDisabled={isLoading}
                className="w-32"
              >
                <Label>{label}</Label>
                <Input inputMode="numeric" placeholder="—" />
                <p className="mt-1 text-xs text-muted">Máx. {max.toLocaleString("es-CO")}</p>
              </TextField>
            ))}
            <PendingButton
              variant="primary"
              type="submit"
              isDisabled={!isValid || !isDirty}
              isPending={mutation.isPending}
              pendingLabel="Guardando"
              className="mb-6"
            >
              Guardar
            </PendingButton>
          </div>
        </form>
      </Card.Content>
    </Card>
  );
}
