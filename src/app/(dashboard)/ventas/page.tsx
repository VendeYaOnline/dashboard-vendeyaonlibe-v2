import type { Metadata } from "next";
import { VentasView } from "@/features/ventas/ventas-view";

export const metadata: Metadata = { title: "Ventas recibidas | VendeYa" };

export default function VentasPage() {
  return <VentasView />;
}
