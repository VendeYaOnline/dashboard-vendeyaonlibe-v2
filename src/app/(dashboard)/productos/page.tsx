import type { Metadata } from "next";
import { ProductosView } from "@/features/productos/productos-view";

export const metadata: Metadata = { title: "Productos | VendeYaOnline" };

export default function ProductosPage() {
  return <ProductosView />;
}
