import type { Metadata } from "next";
import { PlataformaView } from "@/features/plataforma/plataforma-view";

export const metadata: Metadata = { title: "Plataforma | VendeYa" };

export default function PlataformaPage() {
  return <PlataformaView />;
}
