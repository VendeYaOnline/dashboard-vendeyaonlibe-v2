import { ImageResponse } from "next/og";

export const alt = "VendeYaOnline | Panel de clientes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", padding: "64px 72px", background: "linear-gradient(120deg, #090d25 0%, #1e205a 65%, #244bd1 100%)", color: "#ffffff" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", fontSize: 32, fontWeight: 700, letterSpacing: "-1px" }}>VendeYaOnline</div>
        <div style={{ display: "flex", border: "1px solid #798ac5", borderRadius: 32, padding: "12px 22px", fontSize: 19, color: "#d6e0ff" }}>PANEL DE CLIENTES</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", fontSize: 80, fontWeight: 700, letterSpacing: "-4px", lineHeight: 1.08 }}>Tu negocio.</div>
        <div style={{ display: "flex", fontSize: 80, fontWeight: 700, letterSpacing: "-4px", lineHeight: 1.08, color: "#a9c5ff" }}>Todo bajo control.</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #505b8c", paddingTop: 25, fontSize: 23, color: "#d6def6" }}>
        <span>Productos · Pedidos · Ventas</span>
        <span>VendeYaOnline</span>
      </div>
    </div>,
    size,
  );
}

