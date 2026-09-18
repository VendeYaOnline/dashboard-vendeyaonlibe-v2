/** Fecha corta para la tabla ("18 sept 2026, 10:32"); null para mensajes antiguos sin fecha. */
export function formatReceivedAt(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Enlace para responder desde el cliente de correo con el asunto citado. */
export function buildReplyLink(email: string, subject: string): string {
  const params = new URLSearchParams({ subject: `Re: ${subject}` });
  return `mailto:${email}?${params.toString().replace(/\+/g, "%20")}`;
}
