"use client";

import { useEffect } from "react";
import { CheckCircle2, ExternalLink, Lock, Sparkles } from "lucide-react";
import { Card, Spinner, buttonVariants } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useQueryFeatures } from "@/app/api/queries";
import { PAID_FEATURES, PAID_FEATURES_URL, type PaidFeature } from "@/config/navigation";
import { formatMoney } from "@/features/analisis/utils";

/**
 * Muestra la vista solo si la empresa tiene activa la vista de pago; si no,
 * una pantalla de "Disponible con…". El backend también rechaza sus
 * endpoints (requireFeature), esto es solo la parte visual.
 */
export function FeatureGate({ feature, children }: { feature: PaidFeature; children: React.ReactNode }) {
  const { data, isLoading, isError } = useQueryFeatures();

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner aria-label="Cargando" />
      </div>
    );
  }
  // Si falla la consulta se muestra la vista: el backend sigue protegiendo los datos.
  if (isError || data?.features.includes(feature)) return <>{children}</>;
  return <LockedFeature feature={feature} />;
}

function LockedFeature({ feature }: { feature: PaidFeature }) {
  const { label, description, price, highlights } = PAID_FEATURES[feature];
  const queryClient = useQueryClient();

  // Al volver a la pestaña (p. ej. después de pagar) se consulta de nuevo: si ya
  // está activa, la vista se desbloquea sola.
  useEffect(() => {
    const refresh = () => queryClient.invalidateQueries({ queryKey: ["features"] });
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [queryClient]);

  return (
    <div className="flex justify-center py-12">
      <Card className="w-full max-w-lg">
        <Card.Content className="flex flex-col items-center gap-5 p-8 text-center">
          <span className="relative">
            {/* new-badge: el mismo brillo que la etiqueta "Nuevo" del menú. */}
            <span className="new-badge flex size-16 items-center justify-center rounded-2xl bg-new-gradient text-white">
              <Sparkles className="size-7" aria-hidden />
            </span>
            <span className="absolute -bottom-1.5 -right-1.5 flex size-7 items-center justify-center rounded-full border-2 border-surface bg-foreground text-background">
              <Lock className="size-3.5" aria-hidden />
            </span>
          </span>

          <div className="space-y-2">
            <h1 className="text-xl font-semibold">{label} no está activo en tu tienda</h1>
            <p className="text-sm text-muted">{description}</p>
          </div>

          <div className="w-full rounded-xl border border-border bg-surface-secondary p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Desbloquéalo agregándolo a tu plan</p>
            <p className="mt-1 flex items-baseline justify-center gap-1.5">
              <span className="text-3xl font-bold tabular-nums">+{formatMoney(price)}</span>
              <span className="text-sm font-medium text-muted">al mes</span>
            </p>
            <p className="text-xs text-muted">Se suma a la mensualidad de tu plan actual</p>
            <ul className="mt-4 space-y-2 text-left text-sm">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <a
            href={PAID_FEATURES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "primary", fullWidth: true })}
          >
            <Sparkles className="size-4" aria-hidden />
            Desbloquear {label} por +{formatMoney(price)} al mes
            <ExternalLink className="size-4" aria-hidden />
          </a>
          <p className="text-xs text-muted">
            Cuando el pago se confirme, {label} se desbloquea aquí automáticamente, sin que tengas que hacer nada más.
          </p>
        </Card.Content>
      </Card>
    </div>
  );
}
