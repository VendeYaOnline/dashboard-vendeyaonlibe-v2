"use client";

import { Megaphone } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

/** Marketing: marca, plantillas y campañas. Se construye en el paso 2. */
export function MarketingView() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Megaphone}
        title="Marketing"
        description="Envía promociones a tus clientes por correo y WhatsApp con el estilo de tu marca"
      />
    </div>
  );
}
