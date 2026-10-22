"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, ExternalLink, LogOut, RefreshCw } from "lucide-react";
import { Button, Card, buttonVariants, cn } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useQueryFeatures } from "@/app/api/queries";
import { logoutUser } from "@/app/api/request";
import { BILLING_BLOCKED_EVENT } from "@/app/api/config";
import { SUPERADMIN_ROLE } from "@/config/navigation";
import { useAuthStore } from "@/store/auth.store";

/** Dónde el dueño vuelve a suscribirse. */
const ACCOUNT_URL = "https://www.vendeyaonline.com/account";

/**
 * Panel bloqueado por falta de pago: si Mercado Pago canceló la suscripción
 * de VendeYaOnline, en vez del panel se muestra cómo suscribirse de nuevo. La
 * tienda en línea sigue vendiendo. Se desbloquea solo al volver a pagar (la
 * revisión del backend es cada hora) o a mano desde Plataforma.
 */
export function BillingBlockGate({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();
  const { data, refetch, isFetching } = useQueryFeatures(Boolean(user) && user?.role !== SUPERADMIN_ROLE);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Una petición rechazada por el bloqueo (402) vuelve a consultar el estado: así aparece esta pantalla.
  useEffect(() => {
    const onBlocked = () => queryClient.invalidateQueries({ queryKey: ["features"] });
    window.addEventListener(BILLING_BLOCKED_EVENT, onBlocked);
    return () => window.removeEventListener(BILLING_BLOCKED_EVENT, onBlocked);
  }, [queryClient]);

  if (!data?.billing_alert?.blocked) return <>{children}</>;

  const isAdmin = user?.role === "admin";
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutUser();
    } catch {
      // Se cierra la sesión aunque falle la petición.
    }
    logout();
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-lg">
        <Card.Content className="space-y-5 p-6 sm:p-8">
          <span className="flex size-12 items-center justify-center rounded-xl bg-danger/10">
            <AlertTriangle className="size-6 text-danger" aria-hidden />
          </span>
          <div className="space-y-2">
            <h1 className="text-xl font-bold">Tu suscripción de VendeYaOnline se canceló</h1>
            <p className="text-sm text-muted">
              Mercado Pago no pudo cobrar la mensualidad y canceló la suscripción. Tu tienda en línea sigue funcionando y
              recibiendo pedidos, pero el panel está bloqueado hasta que{" "}
              {isAdmin ? "te suscribas de nuevo." : "el administrador de la tienda se suscriba de nuevo."}
            </p>
            {isAdmin && (
              <p className="text-sm text-muted">
                Después de suscribirte, el panel se desbloquea solo en menos de una hora. Si tienes dudas, escríbenos.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {isAdmin && (
              <a href={ACCOUNT_URL} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "primary" }))}>
                Suscribirme de nuevo <ExternalLink className="size-4" aria-hidden />
              </a>
            )}
            <Button variant="outline" isDisabled={isFetching} onPress={() => refetch()}>
              <RefreshCw className={cn("size-4", isFetching && "animate-spin")} aria-hidden /> Volver a revisar
            </Button>
            <Button variant="ghost" isDisabled={isLoggingOut} onPress={handleLogout}>
              <LogOut className="size-4" aria-hidden /> {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
            </Button>
          </div>
        </Card.Content>
      </Card>
    </main>
  );
}
