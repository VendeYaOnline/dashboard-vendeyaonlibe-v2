"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, LayoutTemplate, Megaphone, Palette, Send } from "lucide-react";
import { Button, Card, Chip, Spinner, ToggleButton, ToggleButtonGroup, cn, toast } from "@heroui/react";
import { PageHeader } from "@/components/layout/page-header";
import { PendingButton } from "@/components/shared/pending-button";
import { useQueryMarketing } from "@/app/api/queries";
import {
  useMutationSaveMarketingBrand,
  useMutationSaveMarketingTemplate,
  useMutationSendMarketingTest,
} from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import { useAuthStore } from "@/store/auth.store";
import type { MarketingBrand, MarketingProduct, MarketingTemplate, MarketingTemplateDraft } from "@/interfaces/marketing";
import { BrandForm } from "./components/brand-form";
import { EmailPreview } from "./components/email-preview";
import { TemplateEditor } from "./components/template-editor";

type Tab = "templates" | "brand";

const toDraft = ({ name, layout, content }: MarketingTemplate): MarketingTemplateDraft => ({
  name,
  layout,
  content: structuredClone(content),
});

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Marketing: la marca de los correos y sus 3 plantillas, con vista previa y envío de prueba. */
export function MarketingView() {
  const { data, isLoading, isError } = useQueryMarketing();
  const userEmail = useAuthStore((s) => s.user?.email);
  const [tab, setTab] = useState<Tab>("templates");
  const [slot, setSlot] = useState(1);
  const [drafts, setDrafts] = useState<Record<number, MarketingTemplateDraft>>({});
  const [brand, setBrand] = useState<MarketingBrand | null>(null);
  const [productCache, setProductCache] = useState<Map<string, MarketingProduct>>(new Map());

  const saveTemplate = useMutationSaveMarketingTemplate();
  const saveBrand = useMutationSaveMarketingBrand();
  const sendTest = useMutationSendMarketingTest();

  // Los borradores se crean una sola vez por casilla: al refrescar los datos
  // no se pierden los cambios sin guardar de otras plantillas.
  useEffect(() => {
    if (!data) return;
    setDrafts((current) => {
      const next = { ...current };
      for (const template of data.templates) next[template.slot] ??= toDraft(template);
      return next;
    });
    setBrand((current) => current ?? structuredClone(data.brand));
    setProductCache((current) => {
      const next = new Map(current);
      for (const product of data.products) next.set(product.id, product);
      return next;
    });
  }, [data]);

  const savedTemplate = data?.templates.find((template) => template.slot === slot);
  const draft = drafts[slot];
  const isTemplateDirty = Boolean(savedTemplate && draft && (!savedTemplate.saved || !same(toDraft(savedTemplate), draft)));
  const isBrandDirty = Boolean(data && brand && !same(data.brand, brand));
  const minProducts = data && draft ? data.layouts[draft.layout].minProducts : 0;
  const missingProducts = draft ? Math.max(0, minProducts - draft.content.product_ids.filter((id) => productCache.has(id)).length) : 0;

  const previewRequest = useMemo(
    () => (draft ? { template: draft, ...(tab === "brand" && brand ? { brand } : {}) } : null),
    [draft, tab, brand],
  );

  if (isLoading || (data && (!draft || !brand))) {
    return (
      <div className="flex justify-center py-24">
        <Spinner aria-label="Cargando Marketing" />
      </div>
    );
  }
  if (isError || !data || !draft || !brand || !previewRequest) {
    return <p className="py-24 text-center text-sm text-muted">No se pudo cargar Marketing. Recarga la página.</p>;
  }

  const handleSaveTemplate = () =>
    saveTemplate.mutate(
      { slot, template: draft },
      {
        onSuccess: ({ template }) => {
          setDrafts((current) => ({ ...current, [slot]: toDraft(template) }));
          toast.success(`Plantilla «${template.name}» guardada`);
        },
        onError: (error) => handleAxiosError(error, "No se pudo guardar la plantilla"),
      },
    );

  const handleSaveBrand = () =>
    saveBrand.mutate(brand, {
      onSuccess: ({ brand: saved }) => {
        setBrand(structuredClone(saved));
        toast.success("Marca guardada");
      },
      onError: (error) => handleAxiosError(error, "No se pudo guardar la marca"),
    });

  const handleSendTest = () =>
    sendTest.mutate(
      { template: draft, ...(isBrandDirty ? { brand } : {}) },
      {
        onSuccess: ({ to }) => toast.success(`Correo de prueba enviado a ${to}. Revisa también la carpeta de spam.`),
        onError: (error) => handleAxiosError(error, "No se pudo enviar el correo de prueba"),
      },
    );

  const testButton = (
    <PendingButton
      variant="outline"
      onPress={handleSendTest}
      isPending={sendTest.isPending}
      pendingLabel="Enviando"
      isDisabled={!data.sender.configured || missingProducts > 0 || !draft.content.subject.trim()}
    >
      <Send className="size-4" />
      Enviarme una prueba
    </PendingButton>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Megaphone}
        title="Marketing"
        description="Crea correos con el estilo de tu marca para promocionar tus productos"
      />

      {!data.sender.configured && (
        <Card>
          <Card.Content className="flex items-start gap-3 p-4 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
            <p>El envío de correos aún no está configurado en el servidor. Puedes diseñar tus plantillas y verlas, pero no enviarlas.</p>
          </Card.Content>
        </Card>
      )}

      <ToggleButtonGroup
        aria-label="Sección"
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={new Set([tab])}
        onSelectionChange={(keys) => {
          const [next] = Array.from(keys, String);
          if (next) setTab(next as Tab);
        }}
      >
        <ToggleButton id="templates">
          <LayoutTemplate className="size-4" />
          Plantillas
        </ToggleButton>
        <ToggleButton id="brand">
          <Palette className="size-4" />
          Marca
          {!data.brandSaved && (
            <Chip size="sm" variant="soft" color="warning">
              Configúrala
            </Chip>
          )}
        </ToggleButton>
      </ToggleButtonGroup>

      {tab === "templates" && (
        <div className="grid gap-3 sm:grid-cols-3">
          {data.templates.map((template) => {
            const slotDraft = drafts[template.slot] ?? toDraft(template);
            const isDirty = !template.saved || !same(toDraft(template), slotDraft);
            const isActive = template.slot === slot;
            return (
              <button
                key={template.slot}
                type="button"
                aria-pressed={isActive}
                onClick={() => setSlot(template.slot)}
                className={cn(
                  "rounded-xl border bg-surface p-4 text-left transition-colors hover:bg-surface-secondary",
                  isActive ? "border-accent ring-1 ring-accent" : "border-border",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted">Plantilla {template.slot}</span>
                  {!template.saved ? (
                    <Chip size="sm" variant="soft">Ejemplo</Chip>
                  ) : isDirty ? (
                    <Chip size="sm" variant="soft" color="warning">Sin guardar</Chip>
                  ) : (
                    <Chip size="sm" variant="soft" color="success">Guardada</Chip>
                  )}
                </span>
                <span className="mt-1 block truncate font-semibold">{slotDraft.name || "Sin nombre"}</span>
                <span className="block text-xs text-muted">{data.layouts[slotDraft.layout].label}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          {tab === "templates" ? (
            <TemplateEditor
              draft={draft}
              onChange={(next) => setDrafts((current) => ({ ...current, [slot]: next }))}
              layouts={data.layouts}
              brand={data.brand}
              products={productCache}
              onProductsLoaded={(products) =>
                setProductCache((current) => {
                  const next = new Map(current);
                  for (const product of products) next.set(product.id, product);
                  return next;
                })
              }
            />
          ) : (
            <BrandForm brand={brand} onChange={setBrand} senderEmail={data.sender.email} />
          )}

          <Card>
            <Card.Content className="flex flex-wrap items-center gap-3 p-4">
              {tab === "templates" ? (
                <>
                  <PendingButton
                    variant="primary"
                    onPress={handleSaveTemplate}
                    isPending={saveTemplate.isPending}
                    pendingLabel="Guardando"
                    isDisabled={!isTemplateDirty || missingProducts > 0}
                  >
                    Guardar plantilla
                  </PendingButton>
                  {testButton}
                  {isTemplateDirty && savedTemplate?.saved && (
                    <Button variant="ghost" onPress={() => setDrafts((current) => ({ ...current, [slot]: toDraft(savedTemplate) }))}>
                      Descartar cambios
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <PendingButton
                    variant="primary"
                    onPress={handleSaveBrand}
                    isPending={saveBrand.isPending}
                    pendingLabel="Guardando"
                    isDisabled={(!isBrandDirty && data.brandSaved) || !brand.sender_name.trim()}
                  >
                    Guardar marca
                  </PendingButton>
                  {testButton}
                </>
              )}
              <p className="w-full text-xs text-muted">
                {missingProducts > 0
                  ? `Elige ${missingProducts} ${missingProducts === 1 ? "producto más" : "productos más"} para poder guardar y enviar la prueba.`
                  : `La prueba llega a tu correo (${userEmail ?? "tu usuario"}) con el asunto marcado como [Prueba].`}
              </p>
            </Card.Content>
          </Card>
        </div>

        <div className="xl:sticky xl:top-6 xl:self-start">
          <EmailPreview request={previewRequest} senderName={(tab === "brand" ? brand : data.brand).sender_name} />
          {tab === "brand" && (
            <p className="mt-2 text-xs text-muted">Vista previa con la plantilla {slot} y tu marca sin guardar.</p>
          )}
        </div>
      </div>
    </div>
  );
}
