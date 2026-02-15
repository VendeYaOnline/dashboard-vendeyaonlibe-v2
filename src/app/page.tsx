"use client";

import { useState } from "react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { SalesReceived } from "@/components/sales-received";
import { ProductosStart } from "@/components/productos-start";
import { Carrusel } from "@/components/carrusel";
import { Categorias } from "@/components/categorias";
import { Productos } from "@/components/productos";
import { Analisis } from "@/components/analisis";
import { Mensajes } from "@/components/mensajes";
import { Atributos } from "@/components/atributos";
import { Usuarios } from "@/components/usuarios";
import { Galeria } from "@/components/galeria";

export default function DashboardPage() {
  const [activeView, setActiveView] = useState("ventas-recibidas");

  const renderView = () => {
    switch (activeView) {
      case "ventas-recibidas":
        return <SalesReceived />;
      case "productos-start":
        return <ProductosStart />;
      case "carrusel":
        return <Carrusel />;
      case "categorias":
        return <Categorias />;
      case "productos":
        return <Productos />;
      case "analisis":
        return <Analisis />;
      case "mensajes":
        return <Mensajes />;
      case "atributos":
        return <Atributos />;
      case "usuarios":
        return <Usuarios />;
      case "galeria":
        return <Galeria />;
      default:
        return <SalesReceived />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="flex-1 lg:ml-64">{renderView()}</main>
    </div>
  );
}
