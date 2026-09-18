"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppToaster } from "@/components/shared/app-toaster";

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
      {children}
      <AppToaster />
    </QueryClientProvider>
  );
}
