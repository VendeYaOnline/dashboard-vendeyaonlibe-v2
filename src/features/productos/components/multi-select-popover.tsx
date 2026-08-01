"use client";

import { ChevronDown } from "lucide-react";
import { Button, ListBox, ListBoxItem, Popover } from "@heroui/react";
import type { ComponentProps } from "react";

type OnSelectionChange = ComponentProps<typeof ListBox>["onSelectionChange"];
type Selection = Parameters<NonNullable<OnSelectionChange>>[0];

interface MultiSelectOption {
  id: string;
  label: string;
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
 * conteo y abre un popover con la lista seleccionable.
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
                <ListBoxItem key={option.id} id={option.id}>
                  {option.label}
                </ListBoxItem>
              ))}
            </ListBox>
          ) : (
            <p className="p-3 text-center text-sm text-muted">{emptyMessage}</p>
          )}
        </Popover.Dialog>
      </Popover.Content>
    </Popover.Root>
  );
}
