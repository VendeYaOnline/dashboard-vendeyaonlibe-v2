import type { AnalyticsPeriod } from "@/interfaces/analytics";
import { getPaymentMethodLabel } from "@/features/ventas/types";

export const PERIOD_OPTIONS: { id: AnalyticsPeriod; label: string; compare: string }[] = [
  { id: 7, label: "7 días", compare: "vs. los 7 días anteriores" },
  { id: 30, label: "30 días", compare: "vs. los 30 días anteriores" },
  { id: 90, label: "90 días", compare: "vs. los 90 días anteriores" },
  { id: 365, label: "12 meses", compare: "vs. los 12 meses anteriores" },
];

const cop = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const integer = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

export const formatMoney = (value: number) => cop.format(Math.round(value));
export const formatInteger = (value: number) => integer.format(value);

/** Importe abreviado para ejes y tarjetas: "$ 1,2 M", "$ 850 mil". */
export const formatMoneyCompact = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$ ${trim(value / 1_000_000)} M`;
  if (abs >= 1_000) return `$ ${trim(value / 1_000)} mil`;
  return formatMoney(value);
};

const trim = (n: number) =>
  new Intl.NumberFormat("es-CO", { maximumFractionDigits: n < 10 ? 1 : 0 }).format(n);

/** Etiqueta corta de un punto de la serie: "18 sept" o "sept 2026". */
export const formatBucket = (key: string, granularity: "day" | "month") => {
  if (granularity === "month") {
    const [year, month] = key.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("es-CO", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    });
  }
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
};

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Etiqueta larga para el tooltip: "Jueves, 18 de septiembre". */
export const formatBucketLong = (key: string, granularity: "day" | "month") =>
  capitalize(formatBucketLongRaw(key, granularity));

const formatBucketLongRaw = (key: string, granularity: "day" | "month") => {
  if (granularity === "month") {
    const [year, month] = key.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("es-CO", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  }
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
};

export const paymentLabel = getPaymentMethodLabel;

const CHANNEL_LABELS: Record<string, string> = {
  online: "Tienda en línea",
  local: "Venta en local",
};

export const channelLabel = (channel: string) => CHANNEL_LABELS[channel] ?? channel;

/** Ticks "redondos" para el eje Y: 0, 1M, 2M... nunca valores raros. */
export const niceTicks = (max: number, count = 4): number[] => {
  if (max <= 0) return [0];
  const rough = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const candidates = [1, 2, 2.5, 5, 10].map((m) => m * magnitude);
  const step = candidates.find((c) => c >= rough) ?? candidates[candidates.length - 1];
  const ticks: number[] = [];
  for (let value = 0; value <= max + step * 0.001; value += step) ticks.push(value);
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
};
