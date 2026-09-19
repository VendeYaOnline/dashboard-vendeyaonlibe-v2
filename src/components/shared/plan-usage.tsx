"use client";

import { Chip, cn } from "@heroui/react";
import type { PlanResponse } from "@/interfaces/platform";

interface PlanUsageProps {
  kind: "products" | "images";
  plan: PlanResponse | undefined;
}

const LABELS = { products: "productos", images: "imágenes" } as const;

/**
 * "38 / 50 productos" junto al botón de crear. Cambia a naranja al 80 % del
 * tope y a rojo al llegar. Sin límite en el plan no se muestra nada.
 */
export function PlanUsage({ kind, plan }: PlanUsageProps) {
  const limit = plan?.limits[kind];
  if (!plan || limit === null || limit === undefined) return null;

  const usage = plan.usage[kind];
  const ratio = usage / limit;
  const color = ratio >= 1 ? "danger" : ratio >= 0.8 ? "warning" : "default";

  return (
    <Chip
      size="sm"
      variant="soft"
      color={color}
      className={cn("tabular-nums")}
      title={`Tu plan permite ${limit} ${LABELS[kind]}`}
    >
      {usage} / {limit} {LABELS[kind]}
    </Chip>
  );
}
