import { redirect } from "next/navigation";
import { DEFAULT_ROUTE } from "@/config/navigation";

/** La raíz no tiene contenido propio: entra a la primera sección del panel. */
export default function DashboardIndexPage() {
  redirect(DEFAULT_ROUTE);
}
