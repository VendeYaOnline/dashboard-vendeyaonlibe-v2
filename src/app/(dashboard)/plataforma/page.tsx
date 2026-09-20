import type { Metadata } from "next";
import { PlataformaView } from "@/features/plataforma/plataforma-view";

export const metadata: Metadata = { title: "Plataforma | VendeYaOnline" };

export default function PlataformaPage() {
  return <PlataformaView />;
}
