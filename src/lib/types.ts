// Image Gallery Types
export interface ImageItem {
  Key: string;
  LastModified: string;
  Size: number;
  Url: string;
  category?: string;
}

export interface Images {
  images: ImageItem[];
  total: number;
  grandTotal: number;
  page: number;
  totalPages: number;
}

// Category Types for Gallery
export const CATEGORIES = [
  { value: "all", label: "Todas" },
  { value: "productos", label: "Productos" },
  { value: "promociones", label: "Promociones" },
  { value: "eventos", label: "Eventos" },
  { value: "banners", label: "Banners" },
  { value: "otros", label: "Otros" },
] as const;

export type Category = "all" | string;
