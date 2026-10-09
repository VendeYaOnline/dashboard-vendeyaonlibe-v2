"use client";

import { useState } from "react";
import { BookOpen, Check, Copy } from "lucide-react";
import { Button, Modal, toast, useOverlayState } from "@heroui/react";
import { ModalFormHeader } from "@/components/shared/modal-form-header";

interface MercadoPagoGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  companyId: string;
  /** URL pública del backend con /api (sale de la URL del webhook). */
  apiUrl: string;
  /** URL de la tienda guardada; "" = sin configurar. */
  storeUrl: string;
}

/** Bloque de código con botón de copiar. */
function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.danger("No se pudo copiar");
    }
  };
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg bg-surface-secondary p-3 pr-11 font-mono text-xs leading-relaxed">{code}</pre>
      <Button
        variant="ghost"
        size="sm"
        isIconOnly
        aria-label="Copiar código"
        onPress={copy}
        className="absolute right-1.5 top-1.5"
      >
        {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
      </Button>
    </div>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <section className="flex gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
        {number}
      </span>
      <div className="min-w-0 flex-1 space-y-2 text-sm">
        <h3 className="font-semibold">{title}</h3>
        {children}
      </div>
    </section>
  );
}

/**
 * Guía para conectar la web de una tienda con Mercado Pago a través del
 * backend: qué configurar aquí, qué endpoint llamar y qué páginas crear.
 */
export function MercadoPagoGuideModal({ isOpen, onClose, companyName, companyId, apiUrl, storeUrl }: MercadoPagoGuideModalProps) {
  const state = useOverlayState({ isOpen, onOpenChange: (open) => !open && onClose() });
  const store = storeUrl || "https://www.tienda.com";

  const request = `const response = await fetch("${apiUrl}/create-preference", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-company-id": "${companyId}",
  },
  body: JSON.stringify({
    user: {
      first_name: "Ana",
      last_name: "Pérez",
      id_number: "1012345678",
      email: "ana@correo.com",
      phone: "3001234567",
      department: "Meta",
      city: "Villavicencio",
      address: "Calle 1 # 2-3",
      additional_info: "Apto 101",
    },
    products: carrito.map((item) => ({
      id: item.id,                  // id del producto en VendeYaOnline
      quantity: item.quantity,
      variantKey: item.variantKey,  // solo si tiene variantes
      variantLabel: item.variantLabel,
    })),
    promoCode: codigoPromocional || undefined,
  }),
});

const data = await response.json();
if (!response.ok) {
  // data.message explica el error (producto agotado, código inválido...)
  mostrarError(data.message);
  return;
}
window.location.href = data.init_point; // pago en Mercado Pago`;

  const returnPage = `// /success-purchase?payment_id=...&status=approved&external_reference=...
const params = new URLSearchParams(window.location.search);
const status = params.get("status"); // approved | pending | rejected
// Vaciar el carrito y mostrar "¡Gracias por tu compra!".
// No crees la venta aquí: el backend la crea solo cuando Mercado Pago confirma el pago.`;

  return (
    <Modal state={state}>
      <Modal.Backdrop isDismissable>
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog className="max-w-4xl">
            <ModalFormHeader
              icon={BookOpen}
              title="Cómo conectar la tienda con Mercado Pago"
              description={`Pasos para que la web de ${companyName} cobre con su propia cuenta.`}
            />
            <Modal.Body className="space-y-6">
              <p className="rounded-lg bg-accent-soft px-3 py-2 text-xs text-accent">
                El backend ya hace lo difícil: calcula el total con los precios reales, crea el pago con el token de esta
                tienda, recibe el webhook, registra la venta una sola vez, descuenta el inventario y envía el correo de
                confirmación. La web de la tienda solo pide el pago y muestra el resultado.
              </p>

              <Step number={1} title="Configurar la cuenta (en este panel)">
                <ul className="list-disc space-y-1 pl-4 text-muted">
                  <li>
                    La tienda entra a <strong>mercadopago.com.co/developers</strong> → <em>Tus integraciones</em> → su
                    aplicación → <em>Credenciales de producción</em> y te comparte el <strong>Access token</strong>{" "}
                    (empieza por <code>APP_USR-</code>). Pídeselo por un medio privado.
                  </li>
                  <li>Pégalo en «Access token», completa la URL de la tienda y el correo remitente, y guarda con «Cobrar con Mercado Pago» activo.</li>
                  <li>El webhook se configura solo: no hay que registrarlo en Mercado Pago.</li>
                </ul>
              </Step>

              <Step number={2} title="Botón «Pagar» en el checkout de la tienda">
                <p className="text-muted">
                  Al confirmar la compra, la web llama a este endpoint con el carrito y los datos del comprador, y redirige a
                  la URL de pago que responde. Los precios que mande el navegador se ignoran.
                </p>
                <CodeBlock code={request} />
                <ul className="list-disc space-y-1 pl-4 text-xs text-muted">
                  <li>
                    <code>x-company-id</code> identifica la tienda: con este valor el backend usa la cuenta de{" "}
                    {companyName}.
                  </li>
                  <li>Los datos del comprador que falten quedan como «No especificado»; el correo es necesario para la confirmación.</li>
                  <li>Máximo 10 cuotas; el envío y el código promocional se suman o descuentan en el servidor.</li>
                </ul>
              </Step>

              <Step number={3} title="Páginas de regreso">
                <p className="text-muted">Mercado Pago devuelve al comprador a estas rutas de la tienda:</p>
                <ul className="space-y-1 font-mono text-xs">
                  <li>{store}/success-purchase — pago aprobado</li>
                  <li>{store}/pending-purchase — pago pendiente (p. ej. efectivo)</li>
                  <li>{store}/failure-purchase — pago rechazado o cancelado</li>
                </ul>
                <CodeBlock code={returnPage} />
              </Step>

              <Step number={4} title="Probar antes de anunciarlo">
                <ul className="list-disc space-y-1 pl-4 text-muted">
                  <li>Haz una compra real de bajo valor y verifica que el dinero llega a la cuenta de la tienda.</li>
                  <li>La venta debe aparecer en «Ventas recibidas» y el comprador recibir el correo de confirmación.</li>
                  <li>Si algo falla, el mensaje del error viene en la respuesta del paso 2 (por ejemplo, «Mercado Pago no está configurado»).</li>
                </ul>
              </Step>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="primary" onPress={onClose}>
                Entendido
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
