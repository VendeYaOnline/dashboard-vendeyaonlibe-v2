"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryImages } from "@/app/api/queries";
import { ImageIcon, Search, CheckCircle } from "lucide-react";
import { ImageItem } from "@/lib/types";

interface GalleryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (selectedUrls: string[]) => void;
  multiple?: boolean;
  currentSelected?: string[]; // currently selected URLs to show checked state
  maxSelection?: number;
  disabledUrls?: string[]; // URLs that cannot be selected
}

export function GalleryModal({
  open,
  onOpenChange,
  onSelect,
  multiple = false,
  currentSelected = [],
  maxSelection = 5,
  disabledUrls = [],
}: GalleryModalProps) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  // Sync internal selection directly with props when opened
  useEffect(() => {
    if (open) {
      setSelectedUrls(new Set(currentSelected));
    }
  }, [open, currentSelected]);

  const LIMIT = 30;

  const { data: imagesData, isLoading } = useQueryImages(
    page,
    searchQuery,
    LIMIT,
    undefined // All categories
  );

  const images = imagesData?.images || [];
  const totalPages = imagesData?.totalPages || 0;

  const handleToggleSelect = (url: string) => {
    if (disabledUrls.includes(url)) return;

    setSelectedUrls((prev) => {
      const newSet = new Set(prev);
      if (multiple) {
        if (newSet.has(url)) {
          newSet.delete(url);
        } else {
          if (newSet.size >= maxSelection) {
            return prev;
          }
          newSet.add(url);
        }
      } else {
        newSet.clear();
        newSet.add(url);
      }
      return newSet;
    });
  };

  const handeConfirm = () => {
    onSelect(Array.from(selectedUrls));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {multiple ? "Selección múltiple de imágenes" : "Seleccionar imagen"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar imágenes..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-[400px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 animate-pulse">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">Cargando imágenes...</h3>
              </div>
            ) : images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {images.map((img: ImageItem) => {
                  const isSelected = selectedUrls.has(img.Url);
                  const isDisabled = disabledUrls.includes(img.Url);
                  return (
                    <div
                      key={img.Key}
                      className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        isDisabled ? "opacity-50 cursor-not-allowed border-transparent" :
                        isSelected ? "border-primary" : "border-transparent hover:border-primary/50"
                      }`}
                      onClick={() => handleToggleSelect(img.Url)}
                    >
                      <img
                        src={img.Url}
                        alt="Gallery Image"
                        className="object-cover w-full h-full"
                      />
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-primary text-white rounded-full">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                      )}
                      {isDisabled && (
                        <div className="absolute inset-0 bg-background/50 flex flex-col items-center justify-center text-sm font-medium text-muted-foreground backdrop-blur-[1px]">
                          En uso
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <ImageIcon className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No se encontraron imágenes</h3>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <div className="flex items-center text-sm">
                Página {page} de {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Siguiente
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <div className="w-full flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Seleccionadas {selectedUrls.size}{multiple ? ` / ${maxSelection}` : ""}
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handeConfirm}
                disabled={selectedUrls.size === 0 && !multiple}
              >
                Confirmar selección
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
