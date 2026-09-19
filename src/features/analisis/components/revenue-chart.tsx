"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { cn } from "@heroui/react";
import type { AnalyticsPoint } from "@/interfaces/analytics";
import {
  formatBucket,
  formatBucketLong,
  formatInteger,
  formatMoney,
  formatMoneyCompact,
  niceTicks,
} from "../utils";

interface RevenueChartProps {
  series: AnalyticsPoint[];
  granularity: "day" | "month";
}

const HEIGHT = 260;
const MIN_WIDTH = 320;

/** Ancho real del contenedor: el SVG se dibuja en píxeles, sin escalar texto. */
function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const update = () => setWidth(node.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}
const PAD = { top: 12, right: 12, bottom: 28, left: 56 };
const MAX_BAR = 24;
const RADIUS = 4;

/** Columna con esquinas superiores redondeadas y base recta. */
const columnPath = (x: number, y: number, w: number, h: number) => {
  if (h <= 0) return "";
  const r = Math.min(RADIUS, w / 2, h);
  return [
    `M${x},${y + h}`,
    `V${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    `H${x + w - r}`,
    `Q${x + w},${y} ${x + w},${y + r}`,
    `V${y + h}`,
    "Z",
  ].join(" ");
};

/**
 * Ingresos por día/mes como columnas de una sola serie (tono de acento),
 * con tooltip al pasar el cursor. SVG responsivo sin librerías.
 */
export function RevenueChart({ series, granularity }: RevenueChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const [containerRef, measured] = useElementWidth<HTMLDivElement>();
  const WIDTH = Math.max(MIN_WIDTH, measured);

  const { ticks, bars, labelEvery, plotBottom } = useMemo(() => {
    const max = Math.max(0, ...series.map((p) => p.revenue));
    const ticks = niceTicks(max);
    const top = ticks[ticks.length - 1] || 1;
    const plotW = WIDTH - PAD.left - PAD.right;
    const plotH = HEIGHT - PAD.top - PAD.bottom;
    const slot = plotW / Math.max(1, series.length);
    const barW = Math.min(MAX_BAR, slot * 0.6);
    const bars = series.map((point, index) => {
      const h = (point.revenue / top) * plotH;
      return {
        point,
        index,
        x: PAD.left + slot * index + (slot - barW) / 2,
        y: PAD.top + plotH - h,
        w: barW,
        h,
        slotX: PAD.left + slot * index,
        slotW: slot,
      };
    });
    // Etiquetas del eje X espaciadas para que no choquen.
    const labelEvery = Math.max(1, Math.ceil(series.length / 8));
    return { ticks, bars, labelEvery, plotBottom: PAD.top + plotH };
  }, [series, WIDTH]);

  const hasData = series.some((p) => p.revenue > 0 || p.orders > 0);
  const activeBar = active !== null ? bars[active] : null;
  const top = ticks[ticks.length - 1] || 1;

  return (
    <div ref={containerRef} className="relative w-full">
      <svg
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="block max-w-full"
        role="img"
        aria-label="Ingresos por periodo"
        onMouseLeave={() => setActive(null)}
      >
        {/* Cuadrícula y eje Y (recesivos). */}
        {ticks.map((tick) => {
          const y = PAD.top + (HEIGHT - PAD.top - PAD.bottom) * (1 - tick / top);
          return (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={y}
                y2={y}
                className="stroke-border"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-muted text-[11px] tabular-nums"
              >
                {tick === 0 ? "0" : formatMoneyCompact(tick)}
              </text>
            </g>
          );
        })}

        {/* Columnas. */}
        {bars.map((bar) => (
          <g key={bar.point.date}>
            <path
              d={columnPath(bar.x, bar.y, bar.w, bar.h)}
              className={cn(
                "fill-accent transition-opacity",
                active !== null && active !== bar.index && "opacity-40",
              )}
            />
            {/* Zona de hover más ancha que la columna. */}
            <rect
              x={bar.slotX}
              y={PAD.top}
              width={bar.slotW}
              height={HEIGHT - PAD.top - PAD.bottom}
              fill="transparent"
              onMouseEnter={() => setActive(bar.index)}
            />
            {bar.index % labelEvery === 0 && (
              <text
                x={bar.slotX + bar.slotW / 2}
                y={plotBottom + 18}
                textAnchor="middle"
                className="fill-muted text-[11px]"
              >
                {formatBucket(bar.point.date, granularity)}
              </text>
            )}
          </g>
        ))}

        {/* Línea base. */}
        <line
          x1={PAD.left}
          x2={WIDTH - PAD.right}
          y1={plotBottom}
          y2={plotBottom}
          className="stroke-border"
          strokeWidth={1}
        />
      </svg>

      {!hasData && (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted">
          Sin ventas en este periodo
        </p>
      )}

      {activeBar && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-lg"
          style={{
            left: `${((activeBar.slotX + activeBar.slotW / 2) / WIDTH) * 100}%`,
            top: 0,
          }}
        >
          <p className="font-medium capitalize">
            {formatBucketLong(activeBar.point.date, granularity)}
          </p>
          <p className="text-muted">
            <span className="font-semibold text-foreground tabular-nums">
              {formatMoney(activeBar.point.revenue)}
            </span>{" "}
            · {formatInteger(activeBar.point.orders)}{" "}
            {activeBar.point.orders === 1 ? "pedido" : "pedidos"}
          </p>
        </div>
      )}
    </div>
  );
}
