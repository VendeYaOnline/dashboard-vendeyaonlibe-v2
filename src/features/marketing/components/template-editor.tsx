"use client";

import { useState } from "react";
import { ImageOff, PackagePlus, X } from "lucide-react";
import {
  Button,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Select,
  Switch,
  TextArea,
  TextField,
} from "@heroui/react";
import { FormSection } from "@/features/productos/components/form-section";
import { formatMoney } from "@/features/analisis/utils";
import type {
  MarketingBrand,
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

/** Formulario de una plantilla: diseño, textos, productos y colores. */
export function TemplateEditor({ draft, onChange, layouts, brand, products, onProductsLoaded }: TemplateEditorProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const layout = layouts[draft.layout];
  const content = draft.content;
  const setContent = (patch: Partial<MarketingTemplateDraft["content"]>) =>
    onChange({ ...draft, content: { ...content, ...patch } });
  const selected = content.product_ids.map((id) => products.get(id) ?? { id, title: "", image: "", price: 0, regularPrice: null });
  const colors = content.colors ?? brand.colors;

  return (
    <div className="space-y-5">
      <FormSection title="Diseño" description="Cómo se organiza el correo.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField value={draft.name} onChange={(name) => onChange({ ...draft, name: name.slice(0, LIMITS.name) })} isRequired>
            <Label>Nombre de la plantilla</Label>
            <Input maxLength={LIMITS.name} placeholder="Ej: Promo de temporada" />
          </TextField>
          <Select
            selectedKey={draft.layout}
            onSelectionChange={(key) => {
              const next = String(key) as MarketingLayout;
              // Al cambiar de diseño se recortan los productos que sobren.
              onChange({ ...draft, layout: next, content: { ...content, product_ids: content.product_ids.slice(0, layouts[next].maxProducts) } });
            }}
          >
            <Label>Diseño</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {(Object.keys(layouts) as MarketingLayout[]).map((key) => (
                  <ListBoxItem key={key} id={key}>
                    {layouts[key].label}
                  </ListBoxItem>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>
      </FormSection>

      <FormSection title="Bandeja de entrada" description="Lo primero que ve tu cliente antes de abrir el correo.">
        <div className="grid gap-4">
          <TextField value={content.subject} onChange={(subject) => setContent({ subject: subject.slice(0, LIMITS.subject) })} isRequired>
            <Label>Asunto</Label>
            <Input maxLength={LIMITS.subject} placeholder="Ej: Llegó lo nuevo de la temporada" />
          </TextField>
          <TextField value={content.preheader} onChange={(preheader) => setContent({ preheader: preheader.slice(0, LIMITS.preheader) })}>
            <Label>Texto de vista previa</Label>
            <Input maxLength={LIMITS.preheader} placeholder="Aparece junto al asunto en Gmail y en el celular" />
          </TextField>
        </div>
      </FormSection>

      <FormSection title="Contenido">
        <div className="grid gap-4">
          <TextField value={content.heading} onChange={(heading) => setContent({ heading: heading.slice(0, LIMITS.heading) })}>
            <Label>Título</Label>
            <Input maxLength={LIMITS.heading} />
          </TextField>
          <TextField value={content.body} onChange={(body) => setContent({ body: body.slice(0, LIMITS.body) })}>
            <Label>Mensaje</Label>
            <TextArea rows={4} maxLength={LIMITS.body} />
          </TextField>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField value={content.button_text} onChange={(button_text) => setContent({ button_text: button_text.slice(0, LIMITS.button_text) })}>
              <Label>Texto del botón</Label>
              <Input maxLength={LIMITS.button_text} placeholder="Ej: Comprar ahora" />
            </TextField>
            {draft.layout === "announcement" && (
              <TextField
                value={content.discount_code}
                onChange={(code) => setContent({ discount_code: code.toUpperCase().slice(0, LIMITS.discount_code) })}
              >
                <Label>Código de descuento (opcional)</Label>
                <Input maxLength={LIMITS.discount_code} placeholder="Ej: GRACIAS10" className="font-mono uppercase" />
              </TextField>
            )}
          </div>
          {draft.layout === "announcement" && content.discount_code && (
            <p className="text-xs text-muted">
              El código debe existir en Códigos promocionales para que funcione en tu tienda.
            </p>
          )}
        </div>
      </FormSection>

      <FormSection
        title="Productos"
        description={
          layout.minProducts === layout.maxProducts
            ? `Este diseño muestra ${layout.maxProducts} producto con su foto, precio y botón.`
            : `Entre ${layout.minProducts} y ${layout.maxProducts} productos con su foto y precio actuales.`
        }
      >
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
          <Button variant="outline" onPress={() => setIsPickerOpen(true)}>
            <PackagePlus className="size-4" />
            {selected.length ? "Cambiar productos" : "Elegir productos"}
          </Button>
          {!brand.store_url && (
            <p className="text-xs text-warning">
              Agrega el enlace de tu tienda en la pestaña Marca para que los botones lleven a tus productos.
            </p>
          )}
        </div>
      </FormSection>

      <FormSection title="Colores" description="Por defecto usa los colores de tu marca; puedes cambiarlos solo para esta plantilla.">
        <div className="space-y-4">
          <Switch
            isSelected={content.colors !== null}
            onChange={(custom) => setContent({ colors: custom ? { ...brand.colors } : null })}
          >
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              <Label>Colores propios para esta plantilla</Label>
            </Switch.Content>
          </Switch>
          {content.colors && (
            <div className="grid gap-4 sm:grid-cols-3">
              <ColorField label="Botones" value={colors.primary} onChange={(primary) => setContent({ colors: { ...colors, primary } })} />
              <ColorField label="Fondo" value={colors.background} onChange={(background) => setContent({ colors: { ...colors, background } })} />
              <ColorField label="Texto" value={colors.text} onChange={(text) => setContent({ colors: { ...colors, text } })} />
            </div>
          )}
        </div>
      </FormSection>

      <ProductPickerModal
        isOpen={isPickerOpen}
        onOpenChange={setIsPickerOpen}
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
