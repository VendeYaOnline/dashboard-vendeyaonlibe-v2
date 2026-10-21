"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Copy, KeyRound, Lightbulb } from "lucide-react";
import { Button, Chip, cn, toast } from "@heroui/react";
import { CAROUSEL_CARD_BODY, CAROUSEL_TEMPLATE_BODY, WHATSAPP_TEMPLATE_BODY } from "./whatsapp-templates";

/**
 * Guía para conectar WhatsApp Business como línea de tiempo: un paso abierto a
 * la vez, con acciones cortas y lo que hay que copiar de cada uno.
 */

interface GuideStepData {
  title: string;
  /** Una frase: para qué sirve el paso. */
  summary: string;
  /** Lo que el usuario se lleva del paso para pegarlo en el formulario. */
  yields?: string;
  optional?: boolean;
  actions: ReactNode[];
  note?: { tone: "warning" | "info"; text: ReactNode };
  extra?: ReactNode;
}

const STORAGE_KEY = "vy-whatsapp-guide-step";

function CopyBlock({ label, text }: { label: string; text: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiado`);
    } catch {
      toast.danger("No se pudo copiar. Selecciónalo y cópialo a mano.");
    }
  };
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-1.5">
        <span className="text-xs font-medium text-muted">{label}</span>
        <Button size="sm" variant="ghost" onPress={copy}>
          <Copy className="size-3.5" /> Copiar
        </Button>
      </div>
      <pre className="whitespace-pre-wrap p-3 font-sans text-xs text-foreground">{text}</pre>
    </div>
  );
}

const Path = ({ children }: { children: ReactNode }) => <span className="font-medium text-foreground">{children}</span>;

const STEPS: GuideStepData[] = [
  {
    title: "Antes de empezar",
    summary: "Ten a mano estas tres cosas.",
    actions: [
      "Una cuenta de Facebook.",
      <>
        Un portafolio comercial en <Path>business.facebook.com</Path>.
      </>,
      "Un número de celular que reciba SMS o llamadas.",
    ],
    note: {
      tone: "warning",
      text: "Ese número no puede estar en uso en la app de WhatsApp. Si lo está, elimina la cuenta desde la app (Configuración → Cuenta → Eliminar cuenta) o usa un número nuevo.",
    },
  },
  {
    title: "Crea la app en Meta",
    summary: "Es la «puerta» por la que VendeYaOnline envía tus mensajes.",
    actions: [
      <>
        Entra a <Path>developers.facebook.com → Mis apps → Crear app</Path>.
      </>,
      "Elige «Conectar con clientes a través de WhatsApp» (o tipo «Negocio»).",
      "Vincúlala a tu portafolio comercial.",
    ],
  },
  {
    title: "Agrega tu número",
    summary: "Registra el número desde el que saldrán las campañas.",
    yields: "Phone number ID",
    actions: [
      <>
        En la app: <Path>WhatsApp → Configuración de la API → Agregar número de teléfono</Path>.
      </>,
      "Escribe el nombre que verán tus clientes y la categoría.",
      "Verifica el número con el código por SMS o llamada.",
      <>
        En esa misma pantalla, elige tu número y copia el <Path>Identificador del número de teléfono</Path>.
      </>,
    ],
    note: { tone: "info", text: "El Phone number ID son solo dígitos. No es tu número de celular." },
  },
  {
    title: "Agrega un método de pago",
    summary: "Meta cobra cada mensaje de marketing directamente a tu cuenta.",
    actions: [
      <>
        Entra a <Path>business.facebook.com/wa/manage → Configuración → Pagos</Path>.
      </>,
      "Agrega una tarjeta.",
    ],
    note: { tone: "warning", text: "Sin método de pago los mensajes no salen." },
  },
  {
    title: "Genera un token permanente",
    summary: "Es la llave que le permite a VendeYaOnline enviar en tu nombre.",
    yields: "Token de acceso",
    actions: [
      <>
        En <Path>business.facebook.com → Configuración → Usuarios del sistema</Path>, pulsa <Path>Agregar</Path> con rol
        Administrador.
      </>,
      <>
        Con ese usuario: <Path>Asignar activos</Path> → tu app y tu cuenta de WhatsApp, con control total.
      </>,
      <>
        Pulsa <Path>Generar token</Path>: elige tu app, vencimiento <Path>Nunca</Path> y los permisos{" "}
        <code>whatsapp_business_messaging</code> y <code>whatsapp_business_management</code>.
      </>,
      <>
        Copia el token (empieza por <code>EAA</code>).
      </>,
    ],
    note: {
      tone: "warning",
      text: "Meta no vuelve a mostrar el token. El token temporal de 24 horas de «Configuración de la API» no sirve.",
    },
  },
  {
    title: "Crea la plantilla de mensaje",
    summary: "Meta solo deja enviar promociones con una plantilla aprobada.",
    yields: "Nombre de la plantilla",
    actions: [
      <>
        En el Administrador de WhatsApp: <Path>Plantillas de mensajes → Crear plantilla</Path>.
      </>,
      <>
        Categoría <Path>Marketing</Path>, idioma <Path>Español</Path> y un nombre en minúsculas con guion bajo (ej.{" "}
        <code>promo_tienda</code>).
      </>,
      "Pega en el cuerpo el texto de abajo, con sus 3 variables.",
      "Llena los ejemplos que pide Meta (ej. «Ana», «20 % de descuento», «https://tutienda.com») y envíala a revisión.",
    ],
    extra: <CopyBlock label="Cuerpo de la plantilla" text={WHATSAPP_TEMPLATE_BODY} />,
    note: {
      tone: "info",
      text: "{{1}} = nombre del cliente, {{2}} = texto de tu campaña, {{3}} = enlace. La revisión tarda de minutos a 24 horas; espera a que diga «Aprobada».",
    },
  },
  {
    title: "Plantilla de carrusel",
    summary: "Tus clientes reciben tarjetas con foto, precio y botón «Comprar» de cada producto.",
    yields: "Nombre del carrusel",
    optional: true,
    actions: [
      <>
        Crea otra plantilla: categoría <Path>Marketing</Path>, tipo <Path>Carrusel</Path>, mismo idioma.
      </>,
      "Pega el cuerpo del mensaje de abajo.",
      <>
        En cada tarjeta: encabezado de <Path>imagen</Path>, el cuerpo de la tarjeta de abajo y un botón de{" "}
        <Path>sitio web</Path> con URL dinámica <code>https://tutienda.com/{"{{1}}"}</code>.
      </>,
      "Elige de 2 a 6 tarjetas y recuerda el número: lo pedimos al conectar.",
    ],
    extra: (
      <div className="grid gap-2 sm:grid-cols-2">
        <CopyBlock label="Cuerpo del mensaje" text={CAROUSEL_TEMPLATE_BODY} />
        <CopyBlock label="Cuerpo de cada tarjeta" text={CAROUSEL_CARD_BODY} />
      </div>
    ),
    note: { tone: "info", text: "Si una campaña tiene menos productos que tarjetas, se envía la plantilla de texto." },
  },
  {
    title: "Pega los datos y guarda",
    summary: "Con lo que copiaste, conecta tu cuenta en «Datos de conexión».",
    actions: [
      "Token, Phone number ID, nombre exacto de la plantilla y su idioma (es para Español).",
      "Al guardar verificamos la conexión con Meta.",
      "Cuando todo esté bien verás «WhatsApp Business configurado correctamente».",
    ],
  },
];

const readStep = () => {
  try {
    const value = Number(window.localStorage.getItem(STORAGE_KEY));
    return Number.isInteger(value) && value >= 0 && value < STEPS.length ? value : 0;
  } catch {
    return 0;
  }
};

const saveStep = (step: number) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(step));
  } catch {
    // Sin almacenamiento la guía arranca desde el paso 1: no es grave.
  }
};

interface WhatsappGuideProps {
  /** Último paso: llevar al formulario. */
  onFinish?: () => void;
}

export function WhatsappGuide({ onFinish }: WhatsappGuideProps) {
  const [current, setCurrent] = useState(0);

  // Quien va y vuelve de Meta retoma donde iba.
  useEffect(() => setCurrent(readStep()), []);

  const goTo = (step: number) => {
    setCurrent(step);
    saveStep(step);
  };

  const isLast = current === STEPS.length - 1;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-x-3 text-xs">
          <span className="whitespace-nowrap font-medium">
            Paso {current + 1} de {STEPS.length}
          </span>
          <span className="text-muted">Unos 20 minutos, más la aprobación de Meta</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-secondary">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${((current + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <ol>
        {STEPS.map((step, index) => {
          const isActive = index === current;
          const isDone = index < current;
          return (
            <li key={step.title} className="relative flex gap-3 pb-1 last:pb-0">
              {index < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className={cn("absolute top-8 bottom-0 left-[13px] w-0.5", isDone ? "bg-accent" : "bg-border")}
                />
              )}
              <span
                className={cn(
                  "relative z-10 mt-1 flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                  isDone && "border-accent bg-accent text-accent-foreground",
                  isActive && "border-accent bg-surface text-accent",
                  !isDone && !isActive && "border-border bg-surface text-muted",
                )}
              >
                {isDone ? <Check className="size-3.5" /> : index + 1}
              </span>

              <div className={cn("min-w-0 flex-1 rounded-xl", isActive && "mb-3 border border-border bg-surface-secondary")}>
                <button
                  type="button"
                  aria-expanded={isActive}
                  onClick={() => goTo(index)}
                  className={cn("flex w-full flex-wrap items-center gap-2 text-left", isActive ? "px-4 pt-3" : "py-2")}
                >
                  <span className={cn("text-sm", isActive ? "font-semibold" : isDone ? "text-muted" : "font-medium")}>
                    {step.title}
                  </span>
                  {step.optional && (
                    <Chip size="sm" variant="soft">
                      Opcional
                    </Chip>
                  )}
                  {step.yields && !isActive && (
                    <span className="ml-auto flex items-center gap-1 text-xs text-muted">
                      <KeyRound className="size-3" /> {step.yields}
                    </span>
                  )}
                </button>

                {isActive && (
                  <div className="space-y-3 px-4 pt-1 pb-4 text-sm">
                    <p className="text-muted">{step.summary}</p>

                    <ol className="space-y-2">
                      {step.actions.map((action, actionIndex) => (
                        <li key={actionIndex} className="flex gap-2.5">
                          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-surface text-[11px] font-semibold text-muted">
                            {String.fromCharCode(97 + actionIndex)}
                          </span>
                          <span className="min-w-0 text-muted">{action}</span>
                        </li>
                      ))}
                    </ol>

                    {step.extra}

                    {step.note && (
                      <p
                        className={cn(
                          "flex gap-2 rounded-lg px-3 py-2 text-xs",
                          step.note.tone === "warning" ? "bg-warning/10 text-warning" : "bg-accent-soft text-accent",
                        )}
                      >
                        {step.note.tone === "warning" ? (
                          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                        ) : (
                          <Lightbulb className="mt-0.5 size-3.5 shrink-0" />
                        )}
                        <span>{step.note.text}</span>
                      </p>
                    )}

                    {step.yields && (
                      <p className="flex items-center gap-1.5 text-xs">
                        <KeyRound className="size-3.5 text-accent" />
                        <span className="text-muted">Guarda esto para conectar:</span>
                        <span className="font-semibold">{step.yields}</span>
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <Button size="sm" variant="ghost" isDisabled={index === 0} onPress={() => goTo(index - 1)}>
                        <ArrowLeft className="size-4" /> Anterior
                      </Button>
                      {isLast ? (
                        onFinish && (
                          <Button size="sm" variant="primary" onPress={onFinish}>
                            Ir a datos de conexión <ArrowRight className="size-4" />
                          </Button>
                        )
                      ) : (
                        <Button size="sm" variant="primary" onPress={() => goTo(index + 1)}>
                          {step.optional ? "Siguiente" : "Listo, siguiente"} <ArrowRight className="size-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
