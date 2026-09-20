"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { canAccessRoute, getHomeRoute } from "@/config/navigation";

/**
 * Si el usuario entra por URL a una sección que su rol no ve en el menú
 * (p. ej. el superadmin a /productos, o un espectador a /usuarios), se le
 * lleva a su página inicial. El backend sigue siendo quien autoriza.
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  const allowed = Boolean(user) && (pathname === "/" || canAccessRoute(user?.role, pathname));

  useEffect(() => {
    if (!hasHydrated) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!allowed) router.replace(getHomeRoute(user.role));
  }, [allowed, hasHydrated, router, user]);

  return hasHydrated && allowed ? <>{children}</> : null;
}
