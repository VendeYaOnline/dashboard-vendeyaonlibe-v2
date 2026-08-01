import type { Metadata } from "next";
import { MensajesView } from "@/features/mensajes/mensajes-view";

export const metadata: Metadata = { title: "Mensajes | VendeYa" };

export default function MensajesPage() {
  return <MensajesView />;
}
