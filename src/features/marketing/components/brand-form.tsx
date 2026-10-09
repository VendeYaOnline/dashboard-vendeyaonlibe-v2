"use client";

import { useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button, Input, Label, TextField } from "@heroui/react";
import { ImagePickerModal } from "@/components/shared/image-picker-modal";
import { FormSection } from "@/features/productos/components/form-section";
import type { MarketingBrand } from "@/interfaces/marketing";
import { LIMITS } from "../constants";

interface BrandFormProps {
  brand: MarketingBrand;
  onChange: (brand: MarketingBrand) => void;
  /** Dirección desde la que salen los correos (SES_FROM_EMAIL). */
  senderEmail: string | null;
}

/**
 * Así se ve el remitente en la bandeja de entrada (estilo Gmail en el
 * celular): círculo con la inicial, nombre, asunto y vista previa.
 */
function InboxPreview({ name }: { name: string }) {
  const sender = name.trim() || "Tu marca";
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted">Así lo verán tus clientes en su bandeja de entrada</p>
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-secondary px-3 py-2.5">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-400 text-lg font-medium text-amber-950"
          aria-hidden
        >
          {sender.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate font-semibold">{sender}</p>
            <span className="shrink-0 text-xs text-muted">10:30 a. m.</span>
          </div>
          <p className="truncate text-sm">20 % de descuento solo esta semana</p>
          <p className="truncate text-xs text-muted">Aprovecha antes de que se acabe…</p>
        </div>
      </div>
    </div>
  );
}

/** Marca de los correos: nombre, respuestas, logo, enlace de la tienda y redes. */
export function BrandForm({ brand, onChange, senderEmail }: BrandFormProps) {
  const [isLogoPickerOpen, setIsLogoPickerOpen] = useState(false);
  const set = (patch: Partial<MarketingBrand>) => onChange({ ...brand, ...patch });

  return (
    <div className="space-y-5">
      <FormSection
        title="Remitente"
        description={`El correo sale desde ${senderEmail ?? "el dominio de VendeYaOnline"} con el nombre de tu marca, y las respuestas llegan a tu correo.`}
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField value={brand.sender_name} onChange={(sender_name) => set({ sender_name: sender_name.slice(0, LIMITS.sender_name) })} isRequired>
              <Label>Nombre de la marca</Label>
              <Input maxLength={LIMITS.sender_name} placeholder="Ej: Jarameni" />
            </TextField>
            <TextField value={brand.reply_to} onChange={(reply_to) => set({ reply_to })} type="email">
              <Label>Correo para respuestas</Label>
              <Input placeholder="ventas@tumarca.com" maxLength={LIMITS.url} />
            </TextField>
          </div>
          <InboxPreview name={brand.sender_name} />
        </div>
      </FormSection>

      <FormSection title="Logo" description="Aparece arriba de cada correo. Si no eliges uno, se muestra el nombre de tu marca.">
        <div className="space-y-3">
          <div className="flex h-28 w-full items-center justify-center rounded-xl border border-border bg-white p-3 sm:w-64">
            {brand.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-center text-lg font-semibold text-gray-800">{brand.sender_name || "Tu marca"}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onPress={() => setIsLogoPickerOpen(true)}>
              <ImagePlus className="size-4" />
              {brand.logo_url ? "Cambiar logo" : "Elegir logo de la galería"}
            </Button>
            {brand.logo_url && (
              <Button variant="ghost" size="sm" className="text-danger" onPress={() => set({ logo_url: "" })}>
                <Trash2 className="size-4" />
                Quitar logo
              </Button>
            )}
          </div>
        </div>
      </FormSection>

      <FormSection title="Tu tienda" description="A dónde llevan los botones y las imágenes de tus correos.">
        <TextField value={brand.store_url} onChange={(store_url) => set({ store_url: store_url.trim() })} type="url">
          <Label>Enlace de tu tienda</Label>
          <Input placeholder="https://www.tumarca.com" maxLength={LIMITS.url} />
        </TextField>
      </FormSection>

      <FormSection title="Contacto y redes" description="Aparecen al final de cada correo.">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField value={brand.whatsapp} onChange={(whatsapp) => set({ whatsapp: whatsapp.slice(0, LIMITS.whatsapp) })}>
            <Label>WhatsApp de la marca</Label>
            <Input inputMode="tel" placeholder="+57 300 123 4567" />
          </TextField>
          <TextField value={brand.instagram} onChange={(instagram) => set({ instagram: instagram.trim() })} type="url">
            <Label>Instagram</Label>
            <Input placeholder="https://instagram.com/tumarca" maxLength={LIMITS.url} />
          </TextField>
          <TextField value={brand.facebook} onChange={(facebook) => set({ facebook: facebook.trim() })} type="url">
            <Label>Facebook</Label>
            <Input placeholder="https://facebook.com/tumarca" maxLength={LIMITS.url} />
          </TextField>
        </div>
      </FormSection>

      <ImagePickerModal
        isOpen={isLogoPickerOpen}
        onOpenChange={setIsLogoPickerOpen}
        onSelect={([url]) => url && set({ logo_url: url })}
        currentSelected={brand.logo_url ? [brand.logo_url] : []}
      />
    </div>
  );
}
