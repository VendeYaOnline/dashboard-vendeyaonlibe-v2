"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { getHomeRoute } from "@/config/navigation";

/** La raíz no tiene contenido propio: entra a la primera sección del rol. */
export default function DashboardIndexPage() {
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role);

  useEffect(() => {
    router.replace(getHomeRoute(role));
  }, [router, role]);

  return null;
}
