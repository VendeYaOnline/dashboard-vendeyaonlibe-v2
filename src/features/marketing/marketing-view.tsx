"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Check, Megaphone, Send } from "lucide-react";
import { Button, Card, Input, Label, Spinner, TextField, cn, toast } from "@heroui/react";
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
import { CampaignsPanel } from "./components/campaigns-panel";
import { EmailPreview } from "./components/email-preview";
import { TemplateEditor } from "./components/template-editor";
import { LIMITS } from "./constants";

type Step = "brand" | "design" | "send";

const STEPS: { id: Step; title: string; hint: string }[] = [
  { id: "brand", title: "Tu marca", hint: "Nombre, logo y enlace de tu tienda" },
  { id: "design", title: "Diseña tu correo", hint: "Productos o un póster" },
  { id: "send", title: "Envía", hint: "Por correo o WhatsApp" },
];

const toDraft = ({ name, layout, content }: MarketingTemplate): MarketingTemplateDraft => ({
  name,
  layout,
  content: structuredClone(content),
});

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Marketing en 3 pasos: la marca (una vez), el diseño del correo (hasta 3
 * plantillas guardadas) y el envío a los clientes.
 */
export function MarketingView() {
  const { data, isLoading, isError } = useQueryMarketing();
  const userEmail = useAuthStore((s) => s.user?.email);
  const [step, setStep] = useState<Step | null>(null);
  const [slot, setSlot] = useState(1);
  const [drafts, setDrafts] = useState<Record<number, MarketingTemplateDraft>>({});
  const [brand, setBrand] = useState<MarketingBrand | null>(null);
  const [productCache, setProductCache] = useState<Map<string, MarketingProduct>>(new Map());

  const saveTemplate = useMutationSaveMarketingTemplate();
  const saveBrand = useMutationSaveMarketingBrand();
  const sendTest = useMutationSendMarketingTest();

  // Los borradores se crean una sola vez por plantilla: al refrescar los datos
  // no se pierden los cambios sin guardar de las demás.
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
    // Primera vez: si falta la marca, se empieza por ahí.
    setStep((current) => current ?? (data.brandSaved ? "design" : "brand"));
  }, [data]);

  const savedTemplate = data?.templates.find((template) => template.slot === slot);
  const draft = drafts[slot];
  const isTemplateDirty = Boolean(savedTemplate && draft && (!savedTemplate.saved || !same(toDraft(savedTemplate), draft)));
  const isBrandDirty = Boolean(data && brand && !same(data.brand, brand));

  const minProducts = data && draft ? data.layouts[draft.layout].minProducts : 0;
  const missingProducts = draft ? Math.max(0, minProducts - draft.content.product_ids.filter((id) => productCache.has(id)).length) : 0;
  const missingImage = draft?.layout === "poster" && !draft.content.image_url;
  /** Qué falta para poder guardar y probar la plantilla (null = nada). */
  const incomplete = !draft
    ? null
    : missingImage
      ? "elige la imagen del póster."
      : missingProducts > 0
        ? "elige al menos un producto."
        : !draft.content.subject.trim()
          ? "escribe el asunto del correo."
          : !draft.name.trim()
            ? "ponle un nombre a la plantilla."
            : null;

  const previewRequest = useMemo(
    () => (draft ? { template: draft, ...(step === "brand" && brand ? { brand } : {}) } : null),
    [draft, step, brand],
  );

  if (isLoading || (data && (!draft || !brand || !step))) {
    return (
      <div className="flex justify-center py-24">
        <Spinner aria-label="Cargando Marketing" />
      </div>
    );
  }
  if (isError || !data || !draft || !brand || !step || !previewRequest) {
    return <p className="py-24 text-center text-sm text-muted">No se pudo cargar Marketing. Recarga la página.</p>;
  }

  const stepDone: Record<Step, boolean> = {
    brand: data.brandSaved,
    design: data.templates.some((template) => template.saved),
    send: false,
  };

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

  const canSend = Boolean(savedTemplate?.saved && !isTemplateDirty);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Megaphone}
        title="Marketing"
        description="Envía promociones a tus clientes por correo o WhatsApp con el estilo de tu marca"
      />

      {data.sender.testRedirect && (
        <Card>
          <Card.Content className="flex items-start gap-3 p-4 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
            <p>
              Modo de prueba: todos los correos (pruebas y campañas) llegan solo a <strong>{data.sender.testRedirect}</strong>,
              nunca a tus clientes.
            </p>
          </Card.Content>
        </Card>
      )}
      {!data.sender.configured && (
        <Card>
          <Card.Content className="flex items-start gap-3 p-4 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
            <p>El envío de correos aún no está configurado en el servidor. Puedes diseñar y ver tus correos, pero no enviarlos.</p>
          </Card.Content>
        </Card>
      )}

      {/* Los 3 pasos */}
      <nav aria-label="Pasos" className="grid gap-2 sm:grid-cols-3">
        {STEPS.map((item, index) => {
          const isActive = step === item.id;
          const isDone = stepDone[item.id];
          return (
            <button
              key={item.id}
              type="button"
              aria-current={isActive ? "step" : undefined}
              onClick={() => setStep(item.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                isActive ? "border-accent bg-accent-soft ring-1 ring-accent" : "border-border bg-surface hover:bg-surface-secondary",
              )}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                  isActive ? "bg-accent text-accent-foreground" : isDone ? "bg-success text-white" : "bg-surface-secondary text-muted",
                )}
              >
                {isDone && !isActive ? <Check className="size-4" aria-label="Listo" /> : index + 1}
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">{item.title}</span>
                <span className="block truncate text-xs text-muted">{item.hint}</span>
              </span>
            </button>
          );
        })}
      </nav>

      {step === "send" ? (
        <CampaignsPanel data={data} initialSlot={canSend ? slot : undefined} onEditTemplates={() => setStep("design")} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            {step === "design" && (
              <Card>
                <Card.Content className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">Tus plantillas</p>
                    <p className="text-xs text-muted">Guarda hasta 3 diseños para reutilizarlos cuando quieras.</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3" role="tablist" aria-label="Plantillas">
                    {data.templates.map((template) => {
                      const slotDraft = drafts[template.slot] ?? toDraft(template);
                      const isDirty = !template.saved || !same(toDraft(template), slotDraft);
                      const isActive = template.slot === slot;
                      return (
                        <button
                          key={template.slot}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          onClick={() => setSlot(template.slot)}
                          className={cn(
                            "rounded-lg border px-3 py-2 text-left transition-colors",
                            isActive ? "border-accent ring-1 ring-accent" : "border-border hover:bg-surface-secondary",
                          )}
                        >
                          <span className="block truncate text-sm font-medium">{slotDraft.name || "Sin nombre"}</span>
                          <span className="flex items-center gap-1.5 text-xs text-muted">
                            <span
                              className={cn("size-1.5 rounded-full", !template.saved ? "bg-muted" : isDirty ? "bg-warning" : "bg-success")}
                              aria-hidden
                            />
                            {!template.saved ? "Ejemplo sin guardar" : isDirty ? "Cambios sin guardar" : "Guardada"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <TextField
                    value={draft.name}
                    onChange={(name) => setDrafts((current) => ({ ...current, [slot]: { ...draft, name: name.slice(0, LIMITS.name) } }))}
                    isRequired
                  >
                    <Label>Nombre de esta plantilla</Label>
                    <Input maxLength={LIMITS.name} placeholder="Ej: Descuento camisetas" />
                  </TextField>
                </Card.Content>
              </Card>
            )}

            {step === "design" ? (
              <TemplateEditor
                key={slot}
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

            {/* Acciones del paso */}
            <Card>
              <Card.Content className="flex flex-wrap items-center gap-3 p-4">
                {step === "design" ? (
                  <>
                    <PendingButton
                      variant="primary"
                      onPress={handleSaveTemplate}
                      isPending={saveTemplate.isPending}
                      pendingLabel="Guardando"
                      isDisabled={!isTemplateDirty || Boolean(incomplete)}
                    >
                      Guardar plantilla
                    </PendingButton>
                    <PendingButton
                      variant="outline"
                      onPress={handleSendTest}
                      isPending={sendTest.isPending}
                      pendingLabel="Enviando"
                      isDisabled={!data.sender.configured || Boolean(incomplete)}
                    >
                      <Send className="size-4" />
                      Enviarme una prueba
                    </PendingButton>
                    <Button variant="ghost" isDisabled={!canSend} onPress={() => setStep("send")}>
                      Enviar a mis clientes
                      <ArrowRight className="size-4" />
                    </Button>
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
                    <Button variant="ghost" isDisabled={!data.brandSaved || isBrandDirty} onPress={() => setStep("design")}>
                      Siguiente: diseña tu correo
                      <ArrowRight className="size-4" />
                    </Button>
                  </>
                )}
                <p className="w-full text-xs text-muted">
                  {step === "brand"
                    ? "Se usa en todos tus correos. La vista previa muestra tu marca con la plantilla elegida."
                    : incomplete
                      ? `Para guardar: ${incomplete}`
                      : !canSend
                        ? "Guarda la plantilla para poder enviarla a tus clientes."
                        : `La prueba llega a ${data.sender.testRedirect ?? userEmail ?? "tu correo"} con el asunto marcado como [Prueba].`}
                </p>
              </Card.Content>
            </Card>
          </div>

          <div className="xl:self-start">
            <EmailPreview request={previewRequest} senderName={(step === "brand" ? brand : data.brand).sender_name} />
          </div>
        </div>
      )}
    </div>
  );
}
