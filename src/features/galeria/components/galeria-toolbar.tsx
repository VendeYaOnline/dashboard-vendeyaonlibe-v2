"use client";

import { Grid3X3, LayoutList, Trash2 } from "lucide-react";
import {
  Button,
  Chip,
  ListBox,
  ListBoxItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
} from "@heroui/react";
import { SearchField } from "@/components/shared/search-field";
import type { Category } from "@/interfaces/categories";
import { MAX_SELECTION } from "../utils";

export type ViewMode = "grid" | "list";

interface GaleriaToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  categories: Category[];
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedCount: number;
  onDeleteSelected: () => void;
  isDisabled?: boolean;
}

export function GaleriaToolbar({
  search,
  onSearchChange,
  categories,
  categoryFilter,
  onCategoryFilterChange,
  viewMode,
  onViewModeChange,
  selectedCount,
  onDeleteSelected,
  isDisabled,
}: GaleriaToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <SearchField
        aria-label="Buscar imágenes"
        placeholder="Buscar imágenes..."
        value={search}
        onChange={onSearchChange}
      />

      <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
        <Select
          aria-label="Filtrar por categoría"
          selectedKey={categoryFilter}
          onSelectionChange={(key) => onCategoryFilterChange(String(key))}
          isDisabled={isDisabled}
          className="w-40"
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBoxItem id="all">Todas</ListBoxItem>
              {categories.map((category) => (
                <ListBoxItem key={category.id} id={category.id}>
                  {category.name}
                </ListBoxItem>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        <ToggleButtonGroup
          selectionMode="single"
          selectedKeys={new Set([viewMode])}
          onSelectionChange={(keys) => {
            const [next] = Array.from(keys, String);
            if (next === "grid" || next === "list") onViewModeChange(next);
          }}
          isDisabled={isDisabled}
        >
          <ToggleButton id="grid" aria-label="Vista de cuadrícula">
            <Grid3X3 className="size-4" />
          </ToggleButton>
          <ToggleButton id="list" aria-label="Vista de lista">
            <LayoutList className="size-4" />
          </ToggleButton>
        </ToggleButtonGroup>

        {selectedCount > 0 && (
          <Button variant="danger" onPress={onDeleteSelected} isDisabled={isDisabled}>
            <Trash2 className="size-4" />
            Eliminar
            <Chip size="sm" variant="soft">
              {selectedCount}/{MAX_SELECTION}
            </Chip>
          </Button>
        )}
      </div>
    </div>
  );
}
