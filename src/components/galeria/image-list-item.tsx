"use client";

import { useState } from "react";
import Image from "next/image";
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { ImageItem } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";

interface ImageListItemProps {
  image: ImageItem;
  isSelected: boolean;
  onSelect: (key: string) => void;
  onView: (image: ImageItem) => void;
  onEdit: (image: ImageItem) => void;
  onDelete: (key: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ImageListItem({
  image,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onDelete,
}: ImageListItemProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div
      className={`group flex items-center gap-4 p-3 rounded-lg border transition-all duration-200 hover:bg-muted/50 ${
        isSelected ? "border-primary/50 bg-primary/5" : "border-border bg-card"
      }`}
    >
      {/* Checkbox */}
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onSelect(image.Key)}
        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />

      {/* Thumbnail */}
      <div
        className="relative w-16 h-12 rounded-md overflow-hidden bg-muted cursor-pointer shrink-0"
        onClick={() => onView(image)}
      >
        {!imageLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        <Image
          src={image.Url}
          alt={image.Key}
          fill
          className={`object-cover transition-opacity duration-300 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setImageLoaded(true)}
          sizes="64px"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium text-foreground truncate cursor-pointer hover:text-primary transition-colors"
          onClick={() => onView(image)}
          title={image.Key}
        >
          {image.Key}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(image.Size)}
        </p>
      </div>

      {/* Category Badge */}
      <Badge
        variant="secondary"
        className="hidden md:flex text-[10px] capitalize"
      >
        {CATEGORIES.find((c) => c.value === image.category)?.label ||
          image.category}
      </Badge>

      {/* Date */}
      <div className="hidden sm:block text-sm text-muted-foreground">
        {formatDate(image.LastModified)}
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={() => onView(image)}>
            <Eye className="mr-2 h-4 w-4" />
            Ver
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(image)}>
            <Pencil className="mr-2 h-4 w-4" />
            Renombrar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDelete(image.Key)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
