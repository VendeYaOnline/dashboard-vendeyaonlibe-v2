import type { Metadata } from "next";
import { AnalisisView } from "@/features/analisis/analisis-view";

export const metadata: Metadata = { title: "Análisis | VendeYaOnline" };

export default function AnalisisPage() {
  return <AnalisisView />;
}
