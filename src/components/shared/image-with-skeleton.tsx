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
}

/** Miniatura optimizada con espacio reservado y esqueleto hasta que cargue. */
export function ImageWithSkeleton({
  src,
  alt,
  className = "",
  imageClassName = "",
  sizes,
  priority = false,
}: ImageWithSkeletonProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-surface-secondary ${className}`}>
      {!isLoaded && <div aria-hidden className="absolute inset-0 animate-pulse bg-surface-secondary" />}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        onLoad={() => setIsLoaded(true)}
        // Si S3 responde con un error, ocultamos el esqueleto en vez de dejar
        // una tarjeta cargando indefinidamente.
        onError={() => setIsLoaded(true)}
        className={`object-cover transition-opacity duration-200 ${isLoaded ? "opacity-100" : "opacity-0"} ${imageClassName}`}
      />
    </div>
  );
}
