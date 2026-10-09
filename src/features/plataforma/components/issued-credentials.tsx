"use client";

import { CheckCircle2, Copy, X } from "lucide-react";
import { Button, toast } from "@heroui/react";

/** Credenciales que se acaban de fijar: se muestran una vez para copiarlas y entregarlas. */
export interface IssuedCredentials {
  title: string;
  email: string;
  password: string;
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copiado");
  } catch {
    toast.danger("No se pudo copiar. Selecciónalo y cópialo a mano.");
  }
};

/**
 * Aviso verde con el correo y la contraseña recién creados o cambiados. La
 * contraseña no se guarda en el panel ni se puede volver a ver: el superadmin
 * debe copiarla ahora y entregarla por un medio seguro.
 */
export function IssuedCredentialsNotice({
  credentials,
  onDismiss,
}: {
  credentials: IssuedCredentials;
  onDismiss: () => void;
}) {
  return (
    <section className="space-y-2 rounded-xl border border-success/30 bg-success/10 p-4 text-sm" aria-live="polite">
      <div className="flex items-start justify-between gap-3">
        <p className="flex items-center gap-2 font-medium text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          {credentials.title}
        </p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar aviso"
          className="text-muted transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
      <p className="text-muted">
        Copia la contraseña y entrégala por un medio seguro: <strong>no se vuelve a mostrar</strong>.
      </p>
      <dl className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1">
        <dt className="text-muted">Correo</dt>
        <dd className="min-w-0 truncate font-medium">{credentials.email}</dd>
        <Button
          size="sm"
          variant="ghost"
          isIconOnly
          aria-label="Copiar correo"
          onPress={() => copyToClipboard(credentials.email)}
        >
          <Copy className="size-4" />
        </Button>
        <dt className="text-muted">Contraseña</dt>
        <dd className="min-w-0 break-all font-mono font-medium">{credentials.password}</dd>
        <Button
          size="sm"
          variant="ghost"
          isIconOnly
          aria-label="Copiar contraseña"
          onPress={() => copyToClipboard(credentials.password)}
        >
          <Copy className="size-4" />
        </Button>
      </dl>
    </section>
  );
}
