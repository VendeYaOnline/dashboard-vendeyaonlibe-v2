"use client";

import type { ComponentProps, ReactNode } from "react";
import { Button, Spinner } from "@heroui/react";

type ButtonProps = ComponentProps<typeof Button>;

interface PendingButtonProps extends Omit<ButtonProps, "children"> {
  children?: ReactNode;
  /** Mientras es true muestra el loader animado y bloquea nuevos clics. */
  isPending?: boolean;
  /** Texto que acompaña al loader ("Guardando"); si falta se usa la etiqueta normal. */
  pendingLabel?: ReactNode;
}

/**
 * Botón de acción principal con estado de carga: en vez de "Guardando..."
 * muestra un spinner animado junto al texto de la acción en curso.
 */
export function PendingButton({
  isPending = false,
  pendingLabel,
  isDisabled,
  children,
  ...props
}: PendingButtonProps) {
  return (
    <Button
      {...props}
      isDisabled={isDisabled || isPending}
      aria-busy={isPending || undefined}
      data-pending={isPending || undefined}
    >
      {isPending ? (
        <>
          <Spinner size="sm" color="current" aria-hidden="true" />
          {pendingLabel ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
