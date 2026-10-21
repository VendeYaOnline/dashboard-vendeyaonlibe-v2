"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Check, Compass, Lock, Megaphone, Send, Store } from "lucide-react";
import { Button, Card, Input, Label, Spinner, TextField, ToggleButton, ToggleButtonGroup, cn, toast } from "@heroui/react";
import { PageHeader } from "@/components/layout/page-header";
import { FeaturePlanButton } from "@/components/layout/feature-billing-dialogs";
import { PendingButton } from "@/components/shared/pending-button";
import { useQueryMarketing } from "@/app/api/queries";
import {
  useMutationSaveMarketingBrand,
  useMutationSaveMarketingTemplate,
  useMutationSendMarketingTest,
} from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import type { MarketingBrand, MarketingProduct, MarketingTemplate, MarketingTemplateDraft } from "@/interfaces/marketing";
import { BrandForm, isValidStoreUrl } from "./components/brand-form";
import { BillingNotice } from "./components/billing-notice";
import { useMarketingTour } from "./marketing-tour";
import { CampaignsPanel } from "./components/campaigns-panel";
import { MetaFeedPanel } from "@/features/catalogo-meta/meta-feed-panel";
import { EmailPreview } from "./components/email-preview";
import { TemplateEditor } from "./components/template-editor";
import { LIMITS } from "./constants";

type Step = "brand" | "design" | "send";

/** Las dos partes de Marketing: campañas (los 3 pasos) y el catálogo de Meta. */
type Section = "campaigns" | "meta";

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
 * plantillas guardadas) y el envío a los clientes. Aparte, en la misma vista
 * (es parte de Marketing, no se paga por separado), el catálogo de Meta.
 */
export function MarketingView() {
  const { data, isLoading, isError } = useQueryMarketing();
  const [section, setSection] = useState<Section>("campaigns");
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

  // Guía interactiva de cada paso: sola la primera vez, y con «Ver guía».
  const tour = useMarketingTour(section === "campaigns" ? step : null, Boolean(data && draft && brand));
  const brandIncomplete = !brand
    ? null
    : !brand.sender_name.trim()
      ? "escribe el nombre de tu marca."
      : !brand.store_url.trim()
        ? "escribe el enlace de tu tienda."
        : !isValidStoreUrl(brand.store_url)
          ? "revisa el enlace de tu tienda (debe empezar por https://)."
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

  // La marca es obligatoria y se guarda aparte: mientras no esté guardada (o tenga cambios sin
  // guardar) no se puede pasar al diseño ni al envío. Así la vista previa y los correos
  // siempre usan la misma marca guardada.
  const brandPending = !data.brandSaved || isBrandDirty;
  const isStepLocked = (id: Step) => id !== "brand" && brandPending;

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
        onSuccess: ({ to, test }) =>
          toast.success(
            `Correo de prueba enviado a ${to} (${test.used} de ${test.limit}). Revisa también la carpeta de spam.`,
          ),
        onError: (error) => handleAxiosError(error, "No se pudo enviar el correo de prueba"),
      },
    );

  const canSend = Boolean(savedTemplate?.saved && !isTemplateDirty);
  const testsLeft = Math.max(0, data.test.limit - data.test.used);
  /** Por qué no se puede enviar una prueba (null = se puede). */
  const testBlocker = !data.test.email
    ? "Aún no hay un correo de prueba configurado para tu tienda. Pídeselo al equipo de VendeYaOnline."
    : testsLeft === 0
      ? `Ya usaste tus ${data.test.limit} correos de prueba. Pide más al equipo de VendeYaOnline.`
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Megaphone}
        title="Marketing"
        description={
          section === "campaigns"
            ? "Envía promociones a tus clientes por correo o WhatsApp con el estilo de tu marca"
            : "Tus productos en Facebook e Instagram, siempre al día, sin descargar ni subir archivos"
        }
        actions={
          <>
            <ToggleButtonGroup
              aria-label="Sección de Marketing"
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={new Set([section])}
              onSelectionChange={(keys) => {
                const [next] = Array.from(keys, String);
                if (next) setSection(next as Section);
              }}
            >
              <ToggleButton id="campaigns">
                <Send className="size-4" /> Campañas
              </ToggleButton>
              <ToggleButton id="meta">
                <Store className="size-4" /> Catálogo de Meta
              </ToggleButton>
            </ToggleButtonGroup>
            <FeaturePlanButton feature="marketing" />
          </>
        }
      />

      <BillingNotice notice={data.billing_notice} />

      {section === "meta" ? (
        <MetaFeedPanel />
      ) : (
        <>
          {data.sender.testRedirect && (
            <Card>
              <Card.Content className="flex items-start gap-3 p-4 text-sm">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                <p>
                  Servidor local: las campañas de correo llegan solo a <strong>{data.sender.testRedirect}</strong>, nunca a tus
                  clientes.
                </p>
              </Card.Content>
            </Card>
          )}
          {data.pause && (
            <Card>
              <Card.Content className="flex items-start gap-3 p-4 text-sm">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" />
                <div className="space-y-1">
                  <p className="font-semibold">Tus campañas de correo están pausadas</p>
                  <p className="text-muted">
                    En tus últimos {data.pause.sends} correos,{" "}
                    {data.pause.reason === "bounces"
                      ? `el ${(data.pause.bounce_rate * 100).toLocaleString("es-CO", { maximumFractionDigits: 1 })} % rebotó (direcciones que no existen)`
                      : `el ${(data.pause.complaint_rate * 100).toLocaleString("es-CO", { maximumFractionDigits: 1 })} % se marcó como spam`}
                    . Lo pausamos para proteger la entrega de tus correos. WhatsApp sigue funcionando. Revisa tu lista de clientes
                    (correos mal escritos o que ya no se usan) y escríbenos para reactivarlo.
                  </p>
                </div>
              </Card.Content>
            </Card>
          )}
          {!data.sender.configured && (
            <p className="flex items-start gap-2 text-sm text-muted">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
              El envío de correos aún no está configurado en el servidor. Puedes diseñar y ver tus correos, pero no enviarlos.
            </p>
          )}

          {/* Los 3 pasos */}
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onPress={tour.start}>
              <Compass className="size-4" />
              Ver guía de este paso
            </Button>
          </div>
          <nav aria-label="Pasos" data-tour="steps" className="-mt-4 grid gap-2 sm:grid-cols-3">
            {STEPS.map((item, index) => {
              const isActive = step === item.id;
              const isDone = stepDone[item.id];
              const isLocked = isStepLocked(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={isActive ? "step" : undefined}
                  disabled={isLocked}
                  title={isLocked ? "Guarda tu marca para continuar" : undefined}
                  onClick={() => setStep(item.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                    isActive ? "border-accent bg-accent-soft ring-1 ring-accent" : "border-border bg-surface hover:bg-surface-secondary",
                    isLocked && "cursor-not-allowed opacity-60 hover:bg-surface",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                      isActive ? "bg-accent text-accent-foreground" : isDone ? "bg-success text-white" : "bg-surface-secondary text-muted",
                    )}
                  >
                    {isDone && !isActive ? <Check className="size-4" aria-label="Listo" /> : isLocked ? <Lock className="size-3.5" aria-label="Bloqueado" /> : index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold">{item.title}</span>
                    <span className="block truncate text-xs text-muted">{isLocked ? "Primero guarda tu marca" : item.hint}</span>
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
                  <Card data-tour="templates">
                    <Card.Content className="space-y-4 p-4">
                      <TextField
                        value={draft.name}
                        onChange={(name) => setDrafts((current) => ({ ...current, [slot]: { ...draft, name: name.slice(0, LIMITS.name) } }))}
                        isRequired
                      >
                        <Label>Nombre de esta plantilla</Label>
                        <Input maxLength={LIMITS.name} placeholder="Ej: Descuento camisetas" />
                      </TextField>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold">Tipos de plantillas</p>
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
                <Card data-tour="actions">
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
                          isDisabled={!data.sender.configured || Boolean(incomplete) || Boolean(testBlocker)}
                        >
                          <Send className="size-4" />
                          Enviar prueba{data.test.email ? ` (${testsLeft} de ${data.test.limit})` : ""}
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
                          isDisabled={(!isBrandDirty && data.brandSaved) || Boolean(brandIncomplete)}
                        >
                          Guardar marca
                        </PendingButton>
                        <Button variant="ghost" isDisabled={brandPending} onPress={() => setStep("design")}>
                          Siguiente: diseña tu correo
                          <ArrowRight className="size-4" />
                        </Button>
                        {isBrandDirty && data.brandSaved && (
                          <Button variant="ghost" onPress={() => setBrand(structuredClone(data.brand))}>
                            Descartar cambios
                          </Button>
                        )}
                      </>
                    )}
                    <p className="w-full text-xs text-muted">
                      {step === "brand"
                        ? brandIncomplete
                          ? `Para guardar: ${brandIncomplete}`
                          : brandPending
                            ? "Guarda la marca para poder pasar al diseño de tu correo y al envío."
                            : "Se usa en todos tus correos. La vista previa muestra tu marca con la plantilla elegida."
                        : incomplete
                          ? `Para guardar: ${incomplete}`
                          : testBlocker
                            ? testBlocker
                            : `La prueba llega a ${data.test.email} con el asunto marcado como [Prueba]. Te quedan ${testsLeft} de ${data.test.limit}; no cuentan en tus límites de envío.${canSend ? "" : " Guarda la plantilla para poder enviarla a tus clientes."}`}
                    </p>
                  </Card.Content>
                </Card>
              </div>

              <div className="xl:self-start" data-tour="preview">
                <EmailPreview request={previewRequest} senderName={(step === "brand" ? brand : data.brand).sender_name} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
