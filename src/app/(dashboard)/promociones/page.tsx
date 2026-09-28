import type { Metadata } from "next";
import { PromocionesView } from "@/features/promociones/promociones-view";

export const metadata: Metadata = { title: "Códigos promocionales | VendeYaOnline" };

export default function PromocionesPage() {
  return <PromocionesView />;
}
