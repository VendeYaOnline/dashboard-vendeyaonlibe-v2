"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { Card, Checkbox, Chip, cn } from "@heroui/react";
import type { Category } from "@/interfaces/categories";
import type { ImageItem } from "@/lib/types";
import { formatDate, formatFileSize, getCategoryName, getFileName } from "../utils";
import { ImagenActionsMenu } from "./imagen-actions-menu";

interface ImagenCardProps {
  image: ImageItem;
  categories: Category[];
  isSelected: boolean;
  onSelect: (key: string) => void;
  onView: (image: ImageItem) => void;
  onEdit: (image: ImageItem) => void;
  onMove: (image: ImageItem) => void;
  onDelete: (key: string) => void;
}

export function ImagenCard({
  image,
  categories,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onMove,
  onDelete,
}: ImagenCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const fileName = getFileName(image.Key);
  const categoryName = getCategoryName(image.Key, categories);

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-lg",
        isSelected && "ring-2 ring-accent",
      )}
    >
      <div className="absolute top-3 left-3 z-20 rounded-md bg-background/80 p-1 backdrop-blur-sm">
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
      </div>

      <div className="absolute top-3 right-3 z-20 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <ImagenActionsMenu
          image={image}
          onView={onView}
          onEdit={onEdit}
          onMove={onMove}
          onDelete={onDelete}
          className="bg-background/80 backdrop-blur-sm"
        />
      </div>

      <button
        type="button"
        onClick={() => onView(image)}
        aria-label={`Ver ${fileName}`}
        className="relative block aspect-4/3 w-full overflow-hidden"
      >
        {!isLoaded && <div className="absolute inset-0 animate-pulse bg-surface-secondary" />}
        <img
          src={image.Url}
          alt={fileName}
          onLoad={() => setIsLoaded(true)}
          className={cn(
            "size-full object-cover transition-all duration-500 group-hover:scale-105",
            isLoaded ? "opacity-100" : "opacity-0",
          )}
        />
        <span className="absolute inset-0 flex items-center justify-center bg-background/40 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
          <span className="inline-flex items-center gap-2 rounded-lg bg-surface px-3 py-1.5 text-sm font-medium shadow-surface">
            <Eye className="size-4" />
            Ver imagen
          </span>
        </span>
      </button>

      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="flex-1 truncate text-sm font-medium" title={fileName}>
            {fileName}
          </p>
          {categoryName && (
            <Chip size="sm" variant="soft" className="shrink-0">
              {categoryName}
            </Chip>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-muted">
          <span>{formatFileSize(image.Size)}</span>
          <span>{formatDate(image.LastModified)}</span>
        </div>
      </div>
    </Card>
  );
}
