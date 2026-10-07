"use client";

import { ExternalLink, Lock, Sparkles } from "lucide-react";
import { Card, Spinner, buttonVariants } from "@heroui/react";
import { useQueryFeatures } from "@/app/api/queries";
import { PAID_FEATURES, PAID_FEATURES_URL, type PaidFeature } from "@/config/navigation";

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
  const { label, description } = PAID_FEATURES[feature];
  return (
    <div className="flex justify-center py-12">
      <Card className="max-w-lg">
        <Card.Content className="flex flex-col items-center gap-4 p-8 text-center">
          <span className="relative flex size-16 items-center justify-center rounded-2xl bg-new-gradient text-white shadow-[var(--accent-shadow)]">
            <Sparkles className="size-7" aria-hidden />
            <span className="absolute -bottom-1.5 -right-1.5 flex size-7 items-center justify-center rounded-full border-2 border-surface bg-foreground text-background">
              <Lock className="size-3.5" aria-hidden />
            </span>
          </span>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold">{label} no está activo en tu tienda</h1>
            <p className="text-sm text-muted">{description}</p>
          </div>
          <a
            href={PAID_FEATURES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "primary" })}
          >
            Activar en vendeyaonline.com
            <ExternalLink className="size-4" aria-hidden />
          </a>
          <p className="text-xs text-muted">
            Cuando se active, esta sección aparecerá aquí sin que tengas que hacer nada más.
          </p>
        </Card.Content>
      </Card>
    </div>
  );
}
