import type { Metadata } from "next";
import { UsuariosView } from "@/features/usuarios/usuarios-view";

export const metadata: Metadata = { title: "Usuarios | VendeYaOnline" };

export default function UsuariosPage() {
  return <UsuariosView />;
}
