"use client";

import { ChevronDown } from "lucide-react";
import { Dropdown, Spinner, cn } from "@heroui/react";
import { SALE_STATUSES } from "../types";
import { VentaStatusChip } from "./venta-status-chip";

interface VentaStatusMenuProps {
  status: string;
  onChange: (status: string) => void;
  isDisabled?: boolean;
  isPending?: boolean;
}

/**
 * Chip de estado que, al pulsarlo, despliega los estados disponibles para
 * avanzar el pedido (Pago pendiente → Gestionando → En tránsito → Entregado).
 * `Dropdown.Trigger` ya es un <button>, así que no se anida otro botón.
 */
export function VentaStatusMenu({ status, onChange, isDisabled, isPending }: VentaStatusMenuProps) {
  if (isDisabled) return <VentaStatusChip status={status} />;

  return (
    <Dropdown.Root>
      <Dropdown.Trigger
        aria-label={`Cambiar estado (actual: ${status})`}
        className={cn(
          "inline-flex items-center gap-1 rounded-full outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-accent",
          isPending && "pointer-events-none opacity-60",
        )}
      >
        <VentaStatusChip status={status} />
        {isPending ? (
          <Spinner size="sm" color="current" />
        ) : (
          <ChevronDown className="size-3.5 text-muted" />
        )}
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom start">
        <Dropdown.Menu aria-label="Estados de la venta">
          {SALE_STATUSES.map((item) => (
            <Dropdown.Item
              key={item.id}
              id={item.id}
              textValue={item.label}
              onAction={() => item.id !== status && onChange(item.id)}
            >
              <span className={cn(item.id === status && "font-semibold")}>{item.label}</span>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}
