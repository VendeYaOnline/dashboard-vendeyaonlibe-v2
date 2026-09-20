import type { Metadata } from "next";
import { MensajesView } from "@/features/mensajes/mensajes-view";

export const metadata: Metadata = { title: "Mensajes | VendeYaOnline" };

export default function MensajesPage() {
  return <MensajesView />;
}
