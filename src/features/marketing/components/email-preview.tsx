"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Monitor, Smartphone } from "lucide-react";
import { Card, Spinner, ToggleButton, ToggleButtonGroup, cn } from "@heroui/react";
import { previewMarketingEmail } from "@/app/api/request";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { MarketingPreviewRequest } from "@/interfaces/marketing";

type Device = "desktop" | "mobile";

/**
 * Vista previa del correo tal como lo arma el backend (el mismo HTML que se
 * envía). Se actualiza poco después de dejar de escribir.
 */
export function EmailPreview({ request, senderName }: { request: MarketingPreviewRequest; senderName: string }) {
  const [device, setDevice] = useState<Device>("desktop");
  const debounced = useDebouncedValue(JSON.stringify(request), 400);
  const { data, isFetching, isError } = useQuery({
    queryKey: ["marketing", "preview", debounced],
    queryFn: () => previewMarketingEmail(JSON.parse(debounced) as MarketingPreviewRequest),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    retry: false,
  });

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{senderName || "Tu marca"}</p>
          <p className="truncate text-sm">{request.template.content.subject || "Sin asunto"}</p>
          {request.template.content.preheader && (
            <p className="truncate text-xs text-muted">{request.template.content.preheader}</p>
          )}
        </div>
        <ToggleButtonGroup
          aria-label="Tamaño de la vista previa"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={new Set([device])}
          onSelectionChange={(keys) => {
            const [next] = Array.from(keys, String);
            if (next) setDevice(next as Device);
          }}
          size="sm"
        >
          <ToggleButton id="desktop" aria-label="Computador">
            <Monitor className="size-4" />
          </ToggleButton>
          <ToggleButton id="mobile" aria-label="Celular">
            <Smartphone className="size-4" />
          </ToggleButton>
        </ToggleButtonGroup>
      </div>
      <div className="relative flex justify-center bg-surface-secondary p-4">
        {isFetching && (
          <span className="absolute right-6 top-6 z-10">
            <Spinner size="sm" aria-label="Actualizando vista previa" />
          </span>
        )}
        {isError && !data ? (
          <p className="py-24 text-sm text-muted">No se pudo generar la vista previa.</p>
        ) : data ? (
          <iframe
            title="Vista previa del correo"
            srcDoc={data.html}
            // Sin scripts ni navegación desde el correo.
            sandbox=""
            className={cn(
              "h-[640px] rounded-lg border border-border bg-white shadow-sm transition-[width]",
              device === "desktop" ? "w-full max-w-[640px]" : "w-[375px]",
            )}
          />
        ) : (
          <div className="flex h-[640px] items-center">
            <Spinner aria-label="Cargando vista previa" />
          </div>
        )}
      </div>
    </Card>
  );
}
