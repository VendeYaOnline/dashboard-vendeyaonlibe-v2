import type { Metadata } from "next";
import { GaleriaView } from "@/features/galeria/galeria-view";

export const metadata: Metadata = { title: "Galería | VendeYaOnline" };

export default function GaleriaPage() {
  return <GaleriaView />;
}
