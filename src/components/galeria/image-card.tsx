"use client";

import { useState } from "react";
import Image from "next/image";
import { MoreHorizontal, Pencil, Trash2, Eye, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES, ImageItem } from "@/lib/types";


interface ImageCardProps {
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

export function ImageCard({
  image,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onDelete,
}: ImageCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <Card
      className="group relative overflow-hidden bg-card border-border transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Selection Checkbox */}
      <div
        className={`absolute top-3 left-3 z-20 transition-opacity duration-200 ${
          isHovered || isSelected ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="bg-background/80 backdrop-blur-sm rounded-md p-1">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect(image.Key)}
            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
        </div>
      </div>

      {/* Actions Menu */}
      <div
        className={`absolute top-3 right-3 z-20 transition-opacity duration-200 ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background"
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

      {/* Image Container */}
      <div
        className="relative aspect-4/3 overflow-hidden cursor-pointer"
        onClick={() => onView(image)}
      >
        {!imageLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        <Image
          src={image.Url}
          alt={image.Key}
          fill
          className={`object-cover transition-all duration-500 group-hover:scale-105 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setImageLoaded(true)}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />

        {/* Hover Overlay */}
        <div
          className={`absolute inset-0 bg-background/40 backdrop-blur-[2px] transition-opacity duration-300 flex items-center justify-center ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <Button variant="secondary" size="sm" className="gap-2">
            <Eye className="h-4 w-4" />
            Ver imagen
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p
            className="text-sm font-medium text-foreground truncate flex-1"
            title={image.Key}
          >
            {image.Key}
          </p>
          <Badge
            variant="secondary"
            className="text-[10px] shrink-0 capitalize"
          >
            {image.Key}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatFileSize(image.Size)}</span>
          <span>{formatDate(image.LastModified)}</span>
        </div>
      </div>
    </Card>
  );
}
