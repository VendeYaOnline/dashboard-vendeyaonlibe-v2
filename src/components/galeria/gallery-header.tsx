"use client";

import { useRef } from "react";
import {
  Search,
  Plus,
  Trash2,
  Image as ImageIcon,
  Grid3X3,
  LayoutList,
} from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Category } from "@/lib/types";
import type { Category as CategoryData } from "@/interfaces/categories";

const MAX_SELECTION = 10;

interface GalleryHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCount: number;
  totalImages: number;
  onUpload: () => void;
  onDeleteSelected: () => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  categoryFilter: Category;
  onCategoryChange: Dispatch<SetStateAction<Category>>;
  categories?: CategoryData[];
  isLoading?: boolean;
}

export function GalleryHeader({
  searchQuery,
  onSearchChange,
  selectedCount,
  totalImages,
  onUpload,
  onDeleteSelected,
  viewMode,
  onViewModeChange,
  categoryFilter,
  categories = [],
  onCategoryChange,
  isLoading,
}: GalleryHeaderProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-6">
      {/* Title Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <ImageIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Galería de Imágenes
            </h1>
            <p className="text-sm text-muted-foreground">
              {totalImages} {totalImages === 1 ? "imagen" : "imágenes"} en total
            </p>
          </div>
        </div>
        <Button onClick={onUpload} className="gap-2" disabled={isLoading}>
          <Plus className="h-4 w-4" />
          Subir imagen
        </Button>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Buscar imágenes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-muted border-border"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={(value) => onCategoryChange(value as Category)}>
            <SelectTrigger className="w-40 bg-muted border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="flex items-center border border-border rounded-lg p-1 bg-muted/50">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => onViewModeChange("grid")}
              disabled={isLoading}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => onViewModeChange("list")}
              disabled={isLoading}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>

          {/* Delete Selected */}
          {selectedCount > 0 && (
            <Button
              variant="destructive"
              onClick={onDeleteSelected}
              className="gap-2"
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
              <Badge
                variant="secondary"
                className="ml-1 bg-destructive-foreground/20 text-destructive-foreground"
              >
                {selectedCount}/{MAX_SELECTION}
              </Badge>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
