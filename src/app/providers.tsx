"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppToaster } from "@/components/shared/app-toaster";
import { useAuthStore } from "@/store/auth.store";

function AuthCacheBoundary({ queryClient, children }: { queryClient: QueryClient; children: ReactNode }) {
  const userEmail = useAuthStore((state) => state.user?.email ?? null);

  // Las claves de las consultas no incluyen company_id; al cambiar de cuenta
  // se descarta todo antes de que la nueva empresa vea datos en memoria.
  useEffect(() => {
    queryClient.clear();
  }, [queryClient, userEmail]);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  // Una instancia por montaje: evita compartir caché entre peticiones en SSR.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthCacheBoundary queryClient={queryClient}>{children}</AuthCacheBoundary>
      <AppToaster />
    </QueryClientProvider>
  );
}
