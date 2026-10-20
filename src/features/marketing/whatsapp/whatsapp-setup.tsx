"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, BookOpen, CheckCircle2, ChevronDown, Eye, EyeOff, PlugZap, XCircle } from "lucide-react";
import { Button, Input, InputGroup, Label, Spinner, Switch, TextField, cn, toast } from "@heroui/react";
import { PendingButton } from "@/components/shared/pending-button";
import { FormSection } from "@/features/productos/components/form-section";
import { handleAxiosError } from "@/lib/error-handler";
import type { WhatsappSettings, WhatsappSettingsPayload } from "@/interfaces/platform";

/**
 * WhatsApp Cloud API: estado, guía paso a paso y formulario. Lo usan el
 * superadmin (Plataforma) y el admin de la tienda (Marketing); cada uno pasa
 * sus propias llamadas. El token nunca vuelve del servidor.
 */

const PHONE_ID_PATTERN = /^\d{6,25}$/;
const TEMPLATE_PATTERN = /^[a-z0-9_]{1,512}$/;
const LANGUAGE_PATTERN = /^[a-z]{2,3}(_[A-Z]{2})?$/;

/** Cuerpo sugerido para la plantilla de Meta (las 3 variables que llena VendeYaOnline). */
export const WHATSAPP_TEMPLATE_BODY = "¡Hola {{1}}! 👋\n\n{{2}}\n\nMíralo aquí: {{3}}\n\nSi no quieres recibir más promociones, responde BAJA.";

type Tone = "success" | "warning" | "muted";

/** Estado en palabras: lo ven igual el superadmin y la tienda. */
export function whatsappStatus(settings: WhatsappSettings): { tone: Tone; title: string; detail: string } {
  const account = [settings.verified_name, settings.display_phone].filter(Boolean).join(" · ");
  if (settings.ready && settings.verified) {
    return {
      tone: "success",
      title: "WhatsApp Business configurado correctamente",
      detail: `${account ? `${account}. ` : ""}Las campañas de WhatsApp se envían automáticamente, sin abrir la app.`,
    };
  }
  if (settings.ready) {
    return {
      tone: "warning",
      title: "Guardado, falta verificar la conexión",
      detail: "Pulsa «Probar conexión» para confirmar con Meta que el token y el número funcionan.",
    };
  }
  if (settings.verified && !settings.enabled) {
    return {
      tone: "muted",
      title: "Verificado, pero desactivado",
      detail: "Actívalo para enviar campañas por WhatsApp: salen solas, con tus productos en carrusel.",
    };
  }
  return {
    tone: "muted",
    title: "Sin configurar",
    detail: "Sin WhatsApp Business conectado no se pueden enviar campañas por WhatsApp. El correo sigue disponible.",
  };
}

export function WhatsappStatusBanner({ settings, className }: { settings: WhatsappSettings; className?: string }) {
  const status = whatsappStatus(settings);
  const Icon = status.tone === "success" ? CheckCircle2 : status.tone === "warning" ? AlertTriangle : XCircle;
  return (
    <div
      role="status"
      className={cn(
        "flex gap-3 rounded-xl border px-4 py-3",
        status.tone === "success" && "border-success/30 bg-success/10",
        status.tone === "warning" && "border-warning/30 bg-warning/10",
        status.tone === "muted" && "border-border bg-surface-secondary",
        className,
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 size-5 shrink-0",
          status.tone === "success" ? "text-success" : status.tone === "warning" ? "text-warning" : "text-muted",
        )}
      />
      <div className="min-w-0 text-sm">
        <p className="font-semibold">{status.title}</p>
        <p className="text-muted">{status.detail}</p>
      </div>
    </div>
  );
}

function GuideStep({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
        {number}
      </span>
      <div className="min-w-0 flex-1 space-y-1 text-sm">
        <p className="font-medium">{title}</p>
        <div className="space-y-1 text-muted">{children}</div>
      </div>
    </li>
  );
}

/** Pasos en Meta para obtener lo que pide el formulario. */
export function WhatsappGuide({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold"
      >
        <BookOpen className="size-4 text-accent" />
        Guía paso a paso para conectar WhatsApp Business
        <ChevronDown className={cn("ml-auto size-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ol className="space-y-4 border-t border-border px-4 py-4">
          <GuideStep number={1} title="Antes de empezar">
            <p>
              Necesitas una cuenta de Facebook, un portafolio comercial en <strong>business.facebook.com</strong> y un número
              de celular que reciba SMS o llamadas.
            </p>
            <p className="text-warning">
              Ese número no puede estar en uso en la app de WhatsApp o WhatsApp Business. Si lo está, primero elimina la
              cuenta desde la app (Configuración → Cuenta → Eliminar cuenta) o usa un número nuevo.
            </p>
          </GuideStep>
          <GuideStep number={2} title="Crea la app en Meta">
            <p>
              Entra a <strong>developers.facebook.com</strong> → <em>Mis apps</em> → <em>Crear app</em>. Elige el caso de uso
              «Conectar con clientes a través de WhatsApp» (o tipo «Negocio») y vincúlala a tu portafolio comercial.
            </p>
          </GuideStep>
          <GuideStep number={3} title="Agrega tu número y copia el «Phone number ID»">
            <p>
              En la app: <em>WhatsApp → Configuración de la API</em> → <em>Agregar número de teléfono</em>. Escribe el nombre
              que verán tus clientes, la categoría, y verifica el número con el código por SMS o llamada.
            </p>
            <p>
              Luego, en esa misma pantalla, elige tu número y copia el <strong>Identificador del número de teléfono</strong>{" "}
              (Phone number ID): son solo dígitos. <em>No es</em> tu número de celular.
            </p>
          </GuideStep>
          <GuideStep number={4} title="Agrega un método de pago">
            <p>
              En <strong>business.facebook.com/wa/manage</strong> (Administrador de WhatsApp) → <em>Configuración</em> →{" "}
              <em>Pagos</em>, agrega una tarjeta. Meta cobra cada mensaje de marketing directamente a tu cuenta; sin método
              de pago los mensajes no salen.
            </p>
          </GuideStep>
          <GuideStep number={5} title="Genera un token permanente">
            <p>
              En <strong>business.facebook.com</strong> → <em>Configuración</em> → <em>Usuarios → Usuarios del sistema</em> →{" "}
              <em>Agregar</em> (rol Administrador). Con ese usuario: <em>Asignar activos</em> → tu app y tu cuenta de WhatsApp
              con control total.
            </p>
            <p>
              Después <em>Generar token</em>: elige tu app, vencimiento <strong>Nunca</strong> y los permisos{" "}
              <code>whatsapp_business_messaging</code> y <code>whatsapp_business_management</code>. Copia el token (empieza
              por <code>EAA</code>); Meta no lo vuelve a mostrar.
            </p>
            <p>El token temporal de 24 horas de «Configuración de la API» no sirve: deja de funcionar al día siguiente.</p>
          </GuideStep>
          <GuideStep number={6} title="Crea la plantilla de mensaje y espera la aprobación">
            <p>
              En el Administrador de WhatsApp → <em>Plantillas de mensajes</em> → <em>Crear plantilla</em>: categoría{" "}
              <strong>Marketing</strong>, un nombre en minúsculas con guion bajo (ej. <code>promo_tienda</code>) e idioma
              Español. En el cuerpo pega exactamente 3 variables:
            </p>
            <pre className="whitespace-pre-wrap rounded-lg bg-surface-secondary p-3 font-sans text-xs text-foreground">
              {WHATSAPP_TEMPLATE_BODY}
            </pre>
            <p>
              {"{{1}}"} = nombre del cliente, {"{{2}}"} = texto de tu campaña, {"{{3}}"} = enlace. Meta pide ejemplos de cada
              variable (ej. «Ana», «Nueva colección con 20 % de descuento», «https://tutienda.com»). La revisión tarda de
              minutos a 24 horas; solo se puede usar cuando diga <strong>Aprobada</strong>.
            </p>
          </GuideStep>
          <GuideStep number={7} title="Opcional: plantilla de carrusel con tus productos">
            <p>
              Para que tus clientes reciban tarjetas con la foto, el nombre, el precio y un botón «Comprar» de cada producto,
              crea otra plantilla: categoría <strong>Marketing</strong>, tipo <strong>Carrusel</strong>, con el mismo idioma.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Cuerpo del mensaje:</strong> <code>{CAROUSEL_TEMPLATE_BODY}</code> ({"{{1}}"} = nombre del cliente,{" "}
                {"{{2}}"} = texto de tu campaña).
              </li>
              <li>
                <strong>Cada tarjeta:</strong> encabezado de <em>imagen</em>; cuerpo <code>{CAROUSEL_CARD_BODY}</code> ({"{{1}}"}{" "}
                = producto, {"{{2}}"} = precio); un botón de <em>sitio web</em> con URL dinámica{" "}
                <code>https://tutienda.com/{"{{1}}"}</code>, con la dirección de tu tienda.
              </li>
              <li>
                Elige cuántas tarjetas tiene (de 2 a 6) y escribe el mismo número aquí. Si una campaña tiene menos productos
                que tarjetas, se envía la plantilla de texto.
              </li>
            </ul>
          </GuideStep>
          <GuideStep number={8} title="Pega los datos aquí y guarda">
            <p>
              Token, Phone number ID, nombre exacto de la plantilla y su idioma (<code>es</code> para Español). Al guardar
              se verifica la conexión con Meta: cuando todo está bien verás <strong>«WhatsApp Business configurado
              correctamente»</strong>.
            </p>
          </GuideStep>
        </ol>
      )}
    </div>
  );
}

interface WhatsappSetupProps {
  settings: WhatsappSettings | undefined;
  isLoading: boolean;
  /** false = solo ver el estado (p. ej. un editor de la tienda). */
  canEdit: boolean;
  onSave: (data: WhatsappSettingsPayload) => Promise<{ settings: WhatsappSettings }>;
  onTest: () => Promise<{ display_phone: string | null; verified_name: string | null }>;
  isSaving: boolean;
  isTesting: boolean;
  /** Abrir la guía de entrada (la tienda la necesita; el superadmin no tanto). */
  guideOpen?: boolean;
}

export const CAROUSEL_TEMPLATE_BODY = "¡Hola {{1}}! {{2}} Si no quieres recibir más promociones, responde BAJA.";
const CAROUSEL_CARD_BODY = "{{1}} {{2}}";
const CAROUSEL_CARD_OPTIONS = [2, 3, 4, 5, 6];

export function WhatsappSetup({ settings, isLoading, canEdit, onSave, onTest, isSaving, isTesting, guideOpen }: WhatsappSetupProps) {
  const [enabled, setEnabled] = useState(false);
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [language, setLanguage] = useState("es");
  const [carouselName, setCarouselName] = useState("");
  const [carouselCards, setCarouselCards] = useState(3);

  useEffect(() => {
    if (!settings) return;
    // Una tienda sin configurar empieza con el interruptor encendido: viene a activarlo.
    setEnabled(settings.enabled || (!settings.has_token && !settings.phone_number_id));
    setToken("");
    setShowToken(false);
    setPhoneNumberId(settings.phone_number_id);
    setTemplateName(settings.template_name);
    setLanguage(settings.template_language || "es");
    setCarouselName(settings.carousel_template_name ?? "");
    setCarouselCards(settings.carousel_cards ?? 3);
  }, [settings]);

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center gap-3 py-12 text-sm text-muted">
        <Spinner size="sm" />
        Cargando configuración...
      </div>
    );
  }

  const tokenTrimmed = token.trim();
  const isTokenValid = tokenTrimmed === "" || (tokenTrimmed.length >= 20 && !/\s/.test(tokenTrimmed));
  const hasToken = settings.has_token || tokenTrimmed !== "";
  const isPhoneValid = phoneNumberId === "" || PHONE_ID_PATTERN.test(phoneNumberId);
  const isTemplateValid = templateName === "" || TEMPLATE_PATTERN.test(templateName);
  const isLanguageValid = LANGUAGE_PATTERN.test(language);
  const isCarouselValid = carouselName === "" || TEMPLATE_PATTERN.test(carouselName);
  const missingForEnable = enabled && (!hasToken || !phoneNumberId || !templateName);
  const isValid = isTokenValid && isPhoneValid && isTemplateValid && isLanguageValid && isCarouselValid && !missingForEnable;
  const isDirty =
    tokenTrimmed !== "" ||
    enabled !== settings.enabled ||
    phoneNumberId !== settings.phone_number_id ||
    templateName !== settings.template_name ||
    language !== (settings.template_language || "es") ||
    carouselName !== (settings.carousel_template_name ?? "") ||
    carouselCards !== (settings.carousel_cards ?? 3);

  const runTest = async () => {
    try {
      const result = await onTest();
      toast.success(
        `Conexión verificada${result.verified_name ? `: ${result.verified_name}` : ""}${result.display_phone ? ` (${result.display_phone})` : ""}`,
      );
    } catch (error) {
      handleAxiosError(error, "Meta no aceptó la conexión. Revisa el token y el Phone number ID");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValid || !isDirty) return;
    try {
      const { settings: saved } = await onSave({
        enabled,
        phone_number_id: phoneNumberId,
        template_name: templateName,
        template_language: language,
        carousel_template_name: carouselName,
        carousel_cards: carouselCards,
        // Vacío = conservar el token guardado.
        ...(tokenTrimmed ? { access_token: tokenTrimmed } : {}),
      });
      setToken("");
      // Si ya hay token y número, se verifica de una vez con Meta.
      if (saved.has_token && saved.phone_number_id && !saved.verified) {
        toast.success("Configuración guardada. Verificando con Meta…");
        await runTest();
      } else {
        toast.success(saved.enabled ? "Configuración guardada" : "Guardado: WhatsApp quedó desactivado para las campañas");
      }
    } catch (error) {
      handleAxiosError(error, "No se pudo guardar la configuración de WhatsApp");
    }
  };

  const removeToken = async () => {
    try {
      await onSave({ enabled: false, access_token: null });
      toast.success("Token eliminado: WhatsApp quedó desactivado para las campañas");
    } catch (error) {
      handleAxiosError(error, "No se pudo eliminar el token");
    }
  };

  return (
    <div className="space-y-5">
      <WhatsappStatusBanner settings={settings} />

      {!settings.can_store_secrets && (
        <p className="flex gap-2 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          El servidor no tiene SECRETS_KEY configurada: no se pueden guardar tokens. Avisa al equipo de VendeYaOnline.
        </p>
      )}

      {canEdit && <WhatsappGuide defaultOpen={guideOpen && !settings.verified} />}

      {canEdit ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormSection title="Cuenta de Meta" description="Pasos 3 y 5 de la guía. El token se guarda cifrado y nadie puede volver a verlo.">
            <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2">
              <Label>Enviar campañas automáticamente</Label>
              <Switch isSelected={enabled} onChange={setEnabled}>
                <Switch.Content>
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                  <Label className="text-xs text-muted">{enabled ? "Activo" : "Desactivado"}</Label>
                </Switch.Content>
              </Switch>
            </div>
            <TextField value={token} onChange={setToken} type={showToken ? "text" : "password"} isInvalid={!isTokenValid}>
              <Label>Token de acceso permanente</Label>
              <InputGroup className="w-full min-w-0">
                <InputGroup.Input
                  className="min-w-0"
                  autoComplete="off"
                  placeholder={settings.has_token ? `Guardado ${settings.token_hint ?? ""} · vacío = conservarlo` : "EAA..."}
                />
                <InputGroup.Suffix>
                  <button
                    type="button"
                    onClick={() => setShowToken((visible) => !visible)}
                    aria-label={showToken ? "Ocultar token" : "Mostrar token"}
                    className="text-muted transition-colors hover:text-foreground"
                  >
                    {showToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </InputGroup.Suffix>
              </InputGroup>
              {!isTokenValid && <p className="mt-1 text-xs text-danger">El token no parece válido (sin espacios, completo).</p>}
            </TextField>
            <TextField
              value={phoneNumberId}
              onChange={(value) => setPhoneNumberId(value.replace(/\D/g, "").slice(0, 25))}
              isInvalid={!isPhoneValid}
            >
              <Label>Phone number ID (identificador del número)</Label>
              <Input inputMode="numeric" placeholder="Ej: 109876543210987" className="font-mono text-sm" />
              <p className="mt-1 text-xs text-muted">Solo dígitos. No es tu número de celular.</p>
            </TextField>
          </FormSection>

          <FormSection title="Plantilla aprobada" description="Paso 6 de la guía: debe estar «Aprobada» en Meta y tener las 3 variables.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <TextField
                value={templateName}
                onChange={(value) => setTemplateName(value.trim().slice(0, 512))}
                isInvalid={!isTemplateValid}
                className="sm:col-span-2"
              >
                <Label>Nombre de la plantilla</Label>
                <Input placeholder="promo_tienda" className="font-mono text-sm" />
                {!isTemplateValid && <p className="mt-1 text-xs text-danger">Solo minúsculas, números y guion bajo, igual que en Meta.</p>}
              </TextField>
              <TextField value={language} onChange={(value) => setLanguage(value.trim().slice(0, 6))} isInvalid={!isLanguageValid}>
                <Label>Idioma</Label>
                <Input placeholder="es" className="font-mono text-sm" />
              </TextField>
            </div>
          </FormSection>

          <FormSection
            title="Carrusel de productos (opcional)"
            description="Paso 7 de la guía. Con 2 o más productos en la campaña, cada cliente recibe tarjetas con foto, precio y botón «Comprar»."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <TextField
                value={carouselName}
                onChange={(value) => setCarouselName(value.trim().slice(0, 512))}
                isInvalid={!isCarouselValid}
                className="sm:col-span-2"
              >
                <Label>Nombre de la plantilla de carrusel</Label>
                <Input placeholder="carrusel_tienda (vacío = sin carrusel)" className="font-mono text-sm" />
                {!isCarouselValid && <p className="mt-1 text-xs text-danger">Solo minúsculas, números y guion bajo, igual que en Meta.</p>}
              </TextField>
              <div className="space-y-1.5">
                <Label>Tarjetas</Label>
                <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Tarjetas del carrusel">
                  {CAROUSEL_CARD_OPTIONS.map((count) => (
                    <button
                      key={count}
                      type="button"
                      role="radio"
                      aria-checked={carouselCards === count}
                      onClick={() => setCarouselCards(count)}
                      className={cn(
                        "size-9 rounded-lg border text-sm font-medium transition-colors",
                        carouselCards === count ? "border-accent bg-accent-soft text-accent" : "border-border hover:bg-surface-secondary",
                      )}
                    >
                      {count}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted">Las mismas que tiene la plantilla en Meta.</p>
              </div>
            </div>
          </FormSection>

          {/* Solo cuando ya empezó a llenar (sin configurar, el interruptor viene encendido). */}
          {missingForEnable && (hasToken || phoneNumberId || templateName) && (
            <p className="text-xs text-danger">Para activarlo faltan el token, el Phone number ID o el nombre de la plantilla.</p>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <PendingButton
              variant="primary"
              type="submit"
              isDisabled={!isValid || !isDirty || !settings.can_store_secrets}
              isPending={isSaving || isTesting}
              pendingLabel={isTesting ? "Verificando" : "Guardando"}
            >
              Guardar y verificar
            </PendingButton>
            <Button
              variant="outline"
              isDisabled={!settings.has_token || !settings.phone_number_id || isDirty || isTesting}
              onPress={runTest}
            >
              {isTesting ? <Spinner size="sm" /> : <PlugZap className="size-4" />}
              Probar conexión
            </Button>
            {settings.has_token && (
              <Button variant="ghost" className="text-danger" isDisabled={isSaving} onPress={removeToken}>
                Quitar token
              </Button>
            )}
            <p className="w-full text-xs text-muted">
              La prueba consulta tu número en Meta sin enviar mensajes. Si la plantilla no está aprobada, el error aparecerá
              en el historial de la primera campaña.
            </p>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted">Solo el administrador de la tienda puede cambiar esta configuración.</p>
      )}
    </div>
  );
}
