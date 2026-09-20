import type { Metadata } from "next";
import { AtributosView } from "@/features/atributos/atributos-view";

export const metadata: Metadata = { title: "Atributos | VendeYaOnline" };

export default function AtributosPage() {
  return <AtributosView />;
}
