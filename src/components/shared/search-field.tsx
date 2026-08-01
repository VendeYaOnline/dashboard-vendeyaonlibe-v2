"use client";

import { Search } from "lucide-react";
import { InputGroup, TextField } from "@heroui/react";

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  "aria-label": string;
}

export function SearchField({
  value,
  onChange,
  placeholder = "Buscar...",
  "aria-label": ariaLabel,
}: SearchFieldProps) {
  return (
    <TextField
      aria-label={ariaLabel}
      value={value}
      onChange={onChange}
      className="w-full sm:max-w-xs"
    >
      <InputGroup>
        <InputGroup.Prefix>
          <Search className="size-4 text-muted" />
        </InputGroup.Prefix>
        <InputGroup.Input placeholder={placeholder} />
      </InputGroup>
    </TextField>
  );
}
