import type { Metadata } from "next";
import { FeatureGate } from "@/components/layout/feature-gate";
import { MetaCatalogView } from "@/features/catalogo-meta/meta-catalog-view";

export const metadata: Metadata = { title: "Catálogo de Meta | VendeYaOnline" };

// Incluido en Marketing: se activa con la misma vista de pago.
export default function MetaCatalogPage() {
  return (
    <FeatureGate feature="marketing">
      <MetaCatalogView />
    </FeatureGate>
  );
}
