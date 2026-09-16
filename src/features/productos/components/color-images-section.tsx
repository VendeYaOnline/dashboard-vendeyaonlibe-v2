"use client";

import { Button, Chip } from "@heroui/react";
import { ImageIcon, Plus, Trash2 } from "lucide-react";
import type { ColorImageGroup } from "@/interfaces/products";
import { ColorSwatch, type ColorOption } from "./attribute-values";
import { MAX_IMAGES_PER_COLOR } from "./constants";

interface ColorImagesSectionProps {
  /** Colores del atributo de color seleccionado, en su orden. */
  colors: ColorOption[];
  groups: ColorImageGroup[];
  /** Imágenes del producto que no están relacionadas con ningún color. */
  unassignedImages: string[];
  onPickForColor: (hex: string) => void;
  onRemoveImage: (url: string) => void;
}

/**
 * Galería del producto agrupada por color. Cada color muestra sus imágenes
 * (hasta MAX_IMAGES_PER_COLOR) y un botón para elegirlas; las imágenes sin color
 * (productos guardados antes de esta función) se listan aparte.
 */
export function ColorImagesSection({
  colors,
  groups,
  unassignedImages,
  onPickForColor,
  onRemoveImage,
}: ColorImagesSectionProps) {
  const groupByHex = new Map(groups.map((group) => [group.color, group]));
  // Colores guardados en el producto que ya no existen en el atributo.
  const orphanGroups = groups.filter(
    (group) => !colors.some((color) => color.hex === group.color),
  );

  const renderThumbnails = (images: string[]) => (
    <div className="flex flex-wrap gap-2">
      {images.map((url) => (
        <div
          key={url}
          className="group relative size-16 overflow-hidden rounded-md border border-border"
        >
          <img src={url} alt="Imagen del producto" className="size-full object-cover" />
          <button
            type="button"
            onClick={() => onRemoveImage(url)}
            aria-label="Quitar imagen"
            className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-2">
      {colors.map((color) => {
        const images = groupByHex.get(color.hex)?.images ?? [];
        const isFull = images.length >= MAX_IMAGES_PER_COLOR;
        return (
          <div
            key={color.hex}
            className="flex items-start gap-3 rounded-lg border border-border bg-surface-secondary p-3"
          >
            <ColorSwatch hex={color.hex} className="mt-1 size-6" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium">{color.name}</span>
                <span className="text-xs text-muted">
                  {images.length}/{MAX_IMAGES_PER_COLOR}
                </span>
              </div>
              {images.length > 0 ? (
                renderThumbnails(images)
              ) : (
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  <ImageIcon className="size-3.5" />
                  Sin imágenes para este color
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onPress={() => onPickForColor(color.hex)}
            >
              <Plus className="size-4" />
              {images.length > 0 ? (isFull ? "Cambiar" : "Agregar") : "Agregar"}
            </Button>
          </div>
        );
      })}

      {orphanGroups.map((group) => (
        <div
          key={group.color}
          className="flex items-start gap-3 rounded-lg border border-dashed border-border p-3"
        >
          <ColorSwatch hex={group.color} className="mt-1 size-6" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-medium">{group.name || group.color}</span>
              <Chip size="sm" variant="soft" color="warning">
                Este color ya no está en el atributo
              </Chip>
            </div>
            {renderThumbnails(group.images)}
          </div>
        </div>
      ))}

      {unassignedImages.length > 0 && (
        <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Sin color asignado</span>
            <span className="text-xs text-muted">
              Se guardan en la galería general del producto
            </span>
          </div>
          {renderThumbnails(unassignedImages)}
        </div>
      )}
    </div>
  );
}
