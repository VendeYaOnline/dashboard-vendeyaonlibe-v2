"use client";

import { ChevronDown } from "lucide-react";
import { Button, ListBox, ListBoxItem, Popover } from "@heroui/react";
import type { ComponentProps } from "react";

type OnSelectionChange = ComponentProps<typeof ListBox>["onSelectionChange"];
type Selection = Parameters<NonNullable<OnSelectionChange>>[0];

interface MultiSelectOption {
  id: string;
  label: string;
  /** Texto secundario a la derecha de la etiqueta (p. ej. el tipo de atributo). */
  hint?: string;
}

interface MultiSelectPopoverProps {
  options: MultiSelectOption[];
  selectedIds: Set<string>;
  onChange: (ids: Set<string>) => void;
  placeholder: string;
  emptyMessage: string;
  itemNoun: { singular: string; plural: string };
}

/**
 * Selector múltiple genérico (categorías, atributos): botón que muestra el
 * conteo y abre un popover con la lista seleccionable. Cada opción marcada
 * muestra un check para que el estado sea visible al reabrir la lista.
 */
export function MultiSelectPopover({
  options,
  selectedIds,
  onChange,
  placeholder,
  emptyMessage,
  itemNoun,
}: MultiSelectPopoverProps) {
  const handleSelectionChange = (keys: Selection) => {
    if (keys === "all") {
      onChange(new Set(options.map((option) => option.id)));
      return;
    }
    onChange(new Set(Array.from(keys, String)));
  };

  return (
    // Contenedor en bloque: así el disparador ocupa todo el ancho bajo la etiqueta.
    <div className="w-full">
      <Popover.Root>
        <Popover.Trigger>
          <Button variant="outline" fullWidth className="justify-between">
            {selectedIds.size > 0
              ? `${selectedIds.size} ${selectedIds.size === 1 ? itemNoun.singular : itemNoun.plural} seleccionados`
              : placeholder}
            <ChevronDown className="size-4 opacity-50" />
          </Button>
        </Popover.Trigger>
        <Popover.Content className="w-(--trigger-width)">
          <Popover.Dialog>
            {options.length > 0 ? (
              <ListBox
                aria-label={placeholder}
                selectionMode="multiple"
                selectedKeys={selectedIds}
                onSelectionChange={handleSelectionChange}
                className="max-h-60 overflow-y-auto"
              >
                {options.map((option) => (
                  <ListBoxItem
                    key={option.id}
                    id={option.id}
                    textValue={option.label}
                    className="data-[selected=true]:font-medium"
                  >
                    <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                      <span className="truncate">{option.label}</span>
                      {option.hint && (
                        <span className="shrink-0 text-xs text-muted">{option.hint}</span>
                      )}
                    </span>
                    <ListBoxItem.Indicator />
                  </ListBoxItem>
                ))}
              </ListBox>
            ) : (
              <p className="p-3 text-center text-sm text-muted">{emptyMessage}</p>
            )}
          </Popover.Dialog>
        </Popover.Content>
      </Popover.Root>
    </div>
  );
}
