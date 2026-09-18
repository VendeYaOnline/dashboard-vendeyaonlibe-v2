"use client";

import { Spinner, Toast, ToastProvider, cn } from "@heroui/react";
import type { ToastContentValue } from "@heroui/react";

type Variant = NonNullable<ToastContentValue["variant"]>;

/**
 * Tono de cada variante: borde y degradado suave del color, un halo
 * difuminado en la esquina y el icono en el color pleno.
 */
const TONES: Record<
  Variant,
  { container: string; glow: string; icon: string }
> = {
  success: {
    container:
      "border-success/20 bg-linear-to-br from-success/10 via-surface to-surface-secondary dark:border-success/30 dark:from-success/15 dark:to-success/5",
    glow: "bg-success/15 dark:bg-success/25",
    icon: "text-success",
  },
  danger: {
    container:
      "border-danger/20 bg-linear-to-br from-danger/10 via-surface to-surface-secondary dark:border-danger/30 dark:from-danger/15 dark:to-danger/5",
    glow: "bg-danger/15 dark:bg-danger/25",
    icon: "text-danger",
  },
  warning: {
    container:
      "border-warning/20 bg-linear-to-br from-warning/10 via-surface to-surface-secondary dark:border-warning/30 dark:from-warning/15 dark:to-warning/5",
    glow: "bg-warning/15 dark:bg-warning/25",
    icon: "text-warning",
  },
  accent: {
    container:
      "border-accent/20 bg-linear-to-br from-accent/10 via-surface to-surface-secondary dark:border-accent/30 dark:from-accent/15 dark:to-accent/5",
    glow: "bg-accent/15 dark:bg-accent/25",
    icon: "text-accent",
  },
  default: {
    container:
      "border-border bg-linear-to-br from-surface-secondary via-surface to-surface-secondary",
    glow: "bg-foreground/10",
    icon: "text-foreground",
  },
};

/**
 * Región de toasts del panel. Sustituye el aspecto plano por defecto de
 * HeroUI por tarjetas con borde y degradado del color de la variante, sin
 * cambiar la API: `toast.success("…")`, `toast.danger("…")`, etc.
 */
export function AppToaster() {
  return (
    <ToastProvider placement="bottom end" width={420}>
      {({ toast: item }) => {
        const content = item.content ?? {};
        const variant: Variant = content.variant ?? "default";
        const tone = TONES[variant];
        const { title, description, indicator, isLoading, actionProps } = content;

        return (
          <Toast
            toast={item}
            variant={variant}
            className={cn(
              "relative items-start gap-3 overflow-hidden rounded-xl border p-4 shadow-lg shadow-black/5 backdrop-blur-sm",
              tone.container,
            )}
          >
            <div
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute -top-8 -right-8 size-28 rounded-full blur-2xl",
                tone.glow,
              )}
            />
            {indicator !== null && (
              <Toast.Indicator variant={variant} className={cn("relative mt-0.5", tone.icon)}>
                {isLoading ? <Spinner size="sm" color="current" /> : indicator}
              </Toast.Indicator>
            )}
            <Toast.Content className="relative min-w-0 flex-1">
              {!!title && (
                <Toast.Title className="font-semibold text-foreground">{title}</Toast.Title>
              )}
              {!!description && (
                <Toast.Description className="text-muted">{description}</Toast.Description>
              )}
              {actionProps?.children && (
                <Toast.ActionButton
                  size="sm"
                  variant="tertiary"
                  {...actionProps}
                  className={cn("mt-3", actionProps.className)}
                >
                  {actionProps.children}
                </Toast.ActionButton>
              )}
            </Toast.Content>
            <Toast.CloseButton className="relative" />
          </Toast>
        );
      }}
    </ToastProvider>
  );
}
