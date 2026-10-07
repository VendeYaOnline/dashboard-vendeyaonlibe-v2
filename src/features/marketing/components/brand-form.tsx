"use client";

import { useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button, Input, Label, TextField } from "@heroui/react";
import { ImagePickerModal } from "@/components/shared/image-picker-modal";
import { FormSection } from "@/features/productos/components/form-section";
import type { MarketingBrand } from "@/interfaces/marketing";
import { ColorField } from "./color-field";
import { LIMITS } from "../constants";

interface BrandFormProps {
  brand: MarketingBrand;
  onChange: (brand: MarketingBrand) => void;
  /** Dirección desde la que salen los correos (SES_FROM_EMAIL). */
  senderEmail: string | null;
}

/** Marca de los correos: nombre, respuestas, logo, colores, enlaces y redes. */
export function BrandForm({ brand, onChange, senderEmail }: BrandFormProps) {
  const [isLogoPickerOpen, setIsLogoPickerOpen] = useState(false);
  const set = (patch: Partial<MarketingBrand>) => onChange({ ...brand, ...patch });

  return (
    <div className="space-y-5">
      <FormSection
        title="Remitente"
        description={`Tus clientes verán el nombre de tu marca. El correo sale desde ${senderEmail ?? "el dominio de VendeYaOnline"} y las respuestas llegan a tu correo.`}
      >
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
      </FormSection>

      <FormSection title="Logo y colores">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {brand.logo_url ? (
              <span className="flex h-16 w-40 items-center justify-center rounded-lg border border-border bg-white p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={brand.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
              </span>
            ) : (
              <span className="flex h-16 w-40 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted">
                Sin logo: se usa el nombre
              </span>
            )}
            <Button variant="outline" onPress={() => setIsLogoPickerOpen(true)}>
              <ImagePlus className="size-4" />
              {brand.logo_url ? "Cambiar logo" : "Elegir logo de la galería"}
            </Button>
            {brand.logo_url && (
              <Button variant="ghost" onPress={() => set({ logo_url: "" })}>
                <X className="size-4" />
                Quitar
              </Button>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <ColorField label="Botones" value={brand.colors.primary} onChange={(primary) => set({ colors: { ...brand.colors, primary } })} />
            <ColorField label="Fondo" value={brand.colors.background} onChange={(background) => set({ colors: { ...brand.colors, background } })} />
            <ColorField label="Texto" value={brand.colors.text} onChange={(text) => set({ colors: { ...brand.colors, text } })} />
          </div>
        </div>
      </FormSection>

      <FormSection title="Tienda" description="A dónde llevan los botones de los correos.">
        <div className="grid gap-4">
          <TextField value={brand.store_url} onChange={(store_url) => set({ store_url: store_url.trim() })} type="url">
            <Label>Enlace de tu tienda</Label>
            <Input placeholder="https://www.tumarca.com" maxLength={LIMITS.url} />
          </TextField>
          <TextField value={brand.product_url} onChange={(product_url) => set({ product_url: product_url.trim() })}>
            <Label>Formato del enlace de un producto</Label>
            <Input className="font-mono text-sm" maxLength={LIMITS.url} />
            <p className="mt-1 text-xs text-muted">
              {"{store_url}"} es el enlace de tu tienda, {"{id}"} el del producto y {"{slug}"} su nombre en el enlace. Si no sabes
              cuál es, pide ayuda a VendeYaOnline.
            </p>
          </TextField>
        </div>
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
