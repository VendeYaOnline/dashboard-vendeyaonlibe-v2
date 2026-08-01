import type { Metadata } from "next";
import { ProductosDestacadosView } from "@/features/productos-destacados/productos-destacados-view";

export const metadata: Metadata = { title: "Productos Star | VendeYa" };

export default function ProductosDestacadosPage() {
  return <ProductosDestacadosView />;
}
