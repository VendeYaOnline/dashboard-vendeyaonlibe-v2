"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card, cn } from "@heroui/react";

interface StatTileProps {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Variación porcentual vs. el periodo anterior; null = sin datos previos. */
  change?: number | null;
  compareLabel?: string;
  /** Texto secundario cuando no aplica variación ("3 sin leer"). */
  hint?: string;
  /** Para métricas donde subir es malo (stock bajo) se invierte el color. */
  upIsGood?: boolean;
}

/** Tarjeta de indicador: etiqueta, valor grande y variación con flecha. */
export function StatTile({
  label,
  value,
  icon: Icon,
  change,
  compareLabel,
  hint,
  upIsGood = true,
}: StatTileProps) {
  const hasChange = change !== undefined;
  const direction = change === null || change === undefined ? "none" : change > 0 ? "up" : change < 0 ? "down" : "flat";
  const isGood = direction === "up" ? upIsGood : direction === "down" ? !upIsGood : true;

  return (
    <Card>
      <Card.Content className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0 space-y-1">
          <p className="text-sm text-muted">{label}</p>
          <p className="truncate text-2xl font-semibold tracking-tight">{value}</p>
          {hasChange && (
            <p className="flex flex-wrap items-center gap-1 text-xs text-muted">
              {direction === "none" ? (
                <span>Sin datos del periodo anterior</span>
              ) : (
                <>
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium",
                      direction === "flat"
                        ? "bg-surface-secondary text-foreground"
                        : isGood
                          ? "bg-success/10 text-success"
                          : "bg-danger/10 text-danger",
                    )}
                  >
                    {direction === "up" && <ArrowUpRight className="size-3" />}
                    {direction === "down" && <ArrowDownRight className="size-3" />}
                    {direction === "flat" && <Minus className="size-3" />}
                    {direction === "flat" ? "0 %" : `${Math.abs(change ?? 0)} %`}
                  </span>
                  {compareLabel && <span>{compareLabel}</span>}
                </>
              )}
            </p>
          )}
          {!hasChange && hint && <p className="text-xs text-muted">{hint}</p>}
        </div>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft">
          <Icon className="size-5 text-accent" />
        </div>
      </Card.Content>
    </Card>
  );
}
