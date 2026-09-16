import type { ReactNode } from "react";

interface FormSectionProps {
  title: string;
  description?: string;
  /** Acción a la derecha del título (p. ej. el botón "Agregar"). */
  action?: ReactNode;
  children: ReactNode;
}

/**
 * Bloque del formulario de producto: tarjeta blanca sobre el fondo gris del
 * modal con título, descripción opcional y una acción alineada a la derecha.
 */
export function FormSection({ title, description, action, children }: FormSectionProps) {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-surface p-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      {children}
    </section>
  );
}

interface CharCounterProps {
  length: number;
  max: number;
}

/** Contador "n/máx" bajo un campo de texto con límite de caracteres. */
export function CharCounter({ length, max }: CharCounterProps) {
  return (
    <span
      aria-live="polite"
      className={`mt-1 block text-right text-xs ${length >= max ? "text-warning" : "text-muted"}`}
    >
      {length}/{max}
    </span>
  );
}
