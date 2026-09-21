"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { useAuthStore } from "@/store/auth.store";
import { canAccessRoute, getHomeRoute } from "@/config/navigation";
import { verifySession } from "@/app/api/request";

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
  const isSessionValidated = useAuthStore((s) => s.isSessionValidated);
  const restoreValidatedSession = useAuthStore((s) => s.restoreValidatedSession);
  const logout = useAuthStore((s) => s.logout);
  const setSessionValidated = useAuthStore((s) => s.setSessionValidated);

  const allowed = Boolean(user) && (pathname === "/" || canAccessRoute(user?.role, pathname));

  useEffect(() => {
    if (!hasHydrated || isSessionValidated) return;

    let isCurrent = true;
    verifySession()
      .then(({ user: verifiedUser }) => {
        if (isCurrent) restoreValidatedSession(verifiedUser);
      })
      .catch((error) => {
        if (!isCurrent) return;
        // El interceptor ya invalida 401. Si no hay conexión, conservamos la
        // sesión local para no expulsar al usuario por un fallo transitorio.
        if (isAxiosError(error) && error.response?.status === 401) logout();
        else setSessionValidated(true);
      });

    return () => {
      isCurrent = false;
    };
  }, [hasHydrated, isSessionValidated, logout, restoreValidatedSession, setSessionValidated]);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isSessionValidated) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!allowed) router.replace(getHomeRoute(user.role));
  }, [allowed, hasHydrated, isSessionValidated, router, user]);

  return hasHydrated && isSessionValidated && allowed ? <>{children}</> : null;
}
