"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  ColorArea,
  ColorPicker,
  ColorSlider,
  ColorSwatch,
  ColorSwatchPicker,
  Input,
  Label,
  TextField,
  parseColor,
  type Color,
} from "@heroui/react";

const HEX = /^#[0-9a-f]{6}$/i;

/** Colores sugeridos: neutros y tonos de marca habituales. */
const PRESETS = [
  "#111111",
  "#1f2937",
  "#6b7280",
  "#f4f5f7",
  "#ffffff",
  "#1b56fd",
  "#7c3aed",
  "#db2777",
  "#dc2626",
  "#ea580c",
  "#ca8a04",
  "#16a34a",
  "#0d9488",
  "#a44646",
];

const toColor = (hex: string) => parseColor(HEX.test(hex) ? hex : "#000000").toFormat("hsb");
const toHex = (color: Color) => color.toString("hex").toLowerCase();

interface ColorFieldProps {
  label: string;
  /** Para qué se usa ("Botones y código de descuento"). */
  hint?: string;
  value: string;
  onChange: (value: string) => void;
}

/**
 * Selector de color: muestra + nombre + código; al abrirlo, área de color,
 * barra de tono, colores sugeridos y código hexadecimal.
 *
 * Mientras se arrastra solo cambia el estado local (fluido); el color se
 * aplica a la plantilla al soltar, al elegir un sugerido o al escribir un
 * código válido. Así la vista previa no se recalcula en cada movimiento.
 */
export function ColorField({ label, hint, value, onChange }: ColorFieldProps) {
  const [color, setColor] = useState(() => toColor(value));
  const [text, setText] = useState(value);

  // Si cambia desde fuera (otra plantilla, restablecer), se sincroniza.
  useEffect(() => {
    setColor(toColor(value));
    setText(value);
  }, [value]);

  const commit = (next: Color) => {
    const hex = toHex(next);
    setText(hex);
    if (hex !== value) onChange(hex);
  };

  return (
    <ColorPicker
      value={color}
      onChange={(next) => {
        setColor(next);
        setText(toHex(next));
      }}
    >
      <ColorPicker.Trigger className="group flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-2.5 text-left transition-colors hover:bg-surface-secondary">
        <ColorSwatch className="size-9 shrink-0 rounded-lg shadow-sm ring-1 ring-black/10" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium leading-tight">{label}</span>
          <span className="block font-mono text-xs uppercase text-muted">{text}</span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted transition-transform group-aria-expanded:rotate-180" aria-hidden />
      </ColorPicker.Trigger>
      <ColorPicker.Popover className="w-72 space-y-3 p-3">
        <div>
          <p className="text-sm font-semibold">{label}</p>
          {hint && <p className="text-xs text-muted">{hint}</p>}
        </div>
        <ColorArea
          colorSpace="hsb"
          xChannel="saturation"
          yChannel="brightness"
          className="h-36 w-full rounded-lg"
          onChangeEnd={commit}
        >
          <ColorArea.Thumb />
        </ColorArea>
        <ColorSlider channel="hue" colorSpace="hsb" onChangeEnd={commit} aria-label="Tono">
          <ColorSlider.Track className="h-3 rounded-full">
            <ColorSlider.Thumb />
          </ColorSlider.Track>
        </ColorSlider>
        <ColorSwatchPicker
          aria-label="Colores sugeridos"
          className="flex flex-wrap gap-1.5"
          onChange={(next) => {
            setColor(next.toFormat("hsb"));
            commit(next);
          }}
        >
          {PRESETS.map((preset) => (
            <ColorSwatchPicker.Item key={preset} color={preset} className="rounded-md">
              <ColorSwatchPicker.Swatch className="size-6 rounded-md ring-1 ring-black/10" />
            </ColorSwatchPicker.Item>
          ))}
        </ColorSwatchPicker>
        <TextField
          value={text}
          onChange={(next) => {
            const clean = (next.startsWith("#") ? next : `#${next}`).trim().slice(0, 7);
            setText(clean);
            if (HEX.test(clean)) {
              setColor(toColor(clean));
              if (clean.toLowerCase() !== value) onChange(clean.toLowerCase());
            }
          }}
          isInvalid={!HEX.test(text)}
        >
          <Label className="text-xs">Código</Label>
          <Input className="font-mono uppercase" maxLength={7} />
        </TextField>
      </ColorPicker.Popover>
    </ColorPicker>
  );
}
