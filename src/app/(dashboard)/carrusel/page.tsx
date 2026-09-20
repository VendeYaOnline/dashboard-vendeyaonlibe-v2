import type { Metadata } from "next";
import { CarruselView } from "@/features/carrusel/carrusel-view";

export const metadata: Metadata = { title: "Carrusel | VendeYaOnline" };

export default function CarruselPage() {
  return <CarruselView />;
}
