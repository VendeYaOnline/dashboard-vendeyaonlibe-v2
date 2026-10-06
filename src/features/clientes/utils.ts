const DAY_MS = 86_400_000;

/** "12 sept 2026" (hora de Colombia). */
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Bogota" });

/** "Hoy", "Ayer", "Hace 5 días" o la fecha si pasó un mes. */
export const formatRelative = (iso: string | null) => {
  if (!iso) return "—";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS);
  if (days <= 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 30) return `Hace ${days} días`;
  return formatDate(iso);
};
