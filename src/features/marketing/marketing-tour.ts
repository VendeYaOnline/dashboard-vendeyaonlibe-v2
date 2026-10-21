"use client";

import { useCallback, useEffect, useRef } from "react";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import "./marketing-tour.css";

export type TourStep = "brand" | "design" | "send";

interface TourItem {
  /** Valor de `data-tour` del elemento a resaltar; sin él, la tarjeta sale centrada. */
  target?: string;
  title: string;
  description: string;
  side?: "top" | "bottom" | "left" | "right";
}

/**
 * Guía de cada paso de Marketing. Los elementos se marcan con
 * `data-tour="..."`; si alguno no está en pantalla (p. ej. el editor ve el
 * paso sin permiso de admin), ese paso de la guía se salta.
 */
const TOURS: Record<TourStep, TourItem[]> = {
  brand: [
    {
      target: "steps",
      title: "Marketing en 3 pasos",
      description:
        "Primero tu marca, después diseñas el correo y al final lo envías a tus clientes por correo o WhatsApp. Puedes volver a cualquier paso cuando quieras.",
    },
    {
      target: "brand-sender",
      title: "Quién envía el correo",
      description:
        "El nombre de tu marca es lo primero que ve el cliente en su bandeja. Si pones un correo de respuesta, las respuestas te llegan a ti.",
    },
    {
      target: "brand-logo",
      title: "Tu logo y colores",
      description: "Aparecen en todos tus correos para que tus clientes reconozcan tu marca al instante.",
    },
    {
      target: "brand-store",
      title: "El enlace de tu tienda",
      description:
        "Es obligatorio: los botones y los productos del correo llevan a tu tienda. Sin él, tus clientes no podrían comprar desde el correo.",
    },
    {
      target: "preview",
      title: "Vista previa en vivo",
      description: "Mientras escribes, aquí ves cómo le llegará el correo a tus clientes.",
      side: "left",
    },
    {
      target: "actions",
      title: "Guarda y sigue",
      description: "Guarda tu marca y pasa a diseñar tu primer correo.",
      side: "top",
    },
  ],
  design: [
    {
      target: "templates",
      title: "Tipos de plantillas",
      description:
        "Guarda hasta 3 diseños para reutilizarlos. Ponle un nombre que te ayude a reconocerla, como «Descuento camisetas».",
    },
    {
      target: "editor-goal",
      title: "¿Qué quieres promocionar?",
      description:
        "Elige productos de tu tienda (con foto, precio y botón de compra) o un póster de tu galería, como un banner de «20 % de descuento».",
    },
    {
      target: "editor-message",
      title: "Tu mensaje",
      description: "Un título, un texto corto y, si quieres, un código de descuento. Si una venta usa ese código, lo verás en el historial.",
    },
    {
      target: "editor-inbox",
      title: "Lo que se ve en la bandeja",
      description: "El asunto es lo que decide si abren el correo: corto, claro y sin MAYÚSCULAS ni muchos signos de exclamación.",
    },
    {
      target: "preview",
      title: "Revisa cómo se ve",
      description: "La vista previa se actualiza con cada cambio, en computador y en celular.",
      side: "left",
    },
    {
      target: "actions",
      title: "Guarda, prueba y envía",
      description:
        "Guarda la plantilla, envíate una prueba para verla en tu correo y, cuando te guste, pasa a «Enviar a mis clientes».",
      side: "top",
    },
  ],
  send: [
    {
      target: "send-new",
      title: "Nueva campaña",
      description:
        "Elige la plantilla, el canal (correo o WhatsApp) y a quién enviarla. Antes de enviar ves cuántos clientes la recibirán.",
    },
    {
      target: "send-channel",
      title: "Correo o WhatsApp",
      description:
        "El correo sale solo. WhatsApp necesita WhatsApp Business conectado: así las campañas salen solas, con tus productos en carrusel (foto, precio y botón «Comprar»).",
    },
    {
      target: "send-history",
      title: "Historial y ventas",
      description:
        "Cada campaña muestra a cuántos les llegó y quiénes compraron en los 7 días siguientes, con el total en pesos.",
      side: "top",
    },
    {
      target: "send-contacts",
      title: "Clientes y notificaciones",
      description:
        "Quién recibe promociones, cuándo se le escribió por última vez y quién se dio de baja. Si alguien responde BAJA por WhatsApp, dalo de baja aquí.",
      side: "top",
    },
    {
      target: "send-carts",
      title: "Carritos abandonados",
      description:
        "Clientes que llenaron sus datos y no compraron. Se les envía un recordatorio por correo automático y puedes escribirles por WhatsApp con un clic.",
      side: "top",
    },
  ],
};

const storageKey = (step: TourStep) => `vyo-tour:marketing:${step}:v1`;

const wasSeen = (step: TourStep) => {
  try {
    return localStorage.getItem(storageKey(step)) === "1";
  } catch {
    return true; // Sin almacenamiento no se insiste en mostrarla sola.
  }
};

const markSeen = (step: TourStep) => {
  try {
    localStorage.setItem(storageKey(step), "1");
  } catch {
    // Sin almacenamiento: se vuelve a ofrecer, no pasa nada.
  }
};

/**
 * Guía de un paso de Marketing. Se abre sola la primera vez que el usuario
 * llega a ese paso (cuando `ready`) y `start()` la repite con «Ver guía».
 */
export function useMarketingTour(step: TourStep | null, ready: boolean) {
  const active = useRef<ReturnType<typeof driver> | null>(null);

  const start = useCallback(() => {
    if (!step) return;
    active.current?.destroy();
    const steps: DriveStep[] = TOURS[step]
      .filter((item) => !item.target || document.querySelector(`[data-tour="${item.target}"]`))
      .map((item) => ({
        element: item.target ? `[data-tour="${item.target}"]` : undefined,
        popover: { title: item.title, description: item.description, side: item.side ?? "bottom", align: "start" },
      }));
    if (!steps.length) return;

    const tour = driver({
      steps,
      popoverClass: "vyo-tour",
      showProgress: true,
      progressText: "{{current}} de {{total}}",
      nextBtnText: "Siguiente",
      prevBtnText: "Anterior",
      doneBtnText: "Listo",
      overlayOpacity: 0.45,
      stagePadding: 6,
      stageRadius: 14,
      smoothScroll: true,
      allowClose: true,
      onDestroyed: () => {
        active.current = null;
      },
    });
    active.current = tour;
    // Vista una vez, no vuelve a abrirse sola (con «Ver guía» se repite).
    markSeen(step);
    tour.drive();
  }, [step]);

  // Primera visita a cada paso: se abre sola, después de que se pinte la vista.
  useEffect(() => {
    if (!step || !ready || wasSeen(step)) return;
    const timer = window.setTimeout(start, 700);
    return () => window.clearTimeout(timer);
  }, [step, ready, start]);

  // Al cambiar de paso o salir de la vista, se cierra la guía abierta.
  useEffect(() => () => active.current?.destroy(), [step]);

  return { start };
}
