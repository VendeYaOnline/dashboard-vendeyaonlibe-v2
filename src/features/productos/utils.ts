/** Formato de moneda en pesos colombianos, sin decimales: "$ 1.234.567". */
const copFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

/** Solo separadores de miles ("1.234.567"), para mostrar dentro de un input. */
const groupFormatter = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

export const formatCOP = (value: number | string) => {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return "";
  return copFormatter.format(Math.round(number));
};

/**
 * Precio guardado → dígitos enteros para el formulario. Los productos viejos
 * pueden traer decimales ("1234.5") o separadores ("1.234.567"); en ambos
 * casos se conserva el valor sin perderlo.
 */
export const priceToDigits = (raw: string | number | null | undefined) => {
  if (raw === null || raw === undefined || raw === "") return "";
  const number = Number(raw);
  if (Number.isFinite(number)) return toDigits(String(Math.round(number)));
  return toDigits(String(raw));
};

export const formatThousands = (digits: string) =>
  digits === "" ? "" : groupFormatter.format(Number(digits));

/** Deja solo dígitos y quita ceros a la izquierda ("0.012" → "12"). */
export const toDigits = (raw: string) => raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
