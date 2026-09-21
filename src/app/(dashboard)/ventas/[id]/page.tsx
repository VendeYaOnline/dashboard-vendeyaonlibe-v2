import type { Metadata } from "next";
import { VentaDetailView } from "@/features/ventas/venta-detail-view";

export const metadata: Metadata = { title: "Detalle de venta | VendeYaOnline" };

export default async function VentaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VentaDetailView saleId={id} />;
}
