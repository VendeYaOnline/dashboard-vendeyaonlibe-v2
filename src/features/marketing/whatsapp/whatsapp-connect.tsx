"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, CreditCard, ExternalLink, Facebook, Smartphone, Unplug, XCircle } from "lucide-react";
import { Button, Spinner, buttonVariants, cn, toast } from "@heroui/react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PendingButton } from "@/components/shared/pending-button";
import { useQueryWhatsappSignupConfig } from "@/app/api/queries";
import { useMutationCompleteWhatsappSignup, useMutationUpdateMyWhatsapp } from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import type { WhatsappSettings, WhatsappSignupConfig } from "@/interfaces/platform";

/**
 * Conectar WhatsApp Business con el botón de Meta (registro integrado, en
 * modo coexistencia): la tienda elige el número que ya usa en la app de
 * WhatsApp Business y lo sigue usando en su celular; las campañas salen por
 * la API desde ese mismo número. VendeYaOnline crea la plantilla.
 */

interface FacebookSdk {
  init: (options: { appId: string; autoLogAppEvents: boolean; xfbml: boolean; version: string }) => void;
  login: (callback: (response: { authResponse?: { code?: string } | null }) => void, options: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    FB?: FacebookSdk;
    fbAsyncInit?: () => void;
  }
}

const SDK_URL = "https://connect.facebook.net/es_LA/sdk.js";
const WHATSAPP_MANAGER_URL = "https://business.facebook.com/wa/manage/home/";

let sdkPromise: Promise<FacebookSdk> | null = null;

/** Carga el SDK de Meta una sola vez (antes de pulsar el botón, para que no se bloquee la ventana). */
const loadSdk = (config: WhatsappSignupConfig) => {
  if (window.FB) return Promise.resolve(window.FB);
  sdkPromise ??= new Promise<FacebookSdk>((resolve, reject) => {
    window.fbAsyncInit = () => {
      window.FB!.init({ appId: config.app_id!, autoLogAppEvents: true, xfbml: false, version: config.graph_version });
      resolve(window.FB!);
    };
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    script.onerror = () => {
      sdkPromise = null;
      reject(new Error("No se pudo cargar Facebook. Revisa tu conexión o desactiva el bloqueador de anuncios."));
    };
    document.body.appendChild(script);
  });
  return sdkPromise;
};

interface SessionInfo {
  waba_id: string;
  phone_number_id: string;
}

/** Estado de la plantilla en palabras. */
const templateState = (settings: WhatsappSettings) => {
  if (settings.template_status === "APPROVED") {
    return { icon: CheckCircle2, tone: "text-success", title: "Plantilla aprobada", detail: "Ya puedes enviar campañas y recordatorios por WhatsApp." };
  }
  if (settings.template_status === "REJECTED") {
    return {
      icon: XCircle,
      tone: "text-danger",
      title: "Meta rechazó la plantilla",
      detail: `${settings.template_reason ? `Motivo: ${settings.template_reason}. ` : ""}Escríbenos y la ajustamos por ti.`,
    };
  }
  return {
    icon: Clock,
    tone: "text-warning",
    title: "Meta está revisando tu plantilla de promociones",
    detail: "Suele tardar de unos minutos a 24 horas. Cuando la apruebe, las campañas por WhatsApp se activan solas.",
  };
};

function Requirement({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" />
      <span>{children}</span>
    </li>
  );
}

interface WhatsappConnectProps {
  settings: WhatsappSettings;
  /** false = solo ver el estado (p. ej. un editor de la tienda). */
  canEdit: boolean;
}

export function WhatsappConnect({ settings, canEdit }: WhatsappConnectProps) {
  const { data: config, isLoading } = useQueryWhatsappSignupConfig();
  const complete = useMutationCompleteWhatsappSignup();
  const update = useMutationUpdateMyWhatsapp();
  const [isOpening, setIsOpening] = useState(false);
  const [isDisconnectOpen, setIsDisconnectOpen] = useState(false);
  const session = useRef<SessionInfo | null>(null);

  const available = Boolean(config?.available && config.app_id && config.config_id);
  const connected = settings.onboarding === "embedded_signup" && settings.has_token;

  // Se precarga el SDK para que la ventana de Meta abra con el clic (si no, el navegador la bloquea).
  useEffect(() => {
    if (available && canEdit && config) loadSdk(config).catch(() => {});
  }, [available, canEdit, config]);

  // Meta avisa por mensaje qué cuenta y qué número eligió la tienda.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!event.origin.endsWith("facebook.com")) return;
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data?.type !== "WA_EMBEDDED_SIGNUP") return;
        if (String(data.event).startsWith("FINISH") && data.data?.waba_id && data.data?.phone_number_id) {
          session.current = { waba_id: String(data.data.waba_id), phone_number_id: String(data.data.phone_number_id) };
        } else if (data.event === "ERROR") {
          toast.danger(data.data?.error_message ?? "Meta reportó un error al conectar.");
        }
      } catch {
        // Otros mensajes de Facebook que no son del registro.
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  /** El código llega antes o después que la cuenta: se espera la cuenta unos segundos (el código vence en 30). */
  const waitForSession = async () => {
    for (let attempt = 0; attempt < 25 && !session.current; attempt += 1) await new Promise((resolve) => setTimeout(resolve, 200));
    return session.current;
  };

  const finish = async (code: string) => {
    const info = await waitForSession();
    if (!info) {
      setIsOpening(false);
      toast.danger("Meta no indicó qué número elegiste. Vuelve a conectar y elige tu número de WhatsApp.");
      return;
    }
    complete.mutate(
      { code, ...info },
      {
        onSuccess: () => toast.success("WhatsApp Business conectado. Meta está revisando tu plantilla."),
        onError: (error) => handleAxiosError(error, "No se pudo conectar WhatsApp Business"),
        onSettled: () => setIsOpening(false),
      },
    );
  };

  const connect = async () => {
    if (!config) return;
    session.current = null;
    setIsOpening(true);
    try {
      const FB = await loadSdk(config);
      FB.login(
        (response) => {
          const code = response.authResponse?.code;
          if (!code) {
            setIsOpening(false);
            toast.info("Cerraste la ventana de Meta sin terminar. Puedes intentarlo de nuevo.");
            return;
          }
          void finish(code);
        },
        {
          config_id: config.config_id,
          response_type: "code",
          override_default_response_type: true,
          // Coexistencia: el número sigue funcionando en la app de WhatsApp Business.
          extras: { setup: {}, featureType: "whatsapp_business_app_onboarding", sessionInfoVersion: "3" },
        },
      );
    } catch (error) {
      setIsOpening(false);
      toast.danger(error instanceof Error ? error.message : "No se pudo abrir Facebook.");
    }
  };

  const disconnect = () =>
    update.mutate(
      { enabled: false, access_token: null },
      {
        onSuccess: () => {
          setIsDisconnectOpen(false);
          toast.success("WhatsApp Business desconectado de VendeYaOnline.");
        },
        onError: (error) => handleAxiosError(error, "No se pudo desconectar"),
      },
    );

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        <Spinner size="sm" /> Cargando...
      </p>
    );
  }

  const isBusy = isOpening || complete.isPending;

  if (connected) {
    const template = templateState(settings);
    const TemplateIcon = template.icon;
    return (
      <div className="space-y-4">
        <div className="space-y-3 rounded-xl border border-border p-4 text-sm">
          <div className="flex items-start gap-3">
            <Smartphone className="mt-0.5 size-4 shrink-0 text-accent" />
            <div className="min-w-0">
              <p className="font-semibold">{[settings.verified_name, settings.display_phone].filter(Boolean).join(" · ") || "Tu número"}</p>
              <p className="text-muted">
                {settings.coexistence
                  ? "Sigues usando este número en la app de WhatsApp Business como siempre. Las campañas salen desde este mismo número."
                  : "Las campañas salen desde este número."}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 border-t border-border pt-3">
            <TemplateIcon className={cn("mt-0.5 size-4 shrink-0", template.tone)} />
            <div className="min-w-0">
              <p className="font-semibold">{template.title}</p>
              <p className="text-muted">{template.detail}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 border-t border-border pt-3">
            <CreditCard className="mt-0.5 size-4 shrink-0 text-accent" />
            <div className="min-w-0 space-y-2">
              <div>
                <p className="font-semibold">Método de pago en Meta</p>
                <p className="text-muted">
                  Meta cobra cada mensaje de promociones directamente a tu cuenta. Si aún no lo hiciste, agrega una tarjeta en el
                  Administrador de WhatsApp; sin ella los mensajes no salen.
                </p>
              </div>
              <a
                href={WHATSAPP_MANAGER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Abrir el Administrador de WhatsApp <ExternalLink className="size-3.5" />
              </a>
            </div>
          </div>
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            {available && (
              <PendingButton variant="ghost" size="sm" isPending={isBusy} pendingLabel="Conectando" onPress={connect}>
                <Facebook className="size-4" /> Volver a conectar
              </PendingButton>
            )}
            <Button variant="ghost" size="sm" className="text-danger" onPress={() => setIsDisconnectOpen(true)}>
              <Unplug className="size-4" /> Desconectar
            </Button>
          </div>
        )}
        <ConfirmDialog
          isOpen={isDisconnectOpen}
          onOpenChange={setIsDisconnectOpen}
          onConfirm={disconnect}
          tone="danger"
          title="¿Desconectar WhatsApp Business?"
          description="Las campañas y los recordatorios por WhatsApp dejan de salir. Tu número sigue funcionando en la app de WhatsApp Business."
          confirmLabel="Desconectar"
          pendingLabel="Desconectando"
          isPending={update.isPending}
        />
      </div>
    );
  }

  if (!available) {
    return (
      <div className="flex gap-3 rounded-xl border border-border bg-surface-secondary p-4 text-sm">
        <Clock className="mt-0.5 size-4 shrink-0 text-muted" />
        <div className="space-y-1">
          <p className="font-semibold">Muy pronto podrás conectarlo con un clic</p>
          <p className="text-muted">
            Estamos terminando la conexión con Meta. Podrás usar el mismo número que ya tiene tu marca en WhatsApp Business.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {settings.disconnected_at && (
        <p className="flex gap-2 rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          Quitaste el acceso de VendeYaOnline en Meta. Vuelve a conectar para enviar por WhatsApp.
        </p>
      )}
      <div className="space-y-3 rounded-xl border border-border p-4 text-sm">
        <p className="font-semibold">Usa el mismo número de tu marca</p>
        <p className="text-muted">
          Sigues respondiendo a tus clientes desde la app de WhatsApp Business en tu celular, como siempre. Las campañas y los
          recordatorios salen solos desde ese mismo número.
        </p>
        <p className="pt-1 font-medium">Antes de empezar, ten a mano:</p>
        <ul className="space-y-1.5 text-muted">
          <Requirement>Tu celular con la app de WhatsApp Business actualizada y el número de tu marca.</Requirement>
          <Requirement>Tu cuenta de Facebook (si no tienes un portafolio comercial, Meta te ayuda a crearlo).</Requirement>
          <Requirement>Al final, escanea con WhatsApp Business el código que te muestra Meta.</Requirement>
        </ul>
      </div>
      {canEdit ? (
        <PendingButton variant="primary" isPending={isBusy} pendingLabel="Conectando" onPress={connect} className="w-full sm:w-auto">
          <Facebook className="size-4" /> Conectar con Facebook
        </PendingButton>
      ) : (
        <p className="text-sm text-muted">Solo el administrador de la tienda puede conectarlo.</p>
      )}
      <p className="text-xs text-muted">
        VendeYaOnline crea tu plantilla de promociones en Meta; Meta la revisa en unas horas. Meta cobra cada mensaje de
        promociones directamente a tu cuenta.
      </p>
    </div>
  );
}
