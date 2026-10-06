import type { Metadata } from "next";
import { ClientesView } from "@/features/clientes/clientes-view";

export const metadata: Metadata = { title: "Clientes | VendeYaOnline" };

export default function ClientesPage() {
  return <ClientesView />;
}
