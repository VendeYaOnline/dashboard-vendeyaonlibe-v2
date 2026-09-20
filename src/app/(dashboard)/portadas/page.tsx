import type { Metadata } from "next";
import { PortadasView } from "@/features/portadas/portadas-view";

export const metadata: Metadata = { title: "Portadas | VendeYaOnline" };

export default function PortadasPage() {
  return <PortadasView />;
}
