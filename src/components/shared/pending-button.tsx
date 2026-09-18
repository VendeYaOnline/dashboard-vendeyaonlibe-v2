"use client";

import type { ComponentProps, ReactNode } from "react";
import { Button, Spinner, cn } from "@heroui/react";

type ButtonProps = ComponentProps<typeof Button>;

interface PendingButtonProps extends Omit<ButtonProps, "children"> {
  children?: ReactNode;
  /** Mientras es true muestra un loader animado y bloquea nuevos clics. */
  isPending?: boolean;
}

/**
 * Botón de acción principal con estado de carga: en vez de cambiar el texto
 * ("Guardando...") muestra un spinner centrado; la etiqueta queda oculta pero
 * sigue ocupando su sitio para que el botón no cambie de ancho.
 */
export function PendingButton({
  isPending = false,
  isDisabled,
  children,
  className,
  ...props
}: PendingButtonProps) {
  return (
    <Button
      {...props}
      isDisabled={isDisabled || isPending}
      aria-busy={isPending || undefined}
      data-pending={isPending || undefined}
      className={cn("relative", className)}
    >
      {isPending && (
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <Spinner size="sm" color="current" />
        </span>
      )}
      <span
        className={cn(
          "inline-flex items-center gap-2 transition-opacity",
          isPending && "opacity-0",
        )}
      >
        {children}
      </span>
      {isPending && <span className="sr-only">Procesando…</span>}
    </Button>
  );
}
