import { ImageItem } from "./types";

export const initialMockImages: ImageItem[] = [
  {
    Key: "producto-1.jpg",
    LastModified: new Date().toISOString(),
    Size: 1024000,
    Url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
    category: "productos",
  },
  {
    Key: "producto-2.jpg",
    LastModified: new Date().toISOString(),
    Size: 1536000,
    Url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop",
    category: "productos",
  },
  {
    Key: "promocion-1.jpg",
    LastModified: new Date().toISOString(),
    Size: 2048000,
    Url: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop",
    category: "promociones",
  },
  {
    Key: "banner-1.jpg",
    LastModified: new Date().toISOString(),
    Size: 3072000,
    Url: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop",
    category: "banners",
  },
  {
    Key: "evento-1.jpg",
    LastModified: new Date().toISOString(),
    Size: 2560000,
    Url: "https://images.unsplash.com/photo-1540575467063-17838950494e?w=400&h=300&fit=crop",
    category: "eventos",
  },
];
