"use client";

import { useState, type DragEvent } from "react";
import { Button, Chip, cn } from "@heroui/react";
import { ChevronDown, ChevronUp, GripVertical, ImageIcon, Plus, Trash2 } from "lucide-react";
import type { ColorImageGroup } from "@/interfaces/products";
import { ColorSwatch, type ColorOption } from "./attribute-values";
import { MAX_IMAGES_PER_COLOR } from "./constants";

interface ColorImagesSectionProps {
  /** Colores del atributo de color seleccionado (para detectar los que ya no existen). */
  colors: ColorOption[];
  /** Un grupo por color, en el orden elegido por el usuario. */
  groups: ColorImageGroup[];
  /** Imágenes del producto que no están relacionadas con ningún color. */
  unassignedImages: string[];
  onPickForColor: (hex: string) => void;
  onRemoveImage: (url: string) => void;
  /** Mueve el color `hex` a la posición `toIndex`. */
  onMove: (hex: string, toIndex: number) => void;
}

/**
 * Galería del producto agrupada por color. Las tarjetas se pueden arrastrar
 * (o mover con las flechas) para decidir qué color carga primero en la tienda.
 * Cada color requiere una imagen y admite hasta MAX_IMAGES_PER_COLOR imágenes.
 */
export function ColorImagesSection({
  colors,
  groups,
  unassignedImages,
  onPickForColor,
  onRemoveImage,
  onMove,
}: ColorImagesSectionProps) {
  const [draggingHex, setDraggingHex] = useState<string | null>(null);
  const [overHex, setOverHex] = useState<string | null>(null);

  const handleDragStart = (event: DragEvent<HTMLLIElement>, hex: string) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", hex);
    setDraggingHex(hex);
  };

  const handleDragOver = (event: DragEvent<HTMLLIElement>, hex: string) => {
    if (!draggingHex || draggingHex === hex) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (overHex !== hex) setOverHex(hex);
  };

  const handleDrop = (event: DragEvent<HTMLLIElement>, hex: string) => {
    event.preventDefault();
    const fromHex = draggingHex ?? event.dataTransfer.getData("text/plain");
    const toIndex = groups.findIndex((group) => group.color === hex);
    if (fromHex && fromHex !== hex && toIndex >= 0) onMove(fromHex, toIndex);
    setDraggingHex(null);
    setOverHex(null);
  };

  const handleDragEnd = () => {
    setDraggingHex(null);
    setOverHex(null);
  };

  const renderThumbnails = (images: string[]) => (
    <div className="flex flex-wrap gap-2">
      {images.map((url) => (
        <div
          key={url}
          className="group relative size-16 overflow-hidden rounded-md border border-border"
        >
          {/* Sin esto el navegador arrastra la imagen en lugar de la tarjeta. */}
          <img
            src={url}
            alt="Imagen del producto"
            draggable={false}
            className="size-full object-cover"
          />
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
    <div className="space-y-3">
      {groups.length > 1 && (
        <p className="text-xs text-muted">
          Arrastra las tarjetas (o usa las flechas) para elegir qué color se muestra primero.
        </p>
      )}

      <ol className="space-y-2">
        {groups.map((group, index) => {
          const isOrphan = !colors.some((color) => color.hex === group.color);
          const isFull = group.images.length >= MAX_IMAGES_PER_COLOR;
          const isDragging = draggingHex === group.color;
          const isOver = overHex === group.color && draggingHex !== group.color;

          return (
            <li
              key={group.color}
              draggable
              onDragStart={(event) => handleDragStart(event, group.color)}
              onDragOver={(event) => handleDragOver(event, group.color)}
              onDragLeave={() => overHex === group.color && setOverHex(null)}
              onDrop={(event) => handleDrop(event, group.color)}
              onDragEnd={handleDragEnd}
              className={cn(
                "flex cursor-grab items-start gap-2 rounded-lg border bg-surface-secondary p-3 transition-[opacity,box-shadow,border-color] active:cursor-grabbing",
                isOrphan ? "border-dashed border-border" : "border-border",
                isDragging && "opacity-50",
                isOver && "border-accent ring-2 ring-accent/30",
              )}
            >
              <div className="flex shrink-0 flex-col items-center gap-1">
                <span
                  aria-hidden="true"
                  title="Arrastra para reordenar"
                  className="text-muted"
                >
                  <GripVertical className="size-4" />
                </span>
                <span className="flex size-6 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-soft-foreground">
                  {index + 1}
                </span>
              </div>

              <ColorSwatch hex={group.color} className="mt-1 size-6" />

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium">
                    {group.name || group.color}
                  </span>
                  <span className="text-xs text-muted">
                    {group.images.length}/{MAX_IMAGES_PER_COLOR} imágenes
                  </span>
                  {index === 0 && !isOrphan && (
                    <Chip size="sm" variant="soft" color="accent">
                      Carga primero
                    </Chip>
                  )}
                  {isOrphan && (
                    <Chip size="sm" variant="soft" color="warning">
                      Este color ya no está en el atributo
                    </Chip>
                  )}
                </div>
                {group.images.length > 0 ? (
                  renderThumbnails(group.images)
                ) : (
                  <p className="flex items-center gap-1.5 text-xs text-muted">
                    <ImageIcon className="size-3.5" />
                    Agrega entre 1 y {MAX_IMAGES_PER_COLOR} imágenes para este color
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <div className="flex flex-col">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    isIconOnly
                    aria-label={`Subir ${group.name || group.color}`}
                    isDisabled={index === 0}
                    onPress={() => onMove(group.color, index - 1)}
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    isIconOnly
                    aria-label={`Bajar ${group.name || group.color}`}
                    isDisabled={index === groups.length - 1}
                    onPress={() => onMove(group.color, index + 1)}
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                </div>
                {!isOrphan && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onPress={() => onPickForColor(group.color)}
                  >
                    <Plus className="size-4" />
                    {isFull ? "Cambiar" : "Agregar"}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ol>

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
