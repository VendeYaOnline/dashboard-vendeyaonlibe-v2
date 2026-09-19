"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { getHomeRoute } from "@/config/navigation";

/** La raíz no tiene contenido propio: entra a la primera sección del rol. */
export default function DashboardIndexPage() {
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    router.replace(getHomeRoute(role));
  }, [hasHydrated, router, role]);

  return null;
}
