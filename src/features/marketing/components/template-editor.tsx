"use client";

import { useState } from "react";
import { ImageIcon, ImageOff, ImagePlus, Package, PackagePlus, RotateCcw, X, type LucideIcon } from "lucide-react";
import { Button, Input, Label, TextArea, TextField, cn } from "@heroui/react";
import { ImagePickerModal } from "@/components/shared/image-picker-modal";
import { FormSection } from "@/features/productos/components/form-section";
import { formatMoney } from "@/features/analisis/utils";
import type {
  MarketingBrand,
  MarketingColors,
  MarketingLayout,
  MarketingProduct,
  MarketingResponse,
  MarketingTemplateDraft,
} from "@/interfaces/marketing";
import { ColorField } from "./color-field";
import { ProductPickerModal } from "./product-picker-modal";
import { LIMITS } from "../constants";

interface TemplateEditorProps {
  draft: MarketingTemplateDraft;
  onChange: (draft: MarketingTemplateDraft) => void;
  layouts: MarketingResponse["layouts"];
  brand: MarketingBrand;
  /** Datos de los productos por id (los que no estén = no disponibles). */
  products: Map<string, MarketingProduct>;
  onProductsLoaded: (products: MarketingProduct[]) => void;
}

/** Qué colorea cada color en cada diseño (para nombrarlos según lo que el usuario ve). */
const COLOR_FIELDS: Record<MarketingLayout, { key: keyof MarketingColors; label: string; hint: string }[]> = {
  products: [
    { key: "primary", label: "Botones", hint: "Botones de compra y código de descuento" },
    { key: "background", label: "Fondo", hint: "Fondo alrededor del correo" },
    { key: "text", label: "Textos", hint: "Título, mensaje, nombres y precios" },
  ],
  poster: [
    { key: "primary", label: "Botón y código", hint: "Botón bajo el póster y código de descuento" },
    { key: "background", label: "Fondo", hint: "Fondo alrededor del póster" },
    { key: "text", label: "Textos", hint: "Título y mensaje bajo el póster" },
  ],
};

const GOALS: { id: MarketingLayout; icon: LucideIcon; title: string; description: string }[] = [
  {
    id: "products",
    icon: Package,
    title: "Productos de mi tienda",
    description: "Elige 1 producto para mostrarlo en grande, o varios para una cuadrícula. Con foto, precio y botón de compra.",
  },
  {
    id: "poster",
    icon: ImageIcon,
    title: "Imagen o póster",
    description: "Sube una imagen desde tu galería, por ejemplo «20 % en camisetas». Al tocarla, lleva a tu tienda.",
  },
];

/** Paso a paso de una plantilla: qué promocionar, contenido, mensaje y bandeja de entrada. */
export function TemplateEditor({ draft, onChange, layouts, brand, products, onProductsLoaded }: TemplateEditorProps) {
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

  const content = draft.content;
  const layout = layouts[draft.layout];
  const isPoster = draft.layout === "poster";
  const imageUrl = content.image_url ?? "";
  const colors = content.colors ?? brand.colors;
  const selected = content.product_ids.map((id) => products.get(id) ?? { id, title: "", image: "", price: 0, regularPrice: null });
  const setContent = (patch: Partial<MarketingTemplateDraft["content"]>) => onChange({ ...draft, content: { ...content, ...patch } });

  const chooseGoal = (next: MarketingLayout) =>
    // Al pasar a póster se recortan los productos que sobren (admite menos).
    onChange({ ...draft, layout: next, content: { ...content, product_ids: content.product_ids.slice(0, layouts[next].maxProducts) } });

  const productList = (
    <div className="space-y-3">
      {selected.length > 0 && (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {selected.map((product) => (
            <li key={product.id} className="flex items-center gap-3 px-3 py-2">
              {product.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.image} alt="" className="size-10 shrink-0 rounded-md object-cover" />
              ) : (
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-secondary">
                  <ImageOff className="size-4 text-muted" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{product.title || "Producto no disponible"}</p>
                <p className="text-xs text-muted">
                  {product.title ? formatMoney(product.price) : "Se ocultó o se eliminó: no saldrá en el correo"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                isIconOnly
                aria-label={`Quitar ${product.title || "producto"}`}
                onPress={() => setContent({ product_ids: content.product_ids.filter((id) => id !== product.id) })}
              >
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Button variant="outline" onPress={() => setIsProductPickerOpen(true)}>
        <PackagePlus className="size-4" />
        {selected.length ? "Cambiar productos" : "Elegir productos"}
      </Button>
    </div>
  );

  return (
    <div className="space-y-5">
      <FormSection title="1. ¿Qué quieres promocionar?">
        <div className="grid gap-3 sm:grid-cols-2">
          {GOALS.map((goal) => {
            const Icon = goal.icon;
            const isActive = draft.layout === goal.id;
            return (
              <button
                key={goal.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => chooseGoal(goal.id)}
                className={cn(
                  "flex gap-3 rounded-xl border p-4 text-left transition-colors",
                  isActive ? "border-accent bg-accent-soft ring-1 ring-accent" : "border-border hover:bg-surface-secondary",
                )}
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg",
                    isActive ? "bg-accent text-accent-foreground" : "bg-surface-secondary",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">{goal.title}</span>
                  <span className="block text-xs text-muted">{goal.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </FormSection>

      {isPoster ? (
        <FormSection title="2. Tu imagen" description="Un póster o banner de tu galería.">
          <div className="space-y-4">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="max-h-64 w-full rounded-lg border border-border object-contain" />
            ) : (
              <button
                type="button"
                onClick={() => setIsImagePickerOpen(true)}
                className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-sm text-muted hover:bg-surface-secondary"
              >
                <ImagePlus className="size-6" aria-hidden />
                Elegir imagen de la galería
              </button>
            )}
            {imageUrl && (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onPress={() => setIsImagePickerOpen(true)}>
                  <ImagePlus className="size-4" />
                  Cambiar imagen
                </Button>
                <Button variant="ghost" onPress={() => setContent({ image_url: "" })}>
                  <X className="size-4" />
                  Quitar
                </Button>
              </div>
            )}
            <TextField value={content.image_link ?? ""} onChange={(image_link) => setContent({ image_link: image_link.trim() })} type="url">
              <Label>Al tocar la imagen, ir a (opcional)</Label>
              <Input placeholder={brand.store_url || "https://www.tumarca.com/ofertas"} maxLength={LIMITS.url} />
              <p className="mt-1 text-xs text-muted">Vacío = la página principal de tu tienda.</p>
            </TextField>
            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-sm font-medium">Productos debajo de la imagen (opcional)</p>
              <p className="text-xs text-muted">Hasta {layout.maxProducts}, con su foto y precio.</p>
              {productList}
            </div>
          </div>
        </FormSection>
      ) : (
        <FormSection
          title="2. Tus productos"
          description={`Hasta ${layout.maxProducts}. Con 1 se muestra en grande; con 2 o más, en cuadrícula. Foto y precio salen siempre actualizados.`}
        >
          {productList}
        </FormSection>
      )}

      <FormSection title="3. Tu mensaje" description="Todo es opcional, pero un título y un mensaje ayudan a que no llegue a spam.">
        <div className="grid gap-4">
          <TextField value={content.heading} onChange={(heading) => setContent({ heading: heading.slice(0, LIMITS.heading) })}>
            <Label>Título</Label>
            <Input maxLength={LIMITS.heading} placeholder={isPoster ? "Ej: 20 % en camisetas" : "Ej: Nuevo en la tienda"} />
          </TextField>
          <TextField value={content.body} onChange={(body) => setContent({ body: body.slice(0, LIMITS.body) })}>
            <Label>Mensaje</Label>
            <TextArea rows={3} maxLength={LIMITS.body} />
          </TextField>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField value={content.button_text} onChange={(button_text) => setContent({ button_text: button_text.slice(0, LIMITS.button_text) })}>
              <Label>Texto del botón</Label>
              <Input maxLength={LIMITS.button_text} placeholder="Ej: Comprar ahora" />
            </TextField>
            <TextField
              value={content.discount_code}
              onChange={(code) => setContent({ discount_code: code.toUpperCase().slice(0, LIMITS.discount_code) })}
            >
              <Label>Código de descuento (opcional)</Label>
              <Input maxLength={LIMITS.discount_code} placeholder="Ej: CAMISETAS20" className="font-mono uppercase" />
            </TextField>
          </div>
          {content.discount_code && (
            <p className="text-xs text-muted">El código debe existir en Códigos promocionales para que funcione en tu tienda.</p>
          )}
          {isPoster && !content.heading.trim() && !content.body.trim() && (
            <p className="text-xs text-warning">
              Agrega al menos un título o un mensaje: los correos que son solo una imagen suelen terminar en spam.
            </p>
          )}
          {!brand.store_url && (
            <p className="text-xs text-warning">Agrega el enlace de tu tienda en «Tu marca» para que los botones lleven a ella.</p>
          )}
        </div>
      </FormSection>

      <FormSection title="4. Bandeja de entrada" description="Lo primero que ve tu cliente, antes de abrir el correo.">
        <div className="grid gap-4">
          <TextField value={content.subject} onChange={(subject) => setContent({ subject: subject.slice(0, LIMITS.subject) })} isRequired>
            <Label>Asunto</Label>
            <Input maxLength={LIMITS.subject} placeholder="Ej: 20 % de descuento solo esta semana" />
          </TextField>
          <TextField value={content.preheader} onChange={(preheader) => setContent({ preheader: preheader.slice(0, LIMITS.preheader) })}>
            <Label>Texto de vista previa (opcional)</Label>
            <Input maxLength={LIMITS.preheader} placeholder="Aparece junto al asunto en Gmail y en el celular" />
          </TextField>
        </div>
      </FormSection>

      <FormSection
        title="5. Colores"
        description="Por defecto, los de tu marca. Cámbialos solo para esta plantilla si quieres."
        action={
          content.colors ? (
            <Button variant="ghost" size="sm" onPress={() => setContent({ colors: null })}>
              <RotateCcw className="size-3.5" />
              Restablecer
            </Button>
          ) : undefined
        }
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {COLOR_FIELDS[draft.layout].map((field) => (
            <ColorField
              key={field.key}
              label={field.label}
              hint={field.hint}
              value={colors[field.key]}
              onChange={(next) => setContent({ colors: { ...colors, [field.key]: next } })}
            />
          ))}
        </div>
      </FormSection>

      <ImagePickerModal
        isOpen={isImagePickerOpen}
        onOpenChange={setIsImagePickerOpen}
        onSelect={([url]) => url && setContent({ image_url: url })}
        currentSelected={imageUrl ? [imageUrl] : []}
      />

      <ProductPickerModal
        isOpen={isProductPickerOpen}
        onOpenChange={setIsProductPickerOpen}
        selected={selected.filter((product) => product.title)}
        max={layout.maxProducts}
        onConfirm={(picked) => {
          onProductsLoaded(picked);
          setContent({ product_ids: picked.map((product) => product.id) });
        }}
      />
    </div>
  );
}
