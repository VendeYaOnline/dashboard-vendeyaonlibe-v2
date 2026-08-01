import { BarChart3 } from "lucide-react";
import { Card } from "@heroui/react";
import { PageHeader } from "@/components/layout/page-header";

/**
 * Placeholder: esta vista nunca tuvo contenido real. El backend todavía no
 * expone endpoints de estadísticas para este panel, así que se mantiene el
 * estado vacío en lugar de mostrar métricas inventadas.
 */
export function AnalisisView() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={BarChart3}
        title="Análisis"
        description="Métricas y reportes de tu tienda"
      />

      <Card>
        <Card.Content className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-surface-secondary">
            <BarChart3 className="size-10 text-muted" />
          </div>
          <h3 className="text-lg font-medium">Análisis y reportes</h3>
          <p className="max-w-sm text-sm text-muted">
            Todavía no hay métricas disponibles. Esta sección mostrará el
            rendimiento de tus ventas y productos cuando se conecte a los datos.
          </p>
        </Card.Content>
      </Card>
    </div>
  );
}
