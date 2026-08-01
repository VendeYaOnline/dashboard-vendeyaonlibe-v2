import { Chip } from "@heroui/react";

/** Mismo vocabulario que dashboard-cliente v1 (ver StatusBadge en TableSales.tsx). */
const STATUS_CONFIG: Record<string, { color: "success" | "warning" | "danger" | "accent" }> = {
  "Pago pendiente": { color: "warning" },
  "Gestionando pedido": { color: "accent" },
  "En tránsito": { color: "accent" },
  "Pedido entregado": { color: "success" },
};

export function VentaStatusChip({ status }: { status: string }) {
  const config = STATUS_CONFIG[status];

  return (
    <Chip size="sm" variant="soft" color={config?.color}>
      {status}
    </Chip>
  );
}
