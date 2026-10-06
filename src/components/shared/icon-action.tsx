"use client";

import type { ComponentProps, ReactNode } from "react";
import { Button, Tooltip } from "@heroui/react";

type IconActionProps = Omit<ComponentProps<typeof Button>, "isIconOnly" | "children"> & {
  /** Texto del tooltip: qué hace el botón ("Gestionar inventario"). */
  tooltip: ReactNode;
  /** El icono. */
  children: ReactNode;
};

/**
 * Botón de solo icono con tooltip, para las acciones de las tablas. El
 * tooltip aparece al pasar el mouse o al llegar con el teclado; el
 * `aria-label` (con el nombre del elemento) sigue siendo el que oyen los
 * lectores de pantalla.
 */
export function IconAction({ tooltip, children, variant = "ghost", size = "sm", ...props }: IconActionProps) {
  return (
    <Tooltip delay={300} closeDelay={0}>
      <Button variant={variant} size={size} isIconOnly {...props}>
        {children}
      </Button>
      <Tooltip.Content showArrow>
        <Tooltip.Arrow />
        {tooltip}
      </Tooltip.Content>
    </Tooltip>
  );
}
