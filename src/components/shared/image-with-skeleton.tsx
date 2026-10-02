"use client";

import { useState } from "react";
import Image from "next/image";

interface ImageWithSkeletonProps {
  src: string;
  alt: string;
  /** Tamaño y forma del contenedor, por ejemplo: `size-12 rounded-md`. */
  className?: string;
  /** Clases que se aplican a la imagen optimizada. */
  imageClassName?: string;
  sizes: string;
  priority?: boolean;
  /** Sirve la imagen tal cual, sin pasar por el optimizador de Next. */
  unoptimized?: boolean;
  /**
   * Usa la miniatura WebP que el backend guarda en S3 si la imagen es del
   * bucket: pesa decenas de KB y se sirve sin gastar cuota del optimizador de
   * Vercel. Si no existe, cae al original.
   */
  useThumbnail?: boolean;
  /** `sm` (480px) para listados y tarjetas; `lg` (1280px) para banners y vistas amplias. */
  thumbnailSize?: ThumbnailSize;
}

type ThumbnailSize = "sm" | "lg";

const THUMBNAIL_ROOTS: Record<ThumbnailSize, string> = {
  sm: "_thumbs",
  lg: "_thumbs-lg",
};

/**
 * URL de la miniatura de una imagen del bucket de S3
 * (`https://host/{clave}` → `https://host/_thumbs/{clave}.webp`), o null si la
 * URL no es de S3 o ya es una miniatura.
 */
function getThumbnailUrl(src: string, size: ThumbnailSize): string | null {
  try {
    const url = new URL(src);
    if (!url.hostname.endsWith(".amazonaws.com")) return null;
    if (Object.values(THUMBNAIL_ROOTS).some((root) => url.pathname.startsWith(`/${root}/`))) {
      return null;
    }
    return `${url.origin}/${THUMBNAIL_ROOTS[size]}${url.pathname}.webp`;
  } catch {
    return null;
  }
}

/** Miniatura optimizada con espacio reservado y esqueleto hasta que cargue. */
export function ImageWithSkeleton({
  src,
  alt,
  className = "",
  imageClassName = "",
  sizes,
  priority = false,
  unoptimized = false,
  useThumbnail = true,
  thumbnailSize = "sm",
}: ImageWithSkeletonProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  // Miniatura que dio error (no existe todavía): se vuelve al original.
  const [failedThumb, setFailedThumb] = useState<string | null>(null);

  const thumbUrl = useThumbnail ? getThumbnailUrl(src, thumbnailSize) : null;
  const showingThumb = thumbUrl !== null && failedThumb !== thumbUrl;

  return (
    <div className={`relative overflow-hidden bg-surface-secondary ${className}`}>
      {!isLoaded && <div aria-hidden className="absolute inset-0 animate-pulse bg-surface-secondary" />}
      <Image
        src={showingThumb ? thumbUrl : src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={unoptimized || showingThumb}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          if (showingThumb) {
            setFailedThumb(thumbUrl);
            return;
          }
          // Si S3 responde con un error, ocultamos el esqueleto en vez de dejar
          // una tarjeta cargando indefinidamente.
          setIsLoaded(true);
        }}
        className={`object-cover transition-opacity duration-200 ${isLoaded ? "opacity-100" : "opacity-0"} ${imageClassName}`}
      />
    </div>
  );
}
