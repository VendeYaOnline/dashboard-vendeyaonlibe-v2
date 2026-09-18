"use client";

import { useState } from "react";
import { Checkbox, Chip, cn } from "@heroui/react";
import type { Category } from "@/interfaces/categories";
import type { ImageItem } from "@/lib/types";
import { formatDate, formatFileSize, getCategoryName, getFileName } from "../utils";
import { ImagenActionsMenu } from "./imagen-actions-menu";

interface ImagenListItemProps {
  image: ImageItem;
  categories: Category[];
  isSelected: boolean;
  onSelect: (key: string) => void;
  onView: (image: ImageItem) => void;
  onEdit: (image: ImageItem) => void;
  onMove: (image: ImageItem) => void;
  onDelete: (key: string) => void;
}

export function ImagenListItem({
  image,
  categories,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onMove,
  onDelete,
}: ImagenListItemProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const fileName = getFileName(image.Key);
  const categoryName = getCategoryName(image.Key, categories);

  return (
    <div
      className={cn(
        "group flex items-center gap-4 rounded-lg border p-3 transition-colors",
        isSelected
          ? "border-accent bg-accent-soft"
          : "border-border bg-surface hover:bg-surface-secondary",
      )}
    >
      <Checkbox
        isSelected={isSelected}
        onChange={() => onSelect(image.Key)}
        aria-label={`Seleccionar ${fileName}`}
      >
        <Checkbox.Content>
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
        </Checkbox.Content>
      </Checkbox>

      <button
        type="button"
        onClick={() => onView(image)}
        aria-label={`Ver ${fileName}`}
        className="relative size-12 w-16 shrink-0 overflow-hidden rounded-md bg-surface-secondary"
      >
        {!isLoaded && <div className="absolute inset-0 animate-pulse bg-surface-secondary" />}
        <img
          src={image.Url}
          alt={fileName}
          onLoad={() => setIsLoaded(true)}
          className={cn(
            "size-full object-cover transition-opacity",
            isLoaded ? "opacity-100" : "opacity-0",
          )}
        />
      </button>

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onView(image)}
          className="block max-w-full truncate text-sm font-medium hover:text-accent"
          title={fileName}
        >
          {fileName}
        </button>
        <p className="text-xs text-muted">{formatFileSize(image.Size)}</p>
      </div>

      {categoryName && (
        <Chip size="sm" variant="soft" className="hidden md:flex">
          {categoryName}
        </Chip>
      )}

      <span className="hidden text-sm text-muted sm:block">
        {formatDate(image.LastModified)}
      </span>

      <ImagenActionsMenu
        image={image}
        onView={onView}
        onEdit={onEdit}
        onMove={onMove}
        onDelete={onDelete}
        className="opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
      />
    </div>
  );
}
