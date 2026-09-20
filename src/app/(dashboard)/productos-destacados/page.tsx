import type { Metadata } from "next";
import { ProductosDestacadosView } from "@/features/productos-destacados/productos-destacados-view";

export const metadata: Metadata = { title: "Productos Destacados | VendeYaOnline" };

export default function ProductosDestacadosPage() {
  return <ProductosDestacadosView />;
}
