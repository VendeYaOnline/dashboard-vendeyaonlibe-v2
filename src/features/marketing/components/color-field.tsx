"use client";

import { useEffect, useState } from "react";
import { Input, Label, TextField } from "@heroui/react";

const HEX = /^#[0-9a-f]{6}$/i;

/** Selector de color + campo #rrggbb (se aplica solo cuando el valor es válido). */
export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label}: elegir color`}
          value={HEX.test(value) ? value : "#000000"}
          onChange={(event) => onChange(event.target.value)}
          className="size-10 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
        />
        <TextField
          aria-label={`${label}: código`}
          value={text}
          onChange={(next) => {
            const clean = next.trim().slice(0, 7);
            setText(clean);
            if (HEX.test(clean)) onChange(clean.toLowerCase());
          }}
          isInvalid={!HEX.test(text)}
          className="w-28"
        >
          <Input className="font-mono uppercase" maxLength={7} />
        </TextField>
      </div>
    </div>
  );
}
