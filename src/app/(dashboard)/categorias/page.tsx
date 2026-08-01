import type { Metadata } from "next";
import { CategoriasView } from "@/features/categorias/categorias-view";

export const metadata: Metadata = { title: "Categorías | VendeYa" };

export default function CategoriasPage() {
  return <CategoriasView />;
}
