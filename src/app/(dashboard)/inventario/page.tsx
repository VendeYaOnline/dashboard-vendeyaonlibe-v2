import type { Metadata } from "next";
import { InventarioView } from "@/features/inventario/inventario-view";

export const metadata: Metadata = { title: "Inventario | VendeYaOnline" };

export default function InventarioPage() {
  return <InventarioView />;
}
