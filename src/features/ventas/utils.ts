/**
 * `<input type="date">` entrega `YYYY-MM-DD`, pero el backend espera
 * `DD/MM/YYYY` y la parte manualmente por "/" (ver getSales en
 * sales.controller.js).
 */
/**
 * `total` llega como texto con formatos mezclados: "9200000.00" (panel),
 * "9.200.000" o "$ 9.200.000" (tienda) o "No especificado" (ventas viejas).
 * Devuelve el número o null si no se puede interpretar.
 */
export const parseMoney = (raw: string | number | null | undefined): number | null => {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  const text = String(raw ?? "").trim().replace(/[^0-9.,-]/g, "");
  if (!text) return null;
  if (/^-?\d+(\.\d{1,2})?$/.test(text)) return Number(text);
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(text)) return Number(text.replace(/\./g, "").replace(",", "."));
  if (/^-?\d+(,\d{1,2})?$/.test(text)) return Number(text.replace(",", "."));
  const digits = Number(text.replace(/[.,]/g, ""));
  return Number.isFinite(digits) ? digits : null;
};

const cop = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

/** "$ 9.200.000" o "—" cuando la venta no guardó importe. */
export const formatSaleTotal = (raw: string | number | null | undefined): string => {
  const value = parseMoney(raw);
  return value === null ? "—" : cop.format(Math.round(value));
};

export const toBackendDate = (isoDate: string): string => {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
};
