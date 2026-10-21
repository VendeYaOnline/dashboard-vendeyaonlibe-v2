"use client";

import { Store } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MetaFeedPanel } from "./meta-feed-panel";

/** Catálogo de Meta: vista aparte de Marketing (no es parte del envío de mensajes). */
export function MetaCatalogView() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Store}
        title="Catálogo de Meta"
        description="Tus productos en Facebook e Instagram, siempre al día, sin descargar ni subir archivos"
      />
      <MetaFeedPanel />
    </div>
  );
}
