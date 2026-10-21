"use client";

import { AlertTriangle, ExternalLink, Info, PackagePlus } from "lucide-react";
import { Button, Spinner } from "@heroui/react";
import { useQueryWhatsappPreview } from "@/app/api/queries";
import { CAROUSEL_TEMPLATE_BODY, WHATSAPP_TEMPLATE_BODY } from "./whatsapp-templates";

/** "{{1}}", "{{2}}"… de la plantilla de Meta → los valores de la vista previa. */
const fill = (body: string, params: string[]) => params.reduce((text, value, index) => text.replaceAll(`{{${index + 1}}}`, value), body);

/** *negrita* de WhatsApp → <strong>. Todo lo demás es texto (React lo escapa). */
function WhatsappText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*[^*\n]+\*)/g).map((part, index) =>
        part.startsWith("*") && part.endsWith("*") && part.length > 2 ? <strong key={index}>{part.slice(1, -1)}</strong> : part,
      )}
    </>
  );
}

/** Burbuja de mensaje recibido, como en WhatsApp. */
function Bubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[85%] whitespace-pre-wrap rounded-lg rounded-tl-none bg-white px-3 py-2 text-[13px] leading-relaxed text-[#111b21] shadow-sm">
      {children}
    </div>
  );
}

/**
 * Vista previa de la campaña por WhatsApp (con WhatsApp Business conectado):
 * el carrusel con una tarjeta por producto, o el mensaje de texto, tal como lo
 * arma el servidor al enviar. El nombre del cliente es de ejemplo.
 */
export function WhatsappPreview({ slot, onEditTemplates }: { slot: number | null; onEditTemplates: () => void }) {
  const { data: preview, isLoading } = useQueryWhatsappPreview(slot);

  if (!slot) return null;
  if (isLoading || !preview) {
    return (
      <p className="flex items-center gap-2 text-xs text-muted">
        <Spinner size="sm" /> Armando la vista previa...
      </p>
    );
  }
  if (preview.mode === "locked" || preview.mode === "empty") return null;

  const missing = preview.cards ? Math.max(0, preview.cards - preview.products) : 0;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted">Así lo recibirá tu cliente (con un nombre de ejemplo)</p>
      <div className="space-y-2 rounded-xl bg-[#efeae2] p-3">
        {preview.mode === "carousel" ? (
          <>
            <Bubble>
              <WhatsappText text={fill(CAROUSEL_TEMPLATE_BODY, preview.body)} />
            </Bubble>
            <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Tarjetas del carrusel">
              {preview.items.map((card, index) => (
                <div key={`${card.url}-${index}`} className="w-44 shrink-0 overflow-hidden rounded-lg bg-white shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={card.image} alt="" className="aspect-square w-full bg-white object-contain" />
                  <div className="space-y-0.5 px-2.5 py-2 text-[#111b21]">
                    <p className="line-clamp-2 text-[13px] font-medium leading-snug">{card.title}</p>
                    <p className="text-xs text-[#667781]">{card.price}</p>
                  </div>
                  <a
                    href={card.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 border-t border-black/10 py-2 text-[13px] font-medium text-[#00a884] hover:bg-black/5"
                  >
                    <ExternalLink className="size-3.5" />
                    Comprar
                  </a>
                </div>
              ))}
            </div>
          </>
        ) : (
          <Bubble>
            <WhatsappText text={fill(WHATSAPP_TEMPLATE_BODY, preview.params)} />
          </Bubble>
        )}
      </div>

      {preview.mode === "carousel" && preview.extra > 0 && (
        <p className="flex items-start gap-2 text-xs text-muted">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          Tu carrusel tiene {preview.cards} tarjetas: salen los primeros {preview.cards} productos de la plantilla (
          {preview.extra} {preview.extra === 1 ? "queda" : "quedan"} fuera). El correo sí los lleva todos.
        </p>
      )}
      {preview.mode === "text" && preview.reason === "few_products" && (
        <div className="flex flex-col gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning sm:flex-row sm:items-center">
          <p className="flex flex-1 items-start gap-2">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            Esta plantilla tiene {preview.products} {preview.products === 1 ? "producto" : "productos"} y tu carrusel{" "}
            {preview.cards} tarjetas: se enviará como texto. Agrega {missing} {missing === 1 ? "producto" : "productos"} más
            para enviarla en carrusel.
          </p>
          <Button variant="outline" size="sm" onPress={onEditTemplates}>
            <PackagePlus className="size-3.5" />
            Cambiar productos
          </Button>
        </div>
      )}
      {preview.mode === "text" && preview.reason === "missing_image_or_link" && (
        <p className="flex items-start gap-2 text-xs text-warning">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          Algún producto no tiene foto, o falta el enlace de tu tienda: se enviará como texto. Revisa los productos de la
          plantilla.
        </p>
      )}
      {preview.mode === "text" && preview.reason === "no_carousel" && (
        <p className="flex items-start gap-2 text-xs text-muted">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          Para mostrar tus productos con foto y botón «Comprar», configura el carrusel en WhatsApp Business.
        </p>
      )}
      <p className="text-xs text-muted">El texto exacto es el de tu plantilla aprobada en Meta; aquí se ve la recomendada.</p>
    </div>
  );
}
