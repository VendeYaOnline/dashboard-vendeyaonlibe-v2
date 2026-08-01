import { Chip } from "@heroui/react";

/**
 * Los datos mezclan el slug y la etiqueta del estado ("en-transito" y
 * "En tránsito"), así que se normaliza antes de mapear.
 */
const STATUS_CONFIG: Record<string, { label: string; color: "success" | "warning" | "danger" | "accent" }> = {
  // Datos de ejemplo de la tabla (MOCK_SALES).
  completada: { label: "Completada", color: "success" },
  pendiente: { label: "Pendiente", color: "warning" },
  cancelada: { label: "Cancelada", color: "danger" },
  "en-transito": { label: "En tránsito", color: "accent" },
  "en transito": { label: "En tránsito", color: "accent" },
  "en tránsito": { label: "En tránsito", color: "accent" },
  // Vocabulario real que envía el formulario de crear venta (ver
  // CREATE_SALE_STATUSES), compartido con dashboard-cliente v1.
  "pago pendiente": { label: "Pago pendiente", color: "warning" },
  "gestionando pedido": { label: "Gestionando pedido", color: "accent" },
  "pedido entregado": { label: "Pedido entregado", color: "success" },
};

export function VentaStatusChip({ status }: { status: string }) {
  const config = STATUS_CONFIG[status.toLowerCase()];

  if (!config) {
    return (
      <Chip size="sm" variant="soft">
        {status}
      </Chip>
    );
  }

  return (
    <Chip size="sm" variant="soft" color={config.color}>
      {config.label}
    </Chip>
  );
}
